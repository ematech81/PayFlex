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
} from 'component/SHARED';

// Custom Components
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

// Network-specific USSD guide (from VTU Africa documentation)
// PIN shown is the default airtime transfer PIN on the user's own SIM (0000).
const USSD_GUIDE = {
  mtn: {
    transfer: (phone, amount) => `*321*${phone}*${amount}*0000#`,
    changePin: '*321*0000*NEWPIN*NEWPIN#',
    changePinExample: 'e.g. *321*0000*1234*1234#',
  },
  glo: {
    transfer: (phone, amount) => `*131*${phone}*${amount}*0000#`,
    changePin: '*132*0000*NEWPIN*NEWPIN#',
    changePinExample: 'e.g. *132*0000*1234*1234#',
    maxPerTransfer: 1000,
  },
  '9mobile': {
    transfer: (phone, amount) => `*223*0000*${amount}*${phone}#`,
    changePin: '*247*0000*NEWPIN#',
    changePinExample: 'e.g. *247*0000*1234#',
  },
  airtel: {
    transfer: null,
    changePin: null,
  },
};

/**
 * Read Before You Proceed — shown immediately when the screen opens.
 * Collapsible. Contains all key conditions, rates, and USSD codes.
 */
const BeforeYouProceedCard = ({ themeColors }) => {
  const [expanded, setExpanded] = useState(true);

  const rates = [
    { network: 'MTN',    deduction: '30%', eg: '₦1,000 → ₦700' },
    { network: 'GLO',    deduction: '45%', eg: '₦1,000 → ₦550' },
    { network: 'Airtel', deduction: '35%', eg: '₦1,000 → ₦650' },
    { network: '9mobile',deduction: '45%', eg: '₦1,000 → ₦550' },
  ];

  const ussdCodes = [
    { network: 'MTN',     code: '*321*[number]*[amount]*[pin]#' },
    { network: 'GLO',     code: '*131*[number]*[amount]*[pin]#' },
    { network: '9mobile', code: '*223*[pin]*[amount]*[number]#' },
    { network: 'Airtel',  code: 'Use standard airtime share method' },
  ];

  return (
    <View style={[styles.beforeCard, { backgroundColor: themeColors.card, borderColor: '#E67E2230' }]}>
      <TouchableOpacity
        style={styles.beforeCardHeader}
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.7}
      >
        <View style={styles.beforeCardHeaderLeft}>
          <Ionicons name="alert-circle" size={20} color="#E67E22" />
          <Text style={[styles.beforeCardTitle, { color: themeColors.heading }]}>
            Read Before You Proceed
          </Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={themeColors.subheading} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.beforeCardBody}>

          {/* Conditions */}
          <Text style={styles.beforeSection}>Important Conditions</Text>
          {[
            'You must have an account with us to convert airtime.',
            'Minimum ₦100. Maximum is any amount — except GLO which is ₦1,000 per transfer.',
            'If your SIM has no airtime transfer PIN set, load one first before transferring.',
            'You must send the airtime within 30 minutes — the transaction auto-cancels after that.',
            'Transfer the exact amount you enter in the form. Wrong amounts delay or fail processing.',
            'Airtime transfer only — recharge cards or VTU sent to us will not be credited.',
          ].map((cond, i) => (
            <Text key={i} style={[styles.beforeItem, { color: themeColors.subheading }]}>
              {i + 1}. {cond}
            </Text>
          ))}

          {/* Rates */}
          <Text style={styles.beforeSection}>Conversion Rates</Text>
          <View style={styles.ratesGrid}>
            {rates.map(r => (
              <View key={r.network} style={[styles.rateChip, { backgroundColor: `${themeColors.primary}10`, borderColor: themeColors.border }]}>
                <Text style={[styles.rateChipNetwork, { color: themeColors.heading }]}>{r.network}</Text>
                <Text style={styles.rateChipDeduction}>-{r.deduction}</Text>
                <Text style={[styles.rateChipEg, { color: themeColors.subheading }]}>{r.eg}</Text>
              </View>
            ))}
          </View>

          {/* USSD codes */}
          <Text style={styles.beforeSection}>How to Transfer Airtime (USSD Codes)</Text>
          <Text style={[styles.beforeNote, { color: themeColors.subheading }]}>
            Use the USSD code for your network to transfer airtime to the number we provide after verification:
          </Text>
          {ussdCodes.map(u => (
            <View key={u.network} style={styles.ussdRow}>
              <Text style={[styles.ussdRowNetwork, { color: themeColors.heading }]}>{u.network}:</Text>
              <Text style={[styles.ussdRowCode, { color: themeColors.subheading }]}>{u.code}</Text>
            </View>
          ))}
          <Text style={[styles.beforeNote, { color: themeColors.subheading, marginTop: 8 }]}>
            💡 The default airtime transfer PIN on most networks is <Text style={{ fontWeight: '700' }}>0000</Text>. If you have changed yours, use your custom PIN instead.
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * Conversion Details Card — shown after availability check returns the transfer phone.
 * Steps the user through the required USSD transfer and then entering the amount.
 */
const ConversionDetailsCard = ({ transferPhone, network, amount, deductionRate, onCopyPhone, themeColors }) => {
  const numAmount  = parseFloat(amount);
  const hasAmount  = !isNaN(numAmount) && numAmount >= 100;
  const charge     = hasAmount && deductionRate != null ? Math.round(numAmount * deductionRate)       : null;
  const receivable = hasAmount && deductionRate != null ? Math.round(numAmount * (1 - deductionRate)) : null;

  const guide    = USSD_GUIDE[network?.toLowerCase()] ?? {};
  const ussdCode = guide.transfer
    ? guide.transfer(transferPhone, hasAmount ? numAmount : 'AMOUNT')
    : null;

  return (
    <View style={[styles.convCard, { backgroundColor: themeColors.card }]}>

      {/* Airtime-only notice */}
      <View style={styles.convNotice}>
        <Ionicons name="information-circle" size={16} color="#1A6BB5" />
        <Text style={styles.convNoticeText}>
          NOTE: We accept airtime transfer only. Any VTU sent to us will not be credited to your wallet.
        </Text>
      </View>

      <View style={styles.convBody}>

        {/* ── Step 1: Copy destination number ───────────────────── */}
        <View style={styles.convStepHeader}>
          <View style={[styles.convStepBadge, { backgroundColor: themeColors.primary }]}>
            <Text style={styles.convStepBadgeText}>1</Text>
          </View>
          <Text style={[styles.convStepTitle, { color: themeColors.heading }]}>
            Copy the destination number
          </Text>
        </View>
        <View style={[styles.convPhoneBox, { borderColor: themeColors.primary, backgroundColor: `${themeColors.primary}08` }]}>
          <View style={styles.phoneNumberLeft}>
            <Text style={[styles.phoneLabel, { color: themeColors.subheading }]}>Transfer to:</Text>
            <Text style={[styles.convPhone, { color: themeColors.primary }]}>{transferPhone}</Text>
          </View>
          <TouchableOpacity onPress={onCopyPhone} style={[styles.copyButton, { backgroundColor: themeColors.primary }]}>
            <Ionicons name="copy-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ── Step 2: Dial USSD ──────────────────────────────────── */}
        <View style={[styles.convStepHeader, { marginTop: 16 }]}>
          <View style={[styles.convStepBadge, { backgroundColor: themeColors.primary }]}>
            <Text style={styles.convStepBadgeText}>2</Text>
          </View>
          <Text style={[styles.convStepTitle, { color: themeColors.heading }]}>
            Dial this USSD code to send the airtime
          </Text>
        </View>

        {ussdCode ? (
          <>
            {!hasAmount && (
              <Text style={[styles.convStepHint, { color: themeColors.primary }]}>
                Enter the amount below first — the USSD code will update automatically.
              </Text>
            )}
            <View style={[styles.ussdBox, { backgroundColor: themeColors.background, borderColor: themeColors.primary, borderWidth: 1.5 }]}>
              <Text style={[styles.ussdCode, { color: themeColors.heading }]}>{ussdCode}</Text>
            </View>
            <Text style={[styles.changePinHint, { color: themeColors.subheading }]}>
              💡 <Text style={{ fontWeight: '700' }}>0000</Text> is the default airtime transfer PIN on your SIM. If you've changed it, use your own PIN.
            </Text>
            {guide.changePin ? (
              <Text style={[styles.changePinHint, { color: themeColors.subheading }]}>
                Change transfer PIN: <Text style={{ fontFamily: 'monospace', fontWeight: '600' }}>{guide.changePin}</Text>{'  '}{guide.changePinExample}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={[styles.convStepHint, { color: themeColors.subheading }]}>
            Use your network's standard airtime share method to send airtime to the number above.
          </Text>
        )}

        {/* GLO cap */}
        {guide.maxPerTransfer ? (
          <View style={[styles.warningBox, { backgroundColor: '#FFF3CD', borderColor: '#FFC107', borderWidth: 1, marginTop: 10 }]}>
            <Ionicons name="alert-circle" size={16} color="#856404" />
            <Text style={[styles.warningText, { color: '#856404' }]}>
              GLO maximum is ₦{guide.maxPerTransfer.toLocaleString()} per transfer.
            </Text>
          </View>
        ) : null}

        {/* ── Step 3: Enter amount + convert ────────────────────── */}
        <View style={[styles.convStepHeader, { marginTop: 16 }]}>
          <View style={[styles.convStepBadge, { backgroundColor: themeColors.primary }]}>
            <Text style={styles.convStepBadgeText}>3</Text>
          </View>
          <Text style={[styles.convStepTitle, { color: themeColors.heading }]}>
            Enter the amount you transferred below, then tap "Convert Now"
          </Text>
        </View>

        {/* Live summary — appears once amount is entered */}
        {hasAmount && charge != null && (
          <View style={[styles.convSummaryRow, { backgroundColor: `${themeColors.primary}08`, borderColor: themeColors.border }]}>
            <Text style={[styles.convSummaryText, { color: themeColors.subheading }]}>
              Charge ({Math.round(deductionRate * 100)}%):{'  '}
              <Text style={{ color: themeColors.destructive, fontWeight: '700' }}>₦{charge.toLocaleString()}</Text>
            </Text>
            <Text style={[styles.convSummaryText, { color: themeColors.subheading }]}>
              You receive:{'  '}
              <Text style={{ color: themeColors.primary, fontWeight: '700', fontSize: 15 }}>₦{receivable.toLocaleString()}</Text>
            </Text>
          </View>
        )}

        {/* Credit timeline */}
        <Text style={[styles.convTimeline, { color: themeColors.subheading }]}>
          Wallet credited within <Text style={{ fontWeight: '700' }}>3–5 minutes</Text> once your transfer is received.
        </Text>

        {/* Critical action warning */}
        <View style={[styles.warningBox, { backgroundColor: '#FFF3CD', borderColor: '#FFC107', borderWidth: 1, marginTop: 12 }]}>
          <Ionicons name="alert-circle" size={16} color="#856404" />
          <Text style={[styles.warningText, { color: '#856404' }]}>
            You <Text style={{ fontWeight: '700' }}>must transfer the airtime first</Text> before tapping "Convert Now". Your account will be blocked if you tap "Convert Now" without transferring.
          </Text>
        </View>

      </View>
    </View>
  );
};

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
  const [deductionRate, setDeductionRate] = useState(null);
  const [serviceAvailable, setServiceAvailable] = useState(false);
  const [transferPhone, setTransferPhone] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  // Payout calculation using real deductionRate from VTU Africa (e.g. 0.30 = 30% deducted)
  const calculateDeduction = (amt) => deductionRate != null ? Math.round(amt * deductionRate) : null;
  const calculateReceivable = (amt) => deductionRate != null ? Math.round(amt * (1 - deductionRate)) : null;

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

    const maxAmt = conversionData.network === 'glo' ? 1000 : 50000;
    if (conversionData.amount > maxAmt) {
      errors.amount = conversionData.network === 'glo'
        ? 'GLO maximum is ₦1,000 per transfer'
        : 'Maximum amount is ₦50,000';
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
        setTransferPhone(result.transferPhone);
        setDeductionRate(result.deductionRate ?? null);
        setShowInstructions(true);
      } else {
        setServiceAvailable(false);
        Alert.alert('Service Unavailable', result.message || 'This network is currently unavailable for conversion.');
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
    setDeductionRate(null);
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
              Transfer airtime and get cash credited directly to your wallet
            </Text>
          </View>
        </View>

        {/* Before You Proceed — always visible on screen open */}
        <BeforeYouProceedCard themeColors={themeColors} />

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
            {/* Conversion Details */}
            {showInstructions && (
              <ConversionDetailsCard
                transferPhone={transferPhone}
                network={network}
                amount={amount}
                deductionRate={deductionRate}
                onCopyPhone={handleCopyPhone}
                themeColors={themeColors}
              />
            )}

            {/* Sender Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: themeColors.heading }]}>
                Your Phone Number
              </Text>
              <View style={[
                styles.phoneInputBox,
                { borderColor: validationErrors.senderNumber ? themeColors.destructive : themeColors.border, backgroundColor: themeColors.card },
              ]}>
                <Ionicons name="call-outline" size={20} color={themeColors.subheading} style={styles.phoneInputIcon} />
                <TextInput
                  value={senderNumber}
                  onChangeText={setSenderNumber}
                  placeholder="08XX-XXX-XXXX"
                  placeholderTextColor={themeColors.subheading}
                  style={[styles.phoneInputField, { color: themeColors.heading }]}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>
              {validationErrors.senderNumber ? (
                <Text style={[styles.inputError, { color: themeColors.destructive }]}>
                  {validationErrors.senderNumber}
                </Text>
              ) : null}
            </View>

            {/* Amount */}
            <AmountInput
              value={amount}
              onChangeText={setAmount}
              label="Amount to Convert"
              placeholder="Enter amount"
              error={validationErrors.amount}
              minAmount={100}
              maxAmount={network === 'glo' ? 1000 : 50000}
            />

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
      {serviceAvailable && amount && parseFloat(amount) >= 100 && deductionRate != null && (
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
            title="Convert Now"
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
        paymentAmount={amount ? (calculateReceivable(parseFloat(amount)) ?? 0) : 0}
        onCreatePin={payment.handleCreatePin}
        onCancel={payment.handleCancelPinSetup}
        isDarkMode={isDarkMode}
      />

      <ConfirmationModal
        visible={payment.step === 'confirm'}
        onClose={payment.handleCancelPayment}
        onConfirm={payment.confirmPayment}
        amount={amount ? (calculateReceivable(parseFloat(amount)) ?? 0) : 0}
        serviceName={`${network?.toUpperCase()} Airtime Conversion`}
        providerLogo={NETWORK_PROVIDERS.find(p => p.value === network)?.logo}
        providerName={network?.toUpperCase()}
        recipient={senderNumber.replace(/\s/g, '')}
        recipientLabel="Phone Number"
        walletBalance={wallet?.user?.walletBalance}
        additionalDetails={[
          { label: 'Airtime Amount', value: formatCurrency(parseFloat(amount || 0), 'NGN') },
          { label: `Deduction (${deductionRate != null ? Math.round(deductionRate * 100) : 0}%)`, value: formatCurrency(calculateDeduction(parseFloat(amount || 0)) ?? 0, 'NGN') },
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
    title={payment.result ? 'Conversion Request Registered' : 'Request Failed'}
    message={
      payment.result
        ? `We have registered your airtime conversion request. Once we confirm receipt of your ₦${parseFloat(amount || 0).toLocaleString()} ${network?.toUpperCase()} airtime transfer, your wallet will be credited ₦${calculateReceivable(parseFloat(amount || 0))?.toLocaleString() ?? '—'} within 3–5 minutes.`
        : `We could not register your conversion request. Please ensure you have transferred the airtime first, then try again.`
    }
    primaryAction={{
      label: 'View Transaction',
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
    guideStepLabel: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 16,
      marginBottom: 6,
    },
    ussdBox: {
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 14,
      alignItems: 'center',
      marginLeft: 34,
    },
    ussdCode: {
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: 0.5,
      fontFamily: 'monospace',
    },
    changePinHint: {
      fontSize: 12,
      marginTop: 8,
      lineHeight: 18,
      paddingLeft: 34,
    },
    instructionStep: {
      fontSize: 14,
      lineHeight: 20,
      paddingLeft: 8,
    },
    warningBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
      gap: 8,
    },
    warningText: {
      flex: 1,
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 18,
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

    // ========================================
    // BEFORE YOU PROCEED CARD
    // ========================================
    beforeCard: {
      borderRadius: 12,
      borderWidth: 1,
      marginTop: 16,
      overflow: 'hidden',
    },
    beforeCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 14,
    },
    beforeCardHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    beforeCardTitle: {
      fontSize: 15,
      fontWeight: '700',
    },
    beforeCardBody: {
      paddingHorizontal: 14,
      paddingBottom: 14,
    },
    beforeSection: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: '#E67E22',
      marginTop: 14,
      marginBottom: 8,
    },
    beforeItem: {
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 4,
    },
    beforeNote: {
      fontSize: 12,
      lineHeight: 18,
    },
    ratesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    rateChip: {
      borderRadius: 8,
      borderWidth: 1,
      paddingVertical: 8,
      paddingHorizontal: 10,
      minWidth: '45%',
      flex: 1,
      alignItems: 'center',
    },
    rateChipNetwork: {
      fontSize: 13,
      fontWeight: '700',
      marginBottom: 2,
    },
    rateChipDeduction: {
      fontSize: 16,
      fontWeight: '700',
      color: '#E74C3C',
    },
    rateChipEg: {
      fontSize: 11,
      marginTop: 2,
    },
    ussdRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      marginBottom: 4,
      gap: 4,
    },
    ussdRowNetwork: {
      fontSize: 13,
      fontWeight: '700',
    },
    ussdRowCode: {
      fontSize: 13,
      fontFamily: 'monospace',
      flexShrink: 1,
    },

    // ========================================
    // CONVERSION DETAILS CARD
    // ========================================
    convCard: {
      marginTop: 20,
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 3,
    },
    convNotice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: '#EAF4FF',
      padding: 12,
    },
    convNoticeText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
      color: '#1A6BB5',
      fontWeight: '500',
    },
    convBody: {
      padding: 14,
    },
    convStepHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 10,
    },
    convStepBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 1,
    },
    convStepBadgeText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    convStepTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 20,
    },
    convStepHint: {
      fontSize: 12,
      lineHeight: 18,
      marginBottom: 8,
      paddingLeft: 34,
    },
    convPhoneBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1.5,
      borderRadius: 8,
      padding: 12,
      marginLeft: 34,
      marginBottom: 4,
    },
    convPhone: {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: 1,
    },
    convSummaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginLeft: 34,
      marginTop: 8,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
    },
    convSummaryText: {
      fontSize: 13,
    },
    convTimeline: {
      fontSize: 13,
      lineHeight: 20,
      paddingTop: 12,
    },

    // ========================================
    // USSD OPTIONAL BLOCK (legacy — kept for ussdBox/ussdCode styles below)
    // ========================================
    ussdOptionalBlock: {
      marginTop: 10,
    },
    ussdOptionalLabel: {
      fontSize: 13,
      fontWeight: '500',
      marginBottom: 6,
    },

    // ========================================
    // PHONE INPUT
    // ========================================
    inputGroup: {
      marginTop: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    phoneInputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderRadius: 10,
      paddingHorizontal: 12,
      height: 52,
    },
    phoneInputIcon: {
      marginRight: 10,
    },
    phoneInputField: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
    },
    inputError: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 4,
    },
  });