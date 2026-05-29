// src/screen/TVSubscriptionScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ConfirmationModal,
  PinModal,
  ResultModal,
  LoadingOverlay,
} from 'component/SHARED';
import PinSetupModal from 'component/PinSetUpModal';
import { useServicePayment } from 'HOOKS/UseServicePayment';
import { useWallet } from 'context/WalletContext';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { getTVBouquets, purchaseTVSubscription, renewTVSubscription, verifySmartcard } from 'AuthFunction/paymentService';
import { customImages } from 'constants/serviceImages';
import { StatusBarComponent } from 'component/StatusBar';

const TV_CONSTANTS = { LIMITS: { MIN_AMOUNT: 1000, MAX_AMOUNT: 100000 } };

const TV_PROVIDERS = [
  { label: 'DStv',      value: 'dstv',      logo: customImages.Dstv,      requiresSmartcard: true  },
  { label: 'GOtv',      value: 'gotv',      logo: customImages.Gotv,      requiresSmartcard: true  },
  { label: 'Startimes', value: 'startimes', logo: customImages.Startimes, requiresSmartcard: true  },
  { label: 'Showmax',   value: 'showmax',   logo: customImages.Showmax,   requiresSmartcard: false },
];

const cleanBouquetName = (bouquet) => {
  if (!bouquet) return '';
  let name = bouquet.name || bouquet.planName || '';
  const price = parseFloat(bouquet.variation_amount || 0);
  const fmt = price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  [` N${fmt}`, ` - ${fmt} Naira - `, ` - N${fmt} - `, ` - ${fmt} - `, ` - N${fmt}`, ` - ${fmt}`]
    .forEach(p => { name = name.replace(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), ''); });
  return name.trim();
};

export default function TVSubscriptionScreen({ navigation, route }) {
  const isDarkMode  = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const insets      = useSafeAreaInsets();
  const { wallet, refreshWallet } = useWallet();

  // ── State ──────────────────────────────────────────────────────────────────
  const [provider,          setProvider]         = useState('');
  const [smartcardNumber,   setSmartcardNumber]  = useState('');
  const [bouquets,          setBouquets]         = useState([]);
  const [selectedBouquet,   setSelectedBouquet]  = useState(null);
  const [customerData,      setCustomerData]     = useState(null);
  const [subscriptionType,  setSubscriptionType] = useState('change');
  const [isVerifying,       setIsVerifying]      = useState(false);
  const [isLoadingBouquets, setIsLoadingBouquets] = useState(false);
  const [validationErrors,  setValidationErrors] = useState({});
  const [showPlanList,      setShowPlanList]     = useState(false);
  // uiStep: 'form' → 'confirm_details' (after verification)
  const [uiStep,            setUiStep]           = useState('form');

  // ── Load bouquets when provider changes ───────────────────────────────────
  useEffect(() => {
    if (provider) { fetchBouquets(); }
    else { setBouquets([]); setSelectedBouquet(null); setCustomerData(null); setUiStep('form'); }
  }, [provider]);

  const fetchBouquets = async () => {
    setIsLoadingBouquets(true);
    setValidationErrors({});
    try {
      const response = await getTVBouquets(provider);
      if (response.success) setBouquets(response.data.bouquets || []);
      else throw new Error(response.message || 'Failed to load bouquets');
    } catch (error) {
      setValidationErrors({ provider: 'Failed to load packages. Please try again.' });
    } finally {
      setIsLoadingBouquets(false);
    }
  };

  // ── Smartcard verification ─────────────────────────────────────────────────
  const handleVerifyAccount = async () => {
    const providerInfo = TV_PROVIDERS.find(p => p.value === provider);
    if (!provider) { setValidationErrors({ provider: 'Please select a TV provider first' }); return; }

    // Showmax — no smartcard needed
    if (providerInfo && !providerInfo.requiresSmartcard) {
      setCustomerData({ customerName: 'Showmax Customer', smartcardNumber: smartcardNumber || 'N/A', currentBouquet: null });
      setUiStep('confirm_details');
      return;
    }

    if (!smartcardNumber || smartcardNumber.length < 10) {
      setValidationErrors({ smartcard: 'Enter a valid smartcard number (10-11 digits)' });
      return;
    }
    if (!selectedBouquet) {
      setValidationErrors({ bouquet: 'Please select a subscription package' });
      return;
    }

    try {
      setIsVerifying(true);
      const response = await verifySmartcard(smartcardNumber, provider, selectedBouquet?.variation_code);
      if (response.success) {
        setCustomerData(response.data);
        setUiStep('confirm_details');  // move to confirm step — no Alert
      } else {
        throw new Error(response.message || 'Verification failed');
      }
    } catch (error) {
      setValidationErrors({ smartcard: error.message || 'Verification failed' });
    } finally {
      setIsVerifying(false);
    }
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateTVPayment = useCallback((paymentData) => {
    const errors = {};
    const clean = (paymentData.smartcardNumber || '').replace(/\s/g, '');
    if (!clean || clean.length < 10)     errors.smartcard = 'Invalid smartcard number';
    if (!paymentData.provider)           errors.provider  = 'Please select a TV provider';
    if (!paymentData.customerData)       errors.smartcard = 'Please verify smartcard first';
    if (paymentData.subscriptionType === 'change' && !paymentData.variation_code)
      errors.bouquet = 'Please select a bouquet';
    const amt = paymentData.amount;
    if (!amt || amt < TV_CONSTANTS.LIMITS.MIN_AMOUNT)
      errors.amount = `Minimum amount is ${formatCurrency(TV_CONSTANTS.LIMITS.MIN_AMOUNT, 'NGN')}`;
    if (amt > TV_CONSTANTS.LIMITS.MAX_AMOUNT)
      errors.amount = `Maximum amount is ${formatCurrency(TV_CONSTANTS.LIMITS.MAX_AMOUNT, 'NGN')}`;
    const isValid = Object.keys(errors).length === 0;
    setValidationErrors(errors);
    return { isValid, errors };
  }, []);

  // ── Execute purchase ───────────────────────────────────────────────────────
  const executeTVPurchase = useCallback(async (pin, paymentData) => {
    const userPhone = wallet?.user?.phone || wallet?.user?.phoneNumber || '';
    if (paymentData.subscriptionType === 'renew') {
      return await renewTVSubscription(pin, {
        smartcardNumber: paymentData.smartcardNumber,
        provider: paymentData.provider,
        amount: paymentData.amount,
        phone: userPhone,
      });
    }
    return await purchaseTVSubscription(pin, {
      smartcardNumber: paymentData.smartcardNumber,
      provider: paymentData.provider,
      variation_code: paymentData.variation_code,
      amount: paymentData.amount,
      phone: userPhone,
    });
  }, [wallet]);

  // ── Payment hook ───────────────────────────────────────────────────────────
  const payment = useServicePayment({
    serviceName:     'TV Subscription',
    validatePayment:  validateTVPayment,
    executePurchase:  executeTVPurchase,
    navigation,
    route,
  });

  useEffect(() => {
    payment.restoreFormData((data) => {
      setSmartcardNumber(data.smartcardNumber || '');
      setProvider(data.provider || '');
      setSelectedBouquet(data.selectedBouquet || null);
      setCustomerData(data.customerData || null);
      setSubscriptionType(data.subscriptionType || 'change');
    });
  }, [payment.pendingPaymentData]);

  useEffect(() => { refreshWallet(); }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getAmount = () => {
    if (subscriptionType === 'renew') {
      return parseFloat(customerData?.renewalAmount || customerData?.Renewal_Amount || 0) || 0;
    }
    return parseFloat(selectedBouquet?.variation_amount || selectedBouquet?.fixedPrice || 0) || 0;
  };

  const getDisplayAmount = () => {
    if (subscriptionType === 'change' && selectedBouquet)
      return parseFloat(selectedBouquet.userPays ?? selectedBouquet.variation_amount ?? 0);
    return getAmount();
  };

  const handlePayNow = useCallback(() => {
    setValidationErrors({});
    payment.initiatePayment({
      smartcardNumber: smartcardNumber.replace(/\s/g, ''),
      provider,
      variation_code: subscriptionType === 'change' ? selectedBouquet?.variation_code : undefined,
      amount: getAmount(),
      subscriptionType,
      customerData,
      selectedBouquet: subscriptionType === 'change' ? selectedBouquet : null,
    });
  }, [smartcardNumber, provider, selectedBouquet, subscriptionType, customerData, payment]);

  const handleTransactionComplete = useCallback(() => {
    setSmartcardNumber(''); setProvider(''); setSelectedBouquet(null);
    setCustomerData(null); setSubscriptionType('change'); setBouquets([]); setUiStep('form');
    payment.handleTransactionComplete(payment.result?.reference);
  }, [payment]);

  const resetAll = () => {
    setSmartcardNumber(''); setProvider(''); setSelectedBouquet(null);
    setCustomerData(null); setBouquets([]); setUiStep('form'); setValidationErrors({});
  };

  const selectedProvider = TV_PROVIDERS.find(p => p.value === provider);
  const walletBalance    = wallet?.user?.walletBalance || 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border || '#E5E5EA', paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={themeColors.heading} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.heading }]}>Cable TV</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Orders')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <View style={[styles.helpBtn, { borderColor: themeColors.border || '#E5E5EA' }]}>
            <Ionicons name="time-outline" size={18} color={themeColors.primary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Step indicator */}
      <View style={[styles.steps, { backgroundColor: themeColors.background }]}>
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, { backgroundColor: themeColors.primary }]}>
            <Text style={styles.stepNum}>1</Text>
          </View>
          <Text style={[styles.stepLabel, { color: themeColors.primary }]}>Provider</Text>
        </View>
        <View style={[styles.stepLine, { backgroundColor: uiStep === 'confirm_details' ? themeColors.primary : themeColors.border || '#E5E5EA' }]} />
        <View style={styles.stepItem}>
          <View style={[styles.stepCircle, {
            backgroundColor: uiStep === 'confirm_details' ? themeColors.primary : themeColors.card,
            borderWidth: uiStep === 'confirm_details' ? 0 : 1.5,
            borderColor: themeColors.border || '#E5E5EA',
          }]}>
            <Text style={[styles.stepNum, { color: uiStep === 'confirm_details' ? '#FFF' : themeColors.subheading }]}>2</Text>
          </View>
          <Text style={[styles.stepLabel, { color: uiStep === 'confirm_details' ? themeColors.primary : themeColors.subheading }]}>Confirm</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── STEP 1: Form ─────────────────────────────────────────────────── */}
        {uiStep === 'form' && (
          <View style={[styles.formCard, { backgroundColor: themeColors.card, borderColor: themeColors.border || '#E5E5EA' }]}>

            {/* Select Service Provider */}
            <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>Select Service Provider</Text>
            <View style={styles.providerRow}>
              {TV_PROVIDERS.map((p) => {
                const isSelected = provider === p.value;
                return (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.providerCard,
                      { backgroundColor: themeColors.background, borderColor: isSelected ? themeColors.primary : themeColors.border || '#E5E5EA' },
                      isSelected && { borderWidth: 2 },
                    ]}
                    onPress={() => { setProvider(p.value); setCustomerData(null); setSmartcardNumber(''); setSelectedBouquet(null); setUiStep('form'); }}
                    activeOpacity={0.8}
                  >
                    <Image source={p.logo} style={styles.providerLogo} resizeMode="contain" />
                    <Text style={[styles.providerLabel, { color: isSelected ? themeColors.primary : themeColors.subheading }]}>{p.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {validationErrors.provider && <Text style={styles.fieldError}>{validationErrors.provider}</Text>}

            {/* SmartCard / IUC Number */}
            <Text style={[styles.fieldLabel, { color: themeColors.heading, marginTop: 20 }]}>
              {selectedProvider?.requiresSmartcard === false ? 'Email / Phone' : 'SmartCard / IUC Number'}
            </Text>
            <View style={[styles.inputBox, { backgroundColor: themeColors.background, borderColor: validationErrors.smartcard ? '#EF4444' : themeColors.border || '#E5E5EA' }]}>
              <TextInput
                style={[styles.inputText, { color: themeColors.heading }]}
                value={smartcardNumber}
                onChangeText={(t) => {
                  setSmartcardNumber(selectedProvider?.requiresSmartcard !== false ? t.replace(/\D/g, '') : t);
                  setValidationErrors(prev => ({ ...prev, smartcard: undefined }));
                  setCustomerData(null);
                }}
                placeholder={selectedProvider?.requiresSmartcard === false ? 'Enter email or phone' : 'Enter 10-digit number'}
                placeholderTextColor={themeColors.subtext}
                keyboardType={selectedProvider?.requiresSmartcard === false ? 'email-address' : 'number-pad'}
                maxLength={selectedProvider?.requiresSmartcard !== false ? 11 : undefined}
                autoCapitalize="none"
                editable={!isVerifying}
              />
              <Ionicons name="card-outline" size={20} color={themeColors.subtext} />
            </View>
            {selectedProvider?.requiresSmartcard !== false && (
              <Text style={[styles.hintText, { color: themeColors.subtext }]}>
                <Ionicons name="information-circle-outline" size={12} /> Check the back of your decoder
              </Text>
            )}
            {validationErrors.smartcard && <Text style={styles.fieldError}>{validationErrors.smartcard}</Text>}

            {/* Subscription Package */}
            <Text style={[styles.fieldLabel, { color: themeColors.heading, marginTop: 20 }]}>Subscription Package</Text>
            {isLoadingBouquets ? (
              <View style={[styles.inputBox, { backgroundColor: themeColors.background, borderColor: themeColors.border || '#E5E5EA', justifyContent: 'center' }]}>
                <ActivityIndicator size="small" color={themeColors.primary} />
                <Text style={[styles.inputText, { color: themeColors.subtext, marginLeft: 8 }]}>Loading packages…</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.inputBox, { backgroundColor: themeColors.background, borderColor: validationErrors.bouquet ? '#EF4444' : themeColors.border || '#E5E5EA' }]}
                  onPress={() => provider && setShowPlanList(v => !v)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.inputText, { color: selectedBouquet ? themeColors.heading : themeColors.subtext, flex: 1 }]}>
                    {selectedBouquet ? cleanBouquetName(selectedBouquet) || selectedBouquet.name : 'Select a plan'}
                  </Text>
                  {selectedBouquet && (
                    <Text style={[styles.planPriceInline, { color: themeColors.primary }]}>
                      {formatCurrency(Number(selectedBouquet.userPays ?? selectedBouquet.variation_amount), 'NGN')}
                    </Text>
                  )}
                  <Ionicons name={showPlanList ? 'chevron-up' : 'chevron-down'} size={20} color={themeColors.subtext} style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                {showPlanList && bouquets.length > 0 && (
                  <View style={[styles.planDropdown, { backgroundColor: themeColors.card, borderColor: themeColors.border || '#E5E5EA' }]}>
                    {bouquets.map((b) => {
                      const isSelected = selectedBouquet?.variation_code === b.variation_code;
                      return (
                        <TouchableOpacity
                          key={b.variation_code}
                          style={[styles.planOption, { borderBottomColor: themeColors.border || '#F0F0F0' }, isSelected && { backgroundColor: `${themeColors.primary}10` }]}
                          onPress={() => { setSelectedBouquet(b); setShowPlanList(false); setValidationErrors(prev => ({ ...prev, bouquet: undefined })); }}
                        >
                          <Text style={[styles.planOptionName, { color: themeColors.heading }]} numberOfLines={1}>
                            {cleanBouquetName(b) || b.name}
                          </Text>
                          <Text style={[styles.planOptionPrice, { color: themeColors.primary }]}>
                            {formatCurrency(Number(b.userPays ?? b.variation_amount), 'NGN')}
                          </Text>
                          {isSelected && <Ionicons name="checkmark-circle" size={18} color={themeColors.primary} style={{ marginLeft: 8 }} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            )}
            {validationErrors.bouquet && <Text style={styles.fieldError}>{validationErrors.bouquet}</Text>}

            {/* Verify Account button */}
            <TouchableOpacity
              style={[styles.verifyBtn, { backgroundColor: themeColors.primary, marginTop: 24, opacity: isVerifying ? 0.7 : 1 }]}
              onPress={handleVerifyAccount}
              disabled={isVerifying}
              activeOpacity={0.85}
            >
              {isVerifying
                ? <ActivityIndicator color="#FFF" />
                : <>
                    <Text style={styles.verifyBtnText}>Verify Account</Text>
                    <Ionicons name="shield-checkmark-outline" size={20} color="#FFF" />
                  </>
              }
            </TouchableOpacity>

            {/* Instant activation hint */}
            <View style={[styles.activationHint, { backgroundColor: themeColors.background, borderColor: themeColors.border || '#E5E5EA' }]}>
              <Ionicons name="flash-outline" size={14} color={themeColors.primary} />
              <Text style={[styles.activationText, { color: themeColors.subheading }]}>Instant activation after payment</Text>
              <Ionicons name="chevron-forward" size={14} color={themeColors.subtext} />
            </View>
          </View>
        )}

        {/* ── STEP 2: Confirm Details ───────────────────────────────────────── */}
        {uiStep === 'confirm_details' && customerData && (
          <View>
            {/* Summary (visible behind sheet) */}
            <View style={[styles.formCard, { backgroundColor: themeColors.card, borderColor: themeColors.border || '#E5E5EA' }]}>
              <View style={styles.providerSummaryRow}>
                {selectedProvider?.logo && <Image source={selectedProvider.logo} style={styles.providerSummaryLogo} resizeMode="contain" />}
                <View>
                  <Text style={[styles.providerSummaryName, { color: themeColors.heading }]}>{selectedProvider?.label}</Text>
                  <Text style={[styles.providerSummarySub, { color: themeColors.subheading }]}>{cleanBouquetName(selectedBouquet) || 'Subscription'}</Text>
                </View>
              </View>
            </View>

            {/* Confirm Details Card */}
            <View style={[styles.confirmCard, { backgroundColor: themeColors.card, borderColor: themeColors.border || '#E5E5EA' }]}>
              <Text style={[styles.confirmTitle, { color: themeColors.heading }]}>Confirm Details</Text>
              <Text style={[styles.confirmSubtitle, { color: themeColors.subheading }]}>Please verify the recipient information</Text>

              <View style={styles.confirmRows}>
                {[
                  { label: 'Customer Name', value: customerData.customerName || '—' },
                  { label: 'Provider',      value: selectedProvider?.label || provider },
                  { label: 'Plan',          value: cleanBouquetName(selectedBouquet) || selectedBouquet?.name || '—', color: themeColors.primary },
                  { label: 'SmartCard No',  value: smartcardNumber },
                ].map((row) => (
                  <View key={row.label} style={[styles.confirmRow, { borderBottomColor: themeColors.border || '#F0F0F0' }]}>
                    <Text style={[styles.confirmRowLabel, { color: themeColors.subheading }]}>{row.label}</Text>
                    <Text style={[styles.confirmRowValue, { color: row.color || themeColors.heading }]}>{row.value}</Text>
                  </View>
                ))}
                <View style={styles.confirmRow}>
                  <Text style={[styles.confirmRowLabel, { color: themeColors.subheading }]}>Total Amount</Text>
                  <Text style={[styles.confirmAmount, { color: '#14B8A6' }]}>{formatCurrency(getDisplayAmount(), 'NGN')}</Text>
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
                  {payment.step === 'processing' ? 'Processing…' : 'Pay Now  💳'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelLink} onPress={() => { setUiStep('form'); payment.handleCancelPayment(); }}>
                <Text style={[styles.cancelText, { color: themeColors.subheading }]}>Cancel Transaction</Text>
              </TouchableOpacity>
            </View>
          </View>
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
        serviceName="TV Subscription"
        paymentAmount={getAmount()}
        onCreatePin={payment.handleCreatePin}
        onCancel={payment.handleCancelPinSetup}
        isDarkMode={isDarkMode}
      />

      <ConfirmationModal
        visible={payment.step === 'confirm'}
        onClose={payment.handleCancelPayment}
        onConfirm={payment.confirmPayment}
        amount={getDisplayAmount()}
        serviceName="TV Subscription"
        providerName={provider.toUpperCase()}
        recipient={smartcardNumber}
        recipientLabel="Smartcard Number"
        additionalInfo={subscriptionType === 'renew' ? `Renew: ${customerData?.currentBouquet}` : `Package: ${cleanBouquetName(selectedBouquet)}`}
        additionalDetails={subscriptionType === 'change' && selectedBouquet?.convenienceFee
          ? [{ label: 'Convenience Fee', value: formatCurrency(Number(selectedBouquet.convenienceFee), 'NGN') }]
          : undefined}
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
        subtitle={`Confirm payment of ${formatCurrency(getDisplayAmount(), 'NGN')}`}
      />

      <ResultModal
        visible={payment.step === 'result'}
        onClose={() => { payment.resetFlow(); resetAll(); }}
        type={payment.result ? 'success' : 'error'}
        title={payment.result ? 'Subscription Successful!' : 'Subscription Failed'}
        message={
          payment.result
            ? `Your TV subscription of ${formatCurrency(getAmount(), 'NGN')} was successful.`
            : payment.flowError || 'Your TV subscription could not be completed. Please try again.'
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
  helpBtn: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  // Step indicator
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  stepItem:   { alignItems: 'center', gap: 4 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNum:    { fontSize: 13, fontWeight: '700', color: '#FFF' },
  stepLabel:  { fontSize: 11, fontWeight: '600' },
  stepLine:   { flex: 1, height: 2, marginHorizontal: 8, marginBottom: 14 },

  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  // Form card
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  fieldError: { fontSize: 12, color: '#EF4444', marginTop: 4, marginLeft: 2 },

  // Provider row
  providerRow: { flexDirection: 'row', gap: 8 },
  providerCard: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, gap: 6,
  },
  providerLogo:  { width: 34, height: 34 },
  providerLabel: { fontSize: 11, fontWeight: '600' },

  // Input box
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },
  inputText:        { flex: 1, fontSize: 15, fontWeight: '500' },
  planPriceInline:  { fontSize: 14, fontWeight: '700' },
  hintText:         { fontSize: 11, marginTop: 5, marginLeft: 2 },

  // Plan dropdown
  planDropdown: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  planOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  planOptionName:  { flex: 1, fontSize: 14, fontWeight: '500' },
  planOptionPrice: { fontSize: 14, fontWeight: '700' },

  // Verify button
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  verifyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Activation hint
  activationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
  },
  activationText: { flex: 1, fontSize: 12 },

  // Provider summary (step 2 top)
  providerSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  providerSummaryLogo: { width: 40, height: 40 },
  providerSummaryName: { fontSize: 16, fontWeight: '700' },
  providerSummarySub:  { fontSize: 13 },

  // Confirm card
  confirmCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  confirmTitle:    { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  confirmSubtitle: { fontSize: 13, marginBottom: 20 },
  confirmRows:     { gap: 0 },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  confirmRowLabel: { fontSize: 14 },
  confirmRowValue: { fontSize: 14, fontWeight: '600' },
  confirmAmount:   { fontSize: 20, fontWeight: '800' },

  // Pay Now
  payNowBtn: {
    backgroundColor: '#14B8A6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  payNowText:  { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cancelLink:  { alignItems: 'center', marginTop: 14, paddingBottom: 4 },
  cancelText:  { fontSize: 14, fontWeight: '500' },

  // Error box
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEE2E2', padding: 12,
    borderRadius: 10, marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: '#EF4444', fontWeight: '500' },
});
