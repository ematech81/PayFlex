import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Shared Components
import {
  ScreenHeader,
  ProviderSelector,
  PayButton,
  ConfirmationModal,
  PinModal,
  ResultModal,
  LoadingOverlay,
  BeneficiaryInput,
} from 'component/SHARED';

// Custom Components

import { useServicePayment } from 'HOOKS/UseServicePayment';
import PinSetupModal from 'component/PinSetUpModal';
import { useWallet } from 'context/WalletContext';

// Constants & Utils
import { 
  BETTING_PROVIDERS, 
  calculateBettingCharge, 
  calculateTotalAmount 
} from 'CONSTANT/bettingConstant';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { StatusBarComponent } from 'component/StatusBar';
import { verifyBettingAccount, fundBettingAccount } from 'AuthFunction/paymentService';
import AmountInput from 'component/SHARED/INPUT/amountInput';

/**
 * Verified Account Card
 */
const VerifiedAccountCard = ({ customerName, userId, service, themeColors }) => (
  <View style={[styles.verifiedCard, { backgroundColor: themeColors.neutral }]}>
    <View style={styles.verifiedHeader}>
      <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
      <Text style={[styles.verifiedTitle, { color: themeColors.heading }]}>
        Account Verified
      </Text>
    </View>
    <View style={styles.verifiedDetails}>
      <View style={styles.detailRow}>
        <Text style={[styles.detailLabel, { color: themeColors.subheading }]}>
          Customer Name:
        </Text>
        <Text style={[styles.detailValue, { color: themeColors.heading }]}>
          {customerName}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={[styles.detailLabel, { color: themeColors.subheading }]}>
          User ID:
        </Text>
        <Text style={[styles.detailValue, { color: themeColors.heading }]}>
          {userId}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={[styles.detailLabel, { color: themeColors.subheading }]}>
          Service:
        </Text>
        <Text style={[styles.detailValue, { color: themeColors.heading }]}>
          {service}
        </Text>
      </View>
    </View>
  </View>
);

/**
 * Betting Funding Screen
 */
export default function BettingScreen({ navigation, route }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { wallet, refreshWallet } = useWallet();

  // Local State
  const [provider, setProvider] = useState('');
  const [userId, setUserId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Verification State
  const [verifying, setVerifying] = useState(false);
  const [verifiedAccount, setVerifiedAccount] = useState(null);

  // ========================================
  // VALIDATION FUNCTION
  // ========================================
  const validateBettingFunding = useCallback((fundingData) => {
    console.log('🔍 Validating betting funding:', fundingData);
    
    const errors = {};

    if (!fundingData.service) {
      errors.provider = 'Please select a betting provider';
    }

    if (!fundingData.userid) {
      errors.userid = 'User ID is required';
    } else if (fundingData.userid.length < 3) {
      errors.userid = 'User ID must be at least 3 characters';
    }

    // Phone validation
    const cleanPhone = (fundingData.phone || '').replace(/\s/g, '');
    const phoneRegex = /^0\d{10}$/;
    
    if (!cleanPhone) {
      errors.phone = 'Phone number is required';
    } else if (cleanPhone.length !== 11) {
      errors.phone = 'Phone number must be 11 digits';
    } else if (!phoneRegex.test(cleanPhone)) {
      errors.phone = 'Invalid Nigerian phone number';
    }

    if (!fundingData.amount || fundingData.amount < 100) {
      errors.amount = 'Minimum amount is ₦100';
    }

    if (fundingData.amount > 500000) {
      errors.amount = 'Maximum amount is ₦500,000';
    }

    if (!verifiedAccount) {
      errors.verification = 'Please verify user ID first';
    }

    const isValid = Object.keys(errors).length === 0;
    console.log('✅ Validation result:', { isValid, errors });
    setValidationErrors(errors);

    return { isValid, errors };
  }, [verifiedAccount]);

  // ========================================
  // UNIFIED PAYMENT HOOK
  // ========================================
  const payment = useServicePayment({
    serviceName: 'Betting',
    validatePayment: validateBettingFunding,
    executePurchase: async (pin, fundingData) => {
      return await fundBettingAccount(pin, fundingData);
    },
    navigation,
    route,
  });

  // ========================================
  // RESTORE FORM DATA
  // ========================================
  useEffect(() => {
    payment.restoreFormData((data) => {
      console.log('📝 Restoring betting funding form:', data);
      setProvider(data.service);
      setUserId(data.userid);
      setPhoneNumber(data.phone);
      setAmount(data.amount?.toString());
      setVerifiedAccount(data.verifiedAccount);
    });
  }, [payment.pendingPaymentData]);

  // ========================================
  // INITIAL WALLET LOAD
  // ========================================
  useEffect(() => {
    refreshWallet();
  }, []);

  // ========================================
  // RESET VERIFICATION ON PROVIDER/USERID CHANGE
  // ========================================
  useEffect(() => {
    setVerifiedAccount(null);
    setValidationErrors({});
  }, [provider, userId]);

  // ========================================
  // VERIFY ACCOUNT
  // ========================================
  const handleVerifyAccount = useCallback(async () => {
    if (!provider || !userId) {
      Alert.alert('Error', 'Please select a provider and enter user ID');
      return;
    }

    try {
      setVerifying(true);
      const result = await verifyBettingAccount(provider, userId);
      
      if (result.success) {
        setVerifiedAccount(result.data);
        Alert.alert('Success', `Account verified: ${result.data.customerName}`);
      } else {
        Alert.alert('Verification Failed', result.message || 'Invalid user ID');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to verify account');
    } finally {
      setVerifying(false);
    }
  }, [provider, userId]);

  // ========================================
  // FUND ACCOUNT
  // ========================================
  const handleFundAccount = useCallback(() => {
    setValidationErrors({});

    const cleanPhone = phoneNumber.replace(/\s/g, '');
    const numericAmount = parseFloat(amount);

    const fundingData = {
      service: provider,
      userid: userId,
      phone: cleanPhone,
      amount: numericAmount,
      verifiedAccount,
    };

    payment.initiatePayment(fundingData);
  }, [provider, userId, phoneNumber, amount, verifiedAccount, payment]);

  const handleTransactionComplete = useCallback(() => {
    payment.handleTransactionComplete(payment.result?.reference);
  }, [payment]);

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  const getProviderInfo = useCallback(() => {
    return BETTING_PROVIDERS.find(p => p.value === provider);
  }, [provider]);

  // ========================================
  // LOADING STATE
  // ========================================
  if (wallet?.isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ScreenHeader title="Betting" onBackPress={() => navigation.goBack()} />
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
      
      <ScreenHeader
        title="Betting"
        onBackPress={() => navigation.goBack()}
        rightText="History"
        onRightPress={() => navigation.navigate('TransactionDetails')}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: themeColors.card }]}>
          <Ionicons name="trophy-outline" size={32} color={themeColors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: themeColors.heading }]}>
              Fund Betting Account
            </Text>
            <Text style={[styles.infoDescription, { color: themeColors.subheading }]}>
              Quick and secure betting wallet funding
            </Text>
          </View>
        </View>

        {/* Provider Selection */}
        <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
          Select Betting Provider
        </Text>
        <ProviderSelector
          providers={BETTING_PROVIDERS}
          value={provider}
          onChange={setProvider}
          placeholder="Select Provider"
          error={validationErrors.provider}
          disabled={verifiedAccount !== null}
        />

        {/* User ID Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: themeColors.heading }]}>
            User ID / Account Number
          </Text>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: themeColors.background,
                borderColor: validationErrors.userid
                  ? themeColors.destructive
                  : themeColors.border,
              },
            ]}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={themeColors.subtext}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: themeColors.heading }]}
              value={userId}
              onChangeText={setUserId}
              placeholder="Enter your user ID"
              placeholderTextColor={themeColors.subtext}
              editable={!verifiedAccount}
            />
            {verifiedAccount && (
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            )}
          </View>
          {validationErrors.userid && (
            <Text style={[styles.errorText, { color: themeColors.destructive }]}>
              {validationErrors.userid}
            </Text>
          )}
        </View>

        {/* Verify Button or Change Button */}
        {!verifiedAccount ? (
          <PayButton
            title="Verify Account"
            onPress={handleVerifyAccount}
            loading={verifying}
            disabled={!provider || !userId || verifying}
            style={styles.verifyButton}
            icon="shield-checkmark-outline"
          />
        ) : (
          <>
            {/* Verified Account Card */}
            <VerifiedAccountCard
              customerName={verifiedAccount.customerName}
              userId={verifiedAccount.userId}
              service={verifiedAccount.service}
              themeColors={themeColors}
            />

            {/* Phone Number */}
            <BeneficiaryInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              serviceType="betting"
              placeholder="08XX-XXX-XXXX"
              label="Phone Number"
              error={validationErrors.phone}
              keyboardType="phone-pad"
              maxLength={11}
              icon="call-outline"
              identifierField="phone"
              secondaryField="service"
              displayField={(item) => `${item.phone} - ${item.service?.toUpperCase()}`}
              enableValidation={true}
            />

            {/* Amount */}
            <AmountInput
              value={amount}
              onChangeText={setAmount}
              label="Amount to Fund"
              placeholder="Enter amount"
              error={validationErrors.amount}
              minAmount={100}
              maxAmount={500000}
            />

            {/* Funding Summary */}
            {amount && parseFloat(amount) >= 100 && (
              <View style={[styles.summaryCard, { backgroundColor: themeColors.card }]}>
                <Text style={[styles.summaryTitle, { color: themeColors.heading }]}>
                  Funding Summary
                </Text>
                
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: themeColors.subheading }]}>
                    Funding Amount:
                  </Text>
                  <Text style={[styles.summaryValue, { color: themeColors.heading }]}>
                    {formatCurrency(parseFloat(amount), 'NGN')}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: themeColors.subheading }]}>
                    Service Charge (6%):
                  </Text>
                  <Text style={[styles.summaryValue, { color: themeColors.destructive }]}>
                    +{formatCurrency(calculateBettingCharge(parseFloat(amount)), 'NGN')}
                  </Text>
                </View>

                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={[styles.summaryLabel, styles.totalLabel, { color: themeColors.heading }]}>
                    Total to Pay:
                  </Text>
                  <Text style={[styles.summaryValue, styles.totalValue, { color: themeColors.primary }]}>
                    {formatCurrency(calculateTotalAmount(parseFloat(amount)), 'NGN')}
                  </Text>
                </View>
              </View>
            )}

            {/* Change Account Button */}
            <TouchableOpacity
              style={[styles.changeAccountButton, { borderColor: themeColors.border }]}
              onPress={() => {
                setVerifiedAccount(null);
                setUserId('');
              }}
            >
              <Ionicons name="refresh" size={20} color={themeColors.primary} />
              <Text style={[styles.changeAccountText, { color: themeColors.primary }]}>
                Change Account
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Error Display */}
        {validationErrors.verification && (
          <View style={[styles.errorContainer, { backgroundColor: `${themeColors.destructive}20` }]}>
            <Text style={[styles.errorText, { color: themeColors.destructive }]}>
              {validationErrors.verification}
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

      {/* Sticky Fund Button */}
      {verifiedAccount && amount && parseFloat(amount) >= 100 && (
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
                {getProviderInfo()?.label} - {verifiedAccount.customerName}
              </Text>
              <Text style={[styles.footerPrice, { color: themeColors.primary }]}>
                {formatCurrency(calculateTotalAmount(parseFloat(amount)),'NGN')}
</Text>
</View>
</View>
<PayButton
title="Fund Account"
onPress={handleFundAccount}
disabled={payment.step === 'processing'}
loading={payment.step === 'processing'}
style={styles.fundButton}
/>
</View>
)}

{/* ========================================
      MODALS
      ======================================== */}

  <PinSetupModal
    visible={payment.showPinSetupModal}
    serviceName="Betting Funding"
    paymentAmount={amount ? calculateTotalAmount(parseFloat(amount)) : 0}
    onCreatePin={payment.handleCreatePin}
    onCancel={payment.handleCancelPinSetup}
    isDarkMode={isDarkMode}
  />

  <ConfirmationModal
    visible={payment.step === 'confirm'}
    onClose={payment.handleCancelPayment}
    onConfirm={payment.confirmPayment}
    amount={amount ? calculateTotalAmount(parseFloat(amount)) : 0}
    serviceName={`${getProviderInfo()?.label} Funding`}
    providerLogo={getProviderInfo()?.logo}
    providerName={getProviderInfo()?.label}
    recipient={userId}
    recipientLabel="User ID"
    walletBalance={wallet?.user?.walletBalance}
    additionalDetails={[
      { label: 'Customer', value: verifiedAccount?.customerName || 'N/A' },
      { label: 'Funding Amount', value: formatCurrency(parseFloat(amount || 0), 'NGN') },
      { label: 'Service Charge', value: formatCurrency(calculateBettingCharge(parseFloat(amount || 0)), 'NGN') },
      { label: 'Phone', value: phoneNumber.replace(/\s/g, '') },
    ]}
    loading={false}
  />

  <PinModal
    visible={payment.step === 'pin'}
    onClose={payment.handleCancelPayment}
    onSubmit={(enteredPin) => payment.submitPayment(enteredPin)}
    onForgotPin={payment.handleForgotPin}
    loading={payment.step === 'processing'}
    error={payment.pinError}
    title="Enter Transaction PIN"
    subtitle={`Confirm funding of ${formatCurrency(parseFloat(amount || 0), 'NGN')}`}
  />

  <ResultModal
    visible={payment.step === 'result'}
    onClose={payment.resetFlow}
    type={payment.result ? 'success' : 'error'}
    title={payment.result ? 'Funding Successful!' : 'Funding Failed'}
    message={
      payment.result
        ? `Your ${getProviderInfo()?.label} account (${userId}) has been funded with ${formatCurrency(parseFloat(amount || 0), 'NGN')}.`
        : 'Your betting account funding could not be completed. Please try again.'
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

  <LoadingOverlay
    visible={payment.step === 'processing'}
    message="Processing funding..."
  />
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
      paddingHorizontal: 16,
      paddingBottom: 120,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      fontWeight: '500',
    },
  
    // ========================================
    // INFO BANNER
    // ========================================
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginTop: 16,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    infoContent: {
      flex: 1,
      marginLeft: 16,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
    },
    infoDescription: {
      fontSize: 13,
      lineHeight: 18,
    },
  
    // ========================================
    // SECTION TITLES
    // ========================================
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginTop: 20,
      marginBottom: 12,
    },
  
    // ========================================
    // INPUT FIELDS
    // ========================================
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1.5,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
    },
  
    // ========================================
    // VERIFY BUTTON
    // ========================================
    verifyButton: {
      marginTop: 16,
      marginBottom: 8,
    },
  
    // ========================================
    // VERIFIED ACCOUNT CARD
    // ========================================
    verifiedCard: {
      marginTop: 16,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    verifiedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 8,
    },
    verifiedTitle: {
      fontSize: 16,
      fontWeight: '700',
    },
    verifiedDetails: {
      gap: 12,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    detailLabel: {
      fontSize: 14,
      fontWeight: '500',
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '700',
    },
  
    // ========================================
    // FUNDING SUMMARY
    // ========================================
    summaryCard: {
      marginTop: 20,
      padding: 16,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    summaryLabel: {
      fontSize: 14,
      fontWeight: '500',
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '600',
    },
    totalRow: {
      marginTop: 8,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0, 0, 0, 0.1)',
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '700',
    },
    totalValue: {
      fontSize: 18,
      fontWeight: '700',
    },
  
    // ========================================
    // CHANGE ACCOUNT BUTTON
    // ========================================
    changeAccountButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1.5,
      marginTop: 16,
      gap: 8,
    },
    changeAccountText: {
      fontSize: 15,
      fontWeight: '600',
    },
  
    // ========================================
    // ERROR DISPLAY
    // ========================================
    errorContainer: {
      marginTop: 16,
      padding: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    errorText: {
      fontSize: 14,
      fontWeight: '500',
      flex: 1,
    },
  
    // ========================================
    // STICKY FOOTER
    // ========================================
    stickyFooter: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
      borderTopWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 5,
    },
    footerContent: {
      marginBottom: 12,
    },
    footerLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    footerPrice: {
      fontSize: 22,
      fontWeight: '700',
    },
    fundButton: {
      width: '100%',
    },
  });