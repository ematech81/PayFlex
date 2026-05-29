// src/screen/AirtimeScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Shared Components
import {
  ConfirmationModal,
  PinModal,
  ResultModal,
  LoadingOverlay,
  BeneficiaryInput,
} from 'component/SHARED';

// Custom Components
import PinSetupModal from 'component/PinSetUpModal';
import { useWallet } from 'context/WalletContext';
import { StatusBarComponent } from 'component/StatusBar';

// Constants & Utils
import { AIRTIME_CONSTANTS } from 'CONSTANT/SERVICES/airtimeServices';
import { NETWORK_PROVIDERS } from 'CONSTANT/providerConstant';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { useServicePayment } from 'HOOKS/UseServicePayment';
import { purchaseAirtime } from 'AuthFunction/paymentService';

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000];

export default function AirtimeScreen({ navigation, route }) {
  const isDarkMode   = useThem();
  const themeColors  = isDarkMode ? colors.dark : colors.light;
  const insets       = useSafeAreaInsets();
  const { wallet, refreshWallet } = useWallet();

  // ── State ──────────────────────────────────────────────────────────────────
  const [phoneNumber, setPhoneNumber]       = useState('');
  const [provider,    setProvider]          = useState('');
  const [amount,      setAmount]            = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateAirtimePayment = useCallback((paymentData) => {
    const errors = {};
    const cleanPhone = (paymentData.phoneNumber || '').replace(/\s/g, '');
    if (!cleanPhone)                          errors.phoneNumber = 'Phone number is required';
    else if (cleanPhone.length !== 11)        errors.phoneNumber = 'Phone number must be 11 digits';
    else if (!/^0\d{10}$/.test(cleanPhone))  errors.phoneNumber = 'Invalid Nigerian phone number';
    if (!paymentData.network)                 errors.network     = 'Please select a network provider';
    const amt = paymentData.amount;
    if (!amt || amt < AIRTIME_CONSTANTS.LIMITS.MIN_AMOUNT)
      errors.amount = `Minimum amount is ${formatCurrency(AIRTIME_CONSTANTS.LIMITS.MIN_AMOUNT, 'NGN')}`;
    if (amt > AIRTIME_CONSTANTS.LIMITS.MAX_AMOUNT)
      errors.amount = `Maximum amount is ${formatCurrency(AIRTIME_CONSTANTS.LIMITS.MAX_AMOUNT, 'NGN')}`;
    const isValid = Object.keys(errors).length === 0;
    setValidationErrors(errors);
    return { isValid, errors };
  }, []);

  // ── Payment hook ───────────────────────────────────────────────────────────
  const payment = useServicePayment({
    serviceName:    'Airtime',
    validatePayment: validateAirtimePayment,
    executePurchase: async (pin, paymentData) => purchaseAirtime(pin, paymentData),
    navigation,
    route,
  });

  // Restore form after PIN setup
  useEffect(() => {
    payment.restoreFormData((data) => {
      setPhoneNumber(data.phoneNumber);
      setProvider(data.provider);
      setAmount(data.amount.toString());
    });
  }, [payment.pendingPaymentData]);

  useEffect(() => { refreshWallet(); }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePayment = useCallback((paymentAmount) => {
    setValidationErrors({});
    payment.initiatePayment({
      phoneNumber: phoneNumber.replace(/\s/g, ''),
      network:     provider,
      amount:      paymentAmount,
    });
  }, [phoneNumber, provider, payment]);

  const handleQuickAmount = useCallback((val) => {
    setAmount(val.toString());
    handlePayment(val);
  }, [handlePayment]);

  const handleBuyPress = useCallback(() => {
    const amt = parseFloat(amount);
    if (isNaN(amt)) { setValidationErrors({ amount: 'Please enter a valid amount' }); return; }
    handlePayment(amt);
  }, [amount, handlePayment]);

  const handleTransactionComplete = useCallback(() => {
    setPhoneNumber(''); setProvider(''); setAmount('');
    const ref = payment.result?.reference || payment.result?.data?.reference || payment.result?.data?._id;
    payment.handleTransactionComplete(ref);
  }, [payment]);

  const getProviderLogo = useCallback(() => NETWORK_PROVIDERS.find(p => p.value === provider)?.logo, [provider]);
  const getProviderName = useCallback(() => NETWORK_PROVIDERS.find(p => p.value === provider)?.label, [provider]);

  const walletBalance = wallet?.user?.walletBalance || 0;
  const selectedProvider = NETWORK_PROVIDERS.find(p => p.value === provider);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border || '#E5E5EA', paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={themeColors.heading} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.heading }]}>Buy Airtime</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Orders')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.headerRight, { color: themeColors.primary }]}>History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* SELECT NETWORK */}
        <Text style={[styles.sectionLabel, { color: themeColors.subheading }]}>SELECT NETWORK</Text>
        <View style={styles.networkRow}>
          {NETWORK_PROVIDERS.map((p) => {
            const isSelected = provider === p.value;
            return (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.networkCard,
                  { backgroundColor: themeColors.card, borderColor: isSelected ? p.color : themeColors.border || '#E5E5EA' },
                  isSelected && { borderWidth: 2 },
                ]}
                onPress={() => setProvider(p.value)}
                activeOpacity={0.8}
              >
                <Image source={p.logo} style={styles.networkLogo} resizeMode="contain" />
                <Text style={[styles.networkLabel, { color: isSelected ? p.color : themeColors.subheading }]}>{p.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {validationErrors.network && <Text style={styles.fieldError}>{validationErrors.network}</Text>}

        {/* PHONE NUMBER */}
        <Text style={[styles.sectionLabel, { color: themeColors.subheading, marginTop: 20 }]}>PHONE NUMBER</Text>
        <View style={[styles.fieldBox, { backgroundColor: themeColors.card, borderColor: validationErrors.phoneNumber ? '#EF4444' : themeColors.border || '#E5E5EA' }]}>
          <BeneficiaryInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            onNetworkDetected={setProvider}
            onBeneficiarySelect={(b) => { if (b.network) setProvider(b.network); }}
            serviceType="airtime"
            placeholder="08XX XXX XXXX"
            label=""
            error={null}
            keyboardType="phone-pad"
            maxLength={11}
            icon="call-outline"
            identifierField="phoneNumber"
            secondaryField="network"
            displayField={(item) => `${item.phoneNumber} - ${item.network?.toUpperCase()}`}
            enableNetworkDetection={true}
            enableValidation={true}
          />
        </View>
        {validationErrors.phoneNumber && <Text style={styles.fieldError}>{validationErrors.phoneNumber}</Text>}

        {/* Fee hint */}
        <View style={[styles.feeHint, { backgroundColor: `${themeColors.primary}0C` }]}>
          <Ionicons name="information-circle-outline" size={13} color={themeColors.subtext} />
          <Text style={[styles.feeHintText, { color: themeColors.subtext }]}>
            Topping up a different number adds a ₦20 convenience fee.
          </Text>
        </View>

        {/* AMOUNT */}
        <View style={styles.amountHeader}>
          <Text style={[styles.sectionLabel, { color: themeColors.subheading, marginTop: 0, marginBottom: 0 }]}>AMOUNT (₦)</Text>
          <Text style={[styles.balanceText, { color: themeColors.primary }]}>
            Balance: {formatCurrency(walletBalance, 'NGN')}
          </Text>
        </View>
        <View style={[styles.fieldBox, styles.amountBox, { backgroundColor: themeColors.card, borderColor: validationErrors.amount ? '#EF4444' : themeColors.border || '#E5E5EA' }]}>
          <TextInput
            style={[styles.amountInput, { color: themeColors.heading }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
            placeholderTextColor={themeColors.subtext}
            keyboardType="number-pad"
          />
        </View>
        {validationErrors.amount && <Text style={styles.fieldError}>{validationErrors.amount}</Text>}

        {/* Quick amounts */}
        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map((val) => (
            <TouchableOpacity
              key={val}
              style={[styles.quickChip, { backgroundColor: amount === val.toString() ? themeColors.primary : themeColors.card, borderColor: amount === val.toString() ? themeColors.primary : themeColors.border || '#E5E5EA' }]}
              onPress={() => handleQuickAmount(val)}
              activeOpacity={0.8}
            >
              <Text style={[styles.quickChipText, { color: amount === val.toString() ? '#FFF' : themeColors.heading }]}>
                ₦{val.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* PAYMENT SUMMARY */}
        <View style={[styles.summaryCard, { backgroundColor: themeColors.card, borderColor: themeColors.border || '#E5E5EA' }]}>
          <Text style={[styles.summaryTitle, { color: themeColors.subheading }]}>PAYMENT SUMMARY</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: themeColors.subheading }]}>Network</Text>
            <Text style={[styles.summaryValue, { color: selectedProvider ? selectedProvider.color : themeColors.heading }]}>
              {selectedProvider ? selectedProvider.label : 'Not Selected'}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: themeColors.border || '#F0F0F0' }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: themeColors.subheading }]}>Phone Number</Text>
            <Text style={[styles.summaryValue, { color: themeColors.heading }]}>
              {phoneNumber.replace(/\s/g, '') || '---'}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: themeColors.border || '#F0F0F0' }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: themeColors.subheading }]}>Total Amount</Text>
            <Text style={[styles.summaryAmount, { color: amount ? themeColors.primary : themeColors.subheading }]}>
              {amount ? formatCurrency(parseFloat(amount) || 0, 'NGN') : '₦0.00'}
            </Text>
          </View>
        </View>

        {/* Flow error */}
        {payment.flowError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text style={styles.errorText}>{payment.flowError}</Text>
          </View>
        )}

        {/* Buy button */}
        <TouchableOpacity
          style={[styles.buyBtn, { backgroundColor: themeColors.primary, opacity: payment.step === 'processing' ? 0.7 : 1 }]}
          onPress={handleBuyPress}
          disabled={payment.step === 'processing'}
          activeOpacity={0.85}
        >
          <Text style={styles.buyBtnText}>
            {payment.step === 'processing' ? 'Processing…' : 'Buy Airtime ⚡'}
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Modals (all logic unchanged) ──────────────────────────────────── */}
      <PinSetupModal
        visible={payment.showPinSetupModal}
        serviceName="Airtime Recharge"
        paymentAmount={parseFloat(amount)}
        onCreatePin={payment.handleCreatePin}
        onCancel={payment.handleCancelPinSetup}
        isDarkMode={isDarkMode}
      />

      <ConfirmationModal
        visible={payment.step === 'confirm'}
        onClose={payment.handleCancelPayment}
        onConfirm={payment.confirmPayment}
        amount={Number(amount)}
        serviceName="Airtime"
        providerLogo={getProviderLogo()}
        providerName={getProviderName()}
        recipient={phoneNumber.replace(/\s/g, '')}
        recipientLabel="Phone Number"
        walletBalance={walletBalance}
        loading={false}
      />

      <PinModal
        visible={payment.step === 'pin'}
        onClose={payment.handleCancelPayment}
        onSubmit={payment.submitPayment}
        onForgotPin={payment.handleForgotPin}
        loading={payment.step === 'processing'}
        error={payment.pinError}
        title="Enter Transaction PIN"
        subtitle={`Confirm payment of ${formatCurrency(Number(amount), 'NGN')}`}
      />

      <ResultModal
        visible={payment.step === 'result'}
        onClose={payment.resetFlow}
        type={payment.result ? 'success' : 'error'}
        title={payment.result ? 'Purchase Successful!' : 'Purchase Failed'}
        message={
          payment.result
            ? `Your airtime purchase of ${formatCurrency(Number(amount), 'NGN')} to ${phoneNumber.replace(/\s/g, '')} was successful.`
            : payment.flowError || 'Your airtime purchase could not be completed. Please try again.'
        }
        primaryAction={{ label: 'View Details', onPress: handleTransactionComplete }}
        secondaryAction={{
          label: 'Done',
          onPress: () => { setPhoneNumber(''); setProvider(''); setAmount(''); payment.resetFlow(); },
        }}
      />

      <LoadingOverlay visible={payment.step === 'processing'} message="Processing your payment..." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerRight:  { fontSize: 14, fontWeight: '600' },

  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 48 },

  // Section labels
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  // Network grid
  networkRow: {
    flexDirection: 'row',
    gap: 8,
  },
  networkCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  networkLogo:  { width: 36, height: 36 },
  networkLabel: { fontSize: 11, fontWeight: '600' },

  // Field box (phone + amount)
  fieldBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 2,
    marginBottom: 4,
  },
  amountBox:   { paddingVertical: 4 },
  amountInput: { fontSize: 17, fontWeight: '600', paddingVertical: 12 },

  // Amount header (label + balance)
  amountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  balanceText: { fontSize: 13, fontWeight: '600' },

  // Quick amount chips
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  quickChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickChipText: { fontSize: 13, fontWeight: '600' },

  // Fee hint
  feeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  feeHintText: { flex: 1, fontSize: 11, lineHeight: 16 },

  // Payment summary
  summaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel:  { fontSize: 14, fontWeight: '500' },
  summaryValue:  { fontSize: 14, fontWeight: '600' },
  summaryAmount: { fontSize: 18, fontWeight: '800' },
  summaryDivider: { height: 1, marginHorizontal: -4 },

  // Error
  fieldError: { fontSize: 12, color: '#EF4444', marginBottom: 6, marginLeft: 4 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: '#EF4444', fontWeight: '500' },

  // Buy button
  buyBtn: {
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
