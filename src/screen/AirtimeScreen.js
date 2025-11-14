

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';

// Shared Components
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
import AsyncStorage from '@react-native-async-storage/async-storage';


// Custom Components
import PhoneInput from 'component/SHARED/INPUT/phoneInput';
import AmountInput from 'component/SHARED/INPUT/amountInput';
import { PaymentApiIPAddress } from "utility/apiIPAdress";
import PinSetupModal from 'component/PinSetUpModal';
import { useWallet } from 'context/WalletContext';




// Constants & Utils
import { AIRTIME_CONSTANTS } from 'CONSTANT/SERVICES/airtimeServices';
import { NETWORK_PROVIDERS } from 'CONSTANT/providerConstant';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { useServicePayment } from 'HOOKS/UseServicePayment';
import paymentService, { purchaseAirtime } from 'AuthFunction/paymentService';
import { STORAGE_KEYS } from 'utility/storageKeys';


/**
 * Refactored Airtime Purchase Screen - Using Unified Payment System
 */
export default function AirtimeScreen({ navigation, route }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { wallet, refreshWallet } = useWallet();

  // Local State
  const [selectedTab, setSelectedTab] = useState('Local');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState('');
  const [amount, setAmount] = useState('');
  const [validationErrors, setValidationErrors] = useState({});


  // Test in your screen
  const testBackend = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      console.log('🧪 Testing backend connection...');
      console.log('🧪 Token:', token?.substring(0, 20) + '...');
      console.log('🧪 URL:', `${PaymentApiIPAddress}/buy-airtime`);
      
      const response = await fetch(`${PaymentApiIPAddress}/buy-airtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phoneNumber: '08012345678',
          provider: 'mtn',
          amount: 100,
          pin: '1234',
        }),
      });
      
      console.log('🧪 Response status:', response.status);
      console.log('🧪 Response headers:', JSON.stringify([...response.headers]));
      
      const text = await response.text();
      console.log('🧪 Response body:', text);
      
    } catch (error) {
      console.error('🧪 Test failed:', error);
    }
  };
  
  // Call this on component mount
  useEffect(() => {
    testBackend();
  }, []);



  // ========================================
  // VALIDATION FUNCTION
  // ========================================
  const validateAirtimePayment = useCallback((paymentData) => {
    console.log('🔍 Validating airtime payment:', paymentData);
    
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

    // Check both amount fields (for compatibility with usePaymentFlow)
    const amountToValidate = paymentData.amount;
    if (!amountToValidate || amountToValidate < AIRTIME_CONSTANTS.LIMITS.MIN_AMOUNT) {
      errors.amount = `Minimum amount is ${formatCurrency(AIRTIME_CONSTANTS.LIMITS.MIN_AMOUNT, 'NGN')}`;
    }

    if (amountToValidate > AIRTIME_CONSTANTS.LIMITS.MAX_AMOUNT) {
      errors.amount = `Maximum amount is ${formatCurrency(AIRTIME_CONSTANTS.LIMITS.MAX_AMOUNT, 'NGN')}`;
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
  const payment = useServicePayment({
    serviceName: 'Airtime',
    validatePayment: validateAirtimePayment,
    executePurchase: async (pin, paymentData) => {
      return await purchaseAirtime(pin, paymentData);
    },
    navigation,
    route,
  });

  

  // ========================================
  // RESTORE FORM DATA AFTER PIN SETUP
  // ========================================
  useEffect(() => {
    payment.restoreFormData((data) => {
      console.log('📝 Restoring airtime purchase form:', data);
      setPhoneNumber(data.phoneNumber);
      setProvider(data.provider);
      setAmount(data.amount.toString());
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
  const handleQuickAmount = useCallback((selectedAmount) => {
    setAmount(selectedAmount.toString());
    handlePayment(selectedAmount);
  }, [phoneNumber, provider]);

  const handleCustomPayment = useCallback(() => {
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount)) {
      setValidationErrors({ amount: 'Please enter a valid amount' });
      return;
    }
    handlePayment(paymentAmount);
  }, [amount, phoneNumber, provider]);

  const handlePayment = useCallback((paymentAmount) => {
    // Clear errors
    setValidationErrors({});

    // Clean phone number (remove whitespace)
    const cleanPhone = phoneNumber.replace(/\s/g, '');

    // Prepare payment data
    const paymentData = {
      phoneNumber: cleanPhone,
      provider,
      amount: paymentAmount,
    };

    // Initiate payment (handles PIN check automatically)
    payment.initiatePayment(paymentData);
  }, [phoneNumber, provider, payment]);

  const handleTransactionComplete = useCallback(() => {
    // Reset form
    setPhoneNumber('');
    setProvider('');
    setAmount('');
    
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
          error={validationErrors.provider}
        />

        {/* Phone Number Input */}
        <PhoneInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          onNetworkDetected={setProvider}
          placeholder="08XX-XXX-XXXX"
          error={validationErrors.phoneNumber}
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
              isSelected={amount === quickAmount.value.toString()}
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
            error={validationErrors.amount}
          />

          <PayButton
            title="Pay"
            onPress={handleCustomPayment}
            disabled={!phoneNumber || !provider || payment.step === 'processing'}
            loading={payment.step === 'processing'}
            style={styles.payButton}
          />
        </View>

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

      {/* PIN Setup Modal - NEW! */}
      <PinSetupModal
        visible={payment.showPinSetupModal}
        serviceName="Airtime Recharge"
        paymentAmount={parseFloat(amount)}
        onCreatePin={payment.handleCreatePin}
        onCancel={payment.handleCancelPinSetup}
        isDarkMode={isDarkMode}
      />

      {/* Confirmation Modal */}
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
        subtitle={`Confirm payment of ${formatCurrency(Number(amount), 'NGN')}`}
      />

      {/* Success/Error Result Modal */}
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
// STYLES
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
});

