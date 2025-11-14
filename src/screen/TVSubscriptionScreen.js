import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput
} from 'react-native';

// Shared Components
import {
  ScreenHeader,
  ProviderSelector,
  PayButton,
  ConfirmationModal,
  PinModal,
  ResultModal,
  PromoCard,
  LoadingOverlay,
} from 'component/SHARED';

// Custom Components
import AmountInput from 'component/SHARED/INPUT/amountInput';
import { PaymentApiIPAddress } from "utility/apiIPAdress";
import { useServicePayment } from 'HOOKS/UseServicePayment';
import PinSetupModal from 'component/PinSetUpModal';
import { useWallet } from 'context/WalletContext';

// Constants & Utils
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';




/**
 * TV Subscription Screen - Adapted from AirtimeScreen Using Unified Payment System
 */
export default function TVSubscriptionScreen({ navigation, route }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { wallet, refreshWallet } = useWallet();

  // Define TV Constants Inside the Screen
  const TV_CONSTANTS = {
    LIMITS: {
      MIN_AMOUNT: 1000,
      MAX_AMOUNT: 50000,
    },
  };

  const TV_PROVIDERS = [
    { label: 'DSTV', value: 'dstv', logo: '' },
    { label: 'GOTV', value: 'gotv', logo: '' },
    { label: 'Startimes', value: 'startimes', logo: '' },
  ];

  const TV_BOUQUETS = {
    dstv: [
      { label: 'Padi', value: 'padi', price: 4400 },
      { label: 'Yanga', value: 'yanga', price: 6000 },
      { label: 'Confam', value: 'confam', price: 11000 },
      { label: 'Compact', value: 'compact', price: 19000 },
      { label: 'Compact Plus', value: 'compact_plus', price: 30000 },
      { label: 'Premium', value: 'premium', price: 45000 },
    ],
    gotv: [
      { label: 'Smallie', value: 'smallie', price: 1900 },
      { label: 'Jinja', value: 'jinja', price: 3900 },
      { label: 'Jolli', value: 'jolli', price: 5800 },
      { label: 'Max', value: 'max', price: 8500 },
      { label: 'Supa', value: 'supa', price: 11400 },
      { label: 'Supa Plus', value: 'supa_plus', price: 16800 },
    ],
    startimes: [
      { label: 'Nova', value: 'nova', price: 1700 },
      { label: 'Basic', value: 'basic', price: 3000 },
      { label: 'Smart', value: 'smart', price: 2800 },
      { label: 'Classic', value: 'classic', price: 6000 },
      { label: 'Super', value: 'super', price: 5300 },
    ],
  };

  // Local State
  const [smartCardNumber, setSmartCardNumber] = useState('');
  const [provider, setProvider] = useState('');
  const [bouquet, setBouquet] = useState('');
  const [amount, setAmount] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});

  // Get current bouquets based on provider
  const currentBouquets = TV_BOUQUETS[provider] || [];

  // Update amount when bouquet changes
  useEffect(() => {
    const selected = currentBouquets.find(b => b.value === bouquet);
    setAmount(selected ? selected.price : 0);
  }, [bouquet, currentBouquets]);

  // ========================================
  // VALIDATION FUNCTION
  // ========================================
  const validateTVPayment = useCallback((paymentData) => {
    console.log('🔍 Validating TV subscription payment:', paymentData);
    
    const errors = {};

    // Validate smart card number (10-12 digits)
    const cleanSmartCard = (paymentData.smartCardNumber || '').replace(/\s/g, '');
    const smartCardRegex = /^\d{10,12}$/;
    
    if (!cleanSmartCard) {
      errors.smartCardNumber = 'Smart card/IUC number is required';
    } else if (!smartCardRegex.test(cleanSmartCard)) {
      errors.smartCardNumber = 'Invalid smart card/IUC number (10-12 digits)';
    }

    if (!paymentData.provider) {
      errors.provider = 'Please select a TV provider';
    }

    if (!paymentData.bouquet) {
      errors.bouquet = 'Please select a bouquet';
    }

    const amountToValidate = paymentData.amount;
    if (!amountToValidate || amountToValidate < TV_CONSTANTS.LIMITS.MIN_AMOUNT) {
      errors.amount = `Minimum amount is ${formatCurrency(TV_CONSTANTS.LIMITS.MIN_AMOUNT, 'NGN')}`;
    }

    if (amountToValidate > TV_CONSTANTS.LIMITS.MAX_AMOUNT) {
      errors.amount = `Maximum amount is ${formatCurrency(TV_CONSTANTS.LIMITS.MAX_AMOUNT, 'NGN')}`;
    }

    const isValid = Object.keys(errors).length === 0;
    console.log('✅ Validation result:', { isValid, errors });
    setValidationErrors(errors);

    return {
      isValid,
      errors,
    };
  }, []);

  // ========================================
  // PURCHASE EXECUTOR FUNCTION
  // ========================================
  const executeTVPurchase = useCallback(async (pin, paymentData) => {
    try {
      const response = await fetch(`${PaymentApiIPAddress}/payments/buy-tv-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smartCardNumber: paymentData.smartCardNumber, // Already cleaned
          provider: paymentData.provider,
          bouquet: paymentData.bouquet,
          amount: paymentData.amount,
          pin,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'TV subscription failed');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ TV subscription error:', error);
      throw error;
    }
  }, []);

  // ========================================
  // UNIFIED PAYMENT HOOK
  // ========================================
  const payment = useServicePayment({
    serviceName: 'TV Subscription',
    validatePayment: validateTVPayment,
    executePurchase: executeTVPurchase,
    navigation,
    route,
  });

  // ========================================
  // RESTORE FORM DATA AFTER PIN SETUP
  // ========================================
  useEffect(() => {
    payment.restoreFormData((data) => {
      console.log('📝 Restoring TV subscription form:', data);
      setSmartCardNumber(data.smartCardNumber);
      setProvider(data.provider);
      setBouquet(data.bouquet);
      // Amount will be set via effect
    });
  }, [payment.pendingPaymentData]);

  // ========================================
  // INITIAL WALLET LOAD
  // ========================================
  useEffect(() => {
    refreshWallet();
  }, []);

  // ========================================
  // PAYMENT HANDLERS
  // ========================================
  const handlePayment = useCallback(() => {
    // Clear errors
    setValidationErrors({});

    // Clean smart card number (remove whitespace)
    const cleanSmartCard = smartCardNumber.replace(/\s/g, '');

    // Prepare payment data
    const paymentData = {
      smartCardNumber: cleanSmartCard,
      provider,
      bouquet,
      amount,
    };

    // Initiate payment (handles PIN check automatically)
    payment.initiatePayment(paymentData);
  }, [smartCardNumber, provider, bouquet, amount, payment]);

  const handleTransactionComplete = useCallback(() => {
    // Reset form
    setSmartCardNumber('');
    setProvider('');
    setBouquet('');
    setAmount(0);
    
    payment.handleTransactionComplete(payment.result?.reference);
  }, [payment]);

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  const getProviderLogo = useCallback(() => {
    return TV_PROVIDERS.find(p => p.value === provider)?.logo;
  }, [provider]);

  const getProviderName = useCallback(() => {
    return TV_PROVIDERS.find(p => p.value === provider)?.label;
  }, [provider]);

  const getBouquetName = useCallback(() => {
    const selected = currentBouquets.find(b => b.value === bouquet);
    return selected ? selected.label : '';
  }, [bouquet, currentBouquets]);

  // ========================================
  // MAIN RENDER
  // ========================================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ScreenHeader
          title="TV Subscription"
          onBackPress={() => navigation.goBack()}
          rightText="History"
          onRightPress={() => navigation.navigate('History')}
        />

        {/* Provider Selection */}
        <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
          Select TV Provider
        </Text>
        <ProviderSelector
          providers={TV_PROVIDERS}
          value={provider}
          onChange={setProvider}
          placeholder="Select TV Provider"
          error={validationErrors.provider}
        />

        {/* Smart Card Number Input */}
        <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
          Smart Card / IUC Number
        </Text>
        <TextInput // Assuming a basic TextInput; customize as PhoneInput if needed
          style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
          value={smartCardNumber}
          onChangeText={setSmartCardNumber}
          placeholder="Enter 10-12 digit number"
          keyboardType="numeric"
          maxLength={12}
        />
        {validationErrors.smartCardNumber && (
          <Text style={[styles.errorText, { color: themeColors.destructive }]}>
            {validationErrors.smartCardNumber}
          </Text>
        )}

        {/* Bouquet Selection */}
        <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
          Select Bouquet
        </Text>
        <ProviderSelector
          providers={currentBouquets.map(b => ({ label: `${b.label} - ${formatCurrency(b.price, 'NGN')}`, value: b.value }))}
          value={bouquet}
          onChange={setBouquet}
          placeholder="Select Bouquet"
          error={validationErrors.bouquet}
          disabled={!provider}
        />

        {/* Amount Display (Read-Only) */}
        <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
          Subscription Amount
        </Text>
        <AmountInput
          value={amount.toString()}
          placeholder="Amount (auto-set from bouquet)"
          minAmount={TV_CONSTANTS.LIMITS.MIN_AMOUNT}
          maxAmount={TV_CONSTANTS.LIMITS.MAX_AMOUNT}
          showBalance
          balance={wallet?.user?.walletBalance}
          error={validationErrors.amount}
          editable={false} // Read-only
        />

        {/* Pay Button */}
        <PayButton
          title="Pay"
          onPress={handlePayment}
          disabled={!smartCardNumber || !provider || !bouquet || payment.step === 'processing'}
          loading={payment.step === 'processing'}
          style={styles.payButton}
        />

        {/* Error Display */}
        {payment.flowError && (
          <View style={[styles.errorContainer, { backgroundColor: `${themeColors.destructive}20` }]}>
            <Text style={[styles.errorText, { color: themeColors.destructive }]}>
              {payment.flowError}
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

      {/* ========================================
          MODALS - Using Unified System
          ======================================== */}

      {/* PIN Setup Modal */}
      <PinSetupModal
        visible={payment.showPinSetupModal}
        serviceName="TV Subscription"
        paymentAmount={amount}
        onCreatePin={payment.handleCreatePin}
        onCancel={payment.handleCancelPinSetup}
        isDarkMode={isDarkMode}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={payment.step === 'confirm'}
        onClose={payment.handleCancelPayment}
        onConfirm={payment.confirmPayment}
        amount={amount}
        serviceName="TV Subscription"
        providerLogo={getProviderLogo()}
        providerName={getProviderName()}
        recipient={smartCardNumber.replace(/\s/g, '')}
        recipientLabel="Smart Card / IUC Number"
        walletBalance={wallet?.user?.walletBalance}
        loading={false}
      />

      {/* PIN Input Modal */}
      <PinModal
        visible={payment.step === 'pin'}
        onClose={payment.handleCancelPayment}
        onSubmit={payment.submitPayment}
        onForgotPin={payment.handleForgotPin}
        loading={payment.step === 'processing'}
        error={payment.pinError}
        title="Enter Transaction PIN"
        subtitle={`Confirm payment of ${formatCurrency(amount, 'NGN')} for ${getBouquetName()}`}
      />

      {/* Success/Error Result Modal */}
      <ResultModal
        visible={payment.step === 'result'}
        onClose={payment.resetFlow}
        type={payment.result ? 'success' : 'error'}
        title={payment.result ? 'Subscription Successful!' : 'Subscription Failed'}
        message={
          payment.result
            ? `Your TV subscription of ${formatCurrency(amount, 'NGN')} to ${smartCardNumber.replace(/\s/g, '')} was successful.`
            : payment.flowError || 'Your TV subscription could not be completed. Please try again.'
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
        message="Processing your payment..."
      />
    </SafeAreaView>
  );
}

// ========================================
// STYLES (Reused from AirtimeScreen, with minor additions)
 // ========================================
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
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
});