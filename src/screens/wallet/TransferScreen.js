import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Alert, FlatList, Modal, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { useWallet } from 'context/WalletContext';
import {
  transferGetBanks, transferResolveAccount, transferInitiate,
} from 'AuthFunction/paymentService';

const MIN_AMOUNT  = 500;
const DAILY_LIMIT = 200_000;

// ─── Step labels ──────────────────────────────────────────────────────────────
const STEPS = ['Recipient', 'Amount', 'Confirm'];

// ─── PIN pad digits ───────────────────────────────────────────────────────────
const PAD = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function TransferScreen({ navigation }) {
  const insets   = useSafeAreaInsets();
  const isDark   = useThem();
  const tc       = isDark ? colors.dark : colors.light;
  const { wallet, refreshWallet } = useWallet();
  const balance  = wallet?.walletBalance ?? 0;

  // ── State ──────────────────────────────────────────────────────────────────
  const [step,          setStep]          = useState(0); // 0 = Recipient, 1 = Amount, 2 = Confirm+PIN
  const [banks,         setBanks]         = useState([]);
  const [banksLoading,  setBanksLoading]  = useState(true);
  const [banksError,    setBanksError]    = useState('');
  const [bankSearch,    setBankSearch]    = useState('');
  const [bankModal,     setBankModal]     = useState(false);
  const [selectedBank,  setSelectedBank]  = useState(null);   // { name, code }
  const [accountNumber, setAccountNumber] = useState('');
  const [resolving,     setResolving]     = useState(false);
  const [accountName,   setAccountName]   = useState('');

  const [amount,  setAmount]  = useState('');
  const [narration, setNarration] = useState('');

  const [pin,     setPin]     = useState('');
  const [loading, setLoading] = useState(false);

  const resolveTimer = useRef(null);

  // ── Load banks once ────────────────────────────────────────────────────────
  const loadBanks = useCallback(() => {
    setBanksLoading(true);
    setBanksError('');
    transferGetBanks()
      .then(res => {
        const list = res?.data || res || [];
        if (!Array.isArray(list) || list.length === 0) {
          setBanksError('No banks returned. Please retry.');
        } else {
          setBanks(list);
        }
      })
      .catch(err => setBanksError(err.message || 'Failed to load banks.'))
      .finally(() => setBanksLoading(false));
  }, []);

  useEffect(() => { loadBanks(); }, []);

  // ── Auto-resolve account when 10 digits entered ────────────────────────────
  useEffect(() => {
    if (resolveTimer.current) clearTimeout(resolveTimer.current);
    setAccountName('');
    if (accountNumber.length === 10 && selectedBank) {
      resolveTimer.current = setTimeout(async () => {
        setResolving(true);
        try {
          const res = await transferResolveAccount(selectedBank.code, accountNumber);
          setAccountName(res?.data?.account_name || res?.account_name || '');
        } catch {
          setAccountName('');
          Alert.alert('Account not found', 'Could not verify this account. Check the number and bank.');
        } finally {
          setResolving(false);
        }
      }, 600);
    }
    return () => clearTimeout(resolveTimer.current);
  }, [accountNumber, selectedBank]);

  // ── Computed ───────────────────────────────────────────────────────────────
  const filteredBanks = banks.filter(b =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const amountNum    = parseFloat(amount.replace(/,/g, '')) || 0;
  const canProceed0  = selectedBank && accountNumber.length === 10 && accountName;
  const canProceed1  = amountNum >= MIN_AMOUNT && amountNum <= balance;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePinPress = (key) => {
    if (key === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (key === '' || pin.length >= 4) return;
    setPin(p => p + key);
  };

  useEffect(() => {
    if (pin.length === 4) handleSubmit(pin);
  }, [pin]);

  const handleSubmit = async (enteredPin) => {
    setLoading(true);
    try {
      const res = await transferInitiate(enteredPin, {
        amount:        amountNum,
        bankCode:      selectedBank.code,
        bankName:      selectedBank.name,
        accountNumber,
        accountName,
        narration:     narration.trim() || `Transfer to ${accountName}`,
      });
      await refreshWallet();
      Alert.alert(
        'Transfer Initiated',
        `₦${amountNum.toLocaleString()} is on its way to ${accountName}. Ref: ${res.reference}`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      setPin('');
      Alert.alert('Transfer Failed', e.message || 'Could not process transfer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Renders ────────────────────────────────────────────────────────────────

  const renderStep0 = () => (
    <ScrollView contentContainerStyle={ss.stepContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={[ss.stepTitle, { color: tc.heading }]}>Who are you sending to?</Text>

      {/* Bank picker */}
      <Text style={[ss.label, { color: tc.heading }]}>Bank</Text>
      <TouchableOpacity
        style={[ss.field, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
        onPress={() => setBankModal(true)} activeOpacity={0.8}
      >
        <Text style={[ss.fieldText, { color: selectedBank ? tc.heading : tc.subtext }]}>
          {selectedBank ? selectedBank.name : 'Select bank…'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={tc.subtext} />
      </TouchableOpacity>

      {/* Account number */}
      <Text style={[ss.label, { color: tc.heading }]}>Account Number</Text>
      <TextInput
        style={[ss.field, ss.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
        value={accountNumber}
        onChangeText={v => setAccountNumber(v.replace(/\D/g, '').slice(0, 10))}
        placeholder="10-digit account number"
        placeholderTextColor={tc.subtext}
        keyboardType="numeric"
        maxLength={10}
      />

      {/* Resolution result */}
      {resolving && (
        <View style={ss.resolveRow}>
          <ActivityIndicator size="small" color={tc.primary} />
          <Text style={[ss.resolveText, { color: tc.subheading }]}>Verifying account…</Text>
        </View>
      )}
      {accountName ? (
        <View style={[ss.resolveSuccess, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
          <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
          <Text style={ss.resolveNameText}>{accountName}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[ss.nextBtn, { backgroundColor: tc.primary, opacity: canProceed0 ? 1 : 0.4 }]}
        onPress={() => setStep(1)} disabled={!canProceed0} activeOpacity={0.85}
      >
        <Text style={ss.nextBtnText}>Continue</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFF" />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep1 = () => (
    <ScrollView contentContainerStyle={ss.stepContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {/* Recipient summary */}
      <View style={[ss.recipientCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
        <View style={[ss.recipientIcon, { backgroundColor: `${tc.primary}18` }]}>
          <Ionicons name="person-outline" size={22} color={tc.primary} />
        </View>
        <View>
          <Text style={[ss.recipientName, { color: tc.heading }]}>{accountName}</Text>
          <Text style={[ss.recipientMeta, { color: tc.subheading }]}>{selectedBank?.name}  ·  {accountNumber}</Text>
        </View>
      </View>

      <Text style={[ss.stepTitle, { color: tc.heading }]}>How much?</Text>

      {/* Amount */}
      <Text style={[ss.label, { color: tc.heading }]}>Amount (₦)</Text>
      <TextInput
        style={[ss.field, ss.input, ss.amountInput, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
        value={amount}
        onChangeText={v => setAmount(v.replace(/[^0-9]/g, ''))}
        placeholder="0"
        placeholderTextColor={tc.subtext}
        keyboardType="numeric"
      />
      <View style={ss.amountHints}>
        <Text style={[ss.hint, { color: tc.subtext }]}>Min ₦{MIN_AMOUNT.toLocaleString()}</Text>
        <Text style={[ss.hint, { color: tc.subtext }]}>Balance: ₦{balance.toLocaleString()}</Text>
      </View>

      {amountNum > balance && (
        <View style={[ss.errorBadge, { backgroundColor: '#FEE2E2' }]}>
          <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
          <Text style={{ fontSize: 12, color: '#EF4444' }}>Insufficient balance</Text>
        </View>
      )}
      {amountNum > DAILY_LIMIT && (
        <View style={[ss.errorBadge, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="warning-outline" size={14} color="#D97706" />
          <Text style={{ fontSize: 12, color: '#D97706' }}>Exceeds daily limit of ₦{DAILY_LIMIT.toLocaleString()}</Text>
        </View>
      )}

      {/* Narration */}
      <Text style={[ss.label, { color: tc.heading }]}>Narration (optional)</Text>
      <TextInput
        style={[ss.field, ss.input, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
        value={narration}
        onChangeText={setNarration}
        placeholder={`Transfer to ${accountName}`}
        placeholderTextColor={tc.subtext}
        maxLength={60}
      />

      <TouchableOpacity
        style={[ss.nextBtn, { backgroundColor: tc.primary, opacity: canProceed1 ? 1 : 0.4 }]}
        onPress={() => setStep(2)} disabled={!canProceed1} activeOpacity={0.85}
      >
        <Text style={ss.nextBtnText}>Review Transfer</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFF" />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView contentContainerStyle={ss.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={[ss.stepTitle, { color: tc.heading }]}>Confirm & Enter PIN</Text>

      {/* Summary card */}
      <View style={[ss.summaryCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
        <SummaryRow label="To"       value={accountName}               tc={tc} />
        <SummaryRow label="Bank"     value={selectedBank?.name}        tc={tc} />
        <SummaryRow label="Account"  value={accountNumber}             tc={tc} />
        <SummaryRow label="Amount"   value={`₦${amountNum.toLocaleString()}`} tc={tc} highlight />
        <SummaryRow label="Fee"      value="Free"                      tc={tc} />
        {narration ? <SummaryRow label="Note" value={narration} tc={tc} /> : null}
      </View>

      {/* PIN dots */}
      <View style={ss.pinDotsRow}>
        {[0,1,2,3].map(i => (
          <View key={i} style={[ss.pinDot, { borderColor: tc.primary, backgroundColor: pin.length > i ? tc.primary : 'transparent' }]} />
        ))}
      </View>
      <Text style={[ss.pinHint, { color: tc.subtext }]}>Enter your 4-digit transaction PIN</Text>

      {/* PIN pad */}
      {loading ? (
        <ActivityIndicator size="large" color={tc.primary} style={{ marginTop: 32 }} />
      ) : (
        <View style={ss.pad}>
          {PAD.map((key, i) => (
            <TouchableOpacity
              key={i}
              style={[ss.padKey, key === '' && { opacity: 0 }]}
              onPress={() => handlePinPress(key)}
              activeOpacity={0.7}
              disabled={key === ''}
            >
              <Text style={[ss.padKeyText, { color: tc.heading }]}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  // ── Bank Modal ─────────────────────────────────────────────────────────────
  const renderBankModal = () => (
    <Modal visible={bankModal} animationType="slide" transparent onRequestClose={() => setBankModal(false)}>
      <TouchableOpacity style={ss.modalOverlay} activeOpacity={1} onPress={() => setBankModal(false)} />
      <View style={[ss.modalSheet, { backgroundColor: tc.card, paddingBottom: insets.bottom + 16 }]}>
        <View style={ss.modalHandle} />
        <Text style={[ss.modalTitle, { color: tc.heading }]}>Select Bank</Text>
        <TextInput
          style={[ss.modalSearch, { backgroundColor: tc.bg || tc.background, borderColor: tc.border || '#E5E5EA', color: tc.heading }]}
          value={bankSearch} onChangeText={setBankSearch}
          placeholder="Search bank…" placeholderTextColor={tc.subtext}
        />
        {banksLoading ? (
          <ActivityIndicator color={tc.primary} style={{ marginTop: 24 }} />
        ) : banksError ? (
          <View style={{ alignItems: 'center', paddingVertical: 24, gap: 12 }}>
            <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
            <Text style={{ color: '#EF4444', fontSize: 13, textAlign: 'center' }}>{banksError}</Text>
            <TouchableOpacity
              style={[ss.nextBtn, { backgroundColor: tc.primary, paddingHorizontal: 24 }]}
              onPress={loadBanks} activeOpacity={0.8}
            >
              <Text style={ss.nextBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredBanks}
            keyExtractor={item => item.code || item.slug || item.name}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[ss.bankItem, { borderBottomColor: tc.border || '#F0F0F0' }]}
                onPress={() => { setSelectedBank({ name: item.name, code: item.code }); setBankModal(false); setBankSearch(''); }}
                activeOpacity={0.7}
              >
                <Text style={[ss.bankItemText, { color: tc.heading }]}>{item.name}</Text>
                {selectedBank?.code === item.code && <Ionicons name="checkmark" size={18} color={tc.primary} />}
              </TouchableOpacity>
            )}
            style={{ maxHeight: 360 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={{ color: tc.subtext, textAlign: 'center', paddingVertical: 16 }}>No banks found</Text>}
          />
        )}
      </View>
    </Modal>
  );

  // ── Layout ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[ss.safe, { backgroundColor: tc.bg || tc.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={[ss.header, { backgroundColor: tc.primary, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={ss.backBtn} onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={ss.headerTitle}>Bank Transfer</Text>
          <Text style={ss.headerSub}>Free · Instant</Text>
        </View>
        <View style={[ss.headerBalance, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <Text style={ss.headerBalanceText}>₦{balance.toLocaleString()}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[ss.progressBar, { backgroundColor: tc.card }]}>
        {STEPS.map((lbl, i) => (
          <View key={i} style={ss.progressItem}>
            <View style={[ss.progressDot, { backgroundColor: i <= step ? tc.primary : tc.border || '#DDD' }]}>
              {i < step
                ? <Ionicons name="checkmark" size={11} color="#FFF" />
                : <Text style={[ss.progressDotText, { color: i === step ? '#FFF' : tc.subtext }]}>{i + 1}</Text>
              }
            </View>
            <Text style={[ss.progressLbl, { color: i <= step ? tc.primary : tc.subtext }]}>{lbl}</Text>
            {i < STEPS.length - 1 && <View style={[ss.progressLine, { backgroundColor: i < step ? tc.primary : tc.border || '#DDD' }]} />}
          </View>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </KeyboardAvoidingView>

      {renderBankModal()}
    </SafeAreaView>
  );
}

const SummaryRow = ({ label, value, tc, highlight }) => (
  <View style={ss.summaryRow}>
    <Text style={[ss.summaryLabel, { color: tc.subheading }]}>{label}</Text>
    <Text style={[ss.summaryValue, { color: highlight ? tc.primary : tc.heading }]}>{value}</Text>
  </View>
);

const ss = StyleSheet.create({
  safe:          { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  backBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { fontSize: 17, fontWeight: '800', color: '#FFF' },
  headerSub:     { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  headerBalance: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  headerBalanceText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  progressBar:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  progressItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressDot:   { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  progressDotText: { fontSize: 11, fontWeight: '700' },
  progressLbl:   { fontSize: 11, fontWeight: '600' },
  progressLine:  { width: 20, height: 2, marginHorizontal: 2 },

  stepContent:   { padding: 20, gap: 12, paddingBottom: 40 },
  stepTitle:     { fontSize: 17, fontWeight: '800', marginBottom: 4 },

  label:         { fontSize: 13, fontWeight: '600', marginTop: 4 },
  field:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14 },
  input:         { justifyContent: 'flex-start' },
  amountInput:   { fontSize: 22, fontWeight: '800' },
  amountHints:   { flexDirection: 'row', justifyContent: 'space-between' },
  hint:          { fontSize: 12 },
  fieldText:     { fontSize: 14 },

  resolveRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  resolveText:   { fontSize: 13 },
  resolveSuccess:{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  resolveNameText:{ fontSize: 13, fontWeight: '700', color: '#15803D', flex: 1 },

  errorBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8 },

  recipientCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  recipientIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  recipientName: { fontSize: 15, fontWeight: '700' },
  recipientMeta: { fontSize: 12, marginTop: 2 },

  nextBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 13, marginTop: 8 },
  nextBtnText:   { fontSize: 15, fontWeight: '800', color: '#FFF' },

  summaryCard:   { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0' },
  summaryLabel:  { fontSize: 13 },
  summaryValue:  { fontSize: 13, fontWeight: '700' },

  pinDotsRow:    { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 24, marginBottom: 8 },
  pinDot:        { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  pinHint:       { textAlign: 'center', fontSize: 12, marginBottom: 20 },

  pad:           { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 0 },
  padKey:        { width: '33.33%', paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  padKeyText:    { fontSize: 22, fontWeight: '600' },

  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet:    { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, paddingHorizontal: 16 },
  modalHandle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: '#DDD', alignSelf: 'center', marginBottom: 14 },
  modalTitle:    { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  modalSearch:   { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 8 },
  bankItem:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  bankItemText:  { fontSize: 14 },
});
