


// src/screen/AirtimeScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Shared Components
import {
  ScreenHeader,
  TabSelector,
  QuickAmountButton,
  PayButton,
  ConfirmationModal,
  PinModal,
  ResultModal,
  PromoCard,
  LoadingOverlay,
  BeneficiaryInput,
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
import { purchaseAirtime } from 'AuthFunction/paymentService';
import { STORAGE_KEYS } from 'utility/storageKeys';
import { StatusBarComponent } from 'component/StatusBar';

const { width } = Dimensions.get('window');

/**
 * Refactored Airtime Purchase Screen - Professional & Modern Design
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

  const inputRef = useRef(null);

  // ========================================
  // VALIDATION FUNCTION
  // ========================================
  const validateAirtimePayment = useCallback((paymentData) => {
    console.log('🔍 Validating airtime payment:', paymentData);
    
    const errors = {};

    // Validate phone number with RegEx (remove whitespace first)
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
      errors.network = 'Please select a network provider';
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
      network: provider,
      amount: paymentAmount,
    };

    // Initiate payment (handles PIN check automatically)
    payment.initiatePayment(paymentData);
  }, [phoneNumber, provider, payment]);

  // Handle transaction complete function
  const handleTransactionComplete = useCallback(() => {
    console.log('📍 Transaction complete triggered');
    console.log('📦 Full payment result:', JSON.stringify(payment.result, null, 2));
    
    // Reset form
    setPhoneNumber('');
    setProvider('');
    setAmount('');
    
    // Get reference
    const reference = 
      payment.result?.reference ||
      payment.result?.data?.reference ||
      payment.result?.data?._id;
    
    console.log('✅ Using reference:', reference);
    
    payment.handleTransactionComplete(reference);
  }, [payment, setPhoneNumber, setProvider, setAmount]);
 
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

  // After successful purchase, save as beneficiary:
  const handleAirtimeSuccess = async () => {
    await saveBeneficiary('airtime', {
      phoneNumber: phoneNumber,
      network: provider,
    });
    
    payment.handleTransactionComplete();
  };

  // ========================================
  // MAIN RENDER
  // ========================================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header gradient is always dark — keep icons white regardless of theme */}
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header with Gradient */}
      <LinearGradient
        colors={isDarkMode ? ['#1a1a2e', '#16213e'] : ['#667EEA', '#764BA2']}
        style={styles.headerGradient}
      >
        <ScreenHeader
          title="Airtime Purchase"
          onBackPress={() => navigation.goBack()}
          rightText="History"
          onRightPress={() => navigation.navigate('Orders')}
          textColor="#FFFFFF"
          iconColor="#FFFFFF"
        />
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
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

          <BeneficiaryInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            onNetworkDetected={setProvider}
            onBeneficiarySelect={(beneficiary) => {
              if (beneficiary.network) {
                setProvider(beneficiary.network);
              }
            }}
            serviceType="airtime"
            placeholder="08XX-XXX-XXXX"
            label=""
            error={validationErrors.phoneNumber}
            keyboardType="phone-pad"
            maxLength={11}
            icon="call-outline"
            identifierField="phoneNumber"
            secondaryField="network"
            displayField={(item) => `${item.phoneNumber} - ${item.network?.toUpperCase()}`}
            enableNetworkDetection={true}
            enableValidation={true}
          />
        </View>

        {/* Recipient fee hint */}
        <View style={[styles.feeHint, { backgroundColor: `${themeColors.primary}0C` }]}>
          <Ionicons name="information-circle-outline" size={14} color={themeColors.subtext} />
          <Text style={[styles.feeHintText, { color: themeColors.subtext }]}>
            Topping up a different number adds a ₦20 convenience fee.
          </Text>
        </View>

        {/* Quick Amounts Card */}
        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <LinearGradient
                colors={['#4FACFE', '#00F2FE']}
                style={styles.cardIcon}
              >
                <Ionicons name="flash" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.cardTitle, { color: themeColors.heading }]}>
                Quick Top-up
              </Text>
            </View>
          </View>

          {[AIRTIME_CONSTANTS.QUICK_AMOUNTS.slice(0, 3), AIRTIME_CONSTANTS.QUICK_AMOUNTS.slice(3)].map((row, ri) => (
            <View key={ri} style={styles.quickAmountsRow}>
              {row.map((quickAmount) => {
                const selected = amount === quickAmount.value.toString();
                return (
                  <TouchableOpacity
                    key={quickAmount.value}
                    style={[
                      styles.quickAmountCard,
                      selected && styles.quickAmountCardSelected,
                      { backgroundColor: isDarkMode ? '#2a2a3e' : '#F9FAFB' }
                    ]}
                    onPress={() => handleQuickAmount(quickAmount.value)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={selected ? ['#667EEA', '#764BA2'] : ['transparent', 'transparent']}
                      style={styles.quickAmountGradient}
                    >
                      <Text style={[styles.quickAmountText, { color: selected ? '#FFFFFF' : themeColors.heading }]}>
                        {formatCurrency(quickAmount.value, 'NGN')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Custom Amount Card */}
        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <LinearGradient
                colors={['#43E97B', '#38F9D7']}
                style={styles.cardIcon}
              >
                <Ionicons name="create" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.cardTitle, { color: themeColors.heading }]}>
                Custom Amount
              </Text>
            </View>
            {validationErrors.amount && (
              <View style={styles.errorBadge}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
              </View>
            )}
          </View>

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

          {/* Pay Button with Gradient */}
          <TouchableOpacity
            style={[
              styles.payButtonContainer,
              (!phoneNumber || !provider || payment.step === 'processing') && styles.payButtonDisabled
            ]}
            onPress={handleCustomPayment}
            disabled={!phoneNumber || !provider || payment.step === 'processing'}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                !phoneNumber || !provider || payment.step === 'processing'
                  ? ['#9CA3AF', '#6B7280']
                  : ['#667EEA', '#764BA2']
              }
              style={styles.payButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {payment.step === 'processing' ? (
                <Text style={styles.payButtonText}>Processing...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                  <Text style={styles.payButtonText}>Pay Now</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Error Display */}
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

        {/* Promo Card */}
        <PromoCard
          title="🎉 Refer And Win"
          subtitle="Invite your Friends and earn up to ₦10,000"
          buttonText="Refer Now"
          onPress={() => navigation.navigate('Referral')}
          gradientColors={['#FA8BFF', '#2BD2FF', '#2BFF88']}
        />
      </ScrollView>

      {/* ========================================
          MODALS - Using Unified System
          ======================================== */}

      {/* PIN Setup Modal */}
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
        onClose={() => {
          console.log('🚪 Closing result modal');
          payment.resetFlow();
        }}
        type={payment.result ? 'success' : 'error'}
        title={payment.result ? 'Purchase Successful!' : 'Purchase Failed'}
        message={
          payment.result
            ? `Your airtime purchase of ${formatCurrency(Number(amount), 'NGN')} to ${phoneNumber.replace(/\s/g, '')} was successful.`
            : payment.flowError || 'Your airtime purchase could not be completed. Please try again.'
        }
        primaryAction={{
          label: 'View Details',
          onPress: () => {
            console.log('👁️ View Details pressed');
            handleTransactionComplete();
          },
        }}
        secondaryAction={{
          label: 'Done',
          onPress: () => {
            console.log('✅ Done pressed - closing modal');
            setPhoneNumber('');
            setProvider('');
            setAmount('');
            payment.resetFlow();
          },
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
  headerGradient: {
    paddingBottom: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
  quickAmountsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  quickAmountCard: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  quickAmountCardSelected: {
    shadowColor: '#667EEA',
    shadowOpacity: 0.3,
    elevation: 4,
  },
  quickAmountGradient: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  payButtonContainer: {
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
  providerCellSelected: {
    borderColor: 'rgba(255,255,255,0.5)',
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
  feeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  feeHintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});