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

// NameField: stable component with compliance check — defined OUTSIDE CACScreen
const NameField = React.memo(({ label, optLabel, value, onChange, lob, onStatusChange, tc, onChipPress }) => {
  const [compStatus, setCompStatus] = useState(null);
  const [checking,   setChecking]   = useState(false);
  const [clientErr,  setClientErr]  = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    // Reset compliance status and client error
    setCompStatus(null);
    setClientErr('');

    if (!value || !value.trim()) {
      onStatusChange(null);
      return;
    }

    // Step A: client-side checks (instant)
    if (isSingle(value)) {
      const err = 'Name must be more than one word';
      setClientErr(err);
      onStatusChange({ code: 'client_err' });
      return;
    }
    const pw = findProhibited(value);
    if (pw) {
      const err = `Contains prohibited word: "${pw}"`;
      setClientErr(err);
      onStatusChange({ code: 'client_err' });
      return;
    }

    // Step B: API compliance check (debounced 800ms)
    setChecking(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res  = await cacCheckCompliance(value.trim(), lob || '');
        const d    = res?.data || res;
        const code = String(d?.statusCode ?? d?.data?.statusCode ?? '');
        const result = { code, data: d };
        setCompStatus(result);
        onStatusChange(result);
      } catch (_) {
        setCompStatus({ code: 'error' });
        onStatusChange({ code: 'error' });
      } finally {
        setChecking(false);
      }
    }, 800);

    return () => { clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, lob]);

  const msg   = COMPLIANCE_MESSAGES[compStatus?.code];
  const chips = compStatus?.data?.recommendedActions?.keywords || compStatus?.data?.suggestedNames || compStatus?.data?.similarNames || [];

  return (
    <View>
      {optLabel && <Text style={[ss.optLabel, { color: tc.subheading }]}>{optLabel}</Text>}
      <View style={[ss.inp, { backgroundColor: tc.card, borderColor: compStatus?.code === '00' ? '#4CAF50' : tc.border || '#E5E5EA', flexDirection: 'row', alignItems: 'center', borderWidth: compStatus?.code === '00' ? 1.5 : 1 }]}>
        <TextInput
          style={[{ flex: 1, fontSize: 15, color: tc.heading }]}
          value={value} onChangeText={onChange}
          placeholder="e.g. Emeka Ventures" placeholderTextColor={tc.subtext}
          autoCapitalize="words"
        />
        {checking && <ActivityIndicator size="small" color={tc.primary} style={{ marginLeft: 8 }} />}
        {!checking && compStatus?.code === '00' && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
        {!checking && clientErr ? <Ionicons name="alert-circle" size={20} color="#EF4444" /> : null}
      </View>

      {clientErr ? <Text style={[ss.hint, { color: '#EF4444' }]}>{clientErr}</Text> : null}

      {!clientErr && msg && (
        <View style={[ss.compRow, { backgroundColor: `${msg.color}12` }]}>
          <Ionicons name={msg.color === '#4CAF50' ? 'checkmark-circle-outline' : 'information-circle-outline'} size={14} color={msg.color} />
          <Text style={[ss.compText, { color: msg.color }]}>{msg.label}</Text>
        </View>
      )}

      {chips.length > 0 && (
        <View style={ss.chipRow}>
          <Text style={[ss.chipHint, { color: tc.subheading }]}>Tap to use:</Text>
          {chips.slice(0, 5).map((c, i) => (
            <TouchableOpacity key={i} style={[ss.chip, { borderColor: tc.primary, backgroundColor: `${tc.primary}10` }]} onPress={() => onChipPress?.(String(c))}>
              <Text style={[ss.chipT, { color: tc.primary }]}>+ {c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {(compStatus?.code === '03' || compStatus?.code === '04') && (
        <View style={[ss.warnRow, { backgroundColor: '#FF980015' }]}>
          <Ionicons name="warning-outline" size={14} color="#FF9800" />
          <Text style={{ fontSize: 12, color: '#FF9800', flex: 1 }}>A supporting document will be required in Step 4.</Text>
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
  const [busy,  setBusy]  = useState(false);
  const [n1Stat, setN1Stat] = useState(null);
  const [n2Stat, setN2Stat] = useState(null);

  // Stable setter — doesn't recreate on every render
  const setField = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  const fee = form.priorityService ? CAC_PRICING.priority : CAC_PRICING.standard;
  const bal = wallet?.user?.walletBalance || 0;

  // ── Step validation ──────────────────────────────────────────────────────
  const canGoNext = () => {
    if (step === 1) {
      const ok = s => s?.code === '00' || s?.code === '03' || s?.code === '04';
      return ok(n1Stat) && ok(n2Stat) && !!form.lineOfBusiness && !!form.businessCommencementDate;
    }
    if (step === 2) {
      return !!(form.proprietorFirstname && form.proprietorSurname && form.proprietorGender &&
        form.proprietorDob && getAge(form.proprietorDob) >= 18 &&
        form.proprietorPhonenumber && form.proprietorEmail &&
        form.proprietorStreetNumber && form.proprietorServiceAddress &&
        form.proprietorCity && form.proprietorState && form.proprietorLga && form.proprietorPostcode);
    }
    if (step === 3) {
      return !!(form.companyEmail && form.companyStreetNumber && form.companyAddress && form.companyCity && form.companyState);
    }
    if (step === 4) {
      return !!(form.passport && form.meansOfId && form.signature &&
        (!form.requiresSupportingDoc || form.supportingDoc));
    }
    return true;
  };

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
        <NameField
          value={form.proposedOption1}
          onChange={v => setField('proposedOption1', v)}
          lob={form.lineOfBusiness}
          onStatusChange={s => { setN1Stat(s); if (s?.code === '03' || s?.code === '04') setField('requiresSupportingDoc', true); }}
          tc={tc}
          onChipPress={v => setField('proposedOption2', v)}
        />
        <View style={ss.divider} />
        <Text style={[ss.cardSub, { color: tc.subheading, marginTop: 12 }]}>Option 2 (Alternative)</Text>
        <NameField
          value={form.proposedOption2}
          onChange={v => setField('proposedOption2', v)}
          lob={form.lineOfBusiness}
          onStatusChange={s => { setN2Stat(s); if (s?.code === '03' || s?.code === '04') setField('requiresSupportingDoc', true); }}
          tc={tc}
          onChipPress={v => setField('proposedOption1', v)}
        />
      </View>

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

  const renderStep4 = () => (
    <ScrollView contentContainerStyle={ss.sc} showsVerticalScrollIndicator={false}>
      <Text style={[ss.stepTitle, { color: tc.heading }]}>Identity Verification</Text>
      <Text style={[ss.stepDesc, { color: tc.subheading }]}>Please upload clear copies of the following documents to complete your business registration.</Text>

      <ImageUpload label="Passport Photo" subtitle="Recent passport-sized photograph" required value={form.passport} fileName={form.passportName} fileKB={form.passportKB}
        onPick={(b, kb, n) => { setField('passport', b); setField('passportKB', kb); setField('passportName', n); }} tc={tc} />
      <ImageUpload label="Means of ID" subtitle="National ID, Driver's License or International Passport" required value={form.meansOfId} fileName={form.meansOfIdName} fileKB={form.meansOfIdKB}
        onPick={(b, kb, n) => { setField('meansOfId', b); setField('meansOfIdKB', kb); setField('meansOfIdName', n); }} tc={tc} />
      <ImageUpload label="Digital Signature" subtitle="Upload a clear scan of your signature on white paper" required value={form.signature} fileName={form.signatureName} fileKB={form.signatureKB}
        onPick={(b, kb, n) => { setField('signature', b); setField('signatureKB', kb); setField('signatureName', n); }} tc={tc} />
      <ImageUpload label="Supporting Document" subtitle="Any additional certification or authorization letters" required={form.requiresSupportingDoc} value={form.supportingDoc} fileName={form.supportingDocName} fileKB={form.supportingDocKB}
        onPick={(b, kb, n) => { setField('supportingDoc', b); setField('supportingDocKB', kb); setField('supportingDocName', n); }} tc={tc} />

      <View style={[ss.fileGuide, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
        <Ionicons name="information-circle-outline" size={16} color={tc.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[{ fontSize: 13, fontWeight: '600', color: tc.heading }]}>File Guidelines</Text>
          <Text style={[{ fontSize: 12, color: tc.subheading, marginTop: 2 }]}>Max size 1MB  •  PNG or JPEG only  •  High resolution</Text>
        </View>
      </View>
    </ScrollView>
  );

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
            style={[ss.nextBtn, { backgroundColor: tc.primary, opacity: canGoNext() ? 1 : 0.5 }]}
            onPress={() => canGoNext() && setStep(n => n + 1)}
            disabled={!canGoNext()} activeOpacity={0.85}
          >
            <Text style={ss.nextTxt}>{btnLabel}</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFF" />
          </TouchableOpacity>
          {step > 1 && (
            <TouchableOpacity style={[ss.prevBtn, { borderColor: tc.border || '#E5E5EA' }]} onPress={() => setStep(n => n - 1)} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={16} color={tc.subheading} />
              <Text style={[ss.prevTxt, { color: tc.subheading }]}>{prevLabel}</Text>
            </TouchableOpacity>
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
  tabBar:       { flexDirection: 'row', borderTopWidth: 1, paddingTop: 8 },
  tabItem:      { flex: 1, alignItems: 'center', gap: 2, paddingBottom: 4 },
  tabLabel:     { fontSize: 10 },
});
