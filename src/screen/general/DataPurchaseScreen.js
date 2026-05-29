// src/screen/DataPurchaseScreen.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Shared Components
import {
  ConfirmationModal,
  PinModal,
  ResultModal,
  LoadingOverlay,
} from 'component/SHARED';
import PhoneInput from 'component/SHARED/INPUT/phoneInput';
import { useServicePayment } from 'HOOKS/UseServicePayment';
import PinSetupModal from 'component/PinSetUpModal';
import { useWallet } from 'context/WalletContext';
import { StatusBarComponent } from 'component/StatusBar';

// Constants & Utils
import { NETWORK_PROVIDERS } from 'CONSTANT/providerConstant';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { getDataPlans, purchaseData } from 'AuthFunction/paymentService';

const cleanPlanName = (name) => {
  if (!name) return '';
  return name.replace(/^[N₦]\d+(?:\.\d{2})?\s+/, '').trim();
};

const getPlanDisplayName = (plan) =>
  plan.size ? `${plan.size} Data Plan` : cleanPlanName(plan.name);

// ── Plan Card ─────────────────────────────────────────────────────────────────
const PlanCard = React.memo(({ plan, isSelected, isBestValue, onPress, themeColors }) => (
  <TouchableOpacity
    style={[
      styles.planCard,
      { backgroundColor: themeColors.card, borderColor: isSelected ? themeColors.primary : themeColors.border || '#E5E5EA' },
      isSelected && { borderColor: themeColors.primary, borderWidth: 2, backgroundColor: `${themeColors.primary}08` },
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    {/* Left icon */}
    <View style={[styles.planIcon, { backgroundColor: isSelected ? themeColors.primary : `${themeColors.primary}18` }]}>
      <Ionicons name="bar-chart" size={20} color={isSelected ? '#FFF' : themeColors.primary} />
    </View>

    {/* Info */}
    <View style={styles.planInfo}>
      <Text style={[styles.planName, { color: themeColors.heading }]}>
        {getPlanDisplayName(plan)}
      </Text>
      <Text style={[styles.planValidity, { color: themeColors.subheading }]}>
        Validity: {plan.validity || 'N/A'}
      </Text>
    </View>

    {/* Price + badge */}
    <View style={styles.planRight}>
      <Text style={[styles.planPrice, { color: themeColors.primary }]}>
        {formatCurrency(Number(plan.userPays ?? plan.variation_amount), 'NGN')}
      </Text>
      {isBestValue && (
        <View style={[styles.bestBadge, { backgroundColor: `${themeColors.primary}18` }]}>
          <Text style={[styles.bestBadgeText, { color: themeColors.primary }]}>BEST VALUE</Text>
        </View>
      )}
      {isSelected && !isBestValue && (
        <Ionicons name="checkmark-circle" size={18} color={themeColors.primary} style={{ marginTop: 4 }} />
      )}
    </View>
  </TouchableOpacity>
));

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function DataPurchaseScreen({ navigation, route }) {
  const isDarkMode  = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const insets      = useSafeAreaInsets();
  const { wallet, refreshWallet } = useWallet();

  // ── State ──────────────────────────────────────────────────────────────────
  const [phoneNumber,   setPhoneNumber]   = useState('');
  const [provider,      setProvider]      = useState('');
  const [selectedPlan,  setSelectedPlan]  = useState(null);
  const [plans,         setPlans]         = useState([]);
  const [loadingPlans,  setLoadingPlans]  = useState(false);
  const [serviceType,   setServiceType]   = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateDataPayment = useCallback((paymentData) => {
    const errors = {};
    const cleanPhone = (paymentData.phoneNumber || '').replace(/\s/g, '');
    if (!cleanPhone)                         errors.phoneNumber = 'Phone number is required';
    else if (cleanPhone.length !== 11)       errors.phoneNumber = 'Phone number must be 11 digits';
    else if (!/^0\d{10}$/.test(cleanPhone)) errors.phoneNumber = 'Invalid Nigerian phone number';
    if (!paymentData.network)  errors.provider = 'Please select a network provider';
    if (!paymentData.planId)   errors.planId   = 'Please select a data plan';
    const amt = paymentData.planAmount || paymentData.amount;
    if (!amt || amt < 50)      errors.amount   = 'Invalid plan amount';
    const isValid = Object.keys(errors).length === 0;
    setValidationErrors(errors);
    return { isValid, errors };
  }, []);

  // ── Payment hook ───────────────────────────────────────────────────────────
  const payment = useServicePayment({
    serviceName:     'Data',
    validatePayment:  validateDataPayment,
    executePurchase:  async (pin, paymentData) => purchaseData(pin, paymentData),
    navigation,
    route,
  });

  // Restore form after PIN setup
  useEffect(() => {
    payment.restoreFormData((data) => {
      setPhoneNumber(data.phoneNumber);
      setProvider(data.provider);
      setSelectedPlan(data.selectedPlan);
    });
  }, [payment.pendingPaymentData]);

  useEffect(() => {
    if (provider) loadDataPlans();
    else { setPlans([]); setSelectedPlan(null); setServiceType(''); }
  }, [provider]);

  useEffect(() => { refreshWallet(); }, []);

  const loadDataPlans = async () => {
    try {
      setLoadingPlans(true);
      setSelectedPlan(null);
      const fetchedPlans = await getDataPlans(provider);
      setPlans(fetchedPlans);
      // Auto-select first available service type
      if (fetchedPlans.length > 0) {
        const firstType = fetchedPlans[0].serviceType || '';
        setServiceType(firstType);
      }
    } catch (error) {
      console.error('❌ Failed to load plans:', error);
      setPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  // Unique service types from loaded plans (in order: SME first)
  const serviceTypes = useMemo(() => {
    const order = ['SME', 'Corporate', 'Gifting', 'Awoof'];
    const found  = [...new Set(plans.map(p => p.serviceType).filter(Boolean))];
    return order.filter(t => found.includes(t));
  }, [plans]);

  // Plans filtered by selected service type
  const filteredPlans = useMemo(() =>
    serviceType ? plans.filter(p => p.serviceType === serviceType) : plans,
  [plans, serviceType]);

  // Best value = plan with best GB-per-naira ratio in the filtered list
  const bestValueCode = useMemo(() => {
    if (filteredPlans.length === 0) return null;
    let best = null, bestRatio = 0;
    for (const p of filteredPlans) {
      const sizeMatch = (p.size || '').match(/^([\d.]+)/);
      const price     = Number(p.userPays ?? p.variation_amount) || 0;
      if (sizeMatch && price > 0) {
        const ratio = parseFloat(sizeMatch[1]) / price;
        if (ratio > bestRatio) { bestRatio = ratio; best = p.variation_code; }
      }
    }
    return best;
  }, [filteredPlans]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePlanSelect = useCallback((plan) => {
    setSelectedPlan(plan);
    setValidationErrors({});
  }, []);

  const handleBuyData = useCallback(() => {
    if (!selectedPlan) { setValidationErrors({ planId: 'Please select a data plan' }); return; }
    setValidationErrors({});
    payment.initiatePayment({
      phoneNumber:  phoneNumber.replace(/\s/g, ''),
      network:      provider,
      planId:       selectedPlan.variation_code,
      planAmount:   parseFloat(selectedPlan.variation_amount),
      selectedPlan,
    });
  }, [phoneNumber, provider, selectedPlan, payment]);

  const handleTransactionComplete = useCallback(() => {
    payment.handleTransactionComplete(payment.result?.reference);
  }, [payment]);

  const getProviderLogo = () => NETWORK_PROVIDERS.find(p => p.value === provider)?.logo;
  const getProviderName = () => NETWORK_PROVIDERS.find(p => p.value === provider)?.label;
  const walletBalance   = wallet?.user?.walletBalance || 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border || '#E5E5EA', paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={themeColors.heading} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.heading }]}>Buy Data Bundle</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Orders')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.headerRight, { color: themeColors.primary }]}>History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: selectedPlan ? 120 : 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
                onPress={() => { setProvider(p.value); setSelectedPlan(null); }}
                activeOpacity={0.8}
              >
                <Image source={p.logo} style={styles.networkLogo} resizeMode="contain" />
                <Text style={[styles.networkLabel, { color: isSelected ? p.color : themeColors.subheading }]}>{p.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {validationErrors.provider && <Text style={styles.fieldError}>{validationErrors.provider}</Text>}

        {/* Service type tabs — only when plans have multiple types */}
        {serviceTypes.length > 1 && (
          <>
            <View style={[styles.typeTabs, { backgroundColor: themeColors.card }]}>
              {serviceTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeTab, serviceType === type && { backgroundColor: themeColors.background }]}
                  onPress={() => { setServiceType(type); setSelectedPlan(null); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeTabText, { color: serviceType === type ? themeColors.primary : themeColors.subheading }, serviceType === type && { fontWeight: '700' }]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* RECIPIENT PHONE NUMBER */}
        <Text style={[styles.sectionLabel, { color: themeColors.subheading, marginTop: 20 }]}>RECIPIENT PHONE NUMBER</Text>
        <View style={[styles.fieldBox, { backgroundColor: themeColors.card, borderColor: validationErrors.phoneNumber ? '#EF4444' : themeColors.border || '#E5E5EA' }]}>
          <PhoneInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            onNetworkDetected={setProvider}
            placeholder="0801 234 5678"
            label=""
            error={null}
          />
        </View>
        {validationErrors.phoneNumber && <Text style={styles.fieldError}>{validationErrors.phoneNumber}</Text>}

        {/* AVAILABLE PLANS */}
        {provider && (
          <>
            <View style={styles.plansHeader}>
              <Text style={[styles.sectionLabel, { color: themeColors.subheading, marginBottom: 0 }]}>AVAILABLE PLANS</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
                <Text style={[styles.viewHistory, { color: themeColors.primary }]}>View History</Text>
              </TouchableOpacity>
            </View>

            {loadingPlans ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={themeColors.primary} />
                <Text style={[styles.loadingText, { color: themeColors.subheading }]}>Loading plans…</Text>
              </View>
            ) : filteredPlans.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: themeColors.card }]}>
                <Ionicons name="file-tray-outline" size={36} color={themeColors.subtext} />
                <Text style={[styles.emptyText, { color: themeColors.subheading }]}>No plans available</Text>
              </View>
            ) : (
              filteredPlans.map((plan) => (
                <PlanCard
                  key={plan.variation_code}
                  plan={plan}
                  isSelected={selectedPlan?.variation_code === plan.variation_code}
                  isBestValue={plan.variation_code === bestValueCode}
                  onPress={() => handlePlanSelect(plan)}
                  themeColors={themeColors}
                />
              ))
            )}
          </>
        )}

        {/* Errors */}
        {(validationErrors.planId || payment.flowError) && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text style={styles.errorText}>{validationErrors.planId || payment.flowError}</Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky Buy Button */}
      {(provider || selectedPlan) && (
        <View style={[styles.footer, { backgroundColor: themeColors.background, borderTopColor: themeColors.border || '#E5E5EA', paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.buyBtn, { backgroundColor: '#14B8A6', opacity: payment.step === 'processing' ? 0.7 : 1 }]}
            onPress={handleBuyData}
            disabled={payment.step === 'processing'}
            activeOpacity={0.85}
          >
            <Text style={styles.buyBtnText}>
              {payment.step === 'processing' ? 'Processing…' : 'Buy Data Now  →'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Modals (all logic unchanged) ───────────────────────────────────── */}
      <PinSetupModal
        visible={payment.showPinSetupModal}
        serviceName="Data Bundle"
        paymentAmount={selectedPlan?.variation_amount}
        onCreatePin={payment.handleCreatePin}
        onCancel={payment.handleCancelPinSetup}
        isDarkMode={isDarkMode}
      />

      <ConfirmationModal
        visible={payment.step === 'confirm'}
        onClose={payment.handleCancelPayment}
        onConfirm={payment.confirmPayment}
        amount={Number(selectedPlan?.userPays ?? selectedPlan?.variation_amount ?? 0)}
        serviceName={`Data - ${getPlanDisplayName(selectedPlan || {})}`}
        providerLogo={getProviderLogo()}
        providerName={getProviderName()}
        recipient={phoneNumber.replace(/\s/g, '')}
        recipientLabel="Phone Number"
        walletBalance={walletBalance}
        additionalDetails={[
          { label: 'Data Plan', value: getPlanDisplayName(selectedPlan || {}) },
          { label: 'Validity',  value: selectedPlan?.validity || 'N/A' },
          ...(selectedPlan?.convenienceFee
            ? [{ label: 'Convenience Fee', value: formatCurrency(Number(selectedPlan.convenienceFee), 'NGN') }]
            : []),
        ]}
        loading={false}
      />

      <PinModal
        visible={payment.step === 'pin'}
        onClose={payment.handleCancelPayment}
        onSubmit={(pin) => payment.submitPayment(pin)}
        onForgotPin={payment.handleForgotPin}
        loading={payment.step === 'processing'}
        error={payment.pinError}
        title="Enter Transaction PIN"
        subtitle={`Confirm purchase of ${getPlanDisplayName(selectedPlan || {})}`}
      />

      <ResultModal
        visible={payment.step === 'result'}
        onClose={payment.resetFlow}
        type={payment.result ? 'success' : 'error'}
        title={payment.result ? 'Purchase Successful!' : 'Purchase Failed'}
        message={
          payment.result
            ? `Your data purchase of ${getPlanDisplayName(selectedPlan || {})} to ${phoneNumber.replace(/\s/g, '')} was successful.`
            : 'Your data purchase could not be completed. Please try again.'
        }
        primaryAction={{ label: 'View Details', onPress: handleTransactionComplete }}
        secondaryAction={{ label: 'Done', onPress: payment.resetFlow }}
      />

      <LoadingOverlay visible={payment.step === 'processing'} message="Processing your purchase…" />
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
  headerRight: { fontSize: 14, fontWeight: '600' },

  scroll: { paddingHorizontal: 16, paddingTop: 20 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  // Network row
  networkRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
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

  // Service type tabs
  typeTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
    marginBottom: 4,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  typeTabText: { fontSize: 14, fontWeight: '500' },

  // Phone field
  fieldBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 2,
    marginBottom: 4,
  },

  // Plans header
  plansHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  viewHistory: { fontSize: 13, fontWeight: '600' },

  // Plan card
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  planIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  planInfo:     { flex: 1 },
  planName:     { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  planValidity: { fontSize: 12 },
  planRight:    { alignItems: 'flex-end', gap: 4 },
  planPrice:    { fontSize: 16, fontWeight: '800' },
  bestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bestBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  // Loading / empty
  loadingBox:  { paddingVertical: 48, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  emptyBox:    { padding: 32, borderRadius: 14, alignItems: 'center', gap: 10, marginBottom: 16 },
  emptyText:   { fontSize: 14 },

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

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  buyBtn: {
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
