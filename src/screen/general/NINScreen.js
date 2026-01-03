// screens/VerifyNINScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Shared Components
import {
  ScreenHeader,
  TabSelector,
  PayButton,
  ConfirmationModal,
  PinModal,
  ResultModal,
  LoadingOverlay,
  BeneficiaryInput,
} from 'component/SHARED';

// Custom Components
// import BeneficiaryInput from 'component/SHARED/INPUT/BeneficiaryInput';
import PinSetupModal from 'component/PinSetUpModal';
import VerificationSlip from 'component/VerificationSlip';

// Hooks & Context
import { useServicePayment } from 'HOOKS/UseServicePayment';
import { useWallet } from 'context/WalletContext';

// Services
import {
  verifyNIN,
  verifyBVN,
  searchNINByPhone,
  searchBVNByPhone,
} from 'AuthFunction/verification';

// Constants & Utils
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { StatusBarComponent } from 'component/StatusBar';
import TestPhotoDisplay from 'component/TestPhotoSlip';

/**
 * Input Field Component
 */
const InputField = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder,
  error,
  themeColors,
  icon,
  keyboardType = 'default',
  maxLength,
}) => (
  <View style={styles.inputContainer}>
    <Text style={[styles.inputLabel, { color: themeColors.heading }]}>
      {label}
    </Text>
    <View style={[
      styles.inputWrapper,
      {
        backgroundColor: themeColors.background,
        borderColor: error ? themeColors.destructive : themeColors.border,
      }
    ]}>
      <Ionicons 
        name={icon} 
        size={20} 
        color={themeColors.subtext}
        style={styles.inputIcon}
      />
      <BeneficiaryInput
        value={value}
        onChangeText={onChangeText}
        serviceType={`verification_${label.toLowerCase()}`}
        placeholder={placeholder}
        error={error}
        keyboardType={keyboardType}
        maxLength={maxLength}
        icon={icon}
        identifierField="value"
        displayField={(item) => item.value}
      />
    </View>
    {error && (
      <Text style={[styles.errorText, { color: themeColors.destructive }]}>
        {error}
      </Text>
    )}
  </View>
);

/**
 * Verify NIN/BVN Screen - Refactored with Payment Flow
 */
export default function NINScreen({ navigation, route }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { wallet, refreshWallet } = useWallet();
  const [hasConsent, setHasConsent] = useState(false);

  // Tab state
  const [selectedTab, setSelectedTab] = useState('NIN');
  
  // Search mode: 'number' or 'phone'
  const [searchMode, setSearchMode] = useState('number');

  // Input states
  const [ninNumber, setNinNumber] = useState('');
  const [ninPhone, setNinPhone] = useState('');
  const [bvnNumber, setBvnNumber] = useState('');
  const [bvnPhone, setBvnPhone] = useState('');

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  // Verification result (for showing slip)
  const [verificationResult, setVerificationResult] = useState(null);
  const [showSlip, setShowSlip] = useState(false);

  // Check if already verified
  const isNINVerified = wallet?.user?.isNINVerified || false;
  const isBVNVerified = wallet?.user?.isBVNVerified || false;

  // ========================================
  // VALIDATION FUNCTION
  // ========================================
  const validateVerificationPayment = useCallback((paymentData) => {
    console.log('🔍 Validating verification payment:', paymentData);
    
    const errors = {};

    if (paymentData.searchMode === 'number') {
      // Validate NIN or BVN number
      const numberField = paymentData.verificationType === 'NIN' ? 'nin' : 'bvn';
      const number = paymentData[numberField];
      
      if (!number) {
        errors[numberField] = `${paymentData.verificationType} is required`;
      } else if (!/^\d{11}$/.test(number)) {
        errors[numberField] = `${paymentData.verificationType} must be exactly 11 digits`;
      }
    } else {
      // Validate phone number
      const phone = paymentData.phone;
      
      if (!phone) {
        errors.phone = 'Phone number is required';
      } else if (!/^0\d{10}$/.test(phone)) {
        errors.phone = 'Invalid phone number format';
      }
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
  // EXECUTE PURCHASE FUNCTION
  // ========================================
  const executeVerificationPurchase = useCallback(async (pin, paymentData) => {
    console.log('🔐 Executing verification purchase with PIN:', pin);
    console.log('📦 Payment data:', paymentData);

    const { verificationType, searchMode } = paymentData;

    if (verificationType === 'NIN') {
      if (searchMode === 'number') {
        return await verifyNIN(pin, { nin: paymentData.nin });
      } else {
        return await searchNINByPhone(pin, { phone: paymentData.phone });
      }
    } else {
      if (searchMode === 'number') {
        return await verifyBVN(pin, { bvn: paymentData.bvn });
      } else {
        return await searchBVNByPhone(pin, { phone: paymentData.phone });
      }
    }
  }, []);
  
  // ========================================
  // UNIFIED PAYMENT HOOK
  // ========================================
  const payment = useServicePayment({
    serviceName: `${selectedTab} Verification`,
    validatePayment: validateVerificationPayment,
    executePurchase: executeVerificationPurchase,
    navigation,
    route,
  });

  // ========================================
  // RESTORE FORM DATA AFTER PIN SETUP
  // ========================================
  useEffect(() => {
    payment.restoreFormData((data) => {
      console.log('📝 Restoring verification form:', data);
      setSearchMode(data.searchMode);
      
      if (data.verificationType === 'NIN') {
        if (data.searchMode === 'number') {
          setNinNumber(data.nin);
        } else {
          setNinPhone(data.phone);
        }
      } else {
        if (data.searchMode === 'number') {
          setBvnNumber(data.bvn);
        } else {
          setBvnPhone(data.phone);
        }
      }
    });
  }, [payment.pendingPaymentData]);

  // ========================================
  // INITIAL WALLET LOAD
  // ========================================
  useEffect(() => {
    refreshWallet();
  }, []);

  // ========================================
  // HANDLERS
  // ========================================
  const handleVerify = useCallback(() => {
    // Clear errors
    setValidationErrors({});

    if (!hasConsent) {
      Alert.alert(
        'Consent Required',
        'Please confirm your consent to verify your identity before proceeding.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Prepare payment data
    const paymentData = {
      verificationType: selectedTab,
      searchMode,
    };

    // Get amount based on type and mode
    let amount = 0;
    if (selectedTab === 'NIN') {
      amount = searchMode === 'number' ? 150 : 200;
      if (searchMode === 'number') {
        paymentData.nin = ninNumber;
      } else {
        paymentData.phone = ninPhone;
      }
    } else {
      amount = searchMode === 'number' ? 100 : 150;
      if (searchMode === 'number') {
        paymentData.bvn = bvnNumber;
      } else {
        paymentData.phone = bvnPhone;
      }
    }

    paymentData.amount = amount;

    console.log('💳 Initiating verification payment:', paymentData);

    // Initiate payment (handles PIN check automatically)
    payment.initiatePayment(paymentData);
  }, [selectedTab, searchMode, ninNumber, ninPhone, bvnNumber, bvnPhone, payment, hasConsent]);

  const handleTransactionComplete = useCallback(() => {
    console.log('🎯 Transaction complete, result:', payment.result);
    
    // Store verification result for slip display
    if (payment.result?.data) {
      setVerificationResult({
        ...payment.result.data,
        verificationType: selectedTab,
      });
      setShowSlip(true);
    }
    
    payment.resetFlow();
  }, [payment, selectedTab]);

  const handleCloseSlip = useCallback(() => {
    setShowSlip(false);
    setVerificationResult(null);
    
    // Reset form
    setNinNumber('');
    setNinPhone('');
    setBvnNumber('');
    setBvnPhone('');
    setSearchMode('number');
  }, []);

  // ========================================
  // TAB CHANGE HANDLER
  // ========================================
  const handleTabChange = useCallback((tab) => {
    setSelectedTab(tab);
    setVerificationResult(null);
    setValidationErrors({});
    setSearchMode('number');
    setShowSlip(false);
    
    // Reset inputs
    setNinNumber('');
    setNinPhone('');
    setBvnNumber('');
    setBvnPhone('');
  }, []);

  // ========================================
  // TABS CONFIGURATION
  // ========================================
  const tabs = [
    { label: 'NIN Verification', value: 'NIN' },
    { label: 'BVN Verification', value: 'BVN' },
  ];

  // ========================================
  // GET CURRENT AMOUNT
  // ========================================
  const getCurrentAmount = () => {
    if (selectedTab === 'NIN') {
      return searchMode === 'number' ? 150 : 200;
    } else {
      return searchMode === 'number' ? 100 : 150;
    }
  };

  // ========================================
  // LOADING STATE
  // ========================================
  if (wallet?.isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ScreenHeader title="Identity Verification" onBackPress={() => navigation.goBack()} />
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
        title="NIN/BVN"
        onBackPress={() => navigation.goBack()}
        rightText="History"
        onRightPress={() => navigation.navigate('MainTabs', { screen: 'Orders' })}
      />

      {/* Show Verification Slip */}
      {showSlip && verificationResult && (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <VerificationSlip
            data={verificationResult}
            verificationType={verificationResult.verificationType}
            themeColors={themeColors}
          />
          
          <PayButton
            title="Done"
            onPress={handleCloseSlip}
            style={styles.doneButton}
          />
        </ScrollView>
      )}

{/* ===================== */}
{/* {verificationResult && (
  <TestPhotoDisplay
    photoData={verificationResult.photo}
    themeColors={themeColors}
  />
)} */}


      {/* Main Form */}
      {!showSlip && (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Tabs */}
          <TabSelector
            tabs={tabs}
            selectedTab={selectedTab}
            onTabChange={handleTabChange}
          />

          {/* Already Verified Notice */}
          {((selectedTab === 'NIN' && isNINVerified) || (selectedTab === 'BVN' && isBVNVerified)) && (
            <View style={[styles.verifiedNotice, { backgroundColor: '#4CAF5020' }]}>
              <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
              <Text style={[styles.verifiedText, { color: '#4CAF50' }]}>
                Your {selectedTab} is already verified
              </Text>
            </View>
          )}

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: `${themeColors.primary}15` }]}>
            <Ionicons name="shield-checkmark-outline" size={40} color={themeColors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: themeColors.heading }]}>
                {selectedTab} Verification
              </Text>
              <Text style={[styles.infoText, { color: themeColors.subheading }]}>
  {selectedTab === 'NIN' 
    ? 'Verify and print out your NIN slip with photo and full details instantly'
    : 'Verify and print out your BVN slip with photo and full details instantly'
  }
</Text>
            </View>
          </View>

          {/* Search Mode Toggle */}
          <View style={styles.searchModeContainer}>
            <TouchableOpacity
              style={[
                styles.searchModeButton,
                searchMode === 'number' && { backgroundColor: themeColors.primary },
                searchMode !== 'number' && { backgroundColor: themeColors.card },
              ]}
              onPress={() => setSearchMode('number')}
            >
              <Text style={[
                styles.searchModeText,
                { color: searchMode === 'number' ? '#FFFFFF' : themeColors.heading },
              ]}>
                By {selectedTab} Number
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.searchModeButton,
                searchMode === 'phone' && { backgroundColor: themeColors.primary },
                searchMode !== 'phone' && { backgroundColor: themeColors.card },
              ]}
              onPress={() => setSearchMode('phone')}
            >
              <Text style={[
                styles.searchModeText,
                { color: searchMode === 'phone' ? '#FFFFFF' : themeColors.heading },
              ]}>
                By Phone Number
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input Forms */}
          {selectedTab === 'NIN' ? (
            searchMode === 'number' ? (
              <InputField
                label="National Identity Number (NIN)"
                value={ninNumber}
                onChangeText={setNinNumber}
                placeholder="Enter your 11-digit NIN"
                error={validationErrors.nin}
                themeColors={themeColors}
                icon="card-outline"
                keyboardType="numeric"
                maxLength={11}
              />
            ) : (
              <InputField
                label="Phone Number"
                value={ninPhone}
                onChangeText={setNinPhone}
                placeholder="Enter phone number linked to NIN"
                error={validationErrors.phone}
                themeColors={themeColors}
                icon="call-outline"
                keyboardType="phone-pad"
                maxLength={11}
              />
            )
          ) : (
            searchMode === 'number' ? (
              <InputField
                label="Bank Verification Number (BVN)"
                value={bvnNumber}
                onChangeText={setBvnNumber}
                placeholder="Enter your 11-digit BVN"
                error={validationErrors.bvn}
                themeColors={themeColors}
                icon="card-outline"
                keyboardType="numeric"
                maxLength={11}
              />
            ) : (
              <InputField
                label="Phone Number"
                value={bvnPhone}
                onChangeText={setBvnPhone}
                placeholder="Enter phone number linked to BVN"
                error={validationErrors.phone}
                themeColors={themeColors}
                icon="call-outline"
                keyboardType="phone-pad"
                maxLength={11}
              />
            )
          )}

          {/* Error Display */}
          {payment.flowError && (
            <View style={[styles.errorContainer, { backgroundColor: `${themeColors.destructive}20` }]}>
              <Text style={[styles.errorText, { color: themeColors.destructive }]}>
                {payment.flowError}
              </Text>
            </View>
          )}

          {/* Submit Button */}
          <PayButton
            title={`Verify ${selectedTab} - ${formatCurrency(getCurrentAmount(), 'NGN')}`}
            onPress={handleVerify}
            loading={payment.step === 'processing'}
            disabled={payment.step === 'processing'}
            style={styles.submitButton}
          />

{/* Consent Section */}
<View style={[styles.consentCard, { backgroundColor: themeColors.card }]}>
  <View style={styles.consentHeader}>
    <Ionicons name="shield-checkmark" size={24} color={themeColors.primary} />
    <Text style={[styles.consentTitle, { color: themeColors.heading }]}>
      Verification Consent
    </Text>
  </View>
  
  <Text style={[styles.consentText, { color: themeColors.subheading }]}>
    I hereby confirm that I have given my consent to verify my {selectedTab} and 
    understand that this information will be used in compliance with data protection 
    regulations. I am aware that a service fee of {formatCurrency(getCurrentAmount(), 'NGN')} 
    will be charged for this verification.
  </Text>

  <View style={styles.consentToggle}>
    <Switch
      value={hasConsent}
      onValueChange={setHasConsent}
      trackColor={{ false: themeColors.border, true: themeColors.primary }}
      thumbColor={hasConsent ? '#FFFFFF' : '#f4f3f4'}
      ios_backgroundColor={themeColors.border}
    />
    <Text style={[styles.consentLabel, { color: themeColors.heading }]}>
      I give my consent to verify my {selectedTab}
    </Text>
  </View>
</View>q1 

          {/* Privacy Note */}
          <View style={[styles.noteCard, { backgroundColor: themeColors.card }]}>
            <Ionicons name="lock-closed-outline" size={20} color={themeColors.primary} />
            <Text style={[styles.noteText, { color: themeColors.subheading }]}>
              Your personal information is encrypted and secure. We comply with all data protection regulations.
            </Text>
          </View>

          {/* Pricing Info */}
          <View style={[styles.pricingCard, { backgroundColor: `${themeColors.primary}10` }]}>
            <Ionicons name="information-circle-outline" size={20} color={themeColors.primary} />
            <View style={styles.pricingContent}>
              <Text style={[styles.pricingText, { color: themeColors.heading }]}>
                Verification Fee: {formatCurrency(getCurrentAmount(), 'NGN')}
              </Text>
              <Text style={[styles.pricingSubtext, { color: themeColors.subheading }]}>
                One-time payment for instant verification
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ========================================
          MODALS - Using Unified System
          ======================================== */}

      {/* PIN Setup Modal */}
      <PinSetupModal
        visible={payment.showPinSetupModal}
        serviceName={`${selectedTab} Verification`}
        paymentAmount={getCurrentAmount()}
        onCreatePin={payment.handleCreatePin}
        onCancel={payment.handleCancelPinSetup}
        isDarkMode={isDarkMode}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={payment.step === 'confirm'}
        onClose={payment.handleCancelPayment}
        onConfirm={payment.confirmPayment}
        amount={getCurrentAmount()}
        serviceName={`${selectedTab} ${searchMode === 'number' ? 'Verification' : 'Phone Search'}`}
        recipient={
          selectedTab === 'NIN' 
            ? (searchMode === 'number' ? ninNumber : ninPhone)
            : (searchMode === 'number' ? bvnNumber : bvnPhone)
        }
        recipientLabel={searchMode === 'number' ? `${selectedTab} Number` : 'Phone Number'}
        walletBalance={wallet?.user?.walletBalance}
        additionalDetails={[
          { label: 'Verification Type', value: selectedTab },
          { label: 'Search Method', value: searchMode === 'number' ? 'By Number' : 'By Phone' },
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
        subtitle={`Confirm ${selectedTab} verification - ${formatCurrency(getCurrentAmount(), 'NGN')}`}
      />

      {/* Success/Error Result Modal */}
      <ResultModal
        visible={payment.step === 'result'}
        onClose={payment.resetFlow}
        type={payment.result ? 'success' : 'error'}
        title={payment.result ? 'Verification Successful!' : 'Verification Failed'}
        message={
          payment.result
            ? `Your ${selectedTab} has been verified successfully. You can now view and download your verification slip.`
            : `Your ${selectedTab} verification could not be completed. Please try again.`
        }
        primaryAction={{
          label: 'View Slip',
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
        message="Verifying your identity..."
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
    paddingHorizontal: 16,
    paddingBottom: 40,
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

  // ========================================
  // VERIFIED NOTICE
  // ========================================
  verifiedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 8,
    gap: 12,
  },
  verifiedText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },

  // ========================================
  // INFO CARD
  // ========================================
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 24,
    gap: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },

  // ========================================
  // SEARCH MODE TOGGLE
  // ========================================
  searchModeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  searchModeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchModeText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // ========================================
  // INPUT FIELDS
  // ========================================
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    borderRadius: 10,
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: 10,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  errorContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },

  // ========================================
  // BENEFITS
  // ========================================
  benefitsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  // ========================================
  // NOTE CARD
  // ========================================
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  // ========================================
  // PRICING CARD
  // ========================================
  pricingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  pricingContent: {
    flex: 1,
  },
  pricingText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  pricingSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },

  // ========================================
  // BUTTONS
  // ========================================
  submitButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  doneButton: {
    marginTop: 24,
  },
  consentCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  consentText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  consentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  consentLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});