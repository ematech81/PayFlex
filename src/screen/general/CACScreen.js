/**
 * CACScreen — 5-step Business Name Registration Wizard
 *
 * ARCHITECTURE NOTE:
 * Step content is rendered via renderStep1()…renderStep5() functions
 * (NOT as React component definitions inside the render).
 * This prevents the "Maximum update depth" infinite loop caused by
 * defining component functions inside render (which creates new
 * function references on every render, causing React to unmount/remount
 * and re-fire all useEffects on each keystroke).
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, FlatList, Image, Alert, Platform, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { useWallet } from 'context/WalletContext';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import {
  cacCheckCompliance, cacValidatePayload, cacRegisterBusinessName,
} from 'AuthFunction/paymentService';
import {
  LINE_OF_BUSINESS, PROHIBITED_WORDS, NIGERIAN_STATES,
  COMPLIANCE_MESSAGES, CAC_PRICING,
} from 'constants/cacConstants';

// ─── Pure helpers (no hooks, defined outside component) ──────────────────────

const findProhibited = (name) => {
  if (!name) return null;
  const words = name.toLowerCase().trim().split(/\s+/);
  for (const pw of PROHIBITED_WORDS) if (words.includes(pw.toLowerCase())) return pw;
  return null;
};
const isSingle = (n) => !n || n.trim().split(/\s+/).length < 2;
const toYMD    = (d) => { if (!d) return ''; const dt = typeof d === 'string' ? new Date(d) : d; return dt.toISOString().split('T')[0]; };
const getAge   = (dob) => !dob ? 0 : Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
const fmtLocal = (iso) => !iso ? '' : new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

// ─── Reusable atoms (stable — defined OUTSIDE CACScreen) ─────────────────────

const LabelInput = React.memo(({ value, onChangeText, placeholder, keyboardType, editable = true, multiline, tc, secureTextEntry }) => (
  <TextInput
    style={[ss.inp, { backgroundColor: tc.card, color: tc.heading, borderColor: tc.border || '#E5E5EA' }, multiline && { height: 80, textAlignVertical: 'top' }]}
    value={value} onChangeText={onChangeText} placeholder={placeholder}
    placeholderTextColor={tc.subtext} keyboardType={keyboardType || 'default'}
    editable={editable} multiline={multiline} secureTextEntry={secureTextEntry}
    autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
  />
));

const StateDropdown = React.memo(({ value, options, placeholder, onSelect, tc }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity
        style={[ss.inp, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', flexDirection: 'row', alignItems: 'center' }]}
        onPress={() => setOpen(true)} activeOpacity={0.8}
      >
        <Text style={[{ flex: 1, fontSize: 15 }, { color: value ? tc.heading : tc.subtext }]}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={tc.subtext} />
      </TouchableOpacity>
      <Modal visible={open} animationType="slide" transparent>
        <TouchableOpacity style={ss.overlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={[ss.sheet, { backgroundColor: tc.card }]}>
            <View style={[ss.sheetHandle, { backgroundColor: tc.border || '#E5E5EA' }]} />
            <Text style={[ss.sheetTitle, { color: tc.heading }]}>{placeholder}</Text>
            <FlatList
              data={options} keyExtractor={i => i}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[ss.sheetRow, { borderBottomColor: tc.border || '#F0F0F0' }, item === value && { backgroundColor: `${tc.primary}10` }]}
                  onPress={() => { onSelect(item); setOpen(false); }}
                >
                  <Text style={[{ fontSize: 15, color: tc.heading }, item === value && { color: tc.primary, fontWeight: '700' }]}>{item}</Text>
                  {item === value && <Ionicons name="checkmark-circle" size={18} color={tc.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
});

const DatePicker = React.memo(({ value, onChange, tc, maxDate, minDate, placeholder }) => {
  const [show, setShow] = useState(false);
  const parsed = value ? new Date(value) : (maxDate || new Date());
  return (
    <>
      <TouchableOpacity
        style={[ss.inp, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', flexDirection: 'row', alignItems: 'center' }]}
        onPress={() => setShow(true)} activeOpacity={0.8}
      >
        <Text style={[{ flex: 1, fontSize: 15 }, { color: value ? tc.heading : tc.subtext }]}>{value ? fmtLocal(value) : (placeholder || 'Select date')}</Text>
        <Ionicons name="calendar-outline" size={18} color={tc.subtext} />
      </TouchableOpacity>
      {show && (
        <DateTimePicker value={parsed} mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={maxDate} minimumDate={minDate}
          onChange={(_, dt) => { setShow(Platform.OS === 'ios'); if (dt) onChange(toYMD(dt)); }}
        />
      )}
    </>
  );
});

// NameInput: plain text input with client-side checks only (no auto-API)
// Compliance checking is done separately via ComplianceChecker.
const NameInput = React.memo(({ optLabel, value, onChange, tc }) => {
  const [clientErr, setClientErr] = useState('');

  useEffect(() => {
    if (!value || !value.trim()) { setClientErr(''); return; }
    if (isSingle(value))         { setClientErr('Name must be more than one word'); return; }
    const pw = findProhibited(value);
    if (pw)                      { setClientErr(`Contains prohibited word: "${pw}"`); return; }
    setClientErr('');
  }, [value]);

  return (
    <View>
      {optLabel && <Text style={[ss.optLabel, { color: tc.subheading }]}>{optLabel}</Text>}
      <View style={[ss.inp, { backgroundColor: tc.card, borderColor: clientErr ? '#EF4444' : tc.border || '#E5E5EA', flexDirection: 'row', alignItems: 'center' }]}>
        <TextInput
          style={[{ flex: 1, fontSize: 15, color: tc.heading }]}
          value={value} onChangeText={onChange}
          placeholder="e.g. Emeka Ventures" placeholderTextColor={tc.subtext}
          autoCapitalize="words"
        />
        {clientErr ? <Ionicons name="alert-circle" size={20} color="#EF4444" /> : (value?.trim() && !isSingle(value) && !findProhibited(value)) ? <Ionicons name="checkmark-circle" size={20} color="#4CAF50" /> : null}
      </View>
      {clientErr ? <Text style={[ss.hint, { color: '#EF4444' }]}>{clientErr}</Text> : null}
    </View>
  );
});

// ComplianceChecker: manual compliance check for both names — defined OUTSIDE CACScreen
const ComplianceChecker = React.memo(({ name1, name2, lob, tc, onSupportingDocRequired, onResult, onProceed }) => {
  const [result1,     setResult1]     = useState(null);
  const [result2,     setResult2]     = useState(null);
  const [checking,    setChecking]    = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [unavailMsg,  setUnavailMsg]  = useState('');

  const parseScore = (s) => {
    if (!s) return null;
    const n = parseFloat(String(s).replace('%', ''));
    return isNaN(n) ? null : n;
  };

  const parse = (r) => {
    if (!r) return null;
    const outer = r?.data || r;
    const inner = outer?.data || {};
    const complianceScore = parseScore(inner.complianceScore);
    const similarityScore = parseScore(inner.similarityScore);
    const httpOk = outer.statusCode === 200 || outer.success === true;
    return {
      message:         outer.message || (httpOk ? 'Name check completed.' : 'Name check failed.'),
      complianceScore,
      similarityScore,
      mostSimilarName: inner.mostSimilarName || null,
      passed:  httpOk && (complianceScore === null || complianceScore >= 70),
      warn:    httpOk && complianceScore !== null && complianceScore >= 40 && complianceScore < 70,
      failed: !httpOk || (complianceScore !== null && complianceScore < 40),
    };
  };

  const runCheck = async () => {
    if (!name1?.trim() && !name2?.trim()) {
      Alert.alert('Enter names', 'Please fill in at least one business name first.');
      return;
    }
    setChecking(true);
    setResult1(null); setResult2(null);
    setUnavailable(false); setUnavailMsg('');
    try {
      const [r1, r2] = await Promise.all([
        name1?.trim() ? cacCheckCompliance(name1.trim(), lob || '') : Promise.resolve(null),
        name2?.trim() ? cacCheckCompliance(name2.trim(), lob || '') : Promise.resolve(null),
      ]);
      if (r1?.unavailable || r2?.unavailable) {
        setUnavailable(true);
        setUnavailMsg(r1?.message || r2?.message || 'Compliance check is not available for your account.');
        onResult?.(null, null);
        return;
      }
      const p1 = parse(r1), p2 = parse(r2);
      setResult1(p1); setResult2(p2);
      onResult?.(p1, p2);
    } catch (e) {
      Alert.alert('Check failed', e.message || 'Could not run compliance check. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const clearResults = () => {
    setResult1(null); setResult2(null);
    setUnavailable(false); setUnavailMsg('');
    onResult?.(null, null);
  };

  const ScoreExplainer = ({ score, type }) => {
    if (score === null || score === undefined) return null;
    let color, text;
    if (type === 'compliance') {
      if (score >= 70) {
        color = '#15803D';
        text  = `${score.toFixed(0)}% — Your name fully meets CAC naming standards. This is a strong choice.`;
      } else if (score >= 40) {
        color = '#92400E';
        text  = `${score.toFixed(0)}% — Your name partially meets CAC standards. It may still be approved, but CAC could request minor changes.`;
      } else {
        color = '#991B1B';
        text  = `${score.toFixed(0)}% — Your name does not meet CAC standards. We strongly recommend choosing a different name.`;
      }
    } else {
      if (score <= 50) {
        color = '#15803D';
        text  = `${score.toFixed(0)}% — No similar name found. Your name is very unique — excellent!`;
      } else if (score <= 80) {
        color = '#92400E';
        text  = `${score.toFixed(0)}% — A business with a similar name exists. CAC will review carefully, but your name may still be registered.`;
      } else {
        color = '#991B1B';
        text  = `${score.toFixed(0)}% — Your name is very similar to an existing business. CAC may reject it. Consider a more unique name.`;
      }
    }
    return (
      <View style={[ss.scoreExplain, { backgroundColor: `${color}12`, borderColor: `${color}30` }]}>
        <Text style={[ss.scoreExplainText, { color }]}>{text}</Text>
      </View>
    );
  };

  const ResultCard = ({ name, result }) => {
    if (!result) return null;
    const statusColor = result.passed ? '#16A34A' : result.warn ? '#D97706' : '#DC2626';
    const bgColor     = result.passed ? '#F0FDF4' : result.warn ? '#FFFBEB' : '#FEF2F2';
    const borderColor = result.passed ? '#86EFAC' : result.warn ? '#FDE68A' : '#FECACA';
    const icon  = result.passed ? 'checkmark-circle' : result.warn ? 'warning' : 'close-circle';
    const label = result.passed ? 'Passed' : result.warn ? 'Needs Review' : 'Failed';

    return (
      <View style={[ss.compCard, { backgroundColor: bgColor, borderColor }]}>
        {/* Name + verdict badge */}
        <View style={ss.compCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[ss.compCardName, { color: '#1E293B' }]} numberOfLines={1}>{name}</Text>
          </View>
          <View style={[ss.compBadge, { backgroundColor: `${statusColor}18`, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
            <Ionicons name={icon} size={13} color={statusColor} />
            <Text style={[ss.compBadgeText, { color: statusColor }]}>{label}</Text>
          </View>
        </View>

        {/* API message */}
        <View style={[ss.compStatusRow, { borderLeftColor: statusColor, borderLeftWidth: 3 }]}>
          <Text style={[ss.compStatusText, { color: statusColor }]}>{result.message}</Text>
        </View>

        {/* Compliance Score */}
        {result.complianceScore !== null && (
          <View style={ss.scoreItem}>
            <View style={[ss.scoreLabelPill, { backgroundColor: `${statusColor}15` }]}>
              <Ionicons name="analytics-outline" size={11} color={statusColor} />
              <Text style={[ss.scoreLabel, { color: statusColor }]}>Compliance Score</Text>
            </View>
            <View style={[ss.scoreBarTrack, { backgroundColor: '#E2E8F0' }]}>
              <View style={[ss.scoreFill, { width: `${Math.min(result.complianceScore, 100)}%`, backgroundColor: result.complianceScore >= 70 ? '#16A34A' : result.complianceScore >= 40 ? '#D97706' : '#DC2626' }]} />
            </View>
            <ScoreExplainer score={result.complianceScore} type="compliance" />
          </View>
        )}

        {/* Similarity Score */}
        {result.similarityScore !== null && (
          <View style={[ss.scoreItem, { marginTop: 10 }]}>
            <View style={[ss.scoreLabelPill, { backgroundColor: result.similarityScore <= 50 ? '#F0FDF4' : result.similarityScore <= 80 ? '#FFFBEB' : '#FEF2F2' }]}>
              <Ionicons name="git-compare-outline" size={11} color={result.similarityScore <= 50 ? '#16A34A' : result.similarityScore <= 80 ? '#D97706' : '#DC2626'} />
              <Text style={[ss.scoreLabel, { color: result.similarityScore <= 50 ? '#16A34A' : result.similarityScore <= 80 ? '#D97706' : '#DC2626' }]}>Similarity Score</Text>
            </View>
            <View style={[ss.scoreBarTrack, { backgroundColor: '#E2E8F0' }]}>
              <View style={[ss.scoreFill, { width: `${Math.min(result.similarityScore, 100)}%`, backgroundColor: result.similarityScore <= 50 ? '#16A34A' : result.similarityScore <= 80 ? '#D97706' : '#DC2626' }]} />
            </View>
            <ScoreExplainer score={result.similarityScore} type="similarity" />
          </View>
        )}

        {/* Most similar existing name */}
        {result.mostSimilarName && (
          <View style={[ss.similarRow, { backgroundColor: '#F1F5F9', borderRadius: 8, marginTop: 10, padding: 8 }]}>
            <Ionicons name="business-outline" size={14} color="#64748B" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '600', marginBottom: 2 }}>MOST SIMILAR EXISTING NAME</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }}>{result.mostSimilarName}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const hasResults = result1 || result2;

  return (
    <View style={ss.compCheckerWrap}>
      {/* Title — no background, plain label */}
      <View style={ss.compCheckerLabelRow}>
        <Ionicons name="shield-checkmark-outline" size={20} color={tc.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[ss.compCheckerTitle2, { color: tc.heading }]}>Check Business Name Compliance</Text>
          <Text style={[ss.compCheckerSub2, { color: tc.subheading }]}>Verify your names meet CAC requirements before submitting</Text>
        </View>
      </View>

      {/* Run button — always visible */}
      {!hasResults && (
        <TouchableOpacity
          style={[ss.checkBtn2, { backgroundColor: tc.primary, opacity: checking ? 0.7 : 1 }]}
          onPress={runCheck} disabled={checking} activeOpacity={0.85}
        >
          {checking
            ? <><ActivityIndicator size="small" color="#FFF" /><Text style={ss.checkBtnText2}>Checking…</Text></>
            : <><Ionicons name="search-outline" size={16} color="#FFF" /><Text style={ss.checkBtnText2}>Run Compliance Check</Text></>
          }
        </TouchableOpacity>
      )}

      {/* Re-check button (shown after results) */}
      {hasResults && !checking && (
        <TouchableOpacity style={[ss.checkBtn2, { backgroundColor: tc.card, borderWidth: 1, borderColor: tc.border || '#E5E5EA' }]} onPress={runCheck} activeOpacity={0.85}>
          <Ionicons name="refresh-outline" size={16} color={tc.primary} />
          <Text style={[ss.checkBtnText2, { color: tc.primary }]}>Re-check Names</Text>
        </TouchableOpacity>
      )}
      {checking && hasResults && (
        <View style={[ss.checkBtn2, { backgroundColor: tc.card }]}>
          <ActivityIndicator size="small" color={tc.primary} />
          <Text style={[ss.checkBtnText2, { color: tc.primary }]}>Checking…</Text>
        </View>
      )}

      {/* Not available — 403 from VAS */}
      {unavailable && (
        <View style={[ss.compUnavailBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1, borderRadius: 10 }]}>
          <Ionicons name="information-circle-outline" size={18} color="#2563EB" />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[ss.compUnavailTitle, { color: '#1E40AF' }]}>Compliance Check Unavailable</Text>
            <Text style={[ss.compUnavailMsg, { color: '#1D4ED8' }]}>{unavailMsg}</Text>
            <Text style={[ss.compUnavailNote, { color: '#3B82F6' }]}>You can still proceed — CAC will review your name during processing.</Text>
          </View>
        </View>
      )}

      {/* Results */}
      {hasResults && !unavailable && (
        <View style={{ gap: 12, marginTop: 4 }}>
          {result1 && name1?.trim() && <ResultCard name={name1} result={result1} />}
          {result2 && name2?.trim() && <ResultCard name={name2} result={result2} />}

          {/* Yes / No decision */}
          <View style={[ss.proceedCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
            <Text style={[ss.proceedQuestion, { color: tc.heading }]}>Do you want to continue with these names?</Text>
            <Text style={[ss.proceedSub, { color: tc.subheading }]}>
              Selecting "Yes" will take you to the next step. "No" will let you enter different names.
            </Text>
            <View style={ss.proceedBtnRow}>
              <TouchableOpacity
                style={[ss.proceedBtn, { backgroundColor: tc.primary }]}
                onPress={onProceed} activeOpacity={0.85}
              >
                <Ionicons name="checkmark" size={16} color="#FFF" />
                <Text style={ss.proceedBtnText}>Yes, Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ss.proceedBtnOutline, { borderColor: tc.border || '#E5E5EA' }]}
                onPress={clearResults} activeOpacity={0.85}
              >
                <Ionicons name="close" size={16} color={tc.subheading} />
                <Text style={[ss.proceedBtnOutlineText, { color: tc.subheading }]}>No, Change Names</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
});

const ImageUpload = React.memo(({ label, subtitle, required, value, fileName, fileKB, onPick, tc }) => {
  const [err, setErr] = useState('');
  const pick = async () => {
    const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (p.status !== 'granted') { Alert.alert('Permission needed', 'Allow photo library access.'); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, base64: true, allowsEditing: false });
    if (r.canceled) return;
    const a  = r.assets[0];
    const kb = a.fileSize ? a.fileSize / 1024 : (a.base64?.length * 0.75) / 1024;
    if (kb > 1024) { setErr('File too large — max 1MB. Please compress and try again.'); return; }
    setErr('');
    const name = a.fileName || `document_${Date.now()}.jpg`;
    // Pass (base64DataUri, kb, fileName, fileUri) — uri stored separately for draft persistence
    onPick(`data:image/jpeg;base64,${a.base64}`, Math.round(kb), name, a.uri);
  };

  return (
    <TouchableOpacity style={[ss.uploadCard, { backgroundColor: tc.card, borderColor: value ? '#4CAF50' : tc.border || '#E5E5EA', borderWidth: value ? 1.5 : 1 }]} onPress={pick} activeOpacity={0.8}>
      {value ? (
        <View style={ss.uploadedRow}>
          <Image source={{ uri: value }} style={ss.uploadThumb} />
          <View style={{ flex: 1 }}>
            <View style={ss.uploadedHeader}>
              <Text style={[ss.uploadLabel, { color: tc.heading }]}>{label}</Text>
              <View style={ss.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              </View>
            </View>
            <Text style={[ss.uploadRequired, { color: '#4CAF50' }]}>UPLOADED</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Ionicons name="document-outline" size={12} color={tc.subtext} />
              <Text style={[{ fontSize: 11, color: tc.subtext }]} numberOfLines={1}>{fileName || 'document.jpg'}</Text>
              {fileKB > 0 && <Text style={[{ fontSize: 11, fontWeight: '700', color: tc.primary }]}>{fileKB} KB</Text>}
            </View>
          </View>
        </View>
      ) : (
        <View style={ss.uploadEmpty}>
          <View style={[ss.uploadIconWrap, { backgroundColor: `${tc.primary}12` }]}>
            <Ionicons name={label.includes('Passport') ? 'person-outline' : label.includes('Signature') ? 'create-outline' : label.includes('ID') ? 'card-outline' : 'cloud-upload-outline'} size={28} color={tc.primary} />
          </View>
          <Text style={[ss.uploadLabel, { color: tc.heading }]}>{label}</Text>
          {subtitle && <Text style={[ss.uploadSub, { color: tc.subheading }]}>{subtitle}</Text>}
          <Text style={[ss.uploadRequired, { color: required ? '#EF4444' : tc.subtext }]}>{required ? 'REQUIRED' : 'OPTIONAL'}</Text>
          <Text style={[ss.uploadHint, { color: tc.subtext }]}>JPG, PNG or PDF  •  Max 1MB</Text>
        </View>
      )}
      {err ? <Text style={[ss.hint, { color: '#EF4444', textAlign: 'center', marginTop: 4 }]}>{err}</Text> : null}
    </TouchableOpacity>
  );
});

// ─── Proof of address options ─────────────────────────────────────────────────
const PROOF_OF_ADDRESS_OPTIONS = [
  'National ID Card (NIN)',
  'International Passport',
  "Driver's License",
  "Voter's Card",
  'Staff ID Card',
  'Electricity Bill (PHCN/Disco receipt)',
  'Water Bill',
  'Waste Management Bill',
  'Bank Statement',
  'DSTV/GOtv Subscription Receipt',
  'Tax Clearance Certificate',
  'CAC Certificate (for business address)',
  'Court Affidavit of Residence',
  'LASRRA Card (Lagos residents)',
];

// ─── Draft persistence ────────────────────────────────────────────────────────
const DRAFT_KEY = 'cac_registration_draft';
const IMAGE_BASE64_FIELDS = [
  'passport', 'meansOfId', 'signature', 'supportingDoc',
  'proprietorProofOfAddress', 'businessProofOfAddress',
];

async function saveDraft(form) {
  try {
    const draft = { ...form };
    IMAGE_BASE64_FIELDS.forEach(f => delete draft[f]); // keep URIs, drop base64
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Non-fatal — user can still proceed without persistence
  }
}

async function loadDraft() {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function clearDraft() {
  try { await AsyncStorage.removeItem(DRAFT_KEY); } catch {}
}

// Re-read a file URI back to base64 (for images restored from draft)
async function uriToBase64DataUri(uri) {
  if (!uri) return null;
  try {
    const b64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${b64}`;
  } catch {
    return null;
  }
}

// ─── ID Types accepted by Nigeria ─────────────────────────────────────────────
const ID_TYPES = [
  {
    key: 'nin',
    label: 'NIN (National Identification Number)',
    icon: 'card-outline',
    tip: 'Upload a clear photo of your NIN slip or physical NIN card. Ensure all digits are visible.',
  },
  {
    key: 'passport',
    label: 'International Passport',
    icon: 'airplane-outline',
    tip: 'Upload the bio-data page (page 2) of your international passport. Must be within validity period.',
  },
  {
    key: 'drivers_license',
    label: "Driver's License",
    icon: 'car-outline',
    tip: 'Upload the front side of your driver\'s license. Must be a valid, unexpired license.',
  },
  {
    key: 'voters_card',
    label: 'Permanent Voters Card (PVC)',
    icon: 'checkmark-circle-outline',
    tip: 'Upload the front side of your INEC Permanent Voter\'s Card showing your name and photo.',
  },
  {
    key: 'national_id',
    label: 'National Identity Card',
    icon: 'person-circle-outline',
    tip: 'Upload the front side of your NIMC National Identity Card. Both old and new card formats accepted.',
  },
];

// ─── Pre-check field metadata ─────────────────────────────────────────────────
const FIELD_LABEL = {
  proposedOption1: 'Desired Business Name', proposedOption2: 'Alternative Name',
  lineOfBusiness: 'Line of Business', businessCommencementDate: 'Commencement Date',
  proprietorFirstname: 'First Name', proprietorOthername: 'Other Name',
  proprietorSurname: 'Surname', proprietorGender: 'Gender', proprietorDob: 'Date of Birth',
  proprietorNationality: 'Nationality', proprietorPhonenumber: 'Phone Number',
  proprietorEmail: 'Email', proprietorStreetNumber: 'Street Number', proprietorNumber: 'Street Number',
  proprietorServiceAddress: 'Service Address', proprietorCity: 'City',
  proprietorState: 'State', proprietorLga: 'LGA', proprietorPostcode: 'Postcode',
  companyEmail: 'Company Email', companyStreetNumber: 'Company Street No.',
  companyAddress: 'Company Address', companyCity: 'Company City', companyState: 'Company State',
};
const FIELD_STEP = {
  proposedOption1: 1, proposedOption2: 1,
  lineOfBusiness: 2, businessCommencementDate: 2,
  proprietorFirstname: 3, proprietorOthername: 3, proprietorSurname: 3, proprietorGender: 3,
  proprietorDob: 3, proprietorNationality: 3, proprietorPhonenumber: 3, proprietorEmail: 3,
  proprietorStreetNumber: 3, proprietorNumber: 3, proprietorServiceAddress: 3, proprietorCity: 3,
  proprietorState: 3, proprietorLga: 3, proprietorPostcode: 3,
  companyEmail: 4, companyStreetNumber: 4, companyAddress: 4, companyCity: 4, companyState: 4,
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const TAB_LABELS = ['Names', 'Details', 'Proprietor', 'Address', 'Uploads', 'Review'];
const EMPTY_FORM = {
  proposedOption1: '', proposedOption2: '',
  lineOfBusiness: '', businessCommencementDate: '',
  priorityService: false, requiresSupportingDoc: false,
  proprietorFirstname: '', proprietorOthername: '', proprietorSurname: '',
  proprietorGender: '', proprietorDob: '', proprietorNationality: 'Nigerian',
  proprietorPhonenumber: '', proprietorEmail: '',
  proprietorStreetNumber: '', proprietorServiceAddress: '',
  proprietorCity: '', proprietorState: '', proprietorLga: '', proprietorPostcode: '',
  companyEmail: '', companyStreetNumber: '', companyAddress: '',
  companyCity: '', companyState: '',
  selectedIdType: '',
  // Document base64 (not persisted to draft — too large)
  passport: null, meansOfId: null, signature: null, supportingDoc: null,
  proprietorProofOfAddress: null, businessProofOfAddress: null,
  // Document metadata
  passportKB: 0,  meansOfIdKB: 0,  signatureKB: 0,  supportingDocKB: 0,
  proprietorProofOfAddressKB: 0, businessProofOfAddressKB: 0,
  passportName: '', meansOfIdName: '', signatureName: '', supportingDocName: '',
  proprietorProofOfAddressName: '', businessProofOfAddressName: '',
  // File URIs persisted to draft (used to re-encode on resume)
  passportUri: '', meansOfIdUri: '', signatureUri: '', supportingDocUri: '',
  proprietorProofOfAddressUri: '', businessProofOfAddressUri: '',
  // Proof-of-address type selectors
  proprietorProofOfAddressType: '', businessProofOfAddressType: '',
};

export default function CACScreen({ navigation }) {
  const dark   = useThem();
  const tc     = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { wallet } = useWallet();

  const [step,  setStep]  = useState(1);
  const [form,  setForm]  = useState({ ...EMPTY_FORM });
  const [pin,          setPin]          = useState('');
  const [busy,         setBusy]         = useState(false);
  const [showHint,     setShowHint]     = useState(false);
  const [preChecking,      setPreChecking]      = useState(false);
  const [preCheckDone,     setPreCheckDone]     = useState(false);
  const [preCheckErrors,   setPreCheckErrors]   = useState({});
  const [preCheckUnavail,  setPreCheckUnavail]  = useState(false);
  const [preCheckUnavailMsg, setPreCheckUnavailMsg] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);
  const [tipExpanded,       setTipExpanded]       = useState(false);
  const [compliancePassed,  setCompliancePassed]  = useState(false);
  const [idDropOpen,        setIdDropOpen]        = useState(false);

  // Load saved draft on mount; try to re-encode image URIs immediately
  useEffect(() => {
    (async () => {
      const draft = await loadDraft();
      if (!draft) return;
      // Attempt to re-read image URIs back to base64 (best-effort — may fail if URI expired)
      const uriPairs = [
        ['passport',                 'passportUri'],
        ['meansOfId',                'meansOfIdUri'],
        ['signature',                'signatureUri'],
        ['supportingDoc',            'supportingDocUri'],
        ['proprietorProofOfAddress', 'proprietorProofOfAddressUri'],
        ['businessProofOfAddress',   'businessProofOfAddressUri'],
      ];
      for (const [b64, uriKey] of uriPairs) {
        if (draft[uriKey] && !draft[b64]) {
          const recovered = await uriToBase64DataUri(draft[uriKey]);
          if (recovered) {
            draft[b64] = recovered;
          } else {
            draft[uriKey] = ''; // clear expired URI so upload field shows as "not uploaded"
          }
        }
      }
      setForm(prev => ({ ...prev, ...draft }));
      setDraftRestored(true);
    })();
  }, []);


  // Stable setter — doesn't recreate on every render
  const setField = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  const fee = form.priorityService ? CAC_PRICING.priority : CAC_PRICING.standard;
  const bal = wallet?.user?.walletBalance || 0;

  // ── Step validation ──────────────────────────────────────────────────────
  // Returns array of missing field labels for current step
  const getMissing = () => {
    const m = [];
    if (step === 1) {
      const nameOk = (n) => !!n?.trim() && !isSingle(n) && !findProhibited(n);
      if (!nameOk(form.proposedOption1)) m.push('Desired Business Name (must be 2+ words, no prohibited words)');
      if (!nameOk(form.proposedOption2)) m.push('Alternative Business Name (must be 2+ words, no prohibited words)');
    }
    if (step === 2) {
      if (!form.lineOfBusiness)           m.push('Line of Business');
      if (!form.businessCommencementDate) m.push('Commencement Date');
    }
    if (step === 3) {
      if (!form.proprietorFirstname)      m.push('First Name');
      if (!form.proprietorSurname)        m.push('Surname');
      if (!form.proprietorGender)         m.push('Gender');
      if (!form.proprietorDob)            m.push('Date of Birth');
      else if (getAge(form.proprietorDob) < 18) m.push('Date of Birth (must be 18+)');
      if (!form.proprietorPhonenumber)    m.push('Phone Number');
      if (!form.proprietorEmail)          m.push('Email');
      if (!form.proprietorStreetNumber)   m.push('Street Number');
      if (!form.proprietorServiceAddress) m.push('Service Address');
      if (!form.proprietorCity)           m.push('City');
      if (!form.proprietorState)          m.push('State');
    }
    if (step === 4) {
      if (!form.companyEmail)    m.push('Company Email');
      if (!form.companyAddress)  m.push('Company Address');
      if (!form.companyState)    m.push('State');
    }
    if (step === 5) {
      if (!form.passport)                       m.push('Passport Photograph');
      if (!form.selectedIdType)                 m.push('Select a Means of Identification');
      if (!form.meansOfId)                      m.push('Upload your selected ID document');
      if (!form.signature)                      m.push('Signature');
      if (!form.proprietorProofOfAddressType)   m.push('Proprietor Proof of Address — select type');
      else if (!form.proprietorProofOfAddress)  m.push('Proprietor Proof of Address — upload document');
      if (!form.businessProofOfAddressType)     m.push('Business Proof of Address — select type');
      else if (!form.businessProofOfAddress)    m.push('Business Proof of Address — upload document');
      if (form.requiresSupportingDoc && !form.supportingDoc) m.push('Supporting Document (required for your business name)');
    }
    return m;
  };

  const canGoNext = () => getMissing().length === 0;

  // Auto-hide hint once all issues are resolved
  useEffect(() => {
    if (showHint && canGoNext()) setShowHint(false);
  }, [form, showHint]);

  // ── Pre-submission validation check ─────────────────────────────────────
  const runPreCheck = async () => {
    setPreChecking(true);
    setPreCheckDone(false);
    setPreCheckErrors({});
    setPreCheckUnavail(false);
    setPreCheckUnavailMsg('');
    try {
      const payload = {
        proposedOption1:          form.proposedOption1,
        proposedOption2:          form.proposedOption2,
        lineOfBusiness:           form.lineOfBusiness,
        businessCommencementDate: form.businessCommencementDate,
        proprietorFirstname:      form.proprietorFirstname,
        proprietorOthername:      form.proprietorOthername,
        proprietorSurname:        form.proprietorSurname,
        proprietorGender:         form.proprietorGender,
        proprietorDob:            form.proprietorDob,
        proprietorNationality:    form.proprietorNationality,
        proprietorPhonenumber:    form.proprietorPhonenumber,
        proprietorEmail:          form.proprietorEmail,
        proprietorStreetNumber:   form.proprietorStreetNumber,
        proprietorServiceAddress: form.proprietorServiceAddress,
        proprietorCity:           form.proprietorCity,
        proprietorState:          form.proprietorState,
        proprietorLga:            form.proprietorLga,
        proprietorPostcode:       form.proprietorPostcode,
        companyEmail:             form.companyEmail,
        companyStreetNumber:      form.companyStreetNumber,
        companyAddress:           form.companyAddress,
        companyCity:              form.companyCity,
        companyState:             form.companyState,
      };

      const res = await cacValidatePayload(payload);

      // Graceful degradation — VAS returned 403 (endpoint not enabled for this account)
      if (res?.unavailable) {
        setPreCheckUnavail(true);
        setPreCheckUnavailMsg(res.message || 'Pre-validation is not available. You can still proceed with registration.');
        setPreCheckDone(true);
        setPreCheckErrors({});
        return;
      }

      const vasBody = res?.data || {};          // VAS response: { statusCode, data, success }
      const rawErrors = vasBody?.data || {};    // actual field errors: { proprietorDob: [...] }
      // Image fields are stripped server-side before sending to VAS, so VAS always
      // reports them as "missing key". Filter them out — they are validated client-side.
      const IMAGE_KEYS = new Set(['passport', 'meansOfId', 'signature', 'supportingDoc',
                                   'proprietorProofOfAddress', 'businessProofOfAddress']);
      const errors = Object.fromEntries(
        Object.entries(rawErrors).filter(([k]) => !IMAGE_KEYS.has(k))
      );
      setPreCheckErrors(errors);
      setPreCheckDone(true);
    } catch (e) {
      Alert.alert('Pre-Check Failed', e.message || 'Could not run validation. Please check your connection.');
    } finally {
      setPreChecking(false);
    }
  };

  const preCheckPassed = preCheckDone && (
    preCheckUnavail ||
    Object.keys(preCheckErrors).filter(k => {
      const v = preCheckErrors[k];
      return Array.isArray(v) ? v.length > 0 : !!v;
    }).length === 0
  );

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!preCheckPassed) { Alert.alert('Run Pre-Check First', 'Please run the free pre-submission check before paying.'); return; }
    if (pin.length !== 4) { Alert.alert('PIN required', 'Enter your 4-digit transaction PIN.'); return; }
    if (bal < fee) { Alert.alert('Insufficient Balance', `You need ${formatCurrency(fee, 'NGN')} to proceed. Please fund your wallet.`); return; }
    setBusy(true);
    try {
      // Re-encode any images that were restored from draft (URI exists but base64 is null)
      let finalForm = { ...form };
      const imgFields = [
        ['passport',                 'passportUri'],
        ['meansOfId',                'meansOfIdUri'],
        ['signature',                'signatureUri'],
        ['supportingDoc',            'supportingDocUri'],
        ['proprietorProofOfAddress', 'proprietorProofOfAddressUri'],
        ['businessProofOfAddress',   'businessProofOfAddressUri'],
      ];
      for (const [b64Field, uriField] of imgFields) {
        if (!finalForm[b64Field] && finalForm[uriField]) {
          const encoded = await uriToBase64DataUri(finalForm[uriField]);
          if (!encoded) {
            const labelMap = {
              passport: 'Passport Photo', meansOfId: 'ID Document',
              signature: 'Signature', supportingDoc: 'Supporting Document',
              proprietorProofOfAddress: 'Proprietor Proof of Address',
              businessProofOfAddress: 'Business Proof of Address',
            };
            Alert.alert(
              'Image Expired',
              `Could not read ${labelMap[b64Field] || b64Field}. Please go to Step 4 and re-upload it.`
            );
            setBusy(false);
            return;
          }
          finalForm[b64Field] = encoded;
        }
      }

      const regRes = await cacRegisterBusinessName(pin, finalForm);
      if (!regRes?.success) {
        Alert.alert('Submission Failed', regRes?.message || 'Could not submit. Please try again.');
        setBusy(false);
        return;
      }
      await clearDraft(); // Only clear on success
      const ref = regRes.data?.transactionRef || regRes.transactionRef;
      navigation.navigate('CACStatus', { transactionRef: ref, businessName: form.proposedOption1 });
    } catch (e) {
      Alert.alert('Error', e.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP RENDERERS — plain functions returning JSX, NOT component definitions
  // This is the critical fix: do NOT do `const S1 = () => (...)` here
  // ─────────────────────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <ScrollView contentContainerStyle={ss.sc} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Proposed Business Names card */}
      <View style={[ss.card, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
        <View style={ss.cardHeader}>
          <Ionicons name="business-outline" size={20} color={tc.primary} />
          <Text style={[ss.cardTitle, { color: tc.heading }]}>Proposed Business Names</Text>
        </View>
        <Text style={[ss.cardSub, { color: tc.subheading }]}>Option 1 (Preferred)</Text>
        <NameInput value={form.proposedOption1} onChange={v => setField('proposedOption1', v)} tc={tc} />
        <View style={ss.divider} />
        <Text style={[ss.cardSub, { color: tc.subheading, marginTop: 12 }]}>Option 2 (Alternative)</Text>
        <NameInput value={form.proposedOption2} onChange={v => setField('proposedOption2', v)} tc={tc} />
      </View>

      {/* Compliance Checker — no background, flat label style */}
      <ComplianceChecker
        name1={form.proposedOption1}
        name2={form.proposedOption2}
        lob={form.lineOfBusiness}
        tc={tc}
        onSupportingDocRequired={() => setField('requiresSupportingDoc', true)}
        onResult={(p1, p2) => setCompliancePassed(!!(p1 && !p1.failed) && !!(p2 && !p2.failed))}
        onProceed={() => { saveDraft(form); setStep(2); }}
      />
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView contentContainerStyle={ss.sc} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Industry & Operations */}
      <View style={[ss.card, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
        <View style={ss.cardHeader}>
          <Ionicons name="briefcase-outline" size={20} color={tc.primary} />
          <Text style={[ss.cardTitle, { color: tc.heading }]}>Industry & Operations</Text>
        </View>
        <Text style={[ss.fieldLabel, { color: tc.subheading }]}>Line of Business</Text>
        <StateDropdown value={form.lineOfBusiness} options={LINE_OF_BUSINESS} placeholder="Select line of business" onSelect={v => setField('lineOfBusiness', v)} tc={tc} />
        <Text style={[ss.fieldLabel, { color: tc.subheading, marginTop: 14 }]}>Commencement Date</Text>
        <DatePicker value={form.businessCommencementDate} onChange={v => setField('businessCommencementDate', v)} tc={tc} maxDate={new Date()} placeholder="mm/dd/yyyy" />
      </View>

      {/* Priority Processing */}
      <View style={[ss.card, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
        <View style={ss.cardHeader}>
          <Ionicons name="flash-outline" size={20} color={tc.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[ss.cardTitle, { color: tc.heading }]}>Priority Processing</Text>
            <Text style={[ss.cardSub, { color: tc.subheading }]}>Get approved in 48 hours instead of 7 days.</Text>
          </View>
        </View>
        <View style={ss.priceToggleRow}>
          <TouchableOpacity style={[ss.priceBtn, { borderColor: !form.priorityService ? tc.primary : tc.border || '#E5E5EA', backgroundColor: !form.priorityService ? `${tc.primary}12` : tc.background }]} onPress={() => setField('priorityService', false)}>
            <Text style={[ss.priceBtnLabel, { color: !form.priorityService ? tc.primary : tc.subheading }]}>Standard</Text>
            <Text style={[ss.priceBtnAmt, { color: !form.priorityService ? tc.primary : tc.subheading }]}>{formatCurrency(CAC_PRICING.standard, 'NGN')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[ss.priceBtn, { borderColor: form.priorityService ? tc.primary : tc.border || '#E5E5EA', backgroundColor: form.priorityService ? `${tc.primary}12` : tc.background }]} onPress={() => setField('priorityService', true)}>
            <Text style={[ss.priceBtnLabel, { color: form.priorityService ? tc.primary : tc.subheading }]}>Priority</Text>
            <Text style={[ss.priceBtnAmt, { color: form.priorityService ? tc.primary : tc.subheading }]}>{formatCurrency(CAC_PRICING.priority, 'NGN')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Registration Summary */}
      <View style={[ss.summaryCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
        <Text style={[ss.cardTitle, { color: tc.heading, marginBottom: 12 }]}>Registration Summary</Text>
        <View style={ss.summRow}><Text style={[ss.summLabel, { color: tc.subheading }]}>Application Fee</Text><Text style={[ss.summVal, { color: tc.heading }]}>{formatCurrency(form.priorityService ? 35000 : 30000, 'NGN')}</Text></View>
        <View style={ss.summRow}><Text style={[ss.summLabel, { color: tc.subheading }]}>Service Charge</Text><Text style={[ss.summVal, { color: tc.heading }]}>{formatCurrency(form.priorityService ? 3000 : 5000, 'NGN')}</Text></View>
        <View style={[ss.summRow, ss.totalRow]}><Text style={[ss.totalLabel, { color: tc.heading }]}>Total</Text><Text style={[ss.totalAmt, { color: tc.primary }]}>{formatCurrency(fee, 'NGN')}</Text></View>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView contentContainerStyle={ss.sc} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={[ss.stepDesc, { color: tc.subheading }]}>Please provide the legal information for the primary business owner.</Text>

      {/* Personal Identification */}
      <View style={ss.sectionHeader}>
        <Ionicons name="person-outline" size={16} color={tc.primary} />
        <Text style={[ss.sectionTitle, { color: tc.subheading }]}>PERSONAL IDENTIFICATION</Text>
      </View>
      <View style={ss.fieldGap}>
        <Text style={[ss.fieldLabel, { color: tc.heading }]}>First Name</Text>
        <LabelInput value={form.proprietorFirstname} onChangeText={v => setField('proprietorFirstname', v)} placeholder="John" tc={tc} />
      </View>
      <View style={ss.fieldGap}>
        <Text style={[ss.fieldLabel, { color: tc.heading }]}>Other Name (Optional)</Text>
        <LabelInput value={form.proprietorOthername} onChangeText={v => setField('proprietorOthername', v)} placeholder="Middle name" tc={tc} />
      </View>
      <View style={ss.fieldGap}>
        <Text style={[ss.fieldLabel, { color: tc.heading }]}>Surname</Text>
        <LabelInput value={form.proprietorSurname} onChangeText={v => setField('proprietorSurname', v)} placeholder="Doe" tc={tc} />
      </View>
      <View style={ss.fieldGap}>
        <Text style={[ss.fieldLabel, { color: tc.heading }]}>Gender</Text>
        <View style={{ flexDirection: 'row', gap: 20 }}>
          {['Male', 'Female'].map(g => (
            <TouchableOpacity key={g} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} onPress={() => setField('proprietorGender', g.toUpperCase())}>
              <View style={[ss.radio, form.proprietorGender === g.toUpperCase() && { borderColor: tc.primary }]}>
                {form.proprietorGender === g.toUpperCase() && <View style={[ss.radioDot, { backgroundColor: tc.primary }]} />}
              </View>
              <Text style={[{ fontSize: 15, color: tc.heading }]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={ss.fieldGap}>
        <Text style={[ss.fieldLabel, { color: tc.heading }]}>Date of Birth</Text>
        <DatePicker value={form.proprietorDob} onChange={v => setField('proprietorDob', v)} tc={tc} maxDate={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000)} />
        {form.proprietorDob && getAge(form.proprietorDob) < 18 && <Text style={[ss.hint, { color: '#EF4444' }]}>Proprietor must be 18 years or older.</Text>}
      </View>
      <View style={ss.fieldGap}>
        <Text style={[ss.fieldLabel, { color: tc.heading }]}>Nationality</Text>
        <LabelInput value="Nigerian" editable={false} tc={tc} />
      </View>

      {/* Contact Information */}
      <View style={[ss.sectionHeader, { marginTop: 20 }]}>
        <Ionicons name="call-outline" size={16} color={tc.primary} />
        <Text style={[ss.sectionTitle, { color: tc.subheading }]}>CONTACT INFORMATION</Text>
      </View>
      <View style={ss.fieldGap}>
        <Text style={[ss.fieldLabel, { color: tc.heading }]}>Phone Number</Text>
        <View style={[ss.inp, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', flexDirection: 'row', alignItems: 'center' }]}>
          <Text style={[{ fontSize: 15, color: tc.subheading, marginRight: 8 }]}>+234</Text>
          <TextInput style={[{ flex: 1, fontSize: 15, color: tc.heading }]} value={form.proprietorPhonenumber} onChangeText={v => setField('proprietorPhonenumber', v.replace(/\D/g, ''))} placeholder="801 234 5678" placeholderTextColor={tc.subtext} keyboardType="number-pad" />
        </View>
      </View>
      <View style={ss.fieldGap}>
        <Text style={[ss.fieldLabel, { color: tc.heading }]}>Email Address</Text>
        <LabelInput value={form.proprietorEmail} onChangeText={v => setField('proprietorEmail', v)} placeholder="john.doe@business.com" keyboardType="email-address" tc={tc} />
      </View>

      {/* Residential Address */}
      <View style={[ss.sectionHeader, { marginTop: 20 }]}>
        <Ionicons name="location-outline" size={16} color={tc.primary} />
        <Text style={[ss.sectionTitle, { color: tc.subheading }]}>RESIDENTIAL ADDRESS</Text>
      </View>
      <View style={ss.fieldGap}>
        <Text style={[ss.fieldLabel, { color: tc.heading }]}>Street Address</Text>
        <LabelInput value={form.proprietorServiceAddress} onChangeText={v => setField('proprietorServiceAddress', v)} placeholder="House number, Street name, Landmark" multiline tc={tc} />
      </View>
      <View style={ss.fieldGap}>
        <Text style={[ss.fieldLabel, { color: tc.heading }]}>City</Text>
        <LabelInput value={form.proprietorCity} onChangeText={v => setField('proprietorCity', v)} placeholder="Ikeja" tc={tc} />
      </View>
      <View style={ss.fieldGap}>
        <Text style={[ss.fieldLabel, { color: tc.heading }]}>State</Text>
        <StateDropdown value={form.proprietorState} options={NIGERIAN_STATES} placeholder="Select State" onSelect={v => setField('proprietorState', v)} tc={tc} />
      </View>
      <View style={ss.fieldGap}>
        <Text style={[ss.fieldLabel, { color: tc.heading }]}>LGA</Text>
        <LabelInput value={form.proprietorLga} onChangeText={v => setField('proprietorLga', v)} placeholder="Local Government Area" tc={tc} />
      </View>
      <View style={ss.fieldGap}>
        <Text style={[ss.fieldLabel, { color: tc.heading }]}>Postcode</Text>
        <LabelInput value={form.proprietorPostcode} onChangeText={v => setField('proprietorPostcode', v)} placeholder="100001" keyboardType="number-pad" tc={tc} />
      </View>
    </ScrollView>
  );

  const renderStep4 = () => (
    <ScrollView contentContainerStyle={ss.sc} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={[ss.stepTitle, { color: tc.heading }]}>Physical & Digital Presence</Text>
      <Text style={[ss.stepDesc, { color: tc.subheading }]}>Please provide the registered business address and official contact details for your company.</Text>
      <View style={ss.fieldGap}>
        <Text style={[ss.fieldLabel, { color: tc.heading }]}>Company Email Address</Text>
        <View style={[ss.inp, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', flexDirection: 'row', alignItems: 'center' }]}>
          <Ionicons name="mail-outline" size={18} color={tc.subtext} style={{ marginRight: 8 }} />
          <TextInput style={[{ flex: 1, fontSize: 15, color: tc.heading }]} value={form.companyEmail} onChangeText={v => setField('companyEmail', v)} placeholder="e.g. contact@business.com" placeholderTextColor={tc.subtext} keyboardType="email-address" autoCapitalize="none" />
        </View>
      </View>
      <View style={ss.fieldGap}>
        <Text style={[ss.fieldLabel, { color: tc.heading }]}>No.</Text>
        <LabelInput value={form.companyStreetNumber} onChangeText={v => setField('companyStreetNumber', v)} placeholder="12" tc={tc} />
      </View>
      <View style={ss.fieldGap}>
        <Text style={[ss.fieldLabel, { color: tc.heading }]}>Company Address (Street Name)</Text>
        <LabelInput value={form.companyAddress} onChangeText={v => setField('companyAddress', v)} placeholder="e.g. Herbert Macaulay Way" tc={tc} />
      </View>
      <View style={ss.fieldGap}>
        <Text style={[ss.fieldLabel, { color: tc.heading }]}>City</Text>
        <LabelInput value={form.companyCity} onChangeText={v => setField('companyCity', v)} placeholder="e.g. Ikeja" tc={tc} />
      </View>
      <View style={ss.fieldGap}>
        <Text style={[ss.fieldLabel, { color: tc.heading }]}>State</Text>
        <StateDropdown value={form.companyState} options={NIGERIAN_STATES} placeholder="Select State" onSelect={v => setField('companyState', v)} tc={tc} />
      </View>
      <View style={[ss.addressNote, { backgroundColor: `${tc.primary}10` }]}>
        <Ionicons name="shield-checkmark-outline" size={14} color={tc.primary} />
        <Text style={[{ fontSize: 12, color: tc.subheading, flex: 1 }]}>Address details are required for CAC compliance and tax registration.</Text>
      </View>
    </ScrollView>
  );

  const renderStep5 = () => {
    const selectedId = ID_TYPES.find(t => t.key === form.selectedIdType);
    return (
      <ScrollView contentContainerStyle={ss.sc} showsVerticalScrollIndicator={false}>
        <Text style={[ss.stepTitle, { color: tc.heading }]}>Identity Verification</Text>
        <Text style={[ss.stepDesc, { color: tc.subheading }]}>Upload clear copies of the required documents to complete registration.</Text>

        {/* ── File Size Tip (collapsible) ─────────────────────────────────── */}
        <TouchableOpacity
          style={[ss.tipCard, { backgroundColor: '#FFF8E1', borderColor: '#FFC107' }]}
          onPress={() => setTipExpanded(v => !v)}
          activeOpacity={0.8}
        >
          <View style={ss.tipCardHeader}>
            <Ionicons name="information-circle-outline" size={18} color="#F59E0B" />
            <Text style={[ss.tipCardTitle, { color: '#92400E' }]}>File Size Tip — tap to {tipExpanded ? 'collapse' : 'expand'}</Text>
            <Ionicons name={tipExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#92400E" />
          </View>
          {tipExpanded && (
            <View style={{ paddingTop: 8, gap: 6 }}>
              <Text style={[ss.tipText, { color: '#92400E' }]}>All documents must be under 1MB. To compress:</Text>
              <Text style={[ss.tipText, { color: '#92400E' }]}>• <Text style={{ fontWeight: '700' }}>Canva (free)</Text> — open canva.com, upload your image, resize and download at lower quality</Text>
              <Text style={[ss.tipText, { color: '#92400E' }]}>• <Text style={{ fontWeight: '700' }}>iLovePDF / Smallpdf</Text> — compress PDF files online</Text>
              <Text style={[ss.tipText, { color: '#92400E' }]}>• <Text style={{ fontWeight: '700' }}>Camera settings</Text> — reduce photo resolution in your phone camera settings before taking the picture</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 0 — Passport Photograph (headshot) */}
        <View style={[ss.idSection, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <View style={ss.idSectionHeader}>
            <Ionicons name="person-circle-outline" size={18} color={tc.primary} />
            <Text style={[ss.idSectionTitle, { color: tc.heading }]}>Passport Photograph</Text>
            <View style={[ss.requiredBadge, { backgroundColor: `${tc.primary}15` }]}>
              <Text style={[ss.requiredBadgeText, { color: tc.primary }]}>REQUIRED</Text>
            </View>
          </View>
          <Text style={[ss.idSectionSub, { color: tc.subheading }]}>
            A recent clear passport-size photo of the proprietor (white or light background, face clearly visible).
          </Text>
          <ImageUpload
            label="Passport Photo" subtitle="Max 1MB · PNG or JPEG · Plain background"
            required
            value={form.passport} fileName={form.passportName} fileKB={form.passportKB}
            onPick={(b, kb, n, uri) => {
              setField('passport', b); setField('passportKB', kb);
              setField('passportName', n); setField('passportUri', uri || '');
            }}
            tc={tc}
          />
        </View>

        {/* 1 — Means of ID: dropdown select, then upload */}
        <View style={[ss.idSection, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <View style={ss.idSectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={18} color={tc.primary} />
            <Text style={[ss.idSectionTitle, { color: tc.heading }]}>Means of Identification</Text>
            <View style={[ss.requiredBadge, { backgroundColor: `${tc.primary}15` }]}>
              <Text style={[ss.requiredBadgeText, { color: tc.primary }]}>REQUIRED</Text>
            </View>
          </View>

          {/* Dropdown trigger */}
          <TouchableOpacity
            style={[ss.inp, { backgroundColor: tc.background, borderColor: selectedId ? tc.primary : tc.border || '#E5E5EA', flexDirection: 'row', alignItems: 'center', borderWidth: selectedId ? 1.5 : 1 }]}
            onPress={() => setIdDropOpen(true)} activeOpacity={0.8}
          >
            {selectedId
              ? <><Ionicons name={selectedId.icon} size={16} color={tc.primary} style={{ marginRight: 8 }} /><Text style={{ flex: 1, fontSize: 15, color: tc.heading, fontWeight: '600' }}>{selectedId.label}</Text></>
              : <Text style={{ flex: 1, fontSize: 15, color: tc.subtext }}>Select means of identification</Text>
            }
            <Ionicons name="chevron-down" size={18} color={tc.subtext} />
          </TouchableOpacity>

          {/* Bottom-sheet modal */}
          <Modal visible={idDropOpen} animationType="slide" transparent>
            <TouchableOpacity style={ss.overlay} onPress={() => setIdDropOpen(false)} activeOpacity={1}>
              <View style={[ss.sheet, { backgroundColor: tc.card }]}>
                <View style={[ss.sheetHandle, { backgroundColor: tc.border || '#E5E5EA' }]} />
                <Text style={[ss.sheetTitle, { color: tc.heading }]}>Select Means of Identification</Text>
                <FlatList
                  data={ID_TYPES}
                  keyExtractor={i => i.key}
                  renderItem={({ item }) => {
                    const isSel = form.selectedIdType === item.key;
                    return (
                      <TouchableOpacity
                        style={[ss.sheetRow, { borderBottomColor: tc.border || '#F0F0F0' }, isSel && { backgroundColor: `${tc.primary}10` }]}
                        onPress={() => {
                          if (form.selectedIdType !== item.key) {
                            setField('meansOfId', null); setField('meansOfIdKB', 0);
                            setField('meansOfIdName', ''); setField('meansOfIdUri', '');
                          }
                          setField('selectedIdType', item.key);
                          setIdDropOpen(false);
                        }}
                      >
                        <View style={[ss.idTypeIcon, { backgroundColor: isSel ? `${tc.primary}20` : `${tc.subtext}12` }]}>
                          <Ionicons name={item.icon} size={18} color={isSel ? tc.primary : tc.subtext} />
                        </View>
                        <Text style={[{ flex: 1, fontSize: 15, color: tc.heading }, isSel && { color: tc.primary, fontWeight: '700' }]}>{item.label}</Text>
                        {isSel && <Ionicons name="checkmark-circle" size={18} color={tc.primary} />}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Upload appears after selection */}
          {selectedId && (
            <View style={[ss.idUploadCard, { backgroundColor: tc.background, borderColor: tc.border || '#E5E5EA', marginTop: 12 }]}>
              <View style={[ss.idTipRow, { backgroundColor: `${tc.primary}10` }]}>
                <Ionicons name="bulb-outline" size={15} color={tc.primary} />
                <Text style={[ss.idTipText, { color: tc.primary }]}>{selectedId.tip}</Text>
              </View>
              <ImageUpload
                label={`Upload: ${selectedId.label}`}
                subtitle="Max 1MB · PNG or JPEG · High resolution"
                required
                value={form.meansOfId} fileName={form.meansOfIdName} fileKB={form.meansOfIdKB}
                onPick={(b, kb, n, uri) => {
                  setField('meansOfId', b); setField('meansOfIdKB', kb);
                  setField('meansOfIdName', n); setField('meansOfIdUri', uri || '');
                }}
                tc={tc}
              />
            </View>
          )}
        </View>

        {/* 3 — Signature with guidance card */}
        <View style={[ss.idSection, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <View style={ss.idSectionHeader}>
            <Ionicons name="create-outline" size={18} color={tc.primary} />
            <Text style={[ss.idSectionTitle, { color: tc.heading }]}>Proprietor Signature</Text>
            <View style={[ss.requiredBadge, { backgroundColor: `${tc.primary}15` }]}>
              <Text style={[ss.requiredBadgeText, { color: tc.primary }]}>REQUIRED</Text>
            </View>
          </View>

          {/* Permanent signature guidance */}
          <View style={[ss.sigGuideCard, { backgroundColor: `${tc.primary}08`, borderColor: `${tc.primary}25` }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Ionicons name="pencil-outline" size={15} color={tc.primary} />
              <Text style={[{ fontSize: 13, fontWeight: '700', color: tc.primary }]}>How to Upload Your Signature</Text>
            </View>
            {[
              '1. Get a plain white sheet of paper',
              '2. Sign your signature clearly on the paper',
              '3. Take a clear photo (good lighting, no shadows)',
              '4. Crop to show only the signature area',
              '5. Upload the photo below',
              '6. Ensure file size is under 1MB',
            ].map((step, i) => (
              <Text key={i} style={[{ fontSize: 12, color: tc.subheading, lineHeight: 20 }]}>{step}</Text>
            ))}
          </View>

          <ImageUpload
            label="Digital Signature" subtitle="Signature on plain white paper — see guide above" required
            value={form.signature} fileName={form.signatureName} fileKB={form.signatureKB}
            onPick={(b, kb, n, uri) => {
              setField('signature', b); setField('signatureKB', kb);
              setField('signatureName', n); setField('signatureUri', uri || '');
            }}
            tc={tc}
          />
        </View>

        {/* 4 — Proprietor Proof of Address */}
        <View style={[ss.idSection, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <View style={ss.idSectionHeader}>
            <Ionicons name="home-outline" size={18} color={tc.primary} />
            <Text style={[ss.idSectionTitle, { color: tc.heading }]}>Proprietor Proof of Address</Text>
            <View style={[ss.requiredBadge, { backgroundColor: `${tc.primary}15` }]}>
              <Text style={[ss.requiredBadgeText, { color: tc.primary }]}>REQUIRED</Text>
            </View>
          </View>
          <Text style={[ss.idSectionSub, { color: tc.subheading }]}>
            Select the type of document that proves your residential address (must be recent — within 3 months):
          </Text>
          <StateDropdown
            value={form.proprietorProofOfAddressType}
            options={PROOF_OF_ADDRESS_OPTIONS}
            placeholder="Select proof of address type"
            onSelect={v => {
              if (form.proprietorProofOfAddressType !== v) {
                setField('proprietorProofOfAddress', null);
                setField('proprietorProofOfAddressKB', 0);
                setField('proprietorProofOfAddressName', '');
                setField('proprietorProofOfAddressUri', '');
              }
              setField('proprietorProofOfAddressType', v);
            }}
            tc={tc}
          />
          {form.proprietorProofOfAddressType ? (
            <View style={{ marginTop: 12 }}>
              <ImageUpload
                label={`Upload: ${form.proprietorProofOfAddressType}`}
                subtitle="Max 1MB · PNG, JPEG or PDF"
                required
                value={form.proprietorProofOfAddress}
                fileName={form.proprietorProofOfAddressName}
                fileKB={form.proprietorProofOfAddressKB}
                onPick={(b, kb, n, uri) => {
                  setField('proprietorProofOfAddress', b);
                  setField('proprietorProofOfAddressKB', kb);
                  setField('proprietorProofOfAddressName', n);
                  setField('proprietorProofOfAddressUri', uri || '');
                }}
                tc={tc}
              />
            </View>
          ) : null}
        </View>

        {/* 5 — Business Proof of Address */}
        <View style={[ss.idSection, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <View style={ss.idSectionHeader}>
            <Ionicons name="business-outline" size={18} color={tc.primary} />
            <Text style={[ss.idSectionTitle, { color: tc.heading }]}>Business Proof of Address</Text>
            <View style={[ss.requiredBadge, { backgroundColor: `${tc.primary}15` }]}>
              <Text style={[ss.requiredBadgeText, { color: tc.primary }]}>REQUIRED</Text>
            </View>
          </View>
          <Text style={[ss.idSectionSub, { color: tc.subheading }]}>
            Select a document that proves your business/company address:
          </Text>
          <StateDropdown
            value={form.businessProofOfAddressType}
            options={PROOF_OF_ADDRESS_OPTIONS}
            placeholder="Select proof of address type"
            onSelect={v => {
              if (form.businessProofOfAddressType !== v) {
                setField('businessProofOfAddress', null);
                setField('businessProofOfAddressKB', 0);
                setField('businessProofOfAddressName', '');
                setField('businessProofOfAddressUri', '');
              }
              setField('businessProofOfAddressType', v);
            }}
            tc={tc}
          />
          {form.businessProofOfAddressType ? (
            <View style={{ marginTop: 12 }}>
              <ImageUpload
                label={`Upload: ${form.businessProofOfAddressType}`}
                subtitle="Max 1MB · PNG, JPEG or PDF"
                required
                value={form.businessProofOfAddress}
                fileName={form.businessProofOfAddressName}
                fileKB={form.businessProofOfAddressKB}
                onPick={(b, kb, n, uri) => {
                  setField('businessProofOfAddress', b);
                  setField('businessProofOfAddressKB', kb);
                  setField('businessProofOfAddressName', n);
                  setField('businessProofOfAddressUri', uri || '');
                }}
                tc={tc}
              />
            </View>
          ) : null}
        </View>

        {/* 6 — Supporting Document (conditional) */}
        <ImageUpload
          label="Supporting Document"
          subtitle={form.requiresSupportingDoc
            ? 'Required — proficiency certificate for your business name or line of business'
            : 'Any additional certification or authorization letters'}
          required={form.requiresSupportingDoc}
          value={form.supportingDoc} fileName={form.supportingDocName} fileKB={form.supportingDocKB}
          onPick={(b, kb, n, uri) => {
            setField('supportingDoc', b); setField('supportingDocKB', kb);
            setField('supportingDocName', n); setField('supportingDocUri', uri || '');
          }}
          tc={tc}
        />
      </ScrollView>
    );
  };

  const renderStep6 = () => {
    const sections = [
      {
        icon: 'briefcase-outline', title: 'Business Details', editStep: 2,
        rows: [
          ['BUSINESS NAME', form.proposedOption1],
          ['REGISTRATION TYPE', 'Business Name (Sole Proprietorship)'],
          ['NATURE OF BUSINESS', form.lineOfBusiness],
        ],
      },
      {
        icon: 'person-outline', title: 'Proprietor Information', editStep: 3,
        rows: [
          ['FULL NAME', `${form.proprietorFirstname} ${form.proprietorOthername || ''} ${form.proprietorSurname}`.trim()],
          ['EMAIL ADDRESS', form.proprietorEmail],
          ['PHONE NUMBER', form.proprietorPhonenumber ? `+234 ${form.proprietorPhonenumber}` : ''],
        ],
      },
      {
        icon: 'location-outline', title: 'Registered Address', editStep: 4,
        rows: [
          ['PHYSICAL ADDRESS', [form.companyStreetNumber, form.companyAddress, form.companyCity, `${form.companyState} State, Nigeria.`].filter(Boolean).join(', ')],
        ],
      },
    ];

    const docs = [
      { label: form.passportName || 'passport.jpg',                 size: form.passportKB,                   uploaded: !!form.passport || !!form.passportUri },
      { label: form.meansOfIdName || 'id_document.jpg',             size: form.meansOfIdKB,                  uploaded: !!form.meansOfId || !!form.meansOfIdUri },
      { label: form.signatureName || 'signature.png',               size: form.signatureKB,                  uploaded: !!form.signature || !!form.signatureUri },
      form.supportingDoc || form.supportingDocUri
        ? { label: form.supportingDocName || 'supporting.jpg', size: form.supportingDocKB, uploaded: true }
        : null,
      form.proprietorProofOfAddress || form.proprietorProofOfAddressUri
        ? { label: form.proprietorProofOfAddressName || 'proprietor_address.jpg', size: form.proprietorProofOfAddressKB, uploaded: true }
        : null,
      form.businessProofOfAddress || form.businessProofOfAddressUri
        ? { label: form.businessProofOfAddressName || 'business_address.jpg', size: form.businessProofOfAddressKB, uploaded: true }
        : null,
    ].filter(Boolean);

    const broke = bal < fee;

    return (
      <ScrollView contentContainerStyle={ss.sc} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={[ss.stepTitle, { color: tc.heading }]}>Final Review</Text>
        <Text style={[ss.stepDesc, { color: tc.subheading }]}>Please verify all information before submitting your registration.</Text>

        {/* ── Pre-submission Validation Check ───────────────────────────── */}
        <View style={[ss.preCheckCard, { backgroundColor: tc.primary }]}>

          {/* Decorative top-right glow blob */}
          <View style={ss.preCheckGlob} pointerEvents="none" />

          <View style={ss.preCheckHeader}>
            <View style={ss.preCheckIcon}>
              <Ionicons
                name={preCheckUnavail ? 'information-circle' : preCheckPassed ? 'checkmark-circle' : preCheckDone ? 'alert-circle' : 'shield-checkmark-outline'}
                size={22}
                color="#FFFFFF"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ss.preCheckTitle}>Pre-Submission Validation</Text>
              <Text style={ss.preCheckSub}>
                {preCheckUnavail
                  ? 'Validation unavailable — you can still submit'
                  : preCheckPassed
                    ? 'All fields validated — ready to submit'
                    : preCheckDone
                      ? 'Issues found — fix them before submitting'
                      : 'Free check — catch errors before paying'}
              </Text>
            </View>
          </View>

          {/* Field errors */}
          {preCheckDone && Object.keys(preCheckErrors).length > 0 && (
            <View style={ss.preCheckErrors}>
              {Object.entries(preCheckErrors)
                .map(([field, raw]) => [field, Array.isArray(raw) ? raw : (raw ? [String(raw)] : [])])
                .filter(([, errs]) => errs.length > 0)
                .map(([field, errs]) => {
                  const label   = FIELD_LABEL[field] || field;
                  const stepNum = FIELD_STEP[field];
                  return (
                    <View key={field} style={ss.preCheckErrorRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={ss.preCheckFieldLabel}>{label}</Text>
                        {errs.map((e, i) => <Text key={i} style={ss.preCheckFieldErr}>• {e}</Text>)}
                      </View>
                      {stepNum && (
                        <TouchableOpacity style={ss.goFixBtn} onPress={() => setStep(stepNum)}>
                          <Text style={ss.goFixBtnText}>Step {stepNum}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
            </View>
          )}

          {preCheckDone && preCheckUnavail && (
            <View style={ss.preCheckBanner}>
              <Ionicons name="information-circle-outline" size={15} color="rgba(255,255,255,0.9)" />
              <Text style={ss.preCheckBannerText}>{preCheckUnavailMsg}</Text>
            </View>
          )}

          {preCheckDone && !preCheckUnavail && preCheckPassed && (
            <View style={ss.preCheckBanner}>
              <Ionicons name="checkmark-circle" size={15} color="rgba(255,255,255,0.9)" />
              <Text style={ss.preCheckBannerText}>No issues found. Your payload is valid and ready to submit.</Text>
            </View>
          )}

          <TouchableOpacity
            style={[ss.preCheckBtn, { opacity: preChecking ? 0.7 : 1 }]}
            onPress={runPreCheck}
            disabled={preChecking}
            activeOpacity={0.85}
          >
            {preChecking
              ? <><ActivityIndicator size="small" color={tc.primary} /><Text style={[ss.preCheckBtnText, { color: tc.primary }]}>Checking…</Text></>
              : preCheckPassed
                ? <><Ionicons name="checkmark-circle" size={16} color="#22C55E" /><Text style={[ss.preCheckBtnText, { color: '#15803D' }]}>Passed — Re-run Check</Text></>
                : <><Ionicons name="shield-checkmark-outline" size={16} color={tc.primary} /><Text style={[ss.preCheckBtnText, { color: tc.primary }]}>{preCheckDone ? 'Re-run Check' : 'Run Pre-Check (Free)'}</Text></>
            }
          </TouchableOpacity>
        </View>

        {sections.map((sec) => (
          <View key={sec.title} style={[ss.reviewCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
            <View style={ss.reviewCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name={sec.icon} size={18} color={tc.primary} />
                <Text style={[ss.reviewCardTitle, { color: tc.heading }]}>{sec.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setStep(sec.editStep)}>
                <Text style={[ss.editBtn, { color: tc.primary }]}>Edit</Text>
              </TouchableOpacity>
            </View>
            {sec.rows.filter(([, v]) => v).map(([l, v]) => (
              <View key={l} style={ss.reviewRow}>
                <Text style={[ss.reviewRowLabel, { color: tc.subheading }]}>{l}</Text>
                <Text style={[ss.reviewRowValue, { color: tc.heading }]}>{v}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Documents */}
        <View style={[ss.reviewCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <View style={ss.reviewCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="cloud-upload-outline" size={18} color={tc.primary} />
              <Text style={[ss.reviewCardTitle, { color: tc.heading }]}>Supporting Documents</Text>
            </View>
            <TouchableOpacity onPress={() => setStep(4)}><Text style={[ss.editBtn, { color: tc.primary }]}>Edit</Text></TouchableOpacity>
          </View>
          {docs.filter(d => d.uploaded).map((d, i) => (
            <View key={i} style={[ss.docRow, { borderBottomColor: tc.border || '#F0F0F0' }]}>
              <Ionicons name="document-outline" size={16} color={tc.subheading} />
              <Text style={[ss.docName, { color: tc.heading }]} numberOfLines={1}>{d.label}</Text>
              <Text style={[ss.docSize, { color: tc.subtext }]}>{d.size ? `${Math.round(d.size)} KB` : ''} • Uploaded</Text>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={ss.paymentCard}>
          <Text style={ss.paymentTitle}>Payment Summary</Text>
          <View style={ss.payRow}><Text style={ss.payLabel}>CAC Registration Fee</Text><Text style={ss.payVal}>{formatCurrency(form.priorityService ? 35000 : 30000, 'NGN')}</Text></View>
          <View style={ss.payRow}><Text style={ss.payLabel}>Service Charge</Text><Text style={ss.payVal}>{formatCurrency(form.priorityService ? 3000 : 5000, 'NGN')}</Text></View>
          {form.priorityService && <View style={ss.payRow}><Text style={ss.payLabel}>Express Processing</Text><Text style={ss.payVal}>{formatCurrency(0, 'NGN')}</Text></View>}
          <View style={[ss.payRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={ss.payTotalLabel}>Total Amount</Text>
            <Text style={ss.payTotalAmt}>{formatCurrency(fee, 'NGN')}</Text>
          </View>
          <View style={[ss.walletRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', marginTop: 8, paddingTop: 12 }]}>
            <Ionicons name="wallet-outline" size={18} color="#FFF" />
            <Text style={ss.walletLabel}>Wallet Balance</Text>
            <Text style={[ss.walletBal, { color: broke ? '#FFB3B3' : '#7FFFB3' }]}>{formatCurrency(bal, 'NGN')}</Text>
          </View>
        </View>

        {broke && (
          <View style={[ss.insufficientRow, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="warning-outline" size={16} color="#EF4444" />
            <Text style={{ fontSize: 13, color: '#EF4444', flex: 1 }}>Insufficient balance. Please fund your wallet before proceeding.</Text>
          </View>
        )}

        {!broke && (
          <View style={[ss.pinCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
            <Text style={[ss.fieldLabel, { color: tc.heading, marginBottom: 8 }]}>Transaction PIN</Text>
            <TextInput
              style={[ss.inp, { backgroundColor: tc.background, color: tc.heading, borderColor: tc.border || '#E5E5EA', letterSpacing: 10, textAlign: 'center', fontSize: 18 }]}
              value={pin} onChangeText={setPin}
              placeholder="••••" placeholderTextColor={tc.subtext}
              keyboardType="number-pad" secureTextEntry maxLength={4}
            />
          </View>
        )}

        <TouchableOpacity
          style={[ss.submitBtn, { backgroundColor: tc.primary, opacity: (broke || busy || pin.length !== 4) ? 0.5 : 1 }]}
          onPress={handleSubmit} disabled={broke || busy || pin.length !== 4} activeOpacity={0.85}
        >
          {busy ? <ActivityIndicator color="#FFF" /> : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={ss.submitTxt}>Submit Registration</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </View>
          )}
        </TouchableOpacity>

        <View style={[ss.encryptedRow, { backgroundColor: tc.card }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#4CAF50" />
          <Text style={[{ fontSize: 11, color: tc.subheading }]}>DATA ENCRYPTED — Your personal information and business data are protected with bank-grade 256-bit SSL encryption.</Text>
        </View>
      </ScrollView>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const stepsOk = [canGoNext]; // evaluated lazily
  const btnLabel = step > 1 && step < 6 ? (step === 4 ? 'Continue' : step === 5 ? 'Continue' : 'Save & Continue') : null;

  const stepContent = step === 1 ? renderStep1()
    : step === 2 ? renderStep2()
    : step === 3 ? renderStep3()
    : step === 4 ? renderStep4()
    : step === 5 ? renderStep5()
    : renderStep6();

  return (
    <SafeAreaView style={[ss.container, { backgroundColor: tc.background }]}>
      <StatusBarComponent />

      {/* Header */}
      <View style={[ss.header, { backgroundColor: tc.background, borderBottomColor: tc.border || '#E5E5EA', paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={tc.heading} />
        </TouchableOpacity>
        <Text style={[ss.headerTitle, { color: tc.heading }]}>PayFlex</Text>
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <View style={[ss.helpBtn, { borderColor: tc.border || '#E5E5EA' }]}>
            <Ionicons name="help-circle-outline" size={20} color={tc.subheading} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Step indicator */}
      <View style={[ss.stepRow, { backgroundColor: tc.background }]}>
        <Text style={[ss.stepText, { color: tc.primary }]}>Step {step} of 6</Text>
        <Text style={[ss.stepName, { color: tc.subheading }]}>{TAB_LABELS[step - 1] || 'Review'}</Text>
      </View>
      <View style={[ss.progressBar, { backgroundColor: tc.border || '#E5E5EA' }]}>
        <View style={[ss.progressFill, { backgroundColor: tc.primary, width: `${(step / 6) * 100}%` }]} />
      </View>

      {/* Step titles */}
      {step === 2 && <View style={[ss.pageTitleWrap, { backgroundColor: tc.background }]}><Text style={[ss.pageTitle, { color: tc.heading }]}>Business Details</Text></View>}
      {step === 3 && <View style={[ss.pageTitleWrap, { backgroundColor: tc.background }]}><Text style={[ss.pageTitle, { color: tc.heading }]}>Proprietor Details</Text></View>}

      {/* Draft restored banner */}
      {draftRestored && (
        <TouchableOpacity
          style={ss.draftBanner}
          onPress={() => setDraftRestored(false)}
          activeOpacity={0.9}
        >
          <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
          <Text style={ss.draftBannerText}>Your previous progress has been restored. Continue where you left off.</Text>
          <Ionicons name="close" size={14} color="#2E7D32" />
        </TouchableOpacity>
      )}

      {/* Content — key={step} forces new ScrollView instance on each step, resetting scroll to top */}
      <View key={step} style={{ flex: 1 }}>
        {stepContent}
      </View>

      {/* "Need Help?" floating button — visible on all steps, clears nav + tab bar */}
      <TouchableOpacity
        style={[ss.helpFloat, { bottom: insets.bottom + (step < 6 ? 45 : 20) }]}
        onPress={() => Linking.openURL('https://wa.me/2349011495230?text=Hello%2C%20I%20need%20help%20with%20my%20CAC%20Business%20Registration%20on%20PayFlex')}
        activeOpacity={0.85}
      >
        <Ionicons name="logo-whatsapp" size={13} color="#FFF" />
        <Text style={ss.helpFloatText}>Need Help?</Text>
      </TouchableOpacity>

      {/* Bottom nav — hidden on step 1 (Yes/No handles navigation) and step 6 (review/submit) */}
      {step > 1 && step < 6 && (
        <View style={[ss.nav, { backgroundColor: tc.background, borderTopColor: tc.border || '#E5E5EA', paddingBottom: insets.bottom + 2 }]}>

          <View style={ss.navRow}>
            <TouchableOpacity
              style={[ss.prevBtn, { borderColor: tc.border || '#E5E5EA' }]}
              onPress={() => { setShowHint(false); setPreCheckDone(false); setPreCheckErrors({}); setStep(n => n - 1); }}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={15} color={tc.subheading} />
              <Text style={[ss.prevTxt, { color: tc.subheading }]}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[ss.nextBtn, { backgroundColor: tc.primary }]}
              onPress={() => {
                if (canGoNext()) {
                  setShowHint(false);
                  saveDraft(form);
                  setStep(n => n + 1);
                } else {
                  setShowHint(true);
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={ss.nextTxt}>{btnLabel}</Text>
              <Ionicons name="chevron-forward" size={15} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Missing fields hint — only shown after a failed continue attempt */}
          {showHint && getMissing().length > 0 && (
            <View style={[ss.missingBox, { backgroundColor: '#FFF3E0', borderColor: '#FF9800' }]}>
              <Ionicons name="alert-circle-outline" size={14} color="#FF9800" />
              <View style={{ flex: 1 }}>
                <Text style={ss.missingTitle}>Please complete the following:</Text>
                {getMissing().map((f, i) => (
                  <Text key={i} style={ss.missingItem}>• {f}</Text>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Bottom tab bar */}
      <View style={[ss.tabBar, { backgroundColor: tc.card, borderTopColor: tc.border || '#E5E5EA', paddingBottom: insets.bottom }]}>
        {TAB_LABELS.map((label, idx) => {
          const n = idx + 1;
          const active = step === n;
          const done = step > n;
          const icons = ['document-text-outline', 'briefcase-outline', 'person-outline', 'location-outline', 'cloud-upload-outline', 'checkmark-circle-outline'];
          return (
            <TouchableOpacity key={label} style={ss.tabItem} onPress={() => (done || active) && setStep(n)} activeOpacity={0.7}>
              <Ionicons name={done ? 'checkmark-circle' : icons[idx]} size={22} color={active ? tc.primary : done ? '#4CAF50' : tc.subtext} />
              <Text style={[ss.tabLabel, { color: active ? tc.primary : done ? '#4CAF50' : tc.subtext, fontWeight: active ? '700' : '400' }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle:  { fontSize: 16, fontWeight: '700' },
  helpBtn:      { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  stepText:     { fontSize: 13, fontWeight: '700' },
  stepName:     { fontSize: 13 },
  progressBar:  { height: 4, marginHorizontal: 16, borderRadius: 2, marginBottom: 4 },
  progressFill: { height: 4, borderRadius: 2 },
  pageTitleWrap:{ paddingHorizontal: 16, paddingVertical: 12 },
  pageTitle:    { fontSize: 22, fontWeight: '800' },
  sc:           { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  stepTitle:    { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  stepDesc:     { fontSize: 13, lineHeight: 20, marginBottom: 16 },
  card:         { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle:    { fontSize: 15, fontWeight: '700' },
  cardSub:      { fontSize: 12, marginBottom: 8 },
  divider:      { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  fieldGap:     { marginBottom: 14 },
  fieldLabel:   { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inp:          { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  hint:         { fontSize: 12, marginTop: 4 },
  radio:        { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#D0D0D0', alignItems: 'center', justifyContent: 'center' },
  radioDot:     { width: 10, height: 10, borderRadius: 5 },
  optLabel:     { fontSize: 12, marginBottom: 6 },
  compRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8, marginTop: 6 },
  compText:     { fontSize: 12, fontWeight: '600', flex: 1 },
  warnRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8, marginTop: 4 },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 8 },
  chipHint:     { fontSize: 11 },
  chip:         { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, borderWidth: 1 },
  chipT:        { fontSize: 12, fontWeight: '600' },
  priceToggleRow: { flexDirection: 'row', gap: 12 },
  priceBtn:     { flex: 1, borderWidth: 1.5, borderRadius: 10, padding: 12, alignItems: 'center' },
  priceBtnLabel:{ fontSize: 13, fontWeight: '600' },
  priceBtnAmt:  { fontSize: 15, fontWeight: '800', marginTop: 2 },
  summaryCard:  { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  summRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summLabel:    { fontSize: 14 },
  summVal:      { fontSize: 14, fontWeight: '600' },
  totalRow:     { borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 10, marginTop: 4 },
  totalLabel:   { fontSize: 15, fontWeight: '700' },
  totalAmt:     { fontSize: 22, fontWeight: '900' },
  addressNote:  { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, marginTop: 12 },
  uploadCard:   { borderRadius: 14, borderStyle: 'dashed', padding: 16, marginBottom: 14 },
  uploadEmpty:  { alignItems: 'center', gap: 8, paddingVertical: 8 },
  uploadIconWrap:{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  uploadLabel:  { fontSize: 14, fontWeight: '700' },
  uploadSub:    { fontSize: 12, textAlign: 'center' },
  uploadRequired:{ fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  uploadedRow:  { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  uploadedHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  uploadThumb:  { width: 64, height: 64, borderRadius: 8 },
  verifiedBadge:{ },
  fileGuide:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginTop: 4 },
  reviewCard:   { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  reviewCardHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  reviewCardTitle:{ fontSize: 15, fontWeight: '700' },
  editBtn:      { fontSize: 14, fontWeight: '600' },
  reviewRow:    { marginBottom: 8 },
  reviewRowLabel:{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  reviewRowValue:{ fontSize: 14, fontWeight: '500' },
  docRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  docName:      { flex: 1, fontSize: 13 },
  docSize:      { fontSize: 11 },
  paymentCard:  { borderRadius: 14, backgroundColor: '#3B0CB0', padding: 20, marginBottom: 14 },
  paymentTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 12 },
  payRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  payLabel:     { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  payVal:       { fontSize: 14, fontWeight: '600', color: '#FFF' },
  payTotalLabel:{ fontSize: 15, fontWeight: '700', color: '#FFF' },
  payTotalAmt:  { fontSize: 22, fontWeight: '900', color: '#FFF' },
  walletRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  walletLabel:  { flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  walletBal:    { fontSize: 15, fontWeight: '700' },
  insufficientRow:{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 10, marginBottom: 14 },
  pinCard:      { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  submitBtn:    { paddingVertical: 16, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
  submitTxt:    { color: '#FFF', fontSize: 16, fontWeight: '700' },
  encryptedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 14, borderRadius: 10, marginBottom: 8 },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:        { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingTop: 8 },
  sheetHandle:  { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  sheetTitle:   { fontSize: 16, fontWeight: '700', paddingHorizontal: 20, paddingBottom: 12 },
  sheetRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  nav:          { paddingHorizontal: 16, paddingTop: 6, borderTopWidth: 1 },
  navRow:       { flexDirection: 'row', gap: 8 },
  nextBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10 },
  nextTxt:      { color: '#FFF', fontSize: 13, fontWeight: '700' },
  prevBtn:      { flex: 0.45, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  prevTxt:      { fontSize: 13, fontWeight: '500' },
  // ID type selector (Step 4)
  idSection:       { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 },
  idSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  idSectionTitle:  { flex: 1, fontSize: 15, fontWeight: '700' },
  idSectionSub:    { fontSize: 12, marginBottom: 14, lineHeight: 18 },
  requiredBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  requiredBadgeText: { fontSize: 10, fontWeight: '800' },
  idTypeRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  idTypeIcon:      { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  idTypeLabel:     { flex: 1, fontSize: 14 },
  idUploadCard:    { borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', padding: 14, marginTop: 8 },
  idTipRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 8, marginBottom: 12 },
  idTipText:       { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '500' },
  // Pre-check card (Step 5) — purple background
  preCheckCard:        { borderRadius: 18, padding: 18, marginBottom: 16, overflow: 'hidden' },
  preCheckGlob:        {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  preCheckHeader:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  preCheckIcon:        {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  preCheckTitle:       { fontSize: 15, fontWeight: '800', color: '#FFFFFF', marginBottom: 3, letterSpacing: 0.2 },
  preCheckSub:         { fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.75)' },
  preCheckErrors:      {
    backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 10,
    paddingHorizontal: 12, paddingTop: 4, paddingBottom: 4, marginBottom: 12,
  },
  preCheckErrorRow:    {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)', gap: 10,
  },
  preCheckFieldLabel:  { fontSize: 12, fontWeight: '700', color: '#FFD6D6', marginBottom: 2 },
  preCheckFieldErr:    { fontSize: 11.5, color: 'rgba(255,255,255,0.7)', lineHeight: 18 },
  goFixBtn:            {
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  goFixBtnText:        { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  preCheckBanner:      {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: 10, marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  preCheckBannerText:  { fontSize: 12, flex: 1, fontWeight: '500', color: 'rgba(255,255,255,0.9)', lineHeight: 18 },
  preCheckBtn:         {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 3,
  },
  preCheckBtnText:     { fontSize: 14, fontWeight: '800' },
  unavailBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 4 },
  missingBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  missingTitle: { fontSize: 12, fontWeight: '700', color: '#E65100', marginBottom: 2 },
  missingItem:  { fontSize: 12, color: '#E65100', lineHeight: 18 },
  tabBar:       { flexDirection: 'row', borderTopWidth: 1, paddingTop: 8 },
  tabItem:      { flex: 1, alignItems: 'center', gap: 2, paddingBottom: 4 },
  tabLabel:     { fontSize: 10 },

  // Upload hint
  uploadHint:     { fontSize: 10, marginTop: 4 },
  // File size tip card
  tipCard:        { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 14 },
  tipCardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipCardTitle:   { flex: 1, fontSize: 13, fontWeight: '600' },
  tipText:        { fontSize: 12, lineHeight: 18 },
  // Signature guidance card
  sigGuideCard:   { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 12 },
  // Optional badge (mirror of requiredBadge)
  optionalBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  // Draft banner
  draftBanner:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E8F5E9', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#C8E6C9' },
  draftBannerText:{ flex: 1, fontSize: 12, color: '#2E7D32', fontWeight: '500' },
  // "Need Help?" floating button
  helpFloat:      { position: 'absolute', right: 16, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#25D366', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, zIndex: 999 },
  helpFloatText:  { color: '#FFF', fontSize: 11, fontWeight: '700' },
  // ComplianceChecker — flat label style (no background)
  compCheckerWrap:    { marginBottom: 14 },
  compCheckerLabelRow:{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  compCheckerTitle2:  { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  compCheckerSub2:    { fontSize: 12, lineHeight: 17 },
  checkBtn2:          {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, marginBottom: 12,
  },
  checkBtnText2:      { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  compUnavailBox:    { flexDirection: 'row', gap: 10, padding: 12, alignItems: 'flex-start' },
  compUnavailTitle:  { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  compUnavailMsg:    { fontSize: 12, lineHeight: 18 },
  compUnavailNote:   { fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  // ResultCard — light card color-coded per result
  compCard:          { borderRadius: 12, padding: 14, marginBottom: 2, borderWidth: 1 },
  compCardHeader:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  compCardName:      { fontSize: 14, fontWeight: '700' },
  compBadge:         { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  compBadgeText:     { fontSize: 11, fontWeight: '800' },
  compStatusRow:     { paddingLeft: 10, paddingVertical: 8, marginBottom: 10 },
  compStatusText:    { fontSize: 12, fontWeight: '700', flex: 1 },
  // Score bar items
  scoreItem:         { gap: 6 },
  scoreLabelPill:    {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  scoreLabel:        { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.3 },
  scoreBarTrack:     { height: 7, borderRadius: 4, overflow: 'hidden' },
  scoreFill:         { height: 7, borderRadius: 4 },
  // Score plain-English explanation
  scoreExplain:      { borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 6 },
  scoreExplainText:  { fontSize: 12, lineHeight: 18, fontWeight: '600' },
  // Similarity row
  similarRow:        { flexDirection: 'row', alignItems: 'center', gap: 7 },
  similarText:       { fontSize: 13, flex: 1 },
  // Yes / No decision card
  proceedCard:       { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 4 },
  proceedQuestion:   { fontSize: 15, fontWeight: '800', marginBottom: 6 },
  proceedSub:        { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  proceedBtnRow:     { flexDirection: 'row', gap: 8 },
  proceedBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12 },
  proceedBtnText:    { fontSize: 14, fontWeight: '700', color: '#FFF' },
  proceedBtnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, borderWidth: 1 },
  proceedBtnOutlineText: { fontSize: 14, fontWeight: '600' },
});
