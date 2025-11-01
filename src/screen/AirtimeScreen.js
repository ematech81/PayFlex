// screens/Airtime/AirtimeScreen.js

// import { ConfirmationModal, LoadingOverlay, PayButton, PinModal, PromoCard, ProviderSelector, ResultModal, ScreenHeader, TabSelector } from 'component/SHARED';
import AmountInput from 'component/SHARED/INPUT/amountInput';
import PhoneInput from 'component/SHARED/INPUT/phoneInput';
import { AIRTIME_CONSTANTS } from 'CONSTANT/SERVICES/airtimeServices';
import { NETWORK_PROVIDERS } from 'CONSTANT/providerConstant';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { useWallet } from 'context/WalletContext';
import { useAirtimePurchase, usePaymentFlow, useTransactionPin, useWalletBalance } from 'HOOKS';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ActivityIndicator
} from 'react-native';



import {
  ScreenHeader,
  TabSelector,
  ProviderSelector,
  QuickAmountButton,
  PayButton,
  ConfirmationModal,
  PinModal,
  ResultModal,
  PromoCard,
  LoadingOverlay,
} from 'component/SHARED';



const { height } = Dimensions.get('window');

/**
 * Airtime Purchase Screen
 * Professional implementation using shared architecture
 */

export default function AirtimeScreen({ navigation }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { updateTransactionPinStatus } = useWalletBalance();
  const [isWalletLoading, setIsWalletLoading] = useState(!wallet);

  const {wallet} = useWallet()

  // State
  const [selectedTab, setSelectedTab] = useState('Local');


  useEffect(() => {
    if (wallet) {
      setIsWalletLoading(false);
    }
  }, [wallet]);

  // Custom Hooks
  const {
    phoneNumber,
    setPhoneNumber,
    amount,
    setAmount,
    provider,
    setProvider,
    isLoading: isPurchasing,
    error: purchaseError,
    validatePurchase,
    purchaseAirtime,
    clearError: clearPurchaseError,
  } = useAirtimePurchase();

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

  // Tabs configuration
  const tabs = [
    { label: 'Local', value: 'Local' },
    { label: 'International', value: 'International', disabled: true },
  ];

  /**
   * Handle quick amount selection
   */
  const handleQuickAmount = (selectedAmount) => {
    setAmount(selectedAmount);
    handlePayment(selectedAmount);
  };

  /**
   * Handle custom amount payment
   */
  const handleCustomPayment = () => {
    handlePayment(amount);
  };

  /**
   * Start payment flow
   */
  const handlePayment = (paymentAmount) => {
    clearPurchaseError();
    clearPinError();

    // Start payment with validation
    const success = startPayment(
      { phoneNumber, provider, amount: paymentAmount },
      validatePurchase
    );

    if (!success) {
      // Validation failed, error is set in paymentFlow
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
      setError('Wallet not loaded. Please try again.');
      return;
    }
  
    // Check if PIN is set
    if (!wallet.transactionPinSet) {
      cancelPayment();  // Close PIN modal
      navigation.navigate('SetTransactionPin', {
        onSuccess: () => {
          updateTransactionPinStatus();
          // Optionally restart the payment flow
          setTimeout(() => {
            handlePayment(amount);
          }, 500);
        },
      });
      return;
    }

    // Process payment
    const paymentResult = await processPayment(
      pin,
      async (transactionPin) => {
        return await purchaseAirtime(transactionPin);
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

  // Calculate if form is valid
  const isFormValid = phoneNumber && provider && amount && !isPurchasing;

  // if (wallet.isLoading) {}
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ScreenHeader
          title="Airtime"
          onBackPress={() => navigation.goBack()}
          rightText="History"
          onRightPress={() => navigation.navigate('History')}
        />

        {/* Tabs */}
        <TabSelector
          tabs={tabs}
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
        />

        {/* Provider Selection */}
        <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
          Select Service Provider
        </Text>
        <ProviderSelector
          providers={NETWORK_PROVIDERS}
          value={provider}
          onChange={setProvider}
          placeholder="Select Network Provider"
          error={purchaseError && !provider ? 'Please select a provider' : null}
        />

        {/* Phone Number Input */}
        <PhoneInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          onNetworkDetected={setProvider}
          placeholder="08XX-XXX-XXXX"
          error={purchaseError && !phoneNumber ? 'Please enter phone number' : null}
        />

        {/* Quick Amounts */}
        <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
          Top-up Amount
        </Text>
        <View style={styles.quickAmountsContainer}>
          {AIRTIME_CONSTANTS.QUICK_AMOUNTS.map((quickAmount) => (
            <QuickAmountButton
              key={quickAmount.value}
              amount={quickAmount.value}
              onPress={handleQuickAmount}
              isSelected={amount === quickAmount.value}
            />
          ))}
        </View>

        {/* Custom Amount Input */}
        <View
          style={[
            styles.customAmountContainer,
            { backgroundColor: themeColors.card },
          ]}
        >
          <AmountInput
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter Amount"
            minAmount={AIRTIME_CONSTANTS.LIMITS.MIN_AMOUNT}
            maxAmount={AIRTIME_CONSTANTS.LIMITS.MAX_AMOUNT}
            showBalance
            balance={wallet?.user?.walletBalance}
            error={purchaseError && !amount ? 'Please enter amount' : null}
          />

          <PayButton
            title="Pay"
            onPress={handleCustomPayment}
            disabled={!isFormValid}
            loading={isPurchasing}
            style={styles.payButton}
          />
        </View>

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

        {/* Promo Card */}
        <PromoCard
          title="🎉 Refer And Win"
          subtitle="Invite your Friends and earn up to ₦10,000"
          buttonText="Refer"
          onPress={() => navigation.navigate('Referral')}
        />
      </ScrollView>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={step === 'confirm'}
        onClose={cancelPayment}
        onConfirm={confirmPayment}
        amount={Number(amount)}
        serviceName="Airtime"
        providerLogo={getProviderLogo()}
        providerName={getProviderName()}
        recipient={phoneNumber}
        recipientLabel="Phone Number"
        walletBalance={wallet?.user?.walletBalance}
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
        onForgotPin={wallet.transactionPinSet ? handleForgotPin : undefined}
        loading={isPurchasing || isVerifying}
        error={pinError}
        title="Enter Transaction PIN"
        subtitle={`Confirm payment of ${formatCurrency(Number(amount), 'NGN')}`}
      />

      {/* Result Modal */}
      <ResultModal
        visible={step === 'result'}
        onClose={resetFlow}
        type={result ? 'success' : 'error'}
        title={result ? 'Purchase Successful!' : 'Purchase Failed'}
        message={
          result
            ? `Your airtime purchase of ${formatCurrency(Number(amount), 'NGN')} to ${phoneNumber} was successful.`
            : 'Your airtime purchase could not be completed. Please try again.'
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
        message="Processing your payment..."
      />

      {/* Transaction PIN Not Set Modal */}
      
{/* Transaction PIN Not Set Modal */}
{step === 'pin' && !wallet?.transactionPinSet && (  // ✅ Add optional chaining
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
          onSuccess: () => {
            updateTransactionPinStatus();
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
// }

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  customAmountContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  payButton: {
    marginTop: 12,
  },
  errorContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
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
});











