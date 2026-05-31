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
  TextInput, Switch, ActivityIndicator, Modal, FlatList, Image, Alert, Platform,
} from 'react-native';
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
const ComplianceChecker = React.memo(({ name1, name2, lob, tc, onChipPress1, onChipPress2, onSupportingDocRequired }) => {
  const [result1,     setResult1]     = useState(null);
  const [result2,     setResult2]     = useState(null);
  const [checking,    setChecking]    = useState(false);
  const [expanded,    setExpanded]    = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [unavailMsg,  setUnavailMsg]  = useState('');

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

      // Handle graceful "not available" response from backend (403 from VAS)
      const anyUnavailable = r1?.unavailable || r2?.unavailable;
      if (anyUnavailable) {
        setUnavailable(true);
        setUnavailMsg(r1?.message || r2?.message || 'Compliance check is not available for your account.');
        setExpanded(true);
        return;
      }

      const parse = (r) => {
        if (!r) return null;
        const d = r?.data || r;
        return { code: String(d?.statusCode ?? d?.data?.statusCode ?? ''), data: d };
      };
      const p1 = parse(r1), p2 = parse(r2);
      setResult1(p1); setResult2(p2);
      if (p1?.code === '03' || p1?.code === '04' || p2?.code === '03' || p2?.code === '04') {
        onSupportingDocRequired?.();
      }
      setExpanded(true);
    } catch (e) {
      Alert.alert('Check failed', e.message || 'Could not run compliance check. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const ResultCard = ({ name, result, onChip }) => {
    if (!result) return null;
    const msg     = COMPLIANCE_MESSAGES[result.code];
    const score   = result.data?.complianceScorePercentage ?? result.data?.data?.complianceScorePercentage;
    const simScore= result.data?.similarityScorePercentage ?? result.data?.data?.similarityScorePercentage;
    const chips   = result.data?.recommendedActions?.[0]?.keywords || result.data?.data?.recommendedActions?.[0]?.keywords || [];
    const suggested = result.data?.suggestedNames || result.data?.data?.suggestedNames || [];
    const similar   = result.data?.similarNames   || result.data?.data?.similarNames   || [];

    return (
      <View style={[ss.compCard, { backgroundColor: msg ? `${msg.color}08` : `${tc.primary}08`, borderColor: msg ? `${msg.color}30` : tc.border || '#E5E5EA' }]}>
        <View style={ss.compCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[ss.compCardName, { color: tc.heading }]} numberOfLines={1}>{name}</Text>
          </View>
          <View style={[ss.compBadge, { backgroundColor: msg ? `${msg.color}20` : `${tc.primary}20` }]}>
            <Text style={[ss.compBadgeText, { color: msg?.color || tc.primary }]}>{result.code}</Text>
          </View>
        </View>

        {msg && (
          <View style={[ss.compStatusRow, { backgroundColor: `${msg.color}12` }]}>
            <Ionicons name={result.code === '00' ? 'checkmark-circle' : 'information-circle'} size={16} color={msg.color} />
            <Text style={[ss.compStatusText, { color: msg.color }]}>{msg.label}</Text>
          </View>
        )}

        {/* Scores */}
        {(score !== undefined || simScore !== undefined) && (
          <View style={ss.scoreRow}>
            {score !== undefined && (
              <View style={ss.scoreItem}>
                <Text style={[ss.scoreLabel, { color: tc.subheading }]}>Compliance Score</Text>
                <View style={[ss.scoreBar, { backgroundColor: tc.border || '#E5E5EA' }]}>
                  <View style={[ss.scoreFill, { width: `${Math.min(score, 100)}%`, backgroundColor: score >= 70 ? '#4CAF50' : score >= 40 ? '#FF9800' : '#EF4444' }]} />
                </View>
                <Text style={[ss.scoreVal, { color: score >= 70 ? '#4CAF50' : score >= 40 ? '#FF9800' : '#EF4444' }]}>{score?.toFixed(1)}%</Text>
              </View>
            )}
            {simScore !== undefined && (
              <View style={ss.scoreItem}>
                <Text style={[ss.scoreLabel, { color: tc.subheading }]}>Similarity Score</Text>
                <View style={[ss.scoreBar, { backgroundColor: tc.border || '#E5E5EA' }]}>
                  <View style={[ss.scoreFill, { width: `${Math.min(simScore, 100)}%`, backgroundColor: '#FF9800' }]} />
                </View>
                <Text style={[ss.scoreVal, { color: '#FF9800' }]}>{simScore?.toFixed(1)}%</Text>
              </View>
            )}
          </View>
        )}

        {/* Qualifier chips */}
        {chips.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={[ss.chipSectionLabel, { color: tc.subheading }]}>Suggested qualifiers — tap to append:</Text>
            <View style={ss.chipRow}>
              {chips.slice(0, 6).map((c, i) => (
                <TouchableOpacity key={i} style={[ss.chip, { borderColor: tc.primary, backgroundColor: `${tc.primary}10` }]} onPress={() => onChip?.(`${name} ${c}`)}>
                  <Text style={[ss.chipT, { color: tc.primary }]}>+ {c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Suggested names */}
        {suggested.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={[ss.chipSectionLabel, { color: tc.subheading }]}>Suggested alternatives:</Text>
            <View style={ss.chipRow}>
              {suggested.slice(0, 4).map((n, i) => (
                <TouchableOpacity key={i} style={[ss.chip, { borderColor: '#4CAF50', backgroundColor: '#4CAF5010' }]} onPress={() => onChip?.(n)}>
                  <Text style={[ss.chipT, { color: '#4CAF50' }]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Similar names */}
        {similar.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={[ss.chipSectionLabel, { color: tc.subheading }]}>Similar existing names:</Text>
            {similar.slice(0, 3).map((n, i) => (
              <View key={i} style={[ss.similarRow, { borderBottomColor: tc.border || '#F0F0F0' }]}>
                <Ionicons name="business-outline" size={14} color={tc.subtext} />
                <Text style={[{ fontSize: 13, color: tc.subheading, flex: 1 }]}>{n}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[ss.compCheckerCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
      <TouchableOpacity style={ss.compCheckerHeader} onPress={() => setExpanded(v => !v)} activeOpacity={0.8}>
        <View style={[ss.compCheckerIcon, { backgroundColor: `${tc.primary}15` }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color={tc.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[ss.compCheckerTitle, { color: tc.heading }]}>Check Business Name Compliance</Text>
          <Text style={[ss.compCheckerSub, { color: tc.subheading }]}>Verify your names meet CAC requirements before submitting</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={tc.subtext} />
      </TouchableOpacity>

      {expanded && (
        <View style={ss.compCheckerBody}>
          <TouchableOpacity
            style={[ss.checkBtn, { backgroundColor: tc.primary, opacity: checking ? 0.7 : 1 }]}
            onPress={runCheck} disabled={checking} activeOpacity={0.85}
          >
            {checking
              ? <><ActivityIndicator size="small" color="#FFF" /><Text style={ss.checkBtnText}>Checking…</Text></>
              : <><Ionicons name="search-outline" size={18} color="#FFF" /><Text style={ss.checkBtnText}>Run Compliance Check</Text></>
            }
          </TouchableOpacity>

          {/* Not available — 403 from VAS */}
          {unavailable && (
            <View style={[ss.unavailBox, { backgroundColor: '#FFF8E1', borderColor: '#FFC107' }]}>
              <Ionicons name="information-circle-outline" size={18} color="#F59E0B" />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400E' }}>
                  Compliance Check Unavailable
                </Text>
                <Text style={{ fontSize: 12, color: '#92400E', lineHeight: 18 }}>
                  {unavailMsg}
                </Text>
                <Text style={{ fontSize: 12, color: '#92400E', marginTop: 4, fontStyle: 'italic' }}>
                  You can still proceed with your registration. The CAC team will review your name during processing.
                </Text>
              </View>
            </View>
          )}

          {(result1 || result2) && !unavailable && (
            <View style={{ gap: 10, marginTop: 4 }}>
              {result1 && name1?.trim() && <ResultCard name={name1} result={result1} onChip={v => onChipPress1?.(v)} />}
              {result2 && name2?.trim() && <ResultCard name={name2} result={result2} onChip={v => onChipPress2?.(v)} />}
            </View>
          )}
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
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85, base64: true, allowsEditing: true });
    if (r.canceled) return;
    const a  = r.assets[0];
    const kb = a.fileSize ? a.fileSize / 1024 : (a.base64?.length * 0.75) / 1024;
    if (kb > 1024) { setErr('File too large — max 1MB'); return; }
    setErr('');
    const name = a.fileName || `document_${Date.now()}.jpg`;
    onPick(`data:image/jpeg;base64,${a.base64}`, Math.round(kb), name);
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
        </View>
      )}
      {err ? <Text style={[ss.hint, { color: '#EF4444', textAlign: 'center', marginTop: 4 }]}>{err}</Text> : null}
    </TouchableOpacity>
  );
});

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

// ─── Main Screen ──────────────────────────────────────────────────────────────

const TAB_LABELS = ['Details', 'Proprietor', 'Address', 'Uploads', 'Review'];
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
  passport: null, meansOfId: null, signature: null, supportingDoc: null,
  passportKB: 0, meansOfIdKB: 0, signatureKB: 0, supportingDocKB: 0,
  passportName: '', meansOfIdName: '', signatureName: '', supportingDocName: '',
};

export default function CACScreen({ navigation }) {
  const dark   = useThem();
  const tc     = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { wallet } = useWallet();

  const [step,  setStep]  = useState(1);
  const [form,  setForm]  = useState({ ...EMPTY_FORM });
  const [pin,   setPin]   = useState('');
  const [busy,      setBusy]     = useState(false);
  const [showHint,  setShowHint] = useState(false);
  // n1Stat/n2Stat removed — compliance is now optional via ComplianceChecker


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
      if (!form.lineOfBusiness)          m.push('Line of Business');
      if (!form.businessCommencementDate) m.push('Commencement Date');
    }
    if (step === 2) {
      if (!form.proprietorFirstname)      m.push('First Name');
      if (!form.proprietorSurname)        m.push('Surname');
      if (!form.proprietorGender)         m.push('Gender');
      if (!form.proprietorDob)            m.push('Date of Birth');
      else if (getAge(form.proprietorDob) < 18) m.push('Date of Birth (must be 18+)');
      if (!form.proprietorPhonenumber)    m.push('Phone Number');
      if (!form.proprietorEmail)          m.push('Email');
      if (!form.proprietorServiceAddress) m.push('Service Address');
      if (!form.proprietorCity)           m.push('City');
      if (!form.proprietorState)          m.push('State');
    }
    if (step === 3) {
      if (!form.companyEmail)    m.push('Company Email');
      if (!form.companyAddress)  m.push('Company Address');
      if (!form.companyState)    m.push('State');
    }
    if (step === 4) {
      if (!form.passport)        m.push('Passport Photo');
      if (!form.selectedIdType)  m.push('Select a Means of Identification');
      if (!form.meansOfId)       m.push('Upload your selected ID document');
      if (!form.signature)       m.push('Signature');
      if (form.requiresSupportingDoc && !form.supportingDoc) m.push('Supporting Document (required for your business name)');
    }
    return m;
  };

  const canGoNext = () => getMissing().length === 0;

  // Auto-hide hint once all issues are resolved
  useEffect(() => {
    if (showHint && canGoNext()) setShowHint(false);
  }, [form, showHint]);

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (pin.length !== 4) { Alert.alert('PIN required', 'Enter your 4-digit transaction PIN.'); return; }
    if (bal < fee) { Alert.alert('Insufficient Balance', `You need ${formatCurrency(fee, 'NGN')} to proceed. Please fund your wallet.`); return; }
    setBusy(true);
    try {
      const valRes = await cacValidatePayload({ ...form });
      if (!valRes?.success) {
        Alert.alert('Validation Failed', valRes?.message || 'Please check your details and try again.');
        setBusy(false);
        return;
      }
      const regRes = await cacRegisterBusinessName(pin, form);
      if (!regRes?.success) {
        Alert.alert('Submission Failed', regRes?.message || 'Could not submit. Please try again.');
        setBusy(false);
        return;
      }
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

      {/* Compliance Checker card */}
      <ComplianceChecker
        name1={form.proposedOption1}
        name2={form.proposedOption2}
        lob={form.lineOfBusiness}
        tc={tc}
        onChipPress1={v => setField('proposedOption1', v)}
        onChipPress2={v => setField('proposedOption2', v)}
        onSupportingDocRequired={() => setField('requiresSupportingDoc', true)}
      />

      {/* Industry & Operations card */}
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

      {/* Priority Processing card */}
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

  const renderStep2 = () => (
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

  const renderStep3 = () => (
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

  const renderStep4 = () => {
    const selectedId = ID_TYPES.find(t => t.key === form.selectedIdType);
    return (
      <ScrollView contentContainerStyle={ss.sc} showsVerticalScrollIndicator={false}>
        <Text style={[ss.stepTitle, { color: tc.heading }]}>Identity Verification</Text>
        <Text style={[ss.stepDesc, { color: tc.subheading }]}>Please upload clear copies of the following documents to complete your business registration.</Text>

        {/* 1 — Passport Photo (always shown) */}
        <ImageUpload
          label="Passport Photo" subtitle="Recent passport-sized photograph" required
          value={form.passport} fileName={form.passportName} fileKB={form.passportKB}
          onPick={(b, kb, n) => { setField('passport', b); setField('passportKB', kb); setField('passportName', n); }}
          tc={tc}
        />

        {/* 2 — Means of ID: select type first, then upload appears */}
        <View style={[ss.idSection, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <View style={ss.idSectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={18} color={tc.primary} />
            <Text style={[ss.idSectionTitle, { color: tc.heading }]}>Means of Identification</Text>
            <View style={[ss.requiredBadge, { backgroundColor: `${tc.primary}15` }]}>
              <Text style={[ss.requiredBadgeText, { color: tc.primary }]}>REQUIRED</Text>
            </View>
          </View>
          <Text style={[ss.idSectionSub, { color: tc.subheading }]}>
            Select one of the government-issued IDs accepted by CAC Nigeria:
          </Text>

          {/* ID Type list */}
          {ID_TYPES.map((idType) => {
            const isSelected = form.selectedIdType === idType.key;
            return (
              <TouchableOpacity
                key={idType.key}
                style={[
                  ss.idTypeRow,
                  {
                    backgroundColor: isSelected ? `${tc.primary}10` : tc.background,
                    borderColor: isSelected ? tc.primary : tc.border || '#E5E5EA',
                    borderWidth: isSelected ? 1.5 : 1,
                  },
                ]}
                onPress={() => {
                  // Clear existing upload if switching types
                  if (form.selectedIdType !== idType.key) {
                    setField('meansOfId', null);
                    setField('meansOfIdKB', 0);
                    setField('meansOfIdName', '');
                  }
                  setField('selectedIdType', idType.key);
                }}
                activeOpacity={0.8}
              >
                <View style={[ss.idTypeIcon, { backgroundColor: isSelected ? `${tc.primary}20` : `${tc.subtext}12` }]}>
                  <Ionicons name={idType.icon} size={20} color={isSelected ? tc.primary : tc.subtext} />
                </View>
                <Text style={[ss.idTypeLabel, { color: isSelected ? tc.primary : tc.heading, fontWeight: isSelected ? '700' : '500' }]}>
                  {idType.label}
                </Text>
                {isSelected
                  ? <Ionicons name="checkmark-circle" size={20} color={tc.primary} />
                  : <Ionicons name="chevron-forward" size={18} color={tc.subtext} />
                }
              </TouchableOpacity>
            );
          })}

          {/* Upload card — appears only after ID type is selected */}
          {selectedId && (
            <View style={[ss.idUploadCard, { backgroundColor: tc.background, borderColor: tc.border || '#E5E5EA' }]}>
              {/* Tip */}
              <View style={[ss.idTipRow, { backgroundColor: `${tc.primary}10` }]}>
                <Ionicons name="bulb-outline" size={15} color={tc.primary} />
                <Text style={[ss.idTipText, { color: tc.primary }]}>{selectedId.tip}</Text>
              </View>

              <ImageUpload
                label={`Upload: ${selectedId.label}`}
                subtitle="Max 1MB · PNG or JPEG · High resolution"
                required
                value={form.meansOfId}
                fileName={form.meansOfIdName}
                fileKB={form.meansOfIdKB}
                onPick={(b, kb, n) => { setField('meansOfId', b); setField('meansOfIdKB', kb); setField('meansOfIdName', n); }}
                tc={tc}
              />
            </View>
          )}
        </View>

        {/* 3 — Signature (always shown) */}
        <ImageUpload
          label="Digital Signature" subtitle="Upload a clear scan of your signature on white paper" required
          value={form.signature} fileName={form.signatureName} fileKB={form.signatureKB}
          onPick={(b, kb, n) => { setField('signature', b); setField('signatureKB', kb); setField('signatureName', n); }}
          tc={tc}
        />

        {/* 4 — Supporting Document (conditional) */}
        <ImageUpload
          label="Supporting Document"
          subtitle={form.requiresSupportingDoc ? 'Required — your business name or line of business requires a proficiency certificate' : 'Any additional certification or authorization letters'}
          required={form.requiresSupportingDoc}
          value={form.supportingDoc} fileName={form.supportingDocName} fileKB={form.supportingDocKB}
          onPick={(b, kb, n) => { setField('supportingDoc', b); setField('supportingDocKB', kb); setField('supportingDocName', n); }}
          tc={tc}
        />

        {/* File guidelines */}
        <View style={[ss.fileGuide, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <Ionicons name="information-circle-outline" size={16} color={tc.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[{ fontSize: 13, fontWeight: '600', color: tc.heading }]}>File Guidelines</Text>
            <Text style={[{ fontSize: 12, color: tc.subheading, marginTop: 2 }]}>Max size 1MB  •  PNG or JPEG only  •  High resolution</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderStep5 = () => {
    const sections = [
      {
        icon: 'briefcase-outline', title: 'Business Details', editStep: 1,
        rows: [
          ['BUSINESS NAME', form.proposedOption1],
          ['REGISTRATION TYPE', 'Business Name (Sole Proprietorship)'],
          ['NATURE OF BUSINESS', form.lineOfBusiness],
        ],
      },
      {
        icon: 'person-outline', title: 'Proprietor Information', editStep: 2,
        rows: [
          ['FULL NAME', `${form.proprietorFirstname} ${form.proprietorOthername || ''} ${form.proprietorSurname}`.trim()],
          ['EMAIL ADDRESS', form.proprietorEmail],
          ['PHONE NUMBER', form.proprietorPhonenumber ? `+234 ${form.proprietorPhonenumber}` : ''],
        ],
      },
      {
        icon: 'location-outline', title: 'Registered Address', editStep: 3,
        rows: [
          ['PHYSICAL ADDRESS', [form.companyStreetNumber, form.companyAddress, form.companyCity, `${form.companyState} State, Nigeria.`].filter(Boolean).join(', ')],
        ],
      },
    ];

    const docs = [
      { label: form.passportName || 'passport.jpg',      size: form.passportKB,      uploaded: !!form.passport },
      { label: form.meansOfIdName || 'id_document.jpg',  size: form.meansOfIdKB,     uploaded: !!form.meansOfId },
      { label: form.signatureName || 'signature.png',    size: form.signatureKB,     uploaded: !!form.signature },
      form.supportingDoc && { label: form.supportingDocName || 'supporting.jpg', size: form.supportingDocKB, uploaded: true },
    ].filter(Boolean);

    const broke = bal < fee;

    return (
      <ScrollView contentContainerStyle={ss.sc} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={[ss.stepTitle, { color: tc.heading }]}>Final Review</Text>
        <Text style={[ss.stepDesc, { color: tc.subheading }]}>Please verify all information before submitting your registration.</Text>

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
          {docs.map((d, i) => (
            <View key={i} style={[ss.docRow, { borderBottomColor: tc.border || '#F0F0F0' }]}>
              <Ionicons name="document-outline" size={16} color={tc.subheading} />
              <Text style={[ss.docName, { color: tc.heading }]} numberOfLines={1}>{d.label}</Text>
              <Text style={[ss.docSize, { color: tc.subtext }]}>{d.size} MB • Uploaded</Text>
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
  const btnLabel = step < 5 ? (step === 3 ? 'Continue to Uploads' : step === 4 ? 'Continue' : 'Save & Continue') : null;
  const prevLabel = step === 3 ? 'Previous Step' : step === 4 ? 'Save Draft' : '< Save & Previous';

  const stepContent = step === 1 ? renderStep1()
    : step === 2 ? renderStep2()
    : step === 3 ? renderStep3()
    : step === 4 ? renderStep4()
    : renderStep5();

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
        <Text style={[ss.stepText, { color: tc.primary }]}>Step {step} of 5</Text>
        <Text style={[ss.stepName, { color: tc.subheading }]}>{step < 5 ? TAB_LABELS[step - 1] : 'Review'}</Text>
      </View>
      <View style={[ss.progressBar, { backgroundColor: tc.border || '#E5E5EA' }]}>
        <View style={[ss.progressFill, { backgroundColor: tc.primary, width: `${(step / 5) * 100}%` }]} />
      </View>

      {/* Step titles (only on step > 1) */}
      {step === 2 && <View style={[ss.pageTitleWrap, { backgroundColor: tc.background }]}><Text style={[ss.pageTitle, { color: tc.heading }]}>Proprietor Details</Text></View>}

      {/* Content — using render function result, NOT component */}
      <View style={{ flex: 1 }}>
        {stepContent}
      </View>

      {/* Bottom nav */}
      {step < 5 && (
        <View style={[ss.nav, { backgroundColor: tc.background, borderTopColor: tc.border || '#E5E5EA', paddingBottom: insets.bottom + 8 }]}>

          <TouchableOpacity
            style={[ss.nextBtn, { backgroundColor: tc.primary }]}
            onPress={() => {
              if (canGoNext()) {
                setShowHint(false);
                setStep(n => n + 1);
              } else {
                setShowHint(true);
              }
            }}
            activeOpacity={0.85}
          >
            <Text style={ss.nextTxt}>{btnLabel}</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFF" />
          </TouchableOpacity>

          {step > 1 && (
            <TouchableOpacity
              style={[ss.prevBtn, { borderColor: tc.border || '#E5E5EA' }]}
              onPress={() => { setShowHint(false); setStep(n => n - 1); }}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={16} color={tc.subheading} />
              <Text style={[ss.prevTxt, { color: tc.subheading }]}>{prevLabel}</Text>
            </TouchableOpacity>
          )}

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
          const icons = ['briefcase-outline', 'person-outline', 'location-outline', 'cloud-upload-outline', 'checkmark-circle-outline'];
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
  nav:          { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, gap: 8 },
  nextBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 15, borderRadius: 12 },
  nextTxt:      { color: '#FFF', fontSize: 15, fontWeight: '700' },
  prevBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  prevTxt:      { fontSize: 14, fontWeight: '500' },
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
  unavailBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 4 },
  missingBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  missingTitle: { fontSize: 12, fontWeight: '700', color: '#E65100', marginBottom: 2 },
  missingItem:  { fontSize: 12, color: '#E65100', lineHeight: 18 },
  tabBar:       { flexDirection: 'row', borderTopWidth: 1, paddingTop: 8 },
  tabItem:      { flex: 1, alignItems: 'center', gap: 2, paddingBottom: 4 },
  tabLabel:     { fontSize: 10 },

  // ComplianceChecker
  compCheckerCard:   { borderRadius: 14, borderWidth: 1, marginBottom: 14 },
  compCheckerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  compCheckerIcon:   { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  compCheckerTitle:  { fontSize: 14, fontWeight: '700' },
  compCheckerSub:    { fontSize: 11, marginTop: 1 },
  compCheckerBody:   { paddingHorizontal: 14, paddingBottom: 14 },
  checkBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 10, marginBottom: 12 },
  checkBtnText:      { color: '#FFF', fontSize: 14, fontWeight: '700' },
  compCard:          { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 2 },
  compCardHeader:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  compCardName:      { fontSize: 14, fontWeight: '700' },
  compBadge:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  compBadgeText:     { fontSize: 11, fontWeight: '800' },
  compStatusRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8, marginBottom: 8 },
  compStatusText:    { fontSize: 12, fontWeight: '600', flex: 1 },
  scoreRow:          { gap: 10, marginBottom: 8 },
  scoreItem:         { gap: 4 },
  scoreLabel:        { fontSize: 11, fontWeight: '600' },
  scoreBar:          { height: 6, borderRadius: 3, overflow: 'hidden' },
  scoreFill:         { height: 6, borderRadius: 3 },
  scoreVal:          { fontSize: 12, fontWeight: '700' },
  chipSectionLabel:  { fontSize: 11, marginBottom: 6 },
  similarRow:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth },
});
