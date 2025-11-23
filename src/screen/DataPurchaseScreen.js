
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Shared Components
import {
  ScreenHeader,
  TabSelector,
  ProviderSelector,
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
import { fetchDataPlans } from 'component/GetdataPlans';
import { PaymentService } from 'SERVICES/API/paymentService';
import { purchaseData } from 'AuthFunction/paymentService';


/**
 * Utility: Remove amount prefix from plan name
 * Transforms "N1000 1.5GB - 30 days" → "1.5GB - 30 days"
 */
const cleanPlanName = (name) => {
  if (!name) return '';
  // Remove patterns like "N1000 ", "₦2000 ", etc.
  return name.replace(/^[N₦]\d+(?:\.\d{2})?\s+/, '').trim();
};

/**
 * Data Plan Card Component (Memoized)
 */
const DataPlanCard = React.memo(({ plan, onPress, themeColors, isSelected, providerLogo }) => (
  <TouchableOpacity
    style={[
      styles.planCard,
      { 
        backgroundColor: themeColors.card,
        borderColor: isSelected ? themeColors.primary : themeColors.border,
        borderWidth: isSelected ? 2 : 1,
      },
    ]}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityLabel={`${plan.name} data plan`}
    accessibilityRole="button"
  >
    {/* Header with logo + plan name */}
    <View style={styles.planHeader}>
      <View style={styles.headerLeft}>
        {providerLogo && (
          <Image source={providerLogo} style={styles.providerLogo} />
        )}
        <Text style={[styles.planName, { color: themeColors.heading }]}>
          {cleanPlanName(plan.name)}
        </Text>
      </View>
    </View>

    {/* Plan details */}
    <View style={styles.planDetails}>
      <View style={styles.planInfo}>
        <View style={styles.priceRow}>
          <Text style={[styles.planPrice, { color: themeColors.primary }]}>
            {formatCurrency(Number(plan.variation_amount), 'NGN')}
          </Text>

          {plan.name.toLowerCase().includes('oneoff') && (
            <View style={[styles.inlineBadge, { backgroundColor: `${themeColors.primary}20` }]}>
              <Text style={[styles.inlineBadgeText, { color: themeColors.primary }]}>
                One-Time
              </Text>
            </View>
          )}
        </View>

        {plan.allowance && (
          <Text style={[styles.planData, { color: themeColors.subheading }]}>
            {plan.allowance}
          </Text>
        )}
        
        {plan.validity && (
          <Text style={[styles.planValidity, { color: themeColors.subtext }]}>
            Valid for {plan.validity}
          </Text>
        )}
      </View>

      {isSelected && (
        <View style={[styles.selectedIcon, { backgroundColor: themeColors.primary }]}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}
    </View>

    {plan.name.toLowerCase().includes('oneoff') && (
      <Text style={[styles.planNote, { color: themeColors.destructive }]}>
        No auto renewal. To be renewed manually.
      </Text>
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

    // Validate phone number with RegEx (remove whitespace first)
    const cleanPhone = (paymentData.phoneNumber || '').replace(/\s/g, '');
    const phoneRegex = /^0[7-9][0-1]\d{8}$/; // Nigerian phone number format
    
    if (!cleanPhone) {
      errors.phoneNumber = 'Phone number is required';
    } else if (cleanPhone.length !== 11) {
      errors.phoneNumber = 'Phone number must be 11 digits';
    } else if (!phoneRegex.test(cleanPhone)) {
      errors.phoneNumber = 'Invalid Nigerian phone number';
    }

    if (!paymentData.provider) {
      errors.provider = 'Please select a network provider';
    }

    if (!paymentData.planId) {
      errors.planId = 'Please select a data plan';
    }

    // Check both planAmount and amount (for compatibility with usePaymentFlow)
    const amountToValidate = paymentData.planAmount || paymentData.amount;
    if (!amountToValidate || amountToValidate < 50) {
      errors.amount = 'Invalid plan amount';
    }

    const isValid = Object.keys(errors).length === 0;
    console.log('✅ Validation result:', { isValid, errors });
    setValidationErrors(errors);

    // ✅ Return object with 'isValid' property (not 'valid')
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
      return await purchaseData(pin, paymentData); // ✅ Correct
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

  // ========================================
  // LOAD DATA PLANS WHEN PROVIDER CHANGES
  // ========================================
  useEffect(() => {
    if (!provider) {
      setPlans([]);
      return;
    }

    const loadDataPlans = async () => {
      try {
        setLoadingPlans(true);
        const fetchedPlans = await fetchDataPlans(provider);
        setPlans(fetchedPlans);
      } catch (error) {
        console.error('❌ Failed to load plans:', error);
        setPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    };

    loadDataPlans();
  }, [provider]);

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

    // Clear errors
    setValidationErrors({});

    // Clean phone number (remove whitespace)
    const cleanPhone = phoneNumber.replace(/\s/g, '');

    // Prepare payment data including the full plan object for restoration
    const paymentData = {
      phoneNumber: cleanPhone, // ✅ Clean phone number
      provider,
      planId: selectedPlan.variation_code,
      planAmount: parseFloat(selectedPlan.variation_amount), // ✅ Use planAmount instead of amount
      selectedPlan, // ✅ Store full plan for restoration
    };

    // Initiate payment (handles PIN check automatically)
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
          <ActivityIndicator size="large" color={themeColors.primary} />
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
      
      {/* Header */}
      <ScreenHeader
        title="Data"
        onBackPress={() => navigation.goBack()}
        rightText="History"
        onRightPress={() => navigation.navigate('History')}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tabs */}
        <TabSelector
          tabs={tabs}
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
        />

        {/* Provider Selection */}
        <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
          Select Network Provider
        </Text>
        <ProviderSelector
          providers={NETWORK_PROVIDERS}
          value={provider}
          onChange={setProvider}
          placeholder="Select Network"
          error={validationErrors.provider}
        />

        {/* Phone Number Input */}
        <PhoneInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          onNetworkDetected={setProvider}
          placeholder="08XX-XXX-XXXX"
          label="Recipient Phone Number"
          error={validationErrors.phoneNumber}
        />

        {/* Data Plans */}
        {provider && (
          <>
            <View style={styles.plansHeader}>
              <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
                Available Plans
              </Text>
              {plans.length > 0 && (
                <Text style={[styles.planCount, { color: themeColors.subheading }]}>
                  {plans.length} plans
                </Text>
              )}
            </View>

            {loadingPlans ? (
              <View style={styles.loadingPlans}>
                <ActivityIndicator size="large" color={themeColors.primary} />
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
              <EmptyState
                icon="file-tray-outline"
                title="No Data Plans"
                message="No data plans available for this provider"
              />
            )}
          </>
        )}

        {/* Error Display */}
        {validationErrors.planId && (
          <View style={[styles.errorContainer, { backgroundColor: `${themeColors.destructive}20` }]}>
            <Text style={[styles.errorText, { color: themeColors.destructive }]}>
              {validationErrors.planId}
            </Text>
          </View>
        )}

        {payment.flowError && (
          <View style={[styles.errorContainer, { backgroundColor: `${themeColors.destructive}20` }]}>
            <Text style={[styles.errorText, { color: themeColors.destructive }]}>
              {payment.flowError}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky Buy Button */}
      {selectedPlan && (
        <View 
          style={[
            styles.stickyFooter,
            {
              marginBottom: insets.bottom + 8,
              borderColor: themeColors.border,
            },
          ]}
        >
          <View style={styles.footerContent}>
            <View>
              <Text style={[styles.footerLabel, { color: themeColors.subheading }]}>
                Selected Plan
              </Text>
              <Text style={[styles.footerPlan, { color: themeColors.heading }]}>
                {cleanPlanName(selectedPlan.name)}
              </Text>
              <Text style={[styles.footerPrice, { color: themeColors.primary }]}>
                {formatCurrency(Number(selectedPlan.variation_amount), 'NGN')}
              </Text>
            </View>
          </View>
          <PayButton
            title="Buy Now"
            onPress={handleBuyData}
            disabled={ payment.step === 'processing'}
            loading={payment.step === 'processing'}
            style={styles.buyButton}
          />
        </View>
      )}

      {/* ========================================
          MODALS - Using Unified System
          ======================================== */}

      {/* PIN Setup Modal - NEW! */}
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
        amount={Number(selectedPlan?.variation_amount || 0)}
        serviceName={`Data - ${cleanPlanName(selectedPlan?.name || '')}`}
        providerLogo={getProviderLogo()}
        providerName={getProviderName()}
        recipient={phoneNumber.replace(/\s/g, '')} // ✅ Clean display
        recipientLabel="Phone Number"
        walletBalance={wallet?.user?.walletBalance}
        additionalDetails={[
          { label: 'Data Plan', value: cleanPlanName(selectedPlan?.name || '') },
          { label: 'Validity', value: selectedPlan?.validity || 'N/A' },
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
  },
  plansHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  planCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingPlans: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  plansContainer: {
    marginBottom: 20,
  },
  planCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerLogo: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    borderRadius: 5,
  },
  planName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  planDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planInfo: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  inlineBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  inlineBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  planData: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  planValidity: {
    fontSize: 12,
  },
  selectedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  planNote: {
    fontSize: 11,
    marginTop: 8,
    fontWeight: '500',
  },
  errorContainer: {
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    backgroundColor: '#bbd6f5ff'
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  footerPlan: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 2,
  },
  footerPrice: {
    fontSize: 25,
    fontWeight: '700',
  },
  buyButton: {
    minWidth: 120,
    marginTop: 20,
  },
});
