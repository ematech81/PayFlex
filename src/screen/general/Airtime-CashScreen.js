import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Clipboard,
  ActivityIndicator,
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
} from 'component/SHARED';

// Custom Components
// import BeneficiaryInput from 'component/SHARED/INPUT/BeneficiaryInput';
import AmountInput from 'component/SHARED/INPUT/amountInput';
import { useServicePayment } from 'HOOKS/UseServicePayment';
import PinSetupModal from 'component/PinSetUpModal';
import { useWallet } from 'context/WalletContext';

// Constants & Utils
import { NETWORK_PROVIDERS } from 'CONSTANT/providerConstant';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { StatusBarComponent } from 'component/StatusBar';
import { verifyAirtimeToCash, convertAirtimeToCash } from 'AuthFunction/paymentService';

/**
 * Transfer Instructions Card
 */
const TransferInstructionsCard = ({ transferPhone, network, amount, onCopyPhone, themeColors }) => (
  <View style={[styles.instructionsCard, { backgroundColor: `${themeColors.primary}10` }]}>
    <View style={styles.instructionsHeader}>
      <Ionicons name="information-circle" size={24} color={themeColors.primary} />
      <Text style={[styles.instructionsTitle, { color: themeColors.heading }]}>
        Transfer Instructions
      </Text>
    </View>

    <View style={styles.instructionsContent}>
      <Text style={[styles.instructionStep, { color: themeColors.subheading }]}>
        1. Transfer exactly <Text style={{ fontWeight: '700' }}>₦{amount}</Text> airtime from your {network?.toUpperCase()} line
      </Text>
      
      <View style={styles.phoneNumberBox}>
        <View style={styles.phoneNumberLeft}>
          <Text style={[styles.phoneLabel, { color: themeColors.subheading }]}>
            Transfer to:
          </Text>
          <Text style={[styles.phoneNumber, { color: themeColors.heading }]}>
            {transferPhone}
          </Text>
        </View>
        <TouchableOpacity onPress={onCopyPhone} style={[styles.copyButton, { backgroundColor: themeColors.primary }]}>
          <Ionicons name="copy-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Text style={[styles.instructionStep, { color: themeColors.subheading }]}>
        2. After transfer, click "I've Transferred" below
      </Text>
      
      <Text style={[styles.instructionStep, { color: themeColors.subheading }]}>
        3. Your wallet will be credited once we receive the airtime
      </Text>
    </View>

    <View style={[styles.warningBox, { backgroundColor: `${themeColors.destructive}15` }]}>
      <Ionicons name="warning" size={16} color={themeColors.destructive} />
      <Text style={[styles.warningText, { color: themeColors.destructive }]}>
        Transfer the exact amount. Wrong amounts may delay processing.
      </Text>
    </View>
  </View>
);

/**
 * Airtime to Cash Conversion Screen
 */
export default function AirtimeToCashScreen({ navigation, route }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { wallet, refreshWallet } = useWallet();

  // Local State
  const [network, setNetwork] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Service Verification State
  const [verifying, setVerifying] = useState(false);
  const [serviceAvailable, setServiceAvailable] = useState(false);
  const [transferPhone, setTransferPhone] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  // Charge calculation
  const chargePercentage = 2;
  const calculateCharge = (amt) => (amt * chargePercentage) / 100;
  const calculateCredit = (amt) => amt - calculateCharge(amt);

  // ========================================
  // VALIDATION FUNCTION
  // ========================================
  const validateConversion = useCallback((conversionData) => {
    console.log('🔍 Validating conversion:', conversionData);
    
    const errors = {};

    // Phone validation
    const cleanPhone = (conversionData.senderNumber || '').replace(/\s/g, '');
    const phoneRegex = /^0\d{10}$/;
    
    if (!cleanPhone) {
      errors.senderNumber = 'Phone number is required';
    } else if (cleanPhone.length !== 11) {
      errors.senderNumber = 'Phone number must be 11 digits';
    } else if (!phoneRegex.test(cleanPhone)) {
      errors.senderNumber = 'Invalid Nigerian phone number';
    }

    if (!conversionData.network) {
      errors.network = 'Please select a network';
    }

    if (!conversionData.amount || conversionData.amount < 100) {
      errors.amount = 'Minimum amount is ₦100';
    }

    if (conversionData.amount > 50000) {
      errors.amount = 'Maximum amount is ₦50,000';
    }

    if (!conversionData.sitePhone) {
      errors.sitePhone = 'Transfer phone number missing';
    }

    const isValid = Object.keys(errors).length === 0;
    console.log('✅ Validation result:', { isValid, errors });
    setValidationErrors(errors);

    return { isValid, errors };
  }, []);

  // ========================================
  // UNIFIED PAYMENT HOOK
  // ========================================
  const payment = useServicePayment({
    serviceName: 'Airtime Conversion',
    validatePayment: validateConversion,
    executePurchase: async (pin, conversionData) => {
      return await convertAirtimeToCash(pin, conversionData);
    },
    navigation,
    route,
  });

  // ========================================
  // RESTORE FORM DATA
  // ========================================
  useEffect(() => {
    payment.restoreFormData((data) => {
      console.log('📝 Restoring conversion form:', data);
      setSenderNumber(data.senderNumber);
      setNetwork(data.network);
      setAmount(data.amount?.toString());
      setTransferPhone(data.sitePhone);
      setServiceAvailable(true);
      setShowInstructions(true);
    });
  }, [payment.pendingPaymentData]);

  // ========================================
  // INITIAL WALLET LOAD
  // ========================================
  useEffect(() => {
    refreshWallet();
  }, []);

  // ========================================
  // VERIFY SERVICE AVAILABILITY
  // ========================================
  const handleVerifyService = useCallback(async () => {
    if (!network) {
      Alert.alert('Error', 'Please select a network first');
      return;
    }

    try {
      setVerifying(true);
      const result = await verifyAirtimeToCash(network);
      
      if (result.success) {
        setServiceAvailable(true);
        setTransferPhone(result.data.phoneNumber);
        setShowInstructions(true);
        Alert.alert(
          'Service Available',
          `Transfer your airtime to: ${result.data.phoneNumber}`,
          [{ text: 'OK' }]
        );
      } else {
        setServiceAvailable(false);
        Alert.alert('Service Unavailable', result.message);
      }
    } catch (error) {
      setServiceAvailable(false);
      Alert.alert('Error', error.message || 'Failed to verify service');
    } finally {
      setVerifying(false);
    }
  }, [network]);

  // ========================================
  // RESET SERVICE
  // ========================================
  const handleResetService = useCallback(() => {
    setServiceAvailable(false);
    setShowInstructions(false);
    setTransferPhone('');
  }, []);

  // ========================================
  // COPY PHONE NUMBER
  // ========================================
  const handleCopyPhone = useCallback(() => {
    Clipboard.setString(transferPhone);
    Alert.alert('Copied!', 'Phone number copied to clipboard');
  }, [transferPhone]);

  // ========================================
  // INITIATE CONVERSION
  // ========================================
  const handleConvert = useCallback(() => {
    setValidationErrors({});

    const cleanPhone = senderNumber.replace(/\s/g, '');
    const numericAmount = parseFloat(amount);

    const conversionData = {
      network,
      senderNumber: cleanPhone,
      amount: numericAmount,
      sitePhone: transferPhone,
    };

    payment.initiatePayment(conversionData);
  }, [senderNumber, network, amount, transferPhone, payment]);

  const handleTransactionComplete = useCallback(() => {
    payment.handleTransactionComplete(payment.result?.reference);
  }, [payment]);

  // ========================================
  // LOADING STATE
  // ========================================
  if (wallet?.isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ScreenHeader title="Airtime to Cash" onBackPress={() => navigation.goBack()} />
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
        title="Airtime to Cash"
        onBackPress={() => navigation.goBack()}
        rightText="History"
        onRightPress={() => navigation.navigate('History')}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: themeColors.card }]}>
          <Ionicons name="cash-outline" size={32} color={themeColors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: themeColors.heading }]}>
              Convert Airtime to Cash
            </Text>
            <Text style={[styles.infoDescription, { color: themeColors.subheading }]}>
              Transfer airtime and get cash credited directly to your bank account
            </Text>
          </View>
        </View>

        {/* Network Selection */}
        <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
          Select Network
        </Text>
        <ProviderSelector
          providers={NETWORK_PROVIDERS}
          value={network}
          onChange={(value) => {
            setNetwork(value);
            handleResetService();
          }}
          placeholder="Select Network"
          error={validationErrors.network}
          disabled={serviceAvailable}
        />

        {/* Verify Service Button */}
        {!serviceAvailable && network && (
          <PayButton
            title="Check Availability"
            onPress={handleVerifyService}
            loading={verifying}
            style={styles.verifyButton}
            icon="shield-checkmark-outline"
          />
        )}

        {/* Service Available - Show Form */}
        {serviceAvailable && (
          <>
            {/* Transfer Instructions */}
            {showInstructions && (
              <TransferInstructionsCard
                transferPhone={transferPhone}
                network={network}
                amount={amount || '0'}
                onCopyPhone={handleCopyPhone}
                themeColors={themeColors}
              />
            )}

            {/* Sender Number */}
            <BeneficiaryInput
              value={senderNumber}
              onChangeText={setSenderNumber}
              onNetworkDetected={setNetwork}
              serviceType="airtime_conversion"
              placeholder="08XX-XXX-XXXX"
              label="Your Phone Number"
              error={validationErrors.senderNumber}
              keyboardType="phone-pad"
              maxLength={11}
              icon="call-outline"
              identifierField="senderNumber"
              secondaryField="network"
              displayField={(item) => `${item.senderNumber} - ${item.network?.toUpperCase()}`}
              enableNetworkDetection={true}
              enableValidation={true}
            />

            {/* Amount */}
            <AmountInput
              value={amount}
              onChangeText={setAmount}
              label="Amount to Convert"
              placeholder="Enter amount"
              error={validationErrors.amount}
              minAmount={100}
              maxAmount={50000}
            />

            {/* Conversion Summary */}
            {amount && parseFloat(amount) >= 100 && (
              <View style={[styles.summaryCard, { backgroundColor: themeColors.card }]}>
                <Text style={[styles.summaryTitle, { color: themeColors.heading }]}>
                  Conversion Summary
                </Text>
                
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: themeColors.subheading }]}>
                    Airtime Amount:
                  </Text>
                  <Text style={[styles.summaryValue, { color: themeColors.heading }]}>
                    {formatCurrency(parseFloat(amount), 'NGN')}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: themeColors.subheading }]}>
                    Charge (2%):
                  </Text>
                  <Text style={[styles.summaryValue, { color: themeColors.destructive }]}>
                    -{formatCurrency(calculateCharge(parseFloat(amount)), 'NGN')}
                  </Text>
                </View>

                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={[styles.summaryLabel, styles.totalLabel, { color: themeColors.heading }]}>
                    You'll Receive:
                  </Text>
                  <Text style={[styles.summaryValue, styles.totalValue, { color: themeColors.primary }]}>
                    {formatCurrency(calculateCredit(parseFloat(amount)), 'NGN')}
                  </Text>
                </View>
              </View>
            )}

            {/* Change Network Button */}
            <TouchableOpacity
              style={[styles.changeNetworkButton, { borderColor: themeColors.border }]}
              onPress={handleResetService}
            >
              <Ionicons name="refresh" size={20} color={themeColors.primary} />
              <Text style={[styles.changeNetworkText, { color: themeColors.primary }]}>
                Change Network
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Error Display */}
        {payment.flowError && (
          <View style={[styles.errorContainer, { backgroundColor: `${themeColors.destructive}20` }]}>
            <Text style={[styles.errorText, { color: themeColors.destructive }]}>
              {payment.flowError}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky Convert Button */}
      {serviceAvailable && amount && parseFloat(amount) >= 100 && (
        <View 
          style={[
            styles.stickyFooter,
            {
              marginBottom: insets.bottom + 8,
              borderColor: themeColors.border,
            },
          ]}
        >
          <PayButton
            title="I've Transferred Airtime"
            onPress={handleConvert}
            disabled={payment.step === 'processing'}
            loading={payment.step === 'processing'}
            style={styles.convertButton}
          />
        </View>
      )}

      {/* ========================================
          MODALS
          ======================================== */}

      <PinSetupModal
        visible={payment.showPinSetupModal}
        serviceName="Airtime Conversion"
        paymentAmount={amount ? calculateCredit(parseFloat(amount)) : 0}
        onCreatePin={payment.handleCreatePin}
        onCancel={payment.handleCancelPinSetup}
        isDarkMode={isDarkMode}
      />

      <ConfirmationModal
        visible={payment.step === 'confirm'}
        onClose={payment.handleCancelPayment}
        onConfirm={payment.confirmPayment}
        amount={amount ? calculateCredit(parseFloat(amount)) : 0}
        serviceName={`${network?.toUpperCase()} Airtime Conversion`}
        providerLogo={NETWORK_PROVIDERS.find(p => p.value === network)?.logo}
        providerName={network?.toUpperCase()}
        recipient={senderNumber.replace(/\s/g, '')}
        recipientLabel ="Phone Number"
walletBalance={wallet?.user?.walletBalance}
additionalDetails={[
{ label: 'Airtime Amount', value: formatCurrency(parseFloat(amount || 0), 'NGN') },
{ label: 'Charge', value: formatCurrency(calculateCharge(parseFloat(amount || 0)), 'NGN') },
{ label: 'Transfer To', value: transferPhone },
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
    subtitle="Confirm airtime conversion request"
  />

  <ResultModal
    visible={payment.step === 'result'}
    onClose={payment.resetFlow}
    type={payment.result ? 'success' : 'error'}
    title={payment.result ? 'Request Submitted!' : 'Request Failed'}
    message={
      payment.result
        ? `Your conversion request has been submitted. Your wallet will be credited once we receive your airtime transfer of ${formatCurrency(parseFloat(amount || 0), 'NGN')}.`
        : 'Your conversion request could not be completed. Please try again.'
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
    message="Processing conversion..."
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
    // VERIFY BUTTON
    // ========================================
    verifyButton: {
      marginTop: 16,
      marginBottom: 8,
    },
  
    // ========================================
    // TRANSFER INSTRUCTIONS CARD
    // ========================================
    instructionsCard: {
      marginTop: 20,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    instructionsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 8,
    },
    instructionsTitle: {
      fontSize: 16,
      fontWeight: '700',
    },
    instructionsContent: {
      gap: 12,
    },
    instructionStep: {
      fontSize: 14,
      lineHeight: 20,
      paddingLeft: 8,
    },
    phoneNumberBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      padding: 12,
      borderRadius: 8,
      marginVertical: 8,
    },
    phoneNumberLeft: {
      flex: 1,
    },
    phoneLabel: {
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 4,
    },
    phoneNumber: {
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 1,
    },
    copyButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 12,
    },
    warningBox: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
      gap: 8,
    },
    warningText: {
      flex: 1,
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 16,
    },
  
    // ========================================
    // CONVERSION SUMMARY
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
    // CHANGE NETWORK BUTTON
    // ========================================
    changeNetworkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1.5,
      marginTop: 16,
      gap: 8,
    },
    changeNetworkText: {
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
    convertButton: {
      width: '100%',
    },
  });