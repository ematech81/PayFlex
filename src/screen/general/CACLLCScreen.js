/**
 * CACLLCScreen — 6-step LLC (Company) Registration Wizard
 *
 * Step 1: Name Reservation
 * Step 2: Memorandum Objects (generate + edit)
 * Step 3: Analyse Objects (auto-run, shows minimum share capital)
 * Step 4: Company Details
 * Step 5: Register Shares
 * Step 6: Register Affiliates
 *
 * Steps 7–8 (PSC, Validate/Pay/Submit) pending docs — not yet implemented.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, FlatList, Image, StatusBar,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import {
  cacLlcReserveName, cacLlcGenerateMemo, cacLlcAnalyseMemo,
  cacLlcCreateCompany, cacLlcRegisterShares, cacLlcAddAffiliate,
} from 'AuthFunction/paymentService';
import {
  LLC_COMPANY_TYPES, LLC_NATURE_OF_BUSINESS, LLC_AFFILIATE_TYPES, NIGERIAN_STATES,
} from 'constants/cacConstants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toYMD = (d) => {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toISOString().split('T')[0];
};

const fmtDate = (iso) => !iso ? '' : new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

async function uriToBase64(uri) {
  try {
    const FileSystem = await import('expo-file-system/legacy');
    const b64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    return `data:image/jpeg;base64,${b64}`;
  } catch { return null; }
}

// ─── Sub-components (defined OUTSIDE main component) ──────────────────────────

const PickerModal = React.memo(({ visible, title, options, value, onSelect, onClose, tc }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <TouchableOpacity style={pm.overlay} activeOpacity={1} onPress={onClose} />
    <View style={[pm.sheet, { backgroundColor: tc.card }]}>
      <View style={pm.handle} />
      <Text style={[pm.title, { color: tc.heading }]}>{title}</Text>
      <FlatList
        data={options}
        keyExtractor={(item, i) => String(item.value ?? item ?? i)}
        renderItem={({ item }) => {
          const val   = item.value ?? item;
          const label = item.label ?? item;
          const sel   = val === value;
          return (
            <TouchableOpacity
              style={[pm.option, sel && { backgroundColor: `${tc.primary}15` }]}
              onPress={() => { onSelect(val); onClose(); }}
              activeOpacity={0.7}
            >
              <Text style={[pm.optionText, { color: sel ? tc.primary : tc.heading }]}>{label}</Text>
              {sel && <Ionicons name="checkmark" size={18} color={tc.primary} />}
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={[pm.sep, { backgroundColor: tc.border || '#F0F0F0' }]} />}
        showsVerticalScrollIndicator={false}
        style={{ maxHeight: 380 }}
      />
    </View>
  </Modal>
));

const LlcImageUpload = React.memo(({ label, required, value, onPick, tc }) => {
  const pick = async () => {
    const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (p.status !== 'granted') { Alert.alert('Permission needed', 'Allow photo library access.'); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, base64: true, allowsEditing: false });
    if (r.canceled) return;
    const a  = r.assets[0];
    const kb = a.fileSize ? a.fileSize / 1024 : (a.base64?.length * 0.75) / 1024;
    if (kb > 1024) { Alert.alert('File too large', 'Max 1MB. Please compress and try again.'); return; }
    onPick(`data:image/jpeg;base64,${a.base64}`);
  };

  return (
    <TouchableOpacity
      style={[iu.wrap, { backgroundColor: tc.card, borderColor: value ? '#4CAF50' : tc.border || '#E5E5EA', borderWidth: value ? 1.5 : 1 }]}
      onPress={pick} activeOpacity={0.8}
    >
      {value ? (
        <View style={iu.uploadedRow}>
          <Image source={{ uri: value }} style={iu.thumb} />
          <View style={{ flex: 1 }}>
            <Text style={[iu.label, { color: tc.heading }]}>{label}</Text>
            <Text style={iu.uploaded}>✓ UPLOADED</Text>
          </View>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
        </View>
      ) : (
        <View style={iu.emptyRow}>
          <View style={[iu.iconWrap, { backgroundColor: `${tc.primary}12` }]}>
            <Ionicons name="cloud-upload-outline" size={20} color={tc.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[iu.label, { color: tc.heading }]}>{label}{required ? ' *' : ''}</Text>
            <Text style={[iu.hint, { color: tc.subtext }]}>PNG or JPEG · Max 1MB</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
});

// ─── Main Component ────────────────────────────────────────────────────────────

const TOTAL_STEPS = 6;

const EMPTY_FORM = {
  // Step 1
  proposedName: '',
  companyType: '',
  sessionId: null,
  reservationCode: null,
  reservationExpiry: null,
  // Step 2
  natureOfBusinessCategory: '',
  natureOfBusiness: '',
  countOfObjects: 5,
  objectsOfMem: [],
  // Step 3
  minimumShareCapital: null,
  analysisResult: null,
  // Step 4
  principalActivityDescription: '',
  companyEmail: '',
  phoneNumber: '',
  regState: '', regLga: '', regCity: '', regStreet: '',
  headOfficeSameAsReg: true,
  hoState: '', hoLga: '', hoCity: '', hoStreet: '',
  vasTransactionRef: null,
  // Step 5
  ordinaryIssuedShare: '',
  pricePerShare: '1',
  preferenceIssuedShare: '0',
  // Step 6
  affiliates: [],
};

const EMPTY_AFFILIATE = {
  affiliateType: '',
  affiliateMode: 'individual',
  isShareholder: false,
  allottedOrdinaryShares: '',
  allottedPreferenceShares: '0',
  // Individual
  surname: '', firstname: '', othername: '', occupation: '', nationality: 'Nigerian',
  dob: '', gender: '', email: '', phone: '',
  idType: '', idNumber: '',
  serviceState: '', serviceLga: '', serviceCity: '', serviceStreet: '',
  residentialSameAsService: true,
  resState: '', resLga: '', resCity: '', resStreet: '',
  passport: null, meansOfId: null, signature: null,
  // Corporate
  rcNumber: '', companyName: '', contactEmail: '', contactPhone: '',
  isForeign: false,
};

export default function CACLLCScreen({ navigation }) {
  const dark         = useThem();
  const tc           = dark ? colors.dark : colors.light;
  const insets       = useSafeAreaInsets();
  const scrollRef    = useRef(null);

  const [step, setStep]       = useState(1);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [busy, setBusy]       = useState(false);
  const [busyMsg, setBusyMsg] = useState('');
  const [draftObj, setDraftObj]         = useState('');
  const [objectsFromAI, setObjectsFromAI] = useState(false);

  // Picker modal state
  const [picker, setPicker] = useState({ visible: false, key: '', title: '', options: [] });

  // Affiliate modal
  const [affModal, setAffModal] = useState(false);
  const [affForm, setAffForm]   = useState(EMPTY_AFFILIATE);
  const [affBusy, setAffBusy]   = useState(false);

  const setField   = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);
  const setAffField = useCallback((k, v) => setAffForm(f => ({ ...f, [k]: v })), []);

  const scrollTop = () => setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);

  const openPicker = (key, title, options) => setPicker({ visible: true, key, title, options });
  const closePicker = () => setPicker(p => ({ ...p, visible: false }));

  // ── Computed ────────────────────────────────────────────────────────────────

  const shareCapital = () => {
    const ord  = parseFloat(form.ordinaryIssuedShare)   || 0;
    const pref = parseFloat(form.preferenceIssuedShare) || 0;
    const pps  = parseFloat(form.pricePerShare)          || 1;
    return (ord + pref) * pps;
  };

  const totalAllocated = form.affiliates.reduce((s, a) => s + (parseInt(a.allottedOrdinaryShares) || 0), 0);
  const sharesRemaining = (parseInt(form.ordinaryIssuedShare) || 0) - totalAllocated;
  const sharesBalanced = form.ordinaryIssuedShare && sharesRemaining === 0;

  // ── Step validators ─────────────────────────────────────────────────────────

  const validateStep = (n) => {
    switch (n) {
      case 1:
        if (!form.proposedName.trim()) return 'Enter the proposed company name.';
        if (!form.companyType)         return 'Select a company type.';
        return null;
      case 2:
        if (form.objectsOfMem.length < 1) return 'Add at least one memorandum object before proceeding.';
        if (!form.natureOfBusinessCategory) return 'Select a business category (required for company registration).';
        if (!form.natureOfBusiness)         return 'Select the nature of business (required for company registration).';
        return null;
      case 4:
        if (!form.principalActivityDescription.trim()) return 'Enter principal activity description.';
        if (!form.companyEmail.trim()) return 'Enter company email.';
        if (!form.phoneNumber.trim())  return 'Enter company phone number.';
        if (!form.regState || !form.regCity || !form.regStreet) return 'Fill in all registered address fields.';
        if (!form.headOfficeSameAsReg && (!form.hoState || !form.hoCity || !form.hoStreet)) return 'Fill in all head office address fields.';
        return null;
      case 5:
        if (!form.ordinaryIssuedShare || parseFloat(form.ordinaryIssuedShare) <= 0) return 'Enter number of ordinary shares.';
        if (!form.pricePerShare || parseFloat(form.pricePerShare) <= 0) return 'Enter share price.';
        if (form.minimumShareCapital && shareCapital() < form.minimumShareCapital) {
          return `Share capital must be at least ₦${form.minimumShareCapital.toLocaleString()} for your business activity.`;
        }
        return null;
      default: return null;
    }
  };

  // ── Step handlers ────────────────────────────────────────────────────────────

  // Maps a session status returned by the resume path to the wizard step to jump to.
  const STATUS_TO_STEP = {
    name_reserved:      2,
    memorandum_done:    3,
    company_created:    5,
    shares_registered:  6,
    affiliates_complete:6,
  };

  const handleStep1 = async () => {
    const err = validateStep(1);
    if (err) { Alert.alert('Required', err); return; }
    setBusy(true); setBusyMsg('Reserving company name…');
    try {
      const res = await cacLlcReserveName(form.proposedName.trim().toUpperCase(), form.companyType);

      // Pre-fill reservation data regardless of new vs resumed
      setForm(f => ({
        ...f,
        sessionId:        res.sessionId,
        reservationCode:  res.reservationCode,
        reservationExpiry:res.expiryDate,
        proposedName:     res.proposedName || f.proposedName,
        companyType:      res.companyType  || f.companyType,
      }));

      if (res.resumed) {
        const resumeStep = STATUS_TO_STEP[res.currentStatus] || 2;
        Alert.alert(
          'Resuming Existing Registration',
          `You have a previous registration for "${res.proposedName}". Continuing from where you left off.`,
          [{ text: 'Continue', onPress: () => { setStep(resumeStep); scrollTop(); } }]
        );
        return;
      }

      setStep(2); scrollTop();
    } catch (e) {
      Alert.alert('Reservation Failed', e.message);
    } finally { setBusy(false); }
  };

  const handleGenerateMemo = async () => {
    if (!form.natureOfBusinessCategory) { Alert.alert('Required', 'Select a business category first.'); return; }
    if (!form.natureOfBusiness) { Alert.alert('Required', 'Select the nature of business first.'); return; }
    setBusy(true); setBusyMsg('Generating memorandum objects…');
    try {
      const res = await cacLlcGenerateMemo(form.sessionId, form.natureOfBusiness, form.countOfObjects);
      const generated = res.objectsOfMem || [];
      setForm(f => ({
        ...f,
        objectsOfMem:        [...f.objectsOfMem, ...generated],
        minimumShareCapital: res.shareInfo?.minimumShareCapital ?? f.minimumShareCapital,
      }));
      if (generated.length) {
        setObjectsFromAI(true);
      } else {
        Alert.alert(
          'No Suggestions Generated',
          'The AI did not return suggestions for this business type. Please add memorandum objects manually using the input field above.',
        );
      }
    } catch (e) {
      Alert.alert('Generation Failed', e.message);
    } finally { setBusy(false); }
  };

  const handleStep2 = async () => {
    const err = validateStep(2);
    if (err) { Alert.alert('Required', err); return; }
    // Auto-run analysis before moving to step 3
    setBusy(true); setBusyMsg('Analysing memorandum objects…');
    try {
      const res = await cacLlcAnalyseMemo(form.sessionId, form.objectsOfMem);
      setField('minimumShareCapital', res.minimumShareCapital || null);
      setField('analysisResult', res.analysisResult || null);
      setStep(3); scrollTop();
    } catch (e) {
      // Analysis is recommended but not blocking — proceed even on failure
      setStep(3); scrollTop();
    } finally { setBusy(false); }
  };

  const handleStep3 = () => { setStep(4); scrollTop(); };

  const handleStep4 = async () => {
    const err = validateStep(4);
    if (err) { Alert.alert('Required', err); return; }
    setBusy(true); setBusyMsg('Creating company…');
    try {
      const companyAddress = {
        registeredAddress: { state: form.regState, lga: form.regLga, city: form.regCity, street: form.regStreet },
        headOffice: form.headOfficeSameAsReg
          ? { state: form.regState, lga: form.regLga, city: form.regCity, street: form.regStreet }
          : { state: form.hoState, lga: form.hoLga, city: form.hoCity, street: form.hoStreet },
      };
      const res = await cacLlcCreateCompany(form.sessionId, {
        natureOfBusinessCategory: form.natureOfBusinessCategory,
        natureOfBusiness:         form.natureOfBusiness,
        principalActivityDescription: form.principalActivityDescription,
        companyEmail: form.companyEmail,
        phoneNumber:  form.phoneNumber,
        companyAddress,
        objectsOfMem: form.objectsOfMem,
      });
      setField('vasTransactionRef', res.vasTransactionRef);
      setStep(5); scrollTop();
    } catch (e) {
      Alert.alert('Company Creation Failed', e.message);
    } finally { setBusy(false); }
  };

  const handleStep5 = async () => {
    const err = validateStep(5);
    if (err) { Alert.alert('Required', err); return; }
    setBusy(true); setBusyMsg('Registering shares…');
    try {
      await cacLlcRegisterShares(form.sessionId, {
        ordinaryIssuedShare:   parseInt(form.ordinaryIssuedShare),
        pricePerShare:         parseFloat(form.pricePerShare),
        preferenceIssuedShare: parseInt(form.preferenceIssuedShare) || 0,
      });
      setStep(6); scrollTop();
    } catch (e) {
      Alert.alert('Share Registration Failed', e.message);
    } finally { setBusy(false); }
  };

  const handleAddAffiliate = async () => {
    if (!affForm.affiliateType) { Alert.alert('Required', 'Select an affiliate type.'); return; }
    if (affForm.affiliateMode === 'individual') {
      if (!affForm.surname || !affForm.firstname) { Alert.alert('Required', 'Enter surname and firstname.'); return; }
      if (!affForm.dob || !affForm.gender)        { Alert.alert('Required', 'Enter DOB and gender.'); return; }
      if (!affForm.occupation)                    { Alert.alert('Required', 'Enter occupation.'); return; }
      if (!affForm.email || !affForm.phone)       { Alert.alert('Required', 'Enter email and phone.'); return; }
      if (!affForm.idType || !affForm.idNumber)   { Alert.alert('Required', 'Select ID type and enter ID number.'); return; }
      if (!affForm.serviceState || !affForm.serviceStreet) { Alert.alert('Required', 'Enter service address.'); return; }
      if (!affForm.passport || !affForm.meansOfId || !affForm.signature) {
        Alert.alert('Required', 'Upload passport photo, means of ID, and signature.'); return;
      }
    } else {
      if (!affForm.rcNumber || !affForm.companyName) { Alert.alert('Required', 'Enter RC number and company name.'); return; }
      if (!affForm.contactEmail || !affForm.contactPhone) { Alert.alert('Required', 'Enter contact email and phone.'); return; }
      if (!affForm.signature) { Alert.alert('Required', 'Upload company signature.'); return; }
    }

    if (affForm.isShareholder) {
      const allot = parseInt(affForm.allottedOrdinaryShares) || 0;
      if (allot <= 0) { Alert.alert('Required', 'Enter share allotment for this shareholder.'); return; }
      const newTotal = totalAllocated + allot;
      if (newTotal > parseInt(form.ordinaryIssuedShare)) {
        Alert.alert('Over-allotted', `This allotment (${allot.toLocaleString()}) exceeds the remaining ${sharesRemaining.toLocaleString()} shares.`); return;
      }
    }

    setAffBusy(true);
    try {
      let affiliateData;
      if (affForm.affiliateMode === 'individual') {
        affiliateData = {
          surname: affForm.surname, firstname: affForm.firstname, othername: affForm.othername,
          occupation: affForm.occupation, nationality: affForm.nationality || 'Nigerian',
          dob: affForm.dob, gender: affForm.gender, email: affForm.email, phone: affForm.phone,
          serviceAddress: { state: affForm.serviceState, lga: affForm.serviceLga, city: affForm.serviceCity, street: affForm.serviceStreet },
          residentialAddress: affForm.residentialSameAsService
            ? { state: affForm.serviceState, lga: affForm.serviceLga, city: affForm.serviceCity, street: affForm.serviceStreet }
            : { state: affForm.resState, lga: affForm.resLga, city: affForm.resCity, street: affForm.resStreet },
          passport: affForm.passport,
          meansOfId: { idType: affForm.idType, idNumber: affForm.idNumber, image: affForm.meansOfId },
          signature: affForm.signature,
        };
      } else {
        affiliateData = {
          rcNumber: affForm.rcNumber, companyName: affForm.companyName,
          contactEmail: affForm.contactEmail, contactPhone: affForm.contactPhone,
          isForeign: affForm.isForeign,
          serviceAddress: { state: affForm.serviceState, lga: affForm.serviceLga, city: affForm.serviceCity, street: affForm.serviceStreet },
          signature: affForm.signature,
        };
      }

      const res = await cacLlcAddAffiliate(form.sessionId, {
        affiliateType:  affForm.affiliateType,
        affiliateMode:  affForm.affiliateMode,
        isShareholder:  affForm.isShareholder,
        shareAllotment: affForm.isShareholder ? {
          allottedOrdinaryShares:   parseInt(affForm.allottedOrdinaryShares) || 0,
          allottedPreferenceShares: parseInt(affForm.allottedPreferenceShares) || 0,
        } : undefined,
        affiliateData,
      });

      // Add to local list
      const newAffiliate = {
        id:            res.affiliateId,
        affiliateType: affForm.affiliateType,
        affiliateMode: affForm.affiliateMode,
        name:          affForm.affiliateMode === 'individual'
          ? `${affForm.firstname} ${affForm.surname}`.trim()
          : affForm.companyName,
        isShareholder:             affForm.isShareholder,
        allottedOrdinaryShares:    affForm.isShareholder ? parseInt(affForm.allottedOrdinaryShares) : 0,
        allottedPreferenceShares:  affForm.isShareholder ? parseInt(affForm.allottedPreferenceShares) : 0,
      };
      setField('affiliates', [...form.affiliates, newAffiliate]);
      setAffModal(false);
      setAffForm(EMPTY_AFFILIATE);

      if (res.sharesBalanced) {
        Alert.alert('All Shares Allocated', 'All shares are now allocated. Steps 7 & 8 (PSC registration and final submission) will be available once documentation is released.');
      }
    } catch (e) {
      Alert.alert('Affiliate Registration Failed', e.message);
    } finally { setAffBusy(false); }
  };

  // ── Renders ──────────────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <View style={s.stepContent}>
      <View style={[s.stepCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
        <View style={s.stepCardHeader}>
          <View style={[s.stepCardIcon, { backgroundColor: `${tc.primary}15` }]}>
            <Ionicons name="ribbon-outline" size={20} color={tc.primary} />
          </View>
          <Text style={[s.stepCardTitle, { color: tc.heading }]}>Company Name Reservation</Text>
        </View>
        <Text style={[s.stepCardSub, { color: tc.subheading }]}>
          The proposed name must be unique, at least two words, and must not contain prohibited words. It will be converted to UPPERCASE as required by CAC.
        </Text>

        <Text style={[s.label, { color: tc.heading }]}>Proposed Company Name *</Text>
        <TextInput
          style={[s.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
          value={form.proposedName}
          onChangeText={v => setField('proposedName', v.toUpperCase())}
          placeholder="E.G. PAYFLEX TECHNOLOGIES"
          placeholderTextColor={tc.placeholder || '#AAA'}
          autoCapitalize="characters"
          returnKeyType="done"
        />
        <Text style={[s.hint, { color: tc.subtext }]}>Name will be uppercased automatically.</Text>

        <Text style={[s.label, { color: tc.heading }]}>Company Type *</Text>
        <TouchableOpacity
          style={[s.picker, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
          onPress={() => openPicker('companyType', 'Select Company Type', LLC_COMPANY_TYPES)}
        >
          <Text style={[s.pickerText, { color: form.companyType ? tc.heading : tc.placeholder || '#AAA' }]}>
            {LLC_COMPANY_TYPES.find(t => t.value === form.companyType)?.label || 'Select company type…'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={tc.subtext} />
        </TouchableOpacity>

        {form.companyType === 'PUBLIC_COMPANY_LIMITED_BY_SHARES' || form.companyType === 'PUBLIC_UNLIMITED_COMPANY' ? (
          <View style={[s.warnBox, { backgroundColor: '#FFF8E1', borderColor: '#FFC107' }]}>
            <Ionicons name="warning-outline" size={16} color="#F59E0B" />
            <Text style={[s.warnText, { color: '#92400E' }]}>Public companies have higher capital requirements and additional regulatory obligations.</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity style={[s.primaryBtn, { backgroundColor: tc.primary, opacity: busy ? 0.7 : 1 }]} onPress={handleStep1} disabled={busy} activeOpacity={0.85}>
        {busy ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="bookmark-outline" size={18} color="#FFF" />}
        <Text style={s.primaryBtnText}>{busy ? busyMsg : 'Reserve Name'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => {
    const categories = LLC_NATURE_OF_BUSINESS.map(n => ({ value: n.category, label: n.category }));
    const catObj     = LLC_NATURE_OF_BUSINESS.find(n => n.category === form.natureOfBusinessCategory);
    const subItems   = catObj ? catObj.items.map(i => ({ value: i, label: i })) : [];

    const addDraftObj = () => {
      const trimmed = draftObj.trim();
      if (!trimmed) return;
      setField('objectsOfMem', [...form.objectsOfMem, trimmed]);
      setDraftObj('');
    };

    return (
      <View style={s.stepContent}>
        {/* Reservation badge */}
        <View style={[s.infoBadge, { backgroundColor: `${tc.primary}12`, borderColor: `${tc.primary}30` }]}>
          <Ionicons name="checkmark-circle" size={16} color={tc.primary} />
          <Text style={[s.infoBadgeText, { color: tc.primary }]}>
            Reserved: <Text style={{ fontWeight: '800' }}>{form.proposedName}</Text>  ·  Code: {form.reservationCode}
          </Text>
        </View>

        <View style={[s.stepCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <View style={s.stepCardHeader}>
            <View style={[s.stepCardIcon, { backgroundColor: `${tc.primary}15` }]}>
              <Ionicons name="document-text-outline" size={20} color={tc.primary} />
            </View>
            <Text style={[s.stepCardTitle, { color: tc.heading }]}>Business Memorandum Objects</Text>
          </View>
          <Text style={[s.stepCardSub, { color: tc.subheading }]}>
            These are the activities your company is legally authorised to carry out. You must add at least one object before proceeding.
          </Text>

          {/* ── Primary: manual entry ── */}
          <Text style={[s.label, { color: tc.heading, marginTop: 8 }]}>Add a Memorandum Object</Text>
          <Text style={[s.hint, { color: tc.subtext, marginBottom: 6 }]}>
            Describe one business activity your company will carry out (e.g. "To carry on the business of software development and sale of technology products").
          </Text>
          <View style={[s.memoAddRow, { borderColor: tc.border || '#E5E5EA', backgroundColor: tc.inputBg || '#F9F9F9' }]}>
            <TextInput
              style={[s.memoAddInput, { color: tc.heading }]}
              value={draftObj}
              onChangeText={setDraftObj}
              placeholder="Type a business activity…"
              placeholderTextColor={tc.placeholder || '#AAA'}
              multiline
              returnKeyType="done"
              onSubmitEditing={addDraftObj}
            />
            <TouchableOpacity
              style={[s.memoAddBtn, { backgroundColor: draftObj.trim() ? tc.primary : (tc.border || '#DDD') }]}
              onPress={addDraftObj}
              disabled={!draftObj.trim()}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* ── Object list ── */}
          {form.objectsOfMem.length > 0 && (
            <View style={{ marginTop: 16, gap: 8 }}>
              <Text style={[s.label, { color: tc.heading }]}>
                Added Objects <Text style={{ fontWeight: '400', color: tc.subtext }}>({form.objectsOfMem.length})</Text>
              </Text>
              {form.objectsOfMem.map((obj, i) => (
                <View key={i} style={[s.memoRow, { backgroundColor: tc.inputBg || '#F9F9F9', borderColor: tc.border || '#E5E5EA' }]}>
                  <Text style={[s.memoNum, { color: tc.primary }]}>{i + 1}.</Text>
                  <TextInput
                    style={[s.memoInput, { color: tc.heading }]}
                    value={obj}
                    onChangeText={v => {
                      const arr = [...form.objectsOfMem];
                      arr[i] = v;
                      setField('objectsOfMem', arr);
                    }}
                    multiline
                    returnKeyType="done"
                  />
                  <TouchableOpacity onPress={() => setField('objectsOfMem', form.objectsOfMem.filter((_, j) => j !== i))}>
                    <Ionicons name="close-circle" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* ── AI helper instruction ── */}
          {form.objectsOfMem.length > 0 && objectsFromAI && (
            <View style={[s.aiHelperBanner, { backgroundColor: `${tc.primary}12`, borderColor: `${tc.primary}35` }]}>
              <Ionicons name="information-circle" size={18} color={tc.primary} style={{ marginTop: 1 }} />
              <Text style={[s.aiHelperText, { color: tc.primary }]}>
                These objects were AI-generated based on your business type. Read through each one carefully and tap the <Text style={{ fontWeight: '800' }}>✕</Text> button to remove any object that does not apply to your specific business before proceeding.
              </Text>
            </View>
          )}

          {/* ── Divider + AI generator ── */}
          <View style={[s.memoDivider, { borderColor: tc.border || '#E5E5EA' }]}>
            <View style={[s.memoDividerLine, { backgroundColor: tc.border || '#E5E5EA' }]} />
            <Text style={[s.memoDividerText, { color: tc.subtext, backgroundColor: tc.card }]}>
              Don't have memorandum objects yet?
            </Text>
            <View style={[s.memoDividerLine, { backgroundColor: tc.border || '#E5E5EA' }]} />
          </View>

          <Text style={[s.hint, { color: tc.subtext, marginBottom: 8 }]}>
            Select your business category and let AI suggest memorandum objects for you.
          </Text>

          <Text style={[s.label, { color: tc.heading }]}>Business Category</Text>
          <TouchableOpacity
            style={[s.picker, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
            onPress={() => openPicker('natureOfBusinessCategory', 'Select Category', categories)}
          >
            <Text style={[s.pickerText, { color: form.natureOfBusinessCategory ? tc.heading : tc.placeholder || '#AAA' }]} numberOfLines={1}>
              {form.natureOfBusinessCategory || 'Select category…'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={tc.subtext} />
          </TouchableOpacity>

          <Text style={[s.label, { color: tc.heading }]}>Nature of Business</Text>
          <TouchableOpacity
            style={[s.picker, { backgroundColor: tc.card, borderColor: !form.natureOfBusinessCategory ? '#E5E5EA' : (tc.border || '#E5E5EA'), opacity: !form.natureOfBusinessCategory ? 0.5 : 1 }]}
            onPress={() => form.natureOfBusinessCategory && openPicker('natureOfBusiness', 'Select Nature of Business', subItems)}
            disabled={!form.natureOfBusinessCategory}
          >
            <Text style={[s.pickerText, { color: form.natureOfBusiness ? tc.heading : tc.placeholder || '#AAA' }]} numberOfLines={1}>
              {form.natureOfBusiness || 'Select nature of business…'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={tc.subtext} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.secondaryBtn, { borderColor: tc.primary, opacity: busy ? 0.6 : 1 }]}
            onPress={handleGenerateMemo} disabled={busy} activeOpacity={0.8}
          >
            {busy && busyMsg.includes('Generat')
              ? <ActivityIndicator size="small" color={tc.primary} />
              : <Ionicons name="sparkles-outline" size={16} color={tc.primary} />
            }
            <Text style={[s.secondaryBtnText, { color: tc.primary }]}>
              {busy && busyMsg.includes('Generat') ? 'Generating…' : 'Generate Suggestions'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[s.primaryBtn, { backgroundColor: tc.primary, opacity: busy ? 0.7 : 1 }]}
          onPress={handleStep2} disabled={busy} activeOpacity={0.85}
        >
          {busy && busyMsg.includes('Analys')
            ? <ActivityIndicator size="small" color="#FFF" />
            : <Ionicons name="analytics-outline" size={18} color="#FFF" />
          }
          <Text style={s.primaryBtnText}>{busy && busyMsg.includes('Analys') ? 'Analysing…' : 'Analyse & Continue'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStep3 = () => (
    <View style={s.stepContent}>
      <View style={[s.stepCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
        <View style={s.stepCardHeader}>
          <View style={[s.stepCardIcon, { backgroundColor: `${tc.primary}15` }]}>
            <Ionicons name="bar-chart-outline" size={20} color={tc.primary} />
          </View>
          <Text style={[s.stepCardTitle, { color: tc.heading }]}>Analysis Results</Text>
        </View>

        {form.minimumShareCapital ? (
          <View style={[s.alertBox, { backgroundColor: '#FFF8E1', borderColor: '#FFC107' }]}>
            <Ionicons name="warning-outline" size={20} color="#F59E0B" />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400E' }}>Minimum Share Capital Required</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#78350F' }}>
                ₦{form.minimumShareCapital.toLocaleString()}
              </Text>
              <Text style={{ fontSize: 12, color: '#92400E', lineHeight: 18 }}>
                Your business activity requires a minimum share capital of ₦{form.minimumShareCapital.toLocaleString()}. This will be enforced in Step 5.
              </Text>
            </View>
          </View>
        ) : (
          <View style={[s.successBox, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#16A34A" />
            <Text style={{ fontSize: 13, color: '#14532D', flex: 1, lineHeight: 19 }}>
              No minimum share capital requirement detected for your business activity. You may use the standard minimum.
            </Text>
          </View>
        )}

        {/* Share capital by company type */}
        {Array.isArray(form.analysisResult?.companyTypes) && form.analysisResult.companyTypes.length > 0 && (
          <View style={{ marginTop: 14, gap: 6 }}>
            <Text style={[s.label, { color: tc.heading }]}>Share Capital Requirements by Company Type</Text>
            <Text style={[s.hint, { color: tc.subtext, marginBottom: 4 }]}>
              If your company falls under any of these regulated categories, the corresponding minimum share capital applies.
            </Text>
            {form.analysisResult.companyTypes.map((ct, i) => (
              <View key={i} style={[s.compTypeRow, { borderColor: tc.border || '#E5E5EA', backgroundColor: tc.inputBg || '#F9F9F9' }]}>
                <Text style={[s.compTypeLabel, { color: tc.heading }]} numberOfLines={2}>{ct.companyType}</Text>
                <Text style={[s.compTypeAmount, { color: tc.primary }]}>₦{(ct.shareCapital || 0).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {!form.analysisResult && (
          <Text style={[{ fontSize: 13, lineHeight: 19, marginTop: 10 }, { color: tc.subheading }]}>
            Analysis could not be completed. You can still proceed — this step is optional.
          </Text>
        )}
      </View>

      <TouchableOpacity style={[s.primaryBtn, { backgroundColor: tc.primary }]} onPress={handleStep3} activeOpacity={0.85}>
        <Ionicons name="arrow-forward" size={18} color="#FFF" />
        <Text style={s.primaryBtnText}>Continue to Company Details</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <View style={s.stepContent}>
      <View style={[s.stepCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
        <View style={s.stepCardHeader}>
          <View style={[s.stepCardIcon, { backgroundColor: `${tc.primary}15` }]}>
            <Ionicons name="business-outline" size={20} color={tc.primary} />
          </View>
          <Text style={[s.stepCardTitle, { color: tc.heading }]}>Company Details</Text>
        </View>

        <Text style={[s.label, { color: tc.heading }]}>Principal Activity Description *</Text>
        <TextInput
          style={[s.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading, height: 80 }]}
          value={form.principalActivityDescription}
          onChangeText={v => setField('principalActivityDescription', v)}
          placeholder="e.g. Production of packaged fruit juices"
          placeholderTextColor={tc.placeholder || '#AAA'}
          multiline returnKeyType="done"
        />

        <Text style={[s.label, { color: tc.heading }]}>Company Email *</Text>
        <TextInput
          style={[s.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
          value={form.companyEmail}
          onChangeText={v => setField('companyEmail', v)}
          placeholder="info@yourcompany.com"
          placeholderTextColor={tc.placeholder || '#AAA'}
          keyboardType="email-address" autoCapitalize="none"
        />

        <Text style={[s.label, { color: tc.heading }]}>Company Phone *</Text>
        <TextInput
          style={[s.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
          value={form.phoneNumber}
          onChangeText={v => setField('phoneNumber', v)}
          placeholder="08012345678"
          placeholderTextColor={tc.placeholder || '#AAA'}
          keyboardType="phone-pad"
        />

        {/* Registered Address */}
        <Text style={[s.sectionLabel, { color: tc.primary }]}>Registered Address *</Text>
        {[
          { key: 'regState', label: 'State', isPicker: true, opts: NIGERIAN_STATES.map(s => ({ value: s, label: s })) },
          { key: 'regLga',   label: 'LGA',   isPicker: false },
          { key: 'regCity',  label: 'City',  isPicker: false },
          { key: 'regStreet', label: 'Street Address', isPicker: false },
        ].map(({ key, label, isPicker, opts }) => (
          <View key={key}>
            <Text style={[s.label, { color: tc.heading }]}>{label} *</Text>
            {isPicker ? (
              <TouchableOpacity
                style={[s.picker, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
                onPress={() => openPicker(key, `Select ${label}`, opts)}
              >
                <Text style={[s.pickerText, { color: form[key] ? tc.heading : tc.placeholder || '#AAA' }]}>{form[key] || `Select ${label.toLowerCase()}…`}</Text>
                <Ionicons name="chevron-down" size={16} color={tc.subtext} />
              </TouchableOpacity>
            ) : (
              <TextInput
                style={[s.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
                value={form[key]} onChangeText={v => setField(key, v)}
                placeholder={label} placeholderTextColor={tc.placeholder || '#AAA'}
                onFocus={() => key === 'regStreet' && setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200)}
              />
            )}
          </View>
        ))}

        {/* Head office toggle */}
        <TouchableOpacity
          style={[s.toggleRow, { borderColor: tc.border || '#E5E5EA' }]}
          onPress={() => setField('headOfficeSameAsReg', !form.headOfficeSameAsReg)} activeOpacity={0.8}
        >
          <View style={[s.checkbox, { borderColor: form.headOfficeSameAsReg ? tc.primary : tc.border || '#CCC', backgroundColor: form.headOfficeSameAsReg ? tc.primary : 'transparent' }]}>
            {form.headOfficeSameAsReg && <Ionicons name="checkmark" size={12} color="#FFF" />}
          </View>
          <Text style={[s.toggleText, { color: tc.heading }]}>Head office same as registered address</Text>
        </TouchableOpacity>

        {!form.headOfficeSameAsReg && (
          <View style={{ gap: 8 }}>
            <Text style={[s.sectionLabel, { color: tc.primary }]}>Head Office Address *</Text>
            {[
              { key: 'hoState', label: 'State', isPicker: true, opts: NIGERIAN_STATES.map(s => ({ value: s, label: s })) },
              { key: 'hoLga',   label: 'LGA' },
              { key: 'hoCity',  label: 'City' },
              { key: 'hoStreet', label: 'Street Address' },
            ].map(({ key, label, isPicker, opts }) => (
              <View key={key}>
                <Text style={[s.label, { color: tc.heading }]}>{label} *</Text>
                {isPicker ? (
                  <TouchableOpacity
                    style={[s.picker, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
                    onPress={() => openPicker(key, `Select ${label}`, opts)}
                  >
                    <Text style={[s.pickerText, { color: form[key] ? tc.heading : tc.placeholder || '#AAA' }]}>{form[key] || `Select ${label.toLowerCase()}…`}</Text>
                    <Ionicons name="chevron-down" size={16} color={tc.subtext} />
                  </TouchableOpacity>
                ) : (
                  <TextInput
                    style={[s.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
                    value={form[key]} onChangeText={v => setField(key, v)}
                    placeholder={label} placeholderTextColor={tc.placeholder || '#AAA'}
                  />
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity style={[s.primaryBtn, { backgroundColor: tc.primary, opacity: busy ? 0.7 : 1 }]} onPress={handleStep4} disabled={busy} activeOpacity={0.85}>
        {busy ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="business-outline" size={18} color="#FFF" />}
        <Text style={s.primaryBtnText}>{busy ? busyMsg : 'Create Company'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep5 = () => (
    <View style={s.stepContent}>
      <View style={[s.stepCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
        <View style={s.stepCardHeader}>
          <View style={[s.stepCardIcon, { backgroundColor: `${tc.primary}15` }]}>
            <Ionicons name="pie-chart-outline" size={20} color={tc.primary} />
          </View>
          <Text style={[s.stepCardTitle, { color: tc.heading }]}>Share Structure</Text>
        </View>
        <Text style={[s.stepCardSub, { color: tc.subheading }]}>
          Define the share capital structure. Total allotments across all affiliates must equal the ordinary issued shares.
        </Text>

        {form.minimumShareCapital ? (
          <View style={[s.infoBadge, { backgroundColor: '#FFF8E1', borderColor: '#FFC107' }]}>
            <Ionicons name="warning-outline" size={14} color="#F59E0B" />
            <Text style={[s.infoBadgeText, { color: '#92400E' }]}>
              Min share capital: <Text style={{ fontWeight: '800' }}>₦{form.minimumShareCapital.toLocaleString()}</Text>
            </Text>
          </View>
        ) : null}

        <Text style={[s.label, { color: tc.heading }]}>Ordinary Issued Shares *</Text>
        <TextInput
          style={[s.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
          value={form.ordinaryIssuedShare}
          onChangeText={v => setField('ordinaryIssuedShare', v.replace(/[^0-9]/g, ''))}
          placeholder="e.g. 1000000"
          placeholderTextColor={tc.placeholder || '#AAA'}
          keyboardType="numeric"
        />

        <Text style={[s.label, { color: tc.heading }]}>Price Per Share (₦) *</Text>
        <TextInput
          style={[s.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
          value={form.pricePerShare}
          onChangeText={v => setField('pricePerShare', v.replace(/[^0-9.]/g, ''))}
          placeholder="1"
          placeholderTextColor={tc.placeholder || '#AAA'}
          keyboardType="decimal-pad"
        />

        <Text style={[s.label, { color: tc.heading }]}>Preference Shares (optional)</Text>
        <TextInput
          style={[s.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
          value={form.preferenceIssuedShare}
          onChangeText={v => setField('preferenceIssuedShare', v.replace(/[^0-9]/g, ''))}
          placeholder="0"
          placeholderTextColor={tc.placeholder || '#AAA'}
          keyboardType="numeric"
        />

        {/* Live share capital */}
        {shareCapital() > 0 && (
          <View style={[s.capitalBox, { backgroundColor: `${tc.primary}10`, borderColor: `${tc.primary}30` }]}>
            <Text style={[s.capitalLabel, { color: tc.subheading }]}>Total Share Capital</Text>
            <Text style={[s.capitalAmount, { color: tc.primary }]}>₦{shareCapital().toLocaleString()}</Text>
            {form.minimumShareCapital && shareCapital() < form.minimumShareCapital && (
              <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>Below minimum ₦{form.minimumShareCapital.toLocaleString()}</Text>
            )}
          </View>
        )}
      </View>

      <TouchableOpacity style={[s.primaryBtn, { backgroundColor: tc.primary, opacity: busy ? 0.7 : 1 }]} onPress={handleStep5} disabled={busy} activeOpacity={0.85}>
        {busy ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="layers-outline" size={18} color="#FFF" />}
        <Text style={s.primaryBtnText}>{busy ? busyMsg : 'Register Shares'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep6 = () => (
    <View style={s.stepContent}>
      {/* Share allocation tracker */}
      <View style={[s.shareTracker, { backgroundColor: tc.primary }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.trackerLabel}>Shares Allocated</Text>
          <Text style={s.trackerValue}>{totalAllocated.toLocaleString()} / {parseInt(form.ordinaryIssuedShare || 0).toLocaleString()}</Text>
        </View>
        <View style={[s.trackerBadge, { backgroundColor: sharesBalanced ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.18)' }]}>
          <Ionicons name={sharesBalanced ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={sharesBalanced ? '#4ADE80' : 'rgba(255,255,255,0.8)'} />
          <Text style={[s.trackerBadgeText, { color: sharesBalanced ? '#4ADE80' : 'rgba(255,255,255,0.8)' }]}>
            {sharesBalanced ? 'Balanced' : `${sharesRemaining.toLocaleString()} left`}
          </Text>
        </View>
        {/* Progress bar */}
        <View style={s.trackerBarTrack}>
          <View style={[s.trackerBarFill, {
            width: form.ordinaryIssuedShare ? `${Math.min((totalAllocated / parseInt(form.ordinaryIssuedShare)) * 100, 100)}%` : '0%',
            backgroundColor: sharesBalanced ? '#4ADE80' : '#FFFFFF',
          }]} />
        </View>
      </View>

      {/* Affiliates list */}
      {form.affiliates.length > 0 && (
        <View style={{ gap: 8 }}>
          {form.affiliates.map((aff, i) => (
            <View key={i} style={[s.affCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
              <View style={[s.affIconWrap, { backgroundColor: `${tc.primary}15` }]}>
                <Ionicons name={aff.affiliateMode === 'corporate' ? 'business-outline' : 'person-outline'} size={18} color={tc.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.affName, { color: tc.heading }]}>{aff.name}</Text>
                <Text style={[s.affMeta, { color: tc.subheading }]}>
                  {aff.affiliateType.toUpperCase()}  ·  {aff.affiliateMode}
                  {aff.isShareholder ? `  ·  ${aff.allottedOrdinaryShares.toLocaleString()} shares` : ''}
                </Text>
              </View>
              <View style={[s.affBadge, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                <Text style={{ fontSize: 11, color: '#16A34A', fontWeight: '700' }}>Registered</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {form.affiliates.length === 0 && (
        <View style={[s.emptyAff, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <Ionicons name="people-outline" size={36} color={tc.subtext} />
          <Text style={[{ fontSize: 14, fontWeight: '600', marginTop: 8 }, { color: tc.heading }]}>No affiliates yet</Text>
          <Text style={[{ fontSize: 12.5, textAlign: 'center', lineHeight: 19, marginTop: 4 }, { color: tc.subheading }]}>
            Add at least one Director and ensure all ordinary shares are allocated across shareholders.
          </Text>
        </View>
      )}

      <TouchableOpacity style={[s.primaryBtn, { backgroundColor: tc.primary }]} onPress={() => { setAffForm(EMPTY_AFFILIATE); setAffModal(true); }} activeOpacity={0.85}>
        <Ionicons name="person-add-outline" size={18} color="#FFF" />
        <Text style={s.primaryBtnText}>Add Affiliate</Text>
      </TouchableOpacity>

      {sharesBalanced && form.affiliates.length > 0 && (
        <View style={[s.completionBox, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
          <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#14532D' }}>Registration Complete (Steps 1–6)</Text>
            <Text style={{ fontSize: 12, color: '#15803D', lineHeight: 18, marginTop: 3 }}>
              All shares allocated. Steps 7 (PSC) and 8 (Validate, Pay & Submit) will be added once documentation is available.
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  // ── Affiliate Modal ──────────────────────────────────────────────────────────

  const renderAffiliateModal = () => (
    <Modal visible={affModal} animationType="slide" onRequestClose={() => setAffModal(false)}>
      <SafeAreaView style={[s.safe, { backgroundColor: tc.background }]}>
        {/* Modal header */}
        <View style={[s.modalHeader, { backgroundColor: tc.primary, paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={s.backBtn2} onPress={() => setAffModal(false)} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={s.modalHeaderTitle}>Add Affiliate</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={[s.scroll2, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
          {/* Affiliate type */}
          <Text style={[s.label, { color: tc.heading }]}>Affiliate Type *</Text>
          <TouchableOpacity
            style={[s.picker, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
            onPress={() => openPicker('affType', 'Select Affiliate Type', LLC_AFFILIATE_TYPES)}
          >
            <Text style={[s.pickerText, { color: affForm.affiliateType ? tc.heading : tc.placeholder || '#AAA' }]}>
              {LLC_AFFILIATE_TYPES.find(t => t.value === affForm.affiliateType)?.label || 'Select type…'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={tc.subtext} />
          </TouchableOpacity>

          {/* Mode toggle */}
          <View style={[s.modeToggle, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
            {['individual', 'corporate'].map(m => (
              <TouchableOpacity
                key={m}
                style={[s.modeBtn, affForm.affiliateMode === m && { backgroundColor: tc.primary }]}
                onPress={() => setAffField('affiliateMode', m)} activeOpacity={0.8}
              >
                <Ionicons name={m === 'individual' ? 'person-outline' : 'business-outline'} size={14} color={affForm.affiliateMode === m ? '#FFF' : tc.subheading} />
                <Text style={[s.modeBtnText, { color: affForm.affiliateMode === m ? '#FFF' : tc.subheading }]}>{m.charAt(0).toUpperCase() + m.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {affForm.affiliateMode === 'individual' ? (
            <View style={{ gap: 12 }}>
              {[['surname','Surname *'], ['firstname','First Name *'], ['othername','Other Name']].map(([k, lbl]) => (
                <View key={k}>
                  <Text style={[s.label, { color: tc.heading }]}>{lbl}</Text>
                  <TextInput style={[s.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
                    value={affForm[k]} onChangeText={v => setAffField(k, v)} placeholder={lbl.replace(' *','')} placeholderTextColor={tc.placeholder || '#AAA'} />
                </View>
              ))}

              <Text style={[s.label, { color: tc.heading }]}>Gender *</Text>
              <TouchableOpacity style={[s.picker, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
                onPress={() => openPicker('affGender', 'Select Gender', [{ value:'MALE', label:'Male' }, { value:'FEMALE', label:'Female' }])}>
                <Text style={[s.pickerText, { color: affForm.gender ? tc.heading : tc.placeholder || '#AAA' }]}>{affForm.gender || 'Select gender…'}</Text>
                <Ionicons name="chevron-down" size={16} color={tc.subtext} />
              </TouchableOpacity>

              <Text style={[s.label, { color: tc.heading }]}>Date of Birth *</Text>
              <TextInput style={[s.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
                value={affForm.dob} onChangeText={v => setAffField('dob', v)} placeholder="YYYY-MM-DD" placeholderTextColor={tc.placeholder || '#AAA'} keyboardType="numeric" />

              {[['email','Email *','email-address'], ['phone','Phone *','phone-pad']].map(([k, lbl, kb]) => (
                <View key={k}>
                  <Text style={[s.label, { color: tc.heading }]}>{lbl}</Text>
                  <TextInput style={[s.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
                    value={affForm[k]} onChangeText={v => setAffField(k, v)} placeholder={lbl.replace(' *','')} placeholderTextColor={tc.placeholder || '#AAA'}
                    keyboardType={kb} autoCapitalize="none" />
                </View>
              ))}

              {[['occupation','Occupation *'], ['nationality','Nationality *']].map(([k, lbl]) => (
                <View key={k}>
                  <Text style={[s.label, { color: tc.heading }]}>{lbl}</Text>
                  <TextInput style={[s.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
                    value={affForm[k]} onChangeText={v => setAffField(k, v)} placeholder={lbl.replace(' *', '')} placeholderTextColor={tc.placeholder || '#AAA'} />
                </View>
              ))}

              <Text style={[s.sectionLabel, { color: tc.primary }]}>Service Address *</Text>
              {[['serviceState','State',true], ['serviceLga','LGA',false], ['serviceCity','City',false], ['serviceStreet','Street',false]].map(([k, lbl, isPicker]) => (
                <View key={k}>
                  <Text style={[s.label, { color: tc.heading }]}>{lbl} *</Text>
                  {isPicker ? (
                    <TouchableOpacity style={[s.picker, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
                      onPress={() => openPicker(k, `Select ${lbl}`, NIGERIAN_STATES.map(st => ({ value: st, label: st })))}>
                      <Text style={[s.pickerText, { color: affForm[k] ? tc.heading : tc.placeholder || '#AAA' }]}>{affForm[k] || `Select ${lbl.toLowerCase()}…`}</Text>
                      <Ionicons name="chevron-down" size={16} color={tc.subtext} />
                    </TouchableOpacity>
                  ) : (
                    <TextInput style={[s.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
                      value={affForm[k]} onChangeText={v => setAffField(k, v)} placeholder={lbl} placeholderTextColor={tc.placeholder || '#AAA'} />
                  )}
                </View>
              ))}

              <TouchableOpacity style={[s.toggleRow, { borderColor: tc.border || '#E5E5EA' }]} onPress={() => setAffField('residentialSameAsService', !affForm.residentialSameAsService)} activeOpacity={0.8}>
                <View style={[s.checkbox, { borderColor: affForm.residentialSameAsService ? tc.primary : tc.border || '#CCC', backgroundColor: affForm.residentialSameAsService ? tc.primary : 'transparent' }]}>
                  {affForm.residentialSameAsService && <Ionicons name="checkmark" size={12} color="#FFF" />}
                </View>
                <Text style={[s.toggleText, { color: tc.heading }]}>Residential same as service address</Text>
              </TouchableOpacity>

              {!affForm.residentialSameAsService && (
                <View style={{ gap: 8 }}>
                  <Text style={[s.sectionLabel, { color: tc.primary }]}>Residential Address *</Text>
                  {[['resState','State',true],['resLga','LGA',false],['resCity','City',false],['resStreet','Street',false]].map(([k,lbl,isPicker]) => (
                    <View key={k}>
                      <Text style={[s.label, { color: tc.heading }]}>{lbl} *</Text>
                      {isPicker ? (
                        <TouchableOpacity style={[s.picker, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
                          onPress={() => openPicker(k, `Select ${lbl}`, NIGERIAN_STATES.map(st => ({ value: st, label: st })))}>
                          <Text style={[s.pickerText, { color: affForm[k] ? tc.heading : tc.placeholder || '#AAA' }]}>{affForm[k] || `Select ${lbl.toLowerCase()}…`}</Text>
                          <Ionicons name="chevron-down" size={16} color={tc.subtext} />
                        </TouchableOpacity>
                      ) : (
                        <TextInput style={[s.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
                          value={affForm[k]} onChangeText={v => setAffField(k, v)} placeholder={lbl} placeholderTextColor={tc.placeholder || '#AAA'} />
                      )}
                    </View>
                  ))}
                </View>
              )}

              <Text style={[s.sectionLabel, { color: tc.primary }]}>Means of ID *</Text>
              <Text style={[s.label, { color: tc.heading }]}>ID Type *</Text>
              <TouchableOpacity style={[s.picker, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
                onPress={() => openPicker('affIdType', 'Select ID Type', [
                  { value: 'NIN',              label: 'NIN' },
                  { value: 'INTERNATIONAL_PASSPORT', label: 'International Passport' },
                  { value: 'DRIVERS_LICENSE',  label: "Driver's License" },
                  { value: 'VOTERS_CARD',      label: "Voter's Card" },
                ])}>
                <Text style={[s.pickerText, { color: affForm.idType ? tc.heading : tc.placeholder || '#AAA' }]}>{affForm.idType || 'Select ID type…'}</Text>
                <Ionicons name="chevron-down" size={16} color={tc.subtext} />
              </TouchableOpacity>
              <Text style={[s.label, { color: tc.heading }]}>ID Number *</Text>
              <TextInput style={[s.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
                value={affForm.idNumber} onChangeText={v => setAffField('idNumber', v)} placeholder="Enter ID number" placeholderTextColor={tc.placeholder || '#AAA'} keyboardType="default" />

              <Text style={[s.sectionLabel, { color: tc.primary }]}>Documents *</Text>
              <LlcImageUpload label="Passport Photo"    required value={affForm.passport}  onPick={v => setAffField('passport', v)}  tc={tc} />
              <LlcImageUpload label="Means of ID Image" required value={affForm.meansOfId} onPick={v => setAffField('meansOfId', v)} tc={tc} />
              <LlcImageUpload label="Signature"         required value={affForm.signature} onPick={v => setAffField('signature', v)} tc={tc} />
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {[['rcNumber','RC Number *','default'], ['companyName','Company Name *','words'], ['contactEmail','Contact Email *','email-address'], ['contactPhone','Contact Phone *','phone-pad']].map(([k, lbl, kb]) => (
                <View key={k}>
                  <Text style={[s.label, { color: tc.heading }]}>{lbl}</Text>
                  <TextInput style={[s.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
                    value={affForm[k]} onChangeText={v => setAffField(k, v)} placeholder={lbl.replace(' *','')} placeholderTextColor={tc.placeholder || '#AAA'}
                    keyboardType={kb} autoCapitalize={kb === 'email-address' ? 'none' : 'words'} />
                </View>
              ))}

              <Text style={[s.sectionLabel, { color: tc.primary }]}>Service Address *</Text>
              {[['serviceState','State',true],['serviceLga','LGA',false],['serviceCity','City',false],['serviceStreet','Street',false]].map(([k,lbl,isPicker]) => (
                <View key={k}>
                  <Text style={[s.label, { color: tc.heading }]}>{lbl} *</Text>
                  {isPicker ? (
                    <TouchableOpacity style={[s.picker, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
                      onPress={() => openPicker(k, `Select ${lbl}`, NIGERIAN_STATES.map(st => ({ value: st, label: st })))}>
                      <Text style={[s.pickerText, { color: affForm[k] ? tc.heading : tc.placeholder || '#AAA' }]}>{affForm[k] || `Select ${lbl.toLowerCase()}…`}</Text>
                      <Ionicons name="chevron-down" size={16} color={tc.subtext} />
                    </TouchableOpacity>
                  ) : (
                    <TextInput style={[s.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
                      value={affForm[k]} onChangeText={v => setAffField(k, v)} placeholder={lbl} placeholderTextColor={tc.placeholder || '#AAA'} />
                  )}
                </View>
              ))}

              <LlcImageUpload label="Company Signature" required value={affForm.signature} onPick={v => setAffField('signature', v)} tc={tc} />
            </View>
          )}

          {/* Shareholder section */}
          <TouchableOpacity style={[s.toggleRow, { borderColor: tc.border || '#E5E5EA', marginTop: 16 }]} onPress={() => setAffField('isShareholder', !affForm.isShareholder)} activeOpacity={0.8}>
            <View style={[s.checkbox, { borderColor: affForm.isShareholder ? tc.primary : tc.border || '#CCC', backgroundColor: affForm.isShareholder ? tc.primary : 'transparent' }]}>
              {affForm.isShareholder && <Ionicons name="checkmark" size={12} color="#FFF" />}
            </View>
            <Text style={[s.toggleText, { color: tc.heading }]}>This affiliate is a shareholder</Text>
          </TouchableOpacity>

          {affForm.isShareholder && (
            <View style={[s.allotBox, { backgroundColor: `${tc.primary}08`, borderColor: `${tc.primary}25` }]}>
              <Text style={[s.label, { color: tc.heading }]}>Ordinary Shares Allotment *</Text>
              <Text style={[s.hint, { color: tc.subtext }]}>Remaining: {sharesRemaining.toLocaleString()}</Text>
              <TextInput style={[s.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
                value={affForm.allottedOrdinaryShares} onChangeText={v => setAffField('allottedOrdinaryShares', v.replace(/[^0-9]/g, ''))}
                placeholder="0" placeholderTextColor={tc.placeholder || '#AAA'} keyboardType="numeric" />
              <Text style={[s.label, { color: tc.heading, marginTop: 8 }]}>Preference Shares Allotment</Text>
              <TextInput style={[s.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
                value={affForm.allottedPreferenceShares} onChangeText={v => setAffField('allottedPreferenceShares', v.replace(/[^0-9]/g, ''))}
                placeholder="0" placeholderTextColor={tc.placeholder || '#AAA'} keyboardType="numeric" />
            </View>
          )}

          <TouchableOpacity style={[s.primaryBtn, { backgroundColor: tc.primary, opacity: affBusy ? 0.7 : 1, marginTop: 24 }]} onPress={handleAddAffiliate} disabled={affBusy} activeOpacity={0.85}>
            {affBusy ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="person-add-outline" size={18} color="#FFF" />}
            <Text style={s.primaryBtnText}>{affBusy ? 'Registering…' : 'Register Affiliate'}</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Nested picker modal */}
        <PickerModal
          visible={picker.visible}
          title={picker.title}
          options={picker.options}
          value={picker.key === 'affType' ? affForm.affiliateType : picker.key === 'affGender' ? affForm.gender : picker.key === 'affIdType' ? affForm.idType : affForm[picker.key]}
          onSelect={v => {
            if (picker.key === 'affType') setAffField('affiliateType', v);
            else if (picker.key === 'affGender') setAffField('gender', v);
            else if (picker.key === 'affIdType') setAffField('idType', v);
            else setAffField(picker.key, v);
          }}
          onClose={closePicker}
          tc={tc}
        />
      </SafeAreaView>
    </Modal>
  );

  // ── Step progress bar ────────────────────────────────────────────────────────

  const STEP_LABELS = ['Reserve', 'Memo', 'Analyse', 'Company', 'Shares', 'Affiliates'];

  const renderProgress = () => (
    <View style={[s.progressWrap, { backgroundColor: tc.card, borderBottomColor: tc.border || '#F0F0F0' }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.progressRow}>
        {STEP_LABELS.map((lbl, i) => {
          const n    = i + 1;
          const done = n < step;
          const cur  = n === step;
          return (
            <View key={n} style={s.progressItem}>
              <View style={[s.progressDot, { backgroundColor: done || cur ? tc.primary : tc.border || '#DDD' }]}>
                {done ? <Ionicons name="checkmark" size={11} color="#FFF" /> : <Text style={[s.progressDotText, { color: cur ? '#FFF' : tc.subtext }]}>{n}</Text>}
              </View>
              <Text style={[s.progressLabel, { color: cur ? tc.primary : done ? tc.subheading : tc.subtext }]}>{lbl}</Text>
              {i < STEP_LABELS.length - 1 && <View style={[s.progressLine, { backgroundColor: done ? tc.primary : tc.border || '#DDD' }]} />}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );

  // ── Main render ──────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return null;
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: tc.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8, backgroundColor: tc.primary }]}>
        <TouchableOpacity style={s.backBtn2} onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Company Registration</Text>
          <Text style={s.headerSub}>Step {step} of {TOTAL_STEPS} — {STEP_LABELS[step - 1]}</Text>
        </View>
        <View style={s.headerIcon}>
          <Ionicons name="business-outline" size={20} color="#FFFFFF" />
        </View>
      </View>

      {renderProgress()}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView ref={scrollRef} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Global picker modal */}
      <PickerModal
        visible={picker.visible && !affModal}
        title={picker.title}
        options={picker.options}
        value={form[picker.key]}
        onSelect={v => setField(picker.key, v)}
        onClose={closePicker}
        tc={tc}
      />

      {renderAffiliateModal()}
    </SafeAreaView>
  );
}

// ─── Stylesheets ──────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:           { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  backBtn2:       { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  headerSub:      { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  headerIcon:     { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },

  progressWrap:   { borderBottomWidth: 1, paddingVertical: 10 },
  progressRow:    { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 0 },
  progressItem:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressDot:    { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  progressDotText:{ fontSize: 11, fontWeight: '700' },
  progressLabel:  { fontSize: 10, fontWeight: '600' },
  progressLine:   { width: 18, height: 2, marginHorizontal: 2 },

  scroll:         { padding: 16, gap: 16 },
  scroll2:        { padding: 16, gap: 12 },
  stepContent:    { gap: 16 },

  stepCard:       { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  stepCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepCardIcon:   { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepCardTitle:  { fontSize: 15, fontWeight: '800', flex: 1 },
  stepCardSub:    { fontSize: 12.5, lineHeight: 19 },

  label:          { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  hint:           { fontSize: 11.5, marginTop: 4 },
  sectionLabel:   { fontSize: 12, fontWeight: '800', letterSpacing: 0.4, marginTop: 8, marginBottom: 4 },

  input:          { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 },
  picker:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 13 },
  pickerText:     { fontSize: 14, flex: 1 },

  infoBadge:      { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  infoBadgeText:  { fontSize: 12.5, flex: 1 },

  warnBox:        { flexDirection: 'row', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'flex-start' },
  warnText:       { fontSize: 12, flex: 1, lineHeight: 18 },
  alertBox:       { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'flex-start' },
  successBox:     { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  completionBox:  { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'flex-start' },

  memoRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  memoNum:        { fontSize: 14, fontWeight: '800', marginTop: 4, width: 20 },
  memoInput:      { flex: 1, fontSize: 13, lineHeight: 20, minHeight: 44 },

  primaryBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 13 },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  secondaryBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
  secondaryBtnText:{ fontSize: 14, fontWeight: '700' },
  ghostBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed' },
  ghostBtnText:   { fontSize: 13, fontWeight: '600' },

  aiHelperBanner: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 12 },
  aiHelperText:   { flex: 1, fontSize: 12.5, lineHeight: 19 },

  memoAddRow:     { flexDirection: 'row', alignItems: 'flex-end', borderRadius: 12, borderWidth: 1, overflow: 'hidden', minHeight: 52 },
  memoAddInput:   { flex: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 13.5, lineHeight: 19 },
  memoAddBtn:     { width: 44, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  memoDivider:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 18 },
  memoDividerLine:{ flex: 1, height: 1 },
  memoDividerText:{ fontSize: 12, fontWeight: '600', paddingHorizontal: 4 },

  compTypeRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 10, borderWidth: 1, gap: 8 },
  compTypeLabel:  { flex: 1, fontSize: 12.5, fontWeight: '500', textTransform: 'capitalize' },
  compTypeAmount: { fontSize: 12.5, fontWeight: '700' },

  capitalBox:     { padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center', gap: 4 },
  capitalLabel:   { fontSize: 12, fontWeight: '600' },
  capitalAmount:  { fontSize: 22, fontWeight: '900' },

  shareTracker:   { borderRadius: 14, padding: 16, gap: 10 },
  trackerLabel:   { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginBottom: 2 },
  trackerValue:   { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  trackerBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  trackerBadgeText:{ fontSize: 12, fontWeight: '700' },
  trackerBarTrack:{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  trackerBarFill: { height: 6, borderRadius: 3 },

  affCard:        { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  affIconWrap:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  affName:        { fontSize: 14, fontWeight: '700' },
  affMeta:        { fontSize: 11.5, marginTop: 2 },
  affBadge:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },

  emptyAff:       { alignItems: 'center', padding: 32, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', gap: 4 },

  toggleRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1 },
  checkbox:       { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  toggleText:     { fontSize: 13, fontWeight: '500', flex: 1 },

  modeToggle:     { flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  modeBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11 },
  modeBtnText:    { fontSize: 13, fontWeight: '700' },

  allotBox:       { padding: 14, borderRadius: 12, borderWidth: 1, gap: 4 },

  modalHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14 },
  modalHeaderTitle:{ fontSize: 16, fontWeight: '800', color: '#FFFFFF', flex: 1, textAlign: 'center' },
});

// ── ImageUpload styles ────────────────────────────────────────────────────────
const iu = StyleSheet.create({
  wrap:        { borderRadius: 12, padding: 12 },
  uploadedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb:       { width: 44, height: 44, borderRadius: 8 },
  label:       { fontSize: 13, fontWeight: '600' },
  uploaded:    { fontSize: 11, fontWeight: '700', color: '#4CAF50', marginTop: 2 },
  emptyRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap:    { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hint:        { fontSize: 11.5, marginTop: 2 },
});

// ── PickerModal styles ────────────────────────────────────────────────────────
const pm = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:      { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: '#DDD', alignSelf: 'center', marginBottom: 16 },
  title:      { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  option:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 4 },
  optionText: { fontSize: 14, flex: 1 },
  sep:        { height: 1 },
});
