// src/screen/DataPurchaseScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import AmountInput from 'component/SHARED/INPUT/amountInput';
import PhoneInput from 'component/SHARED/INPUT/phoneInput';
import { DATA_CONSTANTS } from 'CONSTANT/SERVICES/dataServices';
import { NETWORK_PROVIDERS } from 'CONSTANT/providerConstant';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { useWallet } from 'context/WalletContext';
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

// Custom Hooks
import {
  useDataPurchase,
  useTransactionPin,
  usePaymentFlow,
}  from 'HOOKS';
import { StatusBarComponent } from 'component/StatusBar';
import { fetchDataPlans } from 'component/GetdataPlans';

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
          <Image
            source={providerLogo}
            style={styles.providerLogo}
          />
        )}
        <Text style={[styles.planName, { color: themeColors.heading }]}>
          {plan.name}
        </Text>
      </View>

      {plan.name.toLowerCase().includes('oneoff') && (
        <View style={[styles.badge, { backgroundColor: `${themeColors.primary}15` }]}>
          <Text style={[styles.badgeText, { color: themeColors.primary }]}>
            One-Time
          </Text>
        </View>
      )}
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
 * Enhanced Data Purchase Screen
 */
export default function DataPurchaseScreen({ navigation }) {
  const [plans, setPlans] = useState([]);
const [loadingPlans, setLoadingPlans] = useState(false);
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { wallet, updateTransactionPinStatus } = useWallet();

  // State
  const [selectedTab, setSelectedTab] = useState('Local');
    const insets = useSafeAreaInsets();

  // Custom Hooks
  const {
    phoneNumber,
    setPhoneNumber,
    provider,
    setProvider,
    selectedPlan,
    setSelectedPlan,
    dataPlans,
    isLoadingPlans,
    isLoading: isPurchasing,
    error: purchaseError,
    validatePurchase,
    purchaseData,
    clearError: clearPurchaseError,
  } = useDataPurchase();

  const {
    pin,
    setPin,
    pinError,
    isVerifying,
    resetPin,
    clearError: clearPinError,
  } = useTransactionPin();

  const {
    step,
    error: flowError,
    result,
    startPayment,
    confirmPayment,
    processPayment,
    cancelPayment,
    resetFlow,
  } = usePaymentFlow();

  useEffect(() => {
    if (!provider) return;
  
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
  
  //   loadDataPlans();
  }, [provider]);

  // Tabs configuration
  const tabs = [
    { label: 'Local', value: 'Local' },
    { label: 'International', value: 'International', disabled: true },
  ];

  /**
   * Handle plan selection
   */
  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    clearPurchaseError();
  };

  /**
   * Start payment flow
   */
  const handleBuyData = () => {
    clearPurchaseError();
    clearPinError();

    if (!selectedPlan) {
      // Show error - no plan selected
      return;
    }

    // Start payment with validation
    const success = startPayment(
      { 
        phoneNumber, 
        provider, 
        planId: selectedPlan.variation_code,
        amount: selectedPlan.variation_amount,
      },
      validatePurchase
    );

    if (!success) {
      // Validation failed
      return;
    }
  };

  /**
   * Handle PIN submission
   */
  const handlePinSubmit = async () => {
    clearPinError();

    // Check if wallet is loaded
    if (!wallet) {
      return;
    }

    // Check if transaction PIN is set
    if (!wallet.transactionPinSet) {
      cancelPayment();
      navigation.navigate('SetTransactionPin', {
        onSuccess: async () => {
          await updateTransactionPinStatus(true);
          setTimeout(() => {
            handleBuyData();
          }, 500);
        },
      });
      return;
    }

    // Process payment
    const paymentResult = await processPayment(
      pin,
      async (transactionPin) => {
        return await purchaseData(transactionPin);
      }
    );

    if (paymentResult) {
      resetPin();
    }
  };

  /**
   * Handle forgot PIN
   */
  const handleForgotPin = () => {
    resetPin();
    navigation.navigate('ResetPin', { pinType: 'transaction' });
  };

  /**
   * Handle transaction completion
   */
  const handleTransactionComplete = () => {
    resetFlow();
    resetPin();
    navigation.navigate('TransactionDetails', {
      reference: result?.reference,
    });
  };

  /**
   * Get provider logo
   */
  const getProviderLogo = () => {
    const selectedProvider = NETWORK_PROVIDERS.find(p => p.value === provider);
    return selectedProvider?.logo;
  };

  /**
   * Get provider name
   */
  const getProviderName = () => {
    const selectedProvider = NETWORK_PROVIDERS.find(p => p.value === provider);
    return selectedProvider?.label;
  };

  // Check if wallet is loading
  if (wallet?.isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <ScreenHeader
          title="Data"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.heading }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
    <StatusBarComponent/>
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
          error={purchaseError && !provider ? 'Please select a provider' : null}
        />

        {/* Phone Number Input */}
        <PhoneInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          onNetworkDetected={setProvider}
          placeholder="08XX-XXX-XXXX"
          label="Recipient Phone Number"
          error={purchaseError && !phoneNumber ? 'Please enter phone number' : null}
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

            {isLoadingPlans ? (
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
                    providerLogo={getProviderLogo()}
                    key={plan.variation_code}
                    plan={plan}
                    onPress={() => handlePlanSelect(plan)}
                    themeColors={themeColors}
                    isSelected={selectedPlan?.variation_code === plan.variation_code}
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
        {(purchaseError || flowError) && (
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: `${themeColors.destructive}20` },
            ]}
          >
            <Text style={[styles.errorText, { color: themeColors.destructive }]}>
              {purchaseError || flowError}
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
      marginBottom: insets.bottom + 8, // ensures it floats above bottom nav
      backgroundColor: '#b1e3f5ff',
    },
  ]}
        >
          <View style={styles.footerContent}>
            <View>
              <Text style={[styles.footerLabel, { color: themeColors.subheading }]}>
                Selected Plan
              </Text>
              <Text style={[styles.footerPlan, { color: themeColors.heading }]}>
                {selectedPlan.name}
              </Text>
              <Text style={[styles.footerPrice, { color: themeColors.primary }]}>
                {formatCurrency(Number(selectedPlan.variation_amount), 'NGN')}
              </Text>
            </View>
           
          </View>
          <PayButton
              title="Buy Now"
              onPress={handleBuyData}
              disabled={!phoneNumber || !provider || isPurchasing}
              loading={isPurchasing}
              style={styles.buyButton}
            />
        </View>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={step === 'confirm'}
        onClose={cancelPayment}
        onConfirm={confirmPayment}
        amount={Number(selectedPlan?.variation_amount || 0)}
        serviceName={`Data - ${selectedPlan?.name || ''}`}
        providerLogo={getProviderLogo()}
        providerName={getProviderName()}
        recipient={phoneNumber}
        recipientLabel="Phone Number"
        walletBalance={wallet?.user?.walletBalance}
        additionalDetails={[
          {
            label: 'Data Plan',
            value: selectedPlan?.name || '',
          },
          {
            label: 'Validity',
            value: selectedPlan?.validity || 'N/A',
          },
        ]}
        loading={false}
      />

      {/* PIN Modal */}
      <PinModal
        visible={step === 'pin' || step === 'processing'}
        onClose={() => {
          resetPin();
          cancelPayment();
        }}
        onSubmit={handlePinSubmit}
        onForgotPin={wallet?.transactionPinSet ? handleForgotPin : undefined}
        loading={isPurchasing || isVerifying}
        error={pinError}
        title="Enter Transaction PIN"
        subtitle={`Confirm purchase of ${selectedPlan?.name || 'data plan'}`}
      />

      {/* Result Modal */}
      <ResultModal
        visible={step === 'result'}
        onClose={resetFlow}
        type={result ? 'success' : 'error'}
        title={result ? 'Purchase Successful!' : 'Purchase Failed'}
        message={
          result
            ? `Your data purchase of ${selectedPlan?.name} to ${phoneNumber} was successful.`
            : 'Your data purchase could not be completed. Please try again.'
        }
        primaryAction={{
          label: 'View Details',
          onPress: handleTransactionComplete,
        }}
        secondaryAction={{
          label: 'Done',
          onPress: resetFlow,
        }}
      />

      {/* Loading Overlay */}
      <LoadingOverlay
        visible={step === 'processing'}
        message="Processing your purchase..."
      />

      {/* Transaction PIN Not Set Modal */}
      {step === 'pin' && !wallet?.transactionPinSet && (
        <ResultModal
          visible={true}
          onClose={cancelPayment}
          type="warning"
          title="Transaction PIN Required"
          message="You need to set up a transaction PIN before making payments."
          primaryAction={{
            label: 'Create PIN',
            onPress: () => {
              cancelPayment();
              navigation.navigate('SetTransactionPin', {
                onSuccess: async () => {
                  await updateTransactionPinStatus(true);
                },
              });
            },
          }}
          secondaryAction={{
            label: 'Cancel',
            onPress: cancelPayment,
          }}
        />
      )}
    </SafeAreaView>
  );
}

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
  planName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  planDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planInfo: {
    flex: 1,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
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
    backgroundColor: '#4ae0ce', // integrates with app theme
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    height: 200
  },
  
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  footerPlan: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  footerPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  buyButton: {
    minWidth: 120,
    marginTop: 20
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
  

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8, // adds small spacing between price and badge
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
  
  
});
