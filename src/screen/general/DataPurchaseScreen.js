

// src/screen/DataPurchaseScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Shared Components
import {
  ScreenHeader,
  TabSelector,
  PayButton,
  ConfirmationModal,
  PinModal,
  ResultModal,
  LoadingOverlay,
  EmptyState,
} from 'component/SHARED';

// Custom Components
import PhoneInput from 'component/SHARED/INPUT/phoneInput';
import { useServicePayment } from 'HOOKS/UseServicePayment';
import PinSetupModal from 'component/PinSetUpModal';
import { useWallet } from 'context/WalletContext';

// Constants & Utils
import { NETWORK_PROVIDERS } from 'CONSTANT/providerConstant';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { StatusBarComponent } from 'component/StatusBar';
import { getDataPlans, purchaseData } from 'AuthFunction/paymentService';

const { width } = Dimensions.get('window');

/**
 * Utility: Remove amount prefix from plan name
 * Transforms "N1000 1.5GB - 30 days" → "1.5GB - 30 days"
 */
const cleanPlanName = (name) => {
  if (!name) return '';
  return name.replace(/^[N₦]\d+(?:\.\d{2})?\s+/, '').trim();
};

/**
 * Enhanced Data Plan Card Component (Memoized)
 */
const DataPlanCard = React.memo(({ plan, onPress, themeColors, isSelected, providerLogo }) => (
  <TouchableOpacity
    style={[
      styles.planCard,
      { backgroundColor: themeColors.card },
      isSelected && styles.planCardSelected,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityLabel={`${plan.name} data plan`}
    accessibilityRole="button"
  >
    {/* Selection Indicator */}
    {isSelected && (
      <LinearGradient
        colors={['#667EEA', '#764BA2']}
        style={styles.selectionIndicator}
      />
    )}

    {/* Header with logo + plan name */}
    <View style={styles.planHeader}>
      <View style={styles.headerLeft}>
        {providerLogo && (
          <View style={styles.logoContainer}>
            <Image source={providerLogo} style={styles.providerLogo} />
          </View>
        )}
        <View style={styles.planNameContainer}>
          <Text 
            style={[styles.planName, { color: themeColors.heading }]}
            numberOfLines={1}
          >
            {cleanPlanName(plan.name)}
          </Text>
          {plan.validity && (
            <View style={styles.validityRow}>
              <Ionicons name="time-outline" size={14} color={themeColors.subtext} />
              <Text style={[styles.planValidity, { color: themeColors.subtext }]}>
                {plan.validity}
              </Text>
            </View>
          )}
        </View>
      </View>

      {isSelected && (
        <View style={styles.selectedIconContainer}>
          <LinearGradient
            colors={['#667EEA', '#764BA2']}
            style={styles.selectedIcon}
          >
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </LinearGradient>
        </View>
      )}
    </View>

    {/* Plan details */}
    <View style={styles.planDetails}>
      <View style={styles.planInfo}>
        <View style={styles.priceRow}>
          <Text style={[styles.planPrice, { color: '#667EEA' }]}>
            {formatCurrency(Number(plan.userPays ?? plan.variation_amount), 'NGN')}
          </Text>

          {plan.name.toLowerCase().includes('oneoff') && (
            <View style={styles.inlineBadge}>
              <LinearGradient
                colors={['#F093FB', '#F5576C']}
                style={styles.badgeGradient}
              >
                <Text style={styles.inlineBadgeText}>One-Time</Text>
              </LinearGradient>
            </View>
          )}
        </View>

        {plan.allowance && (
          <View style={styles.allowanceRow}>
            <Ionicons name="download-outline" size={16} color={themeColors.subheading} />
            <Text style={[styles.planData, { color: themeColors.subheading }]}>
              {plan.allowance}
            </Text>
          </View>
        )}
      </View>
    </View>

    {plan.name.toLowerCase().includes('oneoff') && (
      <View style={styles.noteContainer}>
        <Ionicons name="information-circle-outline" size={14} color="#F5576C" />
        <Text style={styles.planNote}>
          No auto renewal. To be renewed manually.
        </Text>
      </View>
    )}
  </TouchableOpacity>
));

/**
 * Enhanced Data Purchase Screen - Refactored with Unified Payment System
 */
export default function DataPurchaseScreen({ navigation, route }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { wallet, refreshWallet } = useWallet();

  // Local State
  const [selectedTab, setSelectedTab] = useState('Local');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // ========================================
  // VALIDATION FUNCTION
  // ========================================
  const validateDataPayment = useCallback((paymentData) => {
    console.log('🔍 Validating data payment:', paymentData);
    
    const errors = {};

    const cleanPhone = (paymentData.phoneNumber || '').replace(/\s/g, '');
    const phoneRegex = /^0\d{10}$/;
    
    if (!cleanPhone) {
      errors.phoneNumber = 'Phone number is required';
    } else if (cleanPhone.length !== 11) {
      errors.phoneNumber = 'Phone number must be 11 digits';
    } else if (!phoneRegex.test(cleanPhone)) {
      errors.phoneNumber = 'Invalid Nigerian phone number';
    }

    if (!paymentData.network) {
      errors.provider = 'Please select a network provider';
    }

    if (!paymentData.planId) {
      errors.planId = 'Please select a data plan';
    }

    const amountToValidate = paymentData.planAmount || paymentData.amount;
    if (!amountToValidate || amountToValidate < 50) {
      errors.amount = 'Invalid plan amount';
    }

    const isValid = Object.keys(errors).length === 0;
    console.log('✅ Validation result:', { isValid, errors });
    setValidationErrors(errors);

    return {
      isValid,
      errors,
    };
  }, []);

  // UNIFIED PAYMENT HOOK
  const payment = useServicePayment({
    serviceName: 'Data',
    validatePayment: validateDataPayment,
    executePurchase: async (pin, paymentData) => {
      return await purchaseData(pin, paymentData);
    },
    navigation,
    route,
  });

  // ========================================
  // RESTORE FORM DATA AFTER PIN SETUP
  // ========================================
  useEffect(() => {
    payment.restoreFormData((data) => {
      console.log('📝 Restoring data purchase form:', data);
      setPhoneNumber(data.phoneNumber);
      setProvider(data.provider);
      setSelectedPlan(data.selectedPlan);
    });
  }, [payment.pendingPaymentData]);

  useEffect(() => {
    if (provider) {
      loadDataPlans();
    } else {
      setPlans([]);
    }
  }, [provider]);
  
  const loadDataPlans = async () => {
    if (!provider) {
      setPlans([]);
      return;
    }
  
    try {
      setLoadingPlans(true);
      const fetchedPlans = await getDataPlans(provider);
      setPlans(fetchedPlans);
    } catch (error) {
      console.error('❌ Failed to load plans:', error);
      setPlans([]);
      Alert.alert('Error', 'Failed to load data plans. Please try again.');
    } finally {
      setLoadingPlans(false);
    }
  };

  // ========================================
  // INITIAL WALLET LOAD
  // ========================================
  useEffect(() => {
    refreshWallet();
  }, []);

  // ========================================
  // HANDLERS
  // ========================================
  const handlePlanSelect = useCallback((plan) => {
    setSelectedPlan(plan);
    setValidationErrors({});
  }, []);

  const handleBuyData = useCallback(() => {
    if (!selectedPlan) {
      setValidationErrors({ planId: 'Please select a data plan' });
      return;
    }

    setValidationErrors({});
    const cleanPhone = phoneNumber.replace(/\s/g, '');

    const paymentData = {
      phoneNumber: cleanPhone,
      network: provider, 
      planId: selectedPlan.variation_code,
      planAmount: parseFloat(selectedPlan.variation_amount),
      selectedPlan,
    };

    payment.initiatePayment(paymentData);
  }, [phoneNumber, provider, selectedPlan, payment]);

  const handleTransactionComplete = useCallback(() => {
    payment.handleTransactionComplete(payment.result?.reference);
  }, [payment]);

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  const getProviderLogo = useCallback(() => {
    return NETWORK_PROVIDERS.find(p => p.value === provider)?.logo;
  }, [provider]);

  const getProviderName = useCallback(() => {
    return NETWORK_PROVIDERS.find(p => p.value === provider)?.label;
  }, [provider]);

  // ========================================
  // TABS CONFIGURATION
  // ========================================
  const tabs = [
    { label: 'Local', value: 'Local' },
    { label: 'International', value: 'International', disabled: true },
  ];

  // ========================================
  // LOADING STATE
  // ========================================
  if (wallet?.isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ScreenHeader title="Data" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667EEA" />
          <Text style={[styles.loadingText, { color: themeColors.heading }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ========================================
  // MAIN RENDER
  // ========================================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={isDarkMode ? ['#1a1a2e', '#16213e'] : ['#667EEA', '#764BA2']}
        style={styles.headerGradient}
      >
        <ScreenHeader
          title="Data Bundle"
          onBackPress={() => navigation.goBack()}
          rightText="History"
          onRightPress={() => navigation.navigate('Orders')}
          textColor="#FFFFFF"
          iconColor="#FFFFFF"
        />
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: selectedPlan ? 300 : 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet Balance Card */}
        <LinearGradient
          colors={['#667EEA', '#764BA2']}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.balanceContent}>
            <View style={styles.balanceLeft}>
              <Text style={styles.balanceLabel}>Wallet Balance</Text>
              <Text style={styles.balanceAmount}>
                {formatCurrency(wallet?.user?.walletBalance || 0, 'NGN')}
              </Text>
            </View>
            <View style={styles.balanceIcon}>
              <Ionicons name="wallet" size={32} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.section}>
          <TabSelector
            tabs={tabs}
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
          />
        </View>

        {/* Provider Selection Card */}
        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <LinearGradient
                colors={['#667EEA', '#764BA2']}
                style={styles.cardIcon}
              >
                <Ionicons name="business" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.cardTitle, { color: themeColors.heading }]}>
                Network Provider
              </Text>
            </View>
            {validationErrors.provider && (
              <View style={styles.errorBadge}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
              </View>
            )}
          </View>
          
          <View style={styles.providerGrid}>
            {NETWORK_PROVIDERS.map((p) => {
              const isSelected = provider === p.value;
              return (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.providerCell,
                    { backgroundColor: isSelected ? p.color + '22' : (isDarkMode ? '#2a2a3e' : '#F3F4F6') },
                    isSelected && { borderColor: p.color },
                  ]}
                  onPress={() => setProvider(p.value)}
                  activeOpacity={0.75}
                >
                  <Image source={p.logo} style={styles.providerCellLogo} resizeMode="contain" />
                  <Text style={[styles.providerCellLabel, { color: isSelected ? p.color : themeColors.subheading }]}>
                    {p.label}
                  </Text>
                  {isSelected && (
                    <View style={[styles.providerCheck, { backgroundColor: p.color }]}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          {validationErrors.provider && (
            <Text style={styles.providerError}>{validationErrors.provider}</Text>
          )}
        </View>

        {/* Phone Number Input Card */}
        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <LinearGradient
                colors={['#F093FB', '#F5576C']}
                style={styles.cardIcon}
              >
                <Ionicons name="call" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.cardTitle, { color: themeColors.heading }]}>
                Phone Number
              </Text>
            </View>
            {validationErrors.phoneNumber && (
              <View style={styles.errorBadge}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
              </View>
            )}
          </View>

          <PhoneInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            onNetworkDetected={setProvider}
            placeholder="08XX-XXX-XXXX"
            label=""
            error={validationErrors.phoneNumber}
          />
        </View>

        {/* Data Plans */}
        {provider && (
          <>
            <View style={styles.plansHeaderContainer}>
              <View style={styles.cardTitleContainer}>
                <LinearGradient
                  colors={['#4FACFE', '#00F2FE']}
                  style={styles.cardIcon}
                >
                  <Ionicons name="grid" size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.cardTitle, { color: themeColors.heading }]}>
                  Available Plans
                </Text>
              </View>
              {plans.length > 0 && (
                <View style={styles.planCountBadge}>
                  <Text style={styles.planCountText}>{plans.length}</Text>
                </View>
              )}
            </View>

            {loadingPlans ? (
              <View style={styles.loadingPlans}>
                <ActivityIndicator size="large" color="#667EEA" />
                <Text style={[styles.loadingText, { color: themeColors.heading }]}>
                  Loading plans...
                </Text>
              </View>
            ) : plans.length > 0 ? (
              <View style={styles.plansContainer}>
                {plans.map((plan) => (
                  <DataPlanCard
                    key={plan.variation_code}
                    plan={plan}
                    onPress={() => handlePlanSelect(plan)}
                    themeColors={themeColors}
                    isSelected={selectedPlan?.variation_code === plan.variation_code}
                    providerLogo={getProviderLogo()}
                  />
                ))}
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: themeColors.card }]}>
                <EmptyState
                  icon="file-tray-outline"
                  title="No Data Plans"
                  message="No data plans available for this provider"
                />
              </View>
            )}
          </>
        )}

        {/* Error Display */}
        {validationErrors.planId && (
          <View style={styles.errorContainer}>
            <LinearGradient
              colors={['#FEE2E2', '#FECACA']}
              style={styles.errorGradient}
            >
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.errorText}>
                {validationErrors.planId}
              </Text>
            </LinearGradient>
          </View>
        )}

        {payment.flowError && (
          <View style={styles.errorContainer}>
            <LinearGradient
              colors={['#FEE2E2', '#FECACA']}
              style={styles.errorGradient}
            >
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.errorText}>
                {payment.flowError}
              </Text>
            </LinearGradient>
          </View>
        )}
      </ScrollView>

      {/* Sticky Buy Button with Enhanced Design */}
      {selectedPlan && (
        <View 
          style={[
            styles.stickyFooter,
            { bottom: insets.bottom + 16 },
          ]}
        >
          <LinearGradient
            colors={isDarkMode 
              ? ['rgba(26, 26, 46, 0.98)', 'rgba(22, 33, 62, 0.98)']
              : ['rgba(255, 255, 255, 0.98)', 'rgba(249, 250, 251, 0.98)']}
            style={styles.footerGradient}
          >
            <View style={styles.footerContent}>
              <View style={styles.selectedPlanInfo}>
                <Text style={[styles.footerLabel, { color: themeColors.subheading }]}>
                  Selected Plan
                </Text>
                <Text 
                  style={[styles.footerPlan, { color: themeColors.heading }]}
                  numberOfLines={1}
                >
                  {cleanPlanName(selectedPlan.name)}
                </Text>
                <View style={styles.footerPriceRow}>
                  <Text style={styles.footerPrice}>
                    {formatCurrency(Number(selectedPlan.userPays ?? selectedPlan.variation_amount), 'NGN')}
                  </Text>
                  {selectedPlan.validity && (
                    <View style={styles.footerValidityBadge}>
                      <Ionicons name="time-outline" size={12} color="#667EEA" />
                      <Text style={styles.footerValidityText}>
                        {selectedPlan.validity}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.buyButtonContainer,
                payment.step === 'processing' && styles.buyButtonDisabled
              ]}
              onPress={handleBuyData}
              disabled={payment.step === 'processing'}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  payment.step === 'processing'
                    ? ['#9CA3AF', '#6B7280']
                    : ['#667EEA', '#764BA2']
                }
                style={styles.buyButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {payment.step === 'processing' ? (
                  <Text style={styles.buyButtonText}>Processing...</Text>
                ) : (
                  <>
                    <Ionicons name="cart" size={22} color="#FFFFFF" />
                    <Text style={styles.buyButtonText}>Buy Now</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* ========================================
          MODALS - Using Unified System
          ======================================== */}

      {/* PIN Setup Modal */}
      <PinSetupModal
        visible={payment.showPinSetupModal}
        serviceName="Data Bundle"
        paymentAmount={selectedPlan?.variation_amount}
        onCreatePin={payment.handleCreatePin}
        onCancel={payment.handleCancelPinSetup}
        isDarkMode={isDarkMode}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={payment.step === 'confirm'}
        onClose={payment.handleCancelPayment}
        onConfirm={payment.confirmPayment}
        amount={Number(selectedPlan?.userPays ?? selectedPlan?.variation_amount ?? 0)}
        serviceName={`Data - ${cleanPlanName(selectedPlan?.name || '')}`}
        providerLogo={getProviderLogo()}
        providerName={getProviderName()}
        recipient={phoneNumber.replace(/\s/g, '')}
        recipientLabel="Phone Number"
        walletBalance={wallet?.user?.walletBalance}
        additionalDetails={[
          { label: 'Data Plan',        value: cleanPlanName(selectedPlan?.name || '') },
          { label: 'Validity',         value: selectedPlan?.validity || 'N/A' },
          ...(selectedPlan?.convenienceFee
            ? [{ label: 'Convenience Fee', value: formatCurrency(Number(selectedPlan.convenienceFee), 'NGN') }]
            : []),
        ]}
        loading={false}
      />

      {/* PIN Input Modal */}
      <PinModal
        visible={payment.step === 'pin'}
        onClose={payment.handleCancelPayment}
        onSubmit={(enteredPin) => payment.submitPayment(enteredPin)}
        onForgotPin={payment.handleForgotPin}
        loading={payment.step === 'processing'}
        error={payment.pinError}
        title="Enter Transaction PIN"
        subtitle={`Confirm purchase of ${cleanPlanName(selectedPlan?.name || 'data plan')}`}
      />

      {/* Success/Error Result Modal */}
      <ResultModal
        visible={payment.step === 'result'}
        onClose={payment.resetFlow}
        type={payment.result ? 'success' : 'error'}
        title={payment.result ? 'Purchase Successful!' : 'Purchase Failed'}
        message={
          payment.result
            ? `Your data purchase of ${cleanPlanName(selectedPlan?.name)} to ${phoneNumber.replace(/\s/g, '')} was successful.`
            : 'Your data purchase could not be completed. Please try again.'
        }
        primaryAction={{
          label: 'View Details',
          onPress: handleTransactionComplete,
        }}
        secondaryAction={{
          label: 'Done',
          onPress: payment.resetFlow,
        }}
      />

      {/* Processing Overlay */}
      <LoadingOverlay
        visible={payment.step === 'processing'}
        message="Processing your purchase..."
      />
    </SafeAreaView>
  );
}

// ========================================
// STYLES
// ========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  balanceCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLeft: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  balanceIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plansHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  planCountBadge: {
    backgroundColor: '#667EEA15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  planCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#667EEA',
  },
  loadingPlans: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  plansContainer: {
    marginBottom: 20,
  },
  planCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  planCardSelected: {
    shadowColor: '#667EEA',
    shadowOpacity: 0.3,
    elevation: 6,
  },
  selectionIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  providerLogo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  planNameContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 20,
  },
  validityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  planValidity: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectedIconContainer: {
    marginLeft: 8,
  },
  selectedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  planDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planInfo: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  inlineBadge: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  badgeGradient: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  inlineBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  allowanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planData: {
    fontSize: 14,
    fontWeight: '600',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  planNote: {
    fontSize: 11,
    fontWeight: '500',
    color: '#F5576C',
    flex: 1,
  },
  errorContainer: {
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  errorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  stickyFooter: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  footerGradient: {
    padding: 20,
  },
  footerContent: {
    marginBottom: 16,
  },
  selectedPlanInfo: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  footerPlan: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  footerPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#667EEA',
    letterSpacing: 0.5,
  },
  footerValidityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#667EEA15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  footerValidityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667EEA',
  },
  buyButtonContainer: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  buyButtonDisabled: {
    opacity: 0.6,
  },
  buyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  providerCell: {
    width: (width - 32 - 40 - 10) / 2,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  providerCellLogo: {
    width: 34,
    height: 34,
    marginBottom: 6,
  },
  providerCellLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  providerCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerError: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 8,
  },
});