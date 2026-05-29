// src/screen/ElectricityPurchaseScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from 'utility/storageKeys';

import {
  ConfirmationModal,
  PinModal,
  ResultModal,
  LoadingOverlay,
} from 'component/SHARED';
import PinSetupModal from 'component/PinSetUpModal';
import { useWallet } from 'context/WalletContext';
import { useServicePayment } from 'HOOKS/UseServicePayment';
import { ELECTRICITY_PROVIDERS } from 'CONSTANT/providerConstant';
import { ELECTRICITY_CONSTANTS } from 'CONSTANT/SERVICES/electricityServices';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { StatusBarComponent } from 'component/StatusBar';
import { PaymentApiIPAddress } from 'utility/apiIPAdress';

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000];

export default function ElectricityPurchaseScreen({ navigation, route }) {
  const isDarkMode  = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const insets      = useSafeAreaInsets();
  const { wallet, refreshWallet } = useWallet();

  // ── State ──────────────────────────────────────────────────────────────────
  const [meterNumber,  setMeterNumber]  = useState('');
  const [disco,        setDisco]        = useState('');
  const [meterType,    setMeterType]    = useState('prepaid');
  const [phoneNumber,  setPhoneNumber]  = useState('');
  const [amount,       setAmount]       = useState('');
  const [customerInfo, setCustomerInfo] = useState(null);
  const [isVerifying,  setIsVerifying]  = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [uiStep,       setUiStep]       = useState('form'); // 'form' | 'confirm'

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateElectricityPayment = useCallback((paymentData) => {
    const errors = {};
    if (!paymentData.meterNumber || paymentData.meterNumber.length < 10)
      errors.meterNumber = ELECTRICITY_CONSTANTS.ERROR_MESSAGES.INVALID_METER;
    if (!paymentData.disco)
      errors.disco = ELECTRICITY_CONSTANTS.ERROR_MESSAGES.NO_DISCO;
    if (!paymentData.meterType)
      errors.meterType = ELECTRICITY_CONSTANTS.ERROR_MESSAGES.NO_METER_TYPE;
    if (!paymentData.amount || paymentData.amount < ELECTRICITY_CONSTANTS.LIMITS.MIN_AMOUNT)
      errors.amount = ELECTRICITY_CONSTANTS.ERROR_MESSAGES.AMOUNT_TOO_LOW;
    if (paymentData.amount > ELECTRICITY_CONSTANTS.LIMITS.MAX_AMOUNT)
      errors.amount = `Maximum amount is ${formatCurrency(ELECTRICITY_CONSTANTS.LIMITS.MAX_AMOUNT, 'NGN')}`;
    if (!paymentData.customerInfo)
      errors.meter = ELECTRICITY_CONSTANTS.ERROR_MESSAGES.METER_NOT_VERIFIED;
    setValidationErrors(errors);
    return { isValid: Object.keys(errors).length === 0, errors };
  }, []);

  // ── Execute payment ────────────────────────────────────────────────────────
  const executeElectricityPayment = useCallback(async (pin, paymentData) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    const response = await fetch(`${PaymentApiIPAddress}/pay-electricity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        meterNumber:  paymentData.meterNumber,
        disco:        paymentData.disco,
        meterType:    paymentData.meterType,
        amount:       paymentData.amount,
        phoneNumber:  paymentData.phoneNumber,
        customerInfo: paymentData.customerInfo,
        pin,
      }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Electricity payment failed');
    }
    return await response.json();
  }, []);

  // ── Payment hook ───────────────────────────────────────────────────────────
  const payment = useServicePayment({
    serviceName:     'Electricity',
    validatePayment:  validateElectricityPayment,
    executePurchase:  executeElectricityPayment,
    navigation,
    route,
  });

  useEffect(() => {
    payment.restoreFormData((data) => {
      setMeterNumber(data.meterNumber);
      setDisco(data.disco);
      setMeterType(data.meterType);
      setPhoneNumber(data.phoneNumber);
      setAmount(data.amount);
      setCustomerInfo(data.customerInfo);
    });
  }, [payment.pendingPaymentData]);

  useEffect(() => { refreshWallet(); }, []);

  // ── Verify meter ───────────────────────────────────────────────────────────
  const handleVerifyMeter = useCallback(async () => {
    if (!disco)   { setValidationErrors(p => ({ ...p, disco: 'Please select a provider' })); return; }
    if (!meterType) { setValidationErrors(p => ({ ...p, meterType: 'Please select meter type' })); return; }
    if (!meterNumber || meterNumber.length < 10) { setValidationErrors(p => ({ ...p, meterNumber: 'Invalid meter number' })); return; }
    if (!amount || parseFloat(amount) < ELECTRICITY_CONSTANTS.LIMITS.MIN_AMOUNT) {
      setValidationErrors(p => ({ ...p, amount: ELECTRICITY_CONSTANTS.ERROR_MESSAGES.AMOUNT_TOO_LOW })); return;
    }

    try {
      setIsVerifying(true);
      setValidationErrors({});
      const token    = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const response = await fetch(`${PaymentApiIPAddress}/verify-meter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ meterNumber, disco, meterType }),
      });
      const data = await response.json();
      if (data.success) {
        setCustomerInfo(data.data);
        setUiStep('confirm');  // advance — no Alert
      } else {
        throw new Error(data.message || 'Invalid meter number');
      }
    } catch (error) {
      setValidationErrors(p => ({ ...p, meterNumber: error.message || 'Verification failed' }));
      setCustomerInfo(null);
    } finally {
      setIsVerifying(false);
    }
  }, [meterNumber, disco, meterType, amount]);

  // ── Payment handlers ───────────────────────────────────────────────────────
  const triggerPayment = useCallback((amt) => {
    setValidationErrors({});
    payment.initiatePayment({ meterNumber, disco, meterType, amount: parseFloat(amt), phoneNumber, customerInfo });
  }, [meterNumber, disco, meterType, phoneNumber, customerInfo, payment]);

  const handleQuickAmount = useCallback((val) => {
    setAmount(val.toString());
    triggerPayment(val);
  }, [triggerPayment]);

  const handlePayNow = useCallback(() => {
    const amt = parseFloat(amount);
    if (isNaN(amt)) { setValidationErrors({ amount: 'Please enter a valid amount' }); return; }
    triggerPayment(amt);
  }, [amount, triggerPayment]);

  const handleTransactionComplete = useCallback(() => {
    setMeterNumber(''); setDisco(''); setMeterType('prepaid');
    setPhoneNumber(''); setAmount(''); setCustomerInfo(null); setUiStep('form');
    payment.handleTransactionComplete(payment.result?.reference);
  }, [payment]);

  const resetAll = () => {
    setMeterNumber(''); setDisco(''); setMeterType('prepaid');
    setAmount(''); setCustomerInfo(null); setUiStep('form'); setValidationErrors({});
  };

  const selectedDisco  = ELECTRICITY_PROVIDERS.find(p => p.value === disco);
  const walletBalance  = wallet?.user?.walletBalance || 0;
  const parsedAmount   = parseFloat(amount) || 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border || '#E5E5EA', paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={themeColors.heading} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.heading }]}>Electricity</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Orders')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <View style={[styles.historyBtn, { borderColor: themeColors.border || '#E5E5EA' }]}>
            <Ionicons name="time-outline" size={18} color={themeColors.primary} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── STEP 1: Form ─────────────────────────────────────────────────── */}
        {uiStep === 'form' && (
          <>
            {/* Select Provider */}
            <Text style={[styles.sectionLabel, { color: themeColors.heading }]}>Select Provider</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.providerScroll}>
              {ELECTRICITY_PROVIDERS.map((p) => {
                const isSelected = disco === p.value;
                return (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.providerCard,
                      { backgroundColor: themeColors.card, borderColor: isSelected ? themeColors.primary : themeColors.border || '#E5E5EA' },
                      isSelected && { borderWidth: 2 },
                    ]}
                    onPress={() => { setDisco(p.value); setCustomerInfo(null); setUiStep('form'); }}
                    activeOpacity={0.8}
                  >
                    <Image source={p.logo} style={styles.providerLogo} resizeMode="contain" />
                    <Text style={[styles.providerLabel, { color: isSelected ? themeColors.primary : themeColors.subheading }]}>{p.shortName}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {validationErrors.disco && <Text style={styles.fieldError}>{validationErrors.disco}</Text>}

            {/* Meter Number */}
            <Text style={[styles.sectionLabel, { color: themeColors.heading, marginTop: 20 }]}>Meter Number</Text>
            <View style={[styles.inputBox, { backgroundColor: themeColors.card, borderColor: validationErrors.meterNumber ? '#EF4444' : themeColors.border || '#E5E5EA' }]}>
              <TextInput
                style={[styles.inputText, { color: themeColors.heading }]}
                value={meterNumber}
                onChangeText={(t) => { setMeterNumber(t.replace(/\D/g, '')); setValidationErrors(p => ({ ...p, meterNumber: undefined })); }}
                placeholder="Enter 11 or 13 digit number"
                placeholderTextColor={themeColors.subtext}
                keyboardType="number-pad"
                maxLength={13}
              />
            </View>
            {validationErrors.meterNumber && <Text style={styles.fieldError}>{validationErrors.meterNumber}</Text>}

            {/* Meter Type */}
            <Text style={[styles.sectionLabel, { color: themeColors.heading, marginTop: 20 }]}>Meter Type</Text>
            <View style={styles.meterTypeRow}>
              {ELECTRICITY_CONSTANTS.METER_TYPES.map((type) => {
                const isSelected = meterType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.meterTypeBtn,
                      {
                        backgroundColor: isSelected ? `${themeColors.primary}18` : themeColors.card,
                        borderColor: isSelected ? themeColors.primary : themeColors.border || '#E5E5EA',
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => setMeterType(type.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.meterTypeBtnText, { color: isSelected ? themeColors.primary : themeColors.subheading, fontWeight: isSelected ? '700' : '500' }]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Amount */}
            <Text style={[styles.sectionLabel, { color: themeColors.heading, marginTop: 20 }]}>Amount (₦)</Text>
            <View style={[styles.inputBox, { backgroundColor: themeColors.card, borderColor: validationErrors.amount ? '#EF4444' : themeColors.border || '#E5E5EA' }]}>
              <Text style={[styles.nairaPrefix, { color: themeColors.subheading }]}>₦</Text>
              <TextInput
                style={[styles.inputText, { color: themeColors.heading }]}
                value={amount}
                onChangeText={(t) => { setAmount(t.replace(/[^0-9.]/g, '')); setValidationErrors(p => ({ ...p, amount: undefined })); }}
                placeholder="5,000"
                placeholderTextColor={themeColors.subtext}
                keyboardType="decimal-pad"
              />
            </View>
            {validationErrors.amount && <Text style={styles.fieldError}>{validationErrors.amount}</Text>}

            {/* Quick amounts */}
            <View style={styles.quickRow}>
              {QUICK_AMOUNTS.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.quickChip, {
                    backgroundColor: amount === val.toString() ? themeColors.primary : themeColors.card,
                    borderColor: amount === val.toString() ? themeColors.primary : themeColors.border || '#E5E5EA',
                  }]}
                  onPress={() => setAmount(val.toString())}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.quickChipText, { color: amount === val.toString() ? '#FFF' : themeColors.heading }]}>
                    ₦{val.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Verify Meter button */}
            <TouchableOpacity
              style={[styles.verifyBtn, { backgroundColor: themeColors.primary, opacity: isVerifying ? 0.7 : 1, marginTop: 28 }]}
              onPress={handleVerifyMeter}
              disabled={isVerifying}
              activeOpacity={0.85}
            >
              {isVerifying
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.verifyBtnText}>Verify Meter  →</Text>
              }
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 2: Confirm Details ───────────────────────────────────────── */}
        {uiStep === 'confirm' && customerInfo && (
          <>
            {/* Provider badge */}
            <View style={[styles.providerBadge, { backgroundColor: themeColors.card, borderColor: themeColors.border || '#E5E5EA' }]}>
              {selectedDisco?.logo && <Image source={selectedDisco.logo} style={styles.providerBadgeLogo} resizeMode="contain" />}
              <View>
                <Text style={[styles.providerBadgeName, { color: themeColors.heading }]}>{selectedDisco?.shortName || disco.toUpperCase()}</Text>
                <Text style={[styles.providerBadgeSub, { color: themeColors.subheading }]}>{meterType === 'prepaid' ? 'Prepaid Meter' : 'Postpaid Meter'}</Text>
              </View>
            </View>

            {/* Confirm Details Card */}
            <View style={[styles.confirmCard, { backgroundColor: themeColors.card, borderColor: themeColors.border || '#E5E5EA' }]}>
              <Text style={[styles.confirmTitle, { color: themeColors.heading }]}>Confirm Details</Text>
              <Text style={[styles.confirmSubtitle, { color: themeColors.subheading }]}>Please verify the recipient information</Text>

              <View style={styles.confirmRows}>
                {[
                  { label: 'Customer Name', value: customerInfo.customerName || customerInfo.name || '—' },
                  { label: 'Provider',      value: selectedDisco?.shortName || disco.toUpperCase() },
                  { label: 'Meter Number',  value: meterNumber },
                  { label: 'Meter Type',    value: meterType === 'prepaid' ? 'Prepaid' : 'Postpaid' },
                  ...(customerInfo.address ? [{ label: 'Address', value: customerInfo.address }] : []),
                ].map((row) => (
                  <View key={row.label} style={[styles.confirmRow, { borderBottomColor: themeColors.border || '#F0F0F0' }]}>
                    <Text style={[styles.confirmRowLabel, { color: themeColors.subheading }]}>{row.label}</Text>
                    <Text style={[styles.confirmRowValue, { color: themeColors.heading }]} numberOfLines={1}>{row.value}</Text>
                  </View>
                ))}
                <View style={styles.confirmRow}>
                  <Text style={[styles.confirmRowLabel, { color: themeColors.subheading }]}>Total Amount</Text>
                  <Text style={[styles.confirmAmount, { color: '#14B8A6' }]}>{formatCurrency(parsedAmount, 'NGN')}</Text>
                </View>
              </View>

              {/* Pay Now */}
              <TouchableOpacity
                style={[styles.payNowBtn, { opacity: payment.step === 'processing' ? 0.7 : 1 }]}
                onPress={handlePayNow}
                disabled={payment.step === 'processing'}
                activeOpacity={0.85}
              >
                <Text style={styles.payNowText}>
                  {payment.step === 'processing' ? 'Processing…' : 'Pay Now  💡'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelLink} onPress={() => { setUiStep('form'); setCustomerInfo(null); payment.handleCancelPayment(); }}>
                <Text style={[styles.cancelText, { color: themeColors.subheading }]}>Cancel Transaction</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Errors */}
        {payment.flowError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text style={styles.errorText}>{payment.flowError}</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <PinSetupModal
        visible={payment.showPinSetupModal}
        serviceName="Electricity Bill"
        paymentAmount={parsedAmount}
        onCreatePin={payment.handleCreatePin}
        onCancel={payment.handleCancelPinSetup}
        isDarkMode={isDarkMode}
      />

      <ConfirmationModal
        visible={payment.step === 'confirm'}
        onClose={payment.handleCancelPayment}
        onConfirm={payment.confirmPayment}
        amount={parsedAmount}
        serviceName="Electricity"
        providerName={selectedDisco?.label || disco}
        recipient={meterNumber}
        recipientLabel="Meter Number"
        walletBalance={walletBalance}
        additionalDetails={[
          { label: 'Customer Name', value: customerInfo?.customerName || customerInfo?.name || 'N/A' },
          { label: 'Meter Type',    value: meterType === 'prepaid' ? 'Prepaid' : 'Postpaid' },
          { label: 'DISCO',         value: selectedDisco?.shortName || disco },
        ]}
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
        subtitle={`Confirm payment of ${formatCurrency(parsedAmount, 'NGN')}`}
      />

      <ResultModal
        visible={payment.step === 'result'}
        onClose={() => { payment.resetFlow(); resetAll(); }}
        type={payment.result ? 'success' : 'error'}
        title={payment.result ? 'Payment Successful!' : 'Payment Failed'}
        message={
          payment.result
            ? `Your electricity payment of ${formatCurrency(parsedAmount, 'NGN')} for meter ${meterNumber} was successful.${payment.result?.data?.purchasedCode ? `\n\nToken: ${payment.result.data.purchasedCode}` : ''}`
            : payment.flowError || 'Your electricity payment could not be completed. Please try again.'
        }
        primaryAction={{ label: 'View Details', onPress: handleTransactionComplete }}
        secondaryAction={{ label: 'Done', onPress: () => { payment.resetFlow(); resetAll(); } }}
      />

      <LoadingOverlay visible={payment.step === 'processing'} message="Processing your payment..." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  historyBtn: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 48 },

  sectionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  fieldError:   { fontSize: 12, color: '#EF4444', marginTop: 4, marginLeft: 2 },

  // Provider horizontal scroll
  providerScroll: { gap: 10, paddingBottom: 4 },
  providerCard: {
    width: 90, alignItems: 'center', paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, gap: 6,
  },
  providerLogo:  { width: 40, height: 40 },
  providerLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  // Input
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  nairaPrefix: { fontSize: 17, fontWeight: '600' },
  inputText:   { flex: 1, fontSize: 16, fontWeight: '500' },

  // Meter type toggle
  meterTypeRow: { flexDirection: 'row', gap: 12 },
  meterTypeBtn: {
    flex: 1, paddingVertical: 14,
    borderRadius: 12, alignItems: 'center',
  },
  meterTypeBtnText: { fontSize: 15 },

  // Quick amounts
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  quickChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  quickChipText: { fontSize: 13, fontWeight: '600' },

  // Verify button
  verifyBtn: {
    paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  verifyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Provider badge (step 2)
  providerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12,
  },
  providerBadgeLogo: { width: 44, height: 44 },
  providerBadgeName: { fontSize: 16, fontWeight: '700' },
  providerBadgeSub:  { fontSize: 12 },

  // Confirm card
  confirmCard: {
    borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 16,
  },
  confirmTitle:    { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  confirmSubtitle: { fontSize: 13, marginBottom: 20 },
  confirmRows:     {},
  confirmRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  confirmRowLabel: { fontSize: 14, flex: 1 },
  confirmRowValue: { fontSize: 14, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  confirmAmount:   { fontSize: 20, fontWeight: '800' },

  // Pay Now
  payNowBtn: {
    backgroundColor: '#14B8A6', paddingVertical: 16,
    borderRadius: 12, alignItems: 'center', marginTop: 20,
  },
  payNowText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cancelLink: { alignItems: 'center', marginTop: 14, paddingBottom: 4 },
  cancelText: { fontSize: 14, fontWeight: '500' },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEE2E2', padding: 12, borderRadius: 10, marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: '#EF4444', fontWeight: '500' },
});
