// src/screen/ElectricityPurchaseScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { useWallet } from 'context/WalletContext';
// import { PayButton } from 'component/SHARED';
import { ELECTRICITY_PROVIDERS } from 'CONSTANT/providerConstant';
import { ELECTRICITY_CONSTANTS } from 'CONSTANT/SERVICES/electricityServices';




// // Shared Components
import {
  ScreenHeader,
  ProviderSelector,
  AmountInput,
  QuickAmountButton,
  PayButton,
  ConfirmationModal,
  PinModal,
  ResultModal,
  LoadingOverlay,
} from 'component/SHARED';

// Custom Hooks
import {
  useElectricityPayment,
  useTransactionPin,
  usePaymentFlow,
} from 'HOOKS';
import { StatusBarComponent } from 'component/StatusBar';



/**
 * Meter Type Selector Component
 */
const MeterTypeSelector = ({ value, onChange, themeColors }) => (
  <View style={styles.meterTypeContainer}>
    <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
      Meter Type
    </Text>
    <View style={styles.meterTypeButtons}>
      {ELECTRICITY_CONSTANTS.METER_TYPES.map((type) => (
        <TouchableOpacity
          key={type.value}
          style={[
            styles.meterTypeButton,
            {
              backgroundColor: value === type.value 
                ? themeColors.primary 
                : themeColors.card,
              borderColor: value === type.value 
                ? themeColors.primary 
                : themeColors.border,
            },
          ]}
          onPress={() => onChange(type.value)}
          activeOpacity={0.7}
          accessibilityLabel={`${type.label} meter type`}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === type.value }}
        >
          <Ionicons
            name={value === type.value ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={value === type.value ? themeColors.card : themeColors.primary}
          />
          <Text
            style={[
              styles.meterTypeText,
              {
                color: value === type.value 
                  ? themeColors.card 
                  : themeColors.heading,
              },
            ]}
          >
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

/**
 * Meter Number Input Component
 */
const MeterNumberInput = ({
  value,
  onChangeText,
  error,
  themeColors,
  onVerify,
  isVerifying,
  isVerified,
  customerInfo,
}) => (
  <View style={styles.meterInputContainer}>
    <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
      Meter Number
    </Text>
    
    <View style={styles.meterInputWrapper}>
      <View
        style={[
          styles.meterInput,
          {
            backgroundColor: themeColors.card,
            borderColor: error 
              ? themeColors.destructive 
              : isVerified 
              ? '#4CAF50' 
              : themeColors.border,
          },
        ]}
      >
        <Ionicons
          name="keypad-outline"
          size={20}
          color={themeColors.subtext}
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.textInput, { color: themeColors.heading }]}
          placeholder="Enter meter number"
          placeholderTextColor={themeColors.subtext}
          keyboardType="number-pad"
          value={value}
          onChangeText={onChangeText}
          maxLength={13}
          editable={!isVerified}
        />
        {isVerified && (
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
        )}
      </View>

      <PayButton
        title={isVerified ? 'Verified' : 'Verify'}
        onPress={onVerify}
        disabled={!value || value.length < 10 || isVerified}
        loading={isVerifying}
        style={styles.verifyButton}
      />
    </View>

    {error && (
      <Text style={[styles.errorText, { color: themeColors.destructive }]}>
        {error}
      </Text>
    )}

    {isVerified && customerInfo && (
      <View
        style={[
          styles.customerInfoCard,
          { backgroundColor: `${themeColors.primary}10` },
        ]}
      >
        <View style={styles.customerInfoRow}>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color="#4CAF50"
          />
          <Text style={[styles.customerInfoTitle, { color: '#4CAF50' }]}>
            Meter Verified
          </Text>
        </View>
        
        <View style={styles.customerDetails}>
          <View style={styles.customerDetailRow}>
            <Text style={[styles.detailLabel, { color: themeColors.subheading }]}>
              Customer Name:
            </Text>
            <Text style={[styles.detailValue, { color: themeColors.heading }]}>
              {customerInfo.customerName || customerInfo.name || 'N/A'}
            </Text>
          </View>
          
          {customerInfo.address && (
            <View style={styles.customerDetailRow}>
              <Text style={[styles.detailLabel, { color: themeColors.subheading }]}>
                Address:
              </Text>
              <Text style={[styles.detailValue, { color: themeColors.heading }]}>
                {customerInfo.address}
              </Text>
            </View>
          )}
          
          {customerInfo.outstandingBalance && (
            <View style={styles.customerDetailRow}>
              <Text style={[styles.detailLabel, { color: themeColors.subheading }]}>
                Outstanding:
              </Text>
              <Text style={[styles.detailValue, { color: themeColors.destructive }]}>
                {formatCurrency(customerInfo.outstandingBalance, 'NGN')}
              </Text>
            </View>
          )}
        </View>
      </View>
    )}
  </View>
);

/**
 * Phone Number Input Component
 */
const PhoneNumberInput = ({ value, onChangeText, error, themeColors }) => (
  <View style={styles.phoneInputContainer}>
    <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
      Phone Number (Optional)
    </Text>
    <View
      style={[
        styles.phoneInput,
        {
          backgroundColor: themeColors.card,
          borderColor: error ? themeColors.destructive : themeColors.border,
        },
      ]}
    >
      <Ionicons
        name="call-outline"
        size={20}
        color={themeColors.subtext}
        style={styles.inputIcon}
      />
      <TextInput
        style={[styles.textInput, { color: themeColors.heading }]}
        placeholder="08XX-XXX-XXXX"
        placeholderTextColor={themeColors.subtext}
        keyboardType="phone-pad"
        value={value}
        onChangeText={onChangeText}
        maxLength={11}
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
 * Enhanced Electricity Purchase Screen
 */
export default function ElectricityPurchaseScreen({ navigation }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { wallet, updateTransactionPinStatus } = useWallet();

  // State
  const [amount, setAmount] = useState('');

  // Custom Hooks
  const {
    meterNumber,
    setMeterNumber,
    disco,
    setDisco,
    meterType,
    setMeterType,
    phoneNumber,
    setPhoneNumber,
    customerInfo,
    isVerifying,
    isLoading: isPaying,
    error: paymentError,
    verifyMeter,
    payElectricityBill,
    clearError: clearPaymentError,
  } = useElectricityPayment();

  const {
    pin,
    setPin,
    pinError,
    isVerifying: isVerifyingPin,
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

  /**
   * Handle meter verification
   */
  const handleVerifyMeter = async () => {
    clearPaymentError();
    
    if (!disco) {
      // Show error
      return;
    }
    
    if (!meterType) {
      // Show error
      return;
    }

    await verifyMeter();
  };

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
    clearPaymentError();
    clearPinError();

    // Validate meter is verified
    if (!customerInfo) {
      // Show error - meter not verified
      return;
    }

    // Start payment with validation
    const success = startPayment(
      {
        meterNumber,
        disco,
        meterType,
        amount: paymentAmount,
        phoneNumber,
      },
      () => {
        // Custom validation
        const errors = {};

        if (!meterNumber) {
          errors.meterNumber = ELECTRICITY_CONSTANTS.ERROR_MESSAGES.INVALID_METER;
        }

        if (!disco) {
          errors.disco = ELECTRICITY_CONSTANTS.ERROR_MESSAGES.NO_DISCO;
        }

        if (!meterType) {
          errors.meterType = ELECTRICITY_CONSTANTS.ERROR_MESSAGES.NO_METER_TYPE;
        }

        if (!paymentAmount || Number(paymentAmount) < ELECTRICITY_CONSTANTS.LIMITS.MIN_AMOUNT) {
          errors.amount = ELECTRICITY_CONSTANTS.ERROR_MESSAGES.AMOUNT_TOO_LOW;
        }

        if (!customerInfo) {
          errors.meter = ELECTRICITY_CONSTANTS.ERROR_MESSAGES.METER_NOT_VERIFIED;
        }

        return {
          isValid: Object.keys(errors).length === 0,
          errors,
        };
      }
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

    if (!wallet) {
      return;
    }

    if (!wallet.transactionPinSet) {
      cancelPayment();
      navigation.navigate('SetTransactionPin', {
        onSuccess: async () => {
          await updateTransactionPinStatus(true);
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
        return await payElectricityBill(transactionPin);
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
   * Get DISCO logo
   */
  const getDiscoInfo = () => {
    return ELECTRICITY_PROVIDERS.find(p => p.value === disco);
  };

  // Check if wallet is loading
  if (wallet?.isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <ScreenHeader
          title="Electricity"
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

  // Calculate if form is valid
  const isFormValid = 
    meterNumber && 
    disco && 
    meterType && 
    customerInfo && 
    amount && 
    !isPaying;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >

<StatusBarComponent/>
      {/* Header */}
      <ScreenHeader
        title="Electricity"
        onBackPress={() => navigation.goBack()}
        rightText="History"
        onRightPress={() => navigation.navigate('History')}
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Distribution Company Selection */}
        <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
          Select Distribution Company
        </Text>
        <ProviderSelector
          providers={ELECTRICITY_PROVIDERS}
          value={disco}
          onChange={setDisco}
          placeholder="Select DISCO"
          error={paymentError && !disco ? 'Please select a DISCO' : null}
        />

        {/* Meter Type Selection */}
        <MeterTypeSelector
          value={meterType}
          onChange={setMeterType}
          themeColors={themeColors}
        />

        {/* Meter Number Input with Verification */}
        <MeterNumberInput
          value={meterNumber}
          onChangeText={setMeterNumber}
          error={paymentError && !meterNumber ? 'Please enter meter number' : null}
          themeColors={themeColors}
          onVerify={handleVerifyMeter}
          isVerifying={isVerifying}
          isVerified={!!customerInfo}
          customerInfo={customerInfo}
        />

        {/* Phone Number (Optional) */}
        <PhoneNumberInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          themeColors={themeColors}
        />

        {/* Quick Amounts */}
        {customerInfo && (
          <>
            <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
              Select Amount
            </Text>
            <View style={styles.quickAmountsContainer}>
              {ELECTRICITY_CONSTANTS.QUICK_AMOUNTS.map((quickAmount) => (
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
                minAmount={ELECTRICITY_CONSTANTS.LIMITS.MIN_AMOUNT}
                maxAmount={ELECTRICITY_CONSTANTS.LIMITS.MAX_AMOUNT}
                showBalance
                balance={wallet?.user?.walletBalance}
                error={paymentError && !amount ? 'Please enter amount' : null}
              />

              <PayButton
                title="Pay"
                onPress={handleCustomPayment}
                disabled={!isFormValid}
                loading={isPaying}
                style={styles.payButton}
              />
            </View>
          </>
        )}

        {/* Error Display */}
        {(paymentError || flowError) && (
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: `${themeColors.destructive}20` },
            ]}
          >
            <Text style={[styles.errorText, { color: themeColors.destructive }]}>
              {paymentError || flowError}
            </Text>
          </View>
        )}

        {/* Info Banner */}
        <View
          style={[
            styles.infoBanner,
            { backgroundColor: `${themeColors.primary}10` },
          ]}
        >
          <Ionicons
            name="information-circle"
            size={20}
            color={themeColors.primary}
          />
          <Text style={[styles.infoText, { color: themeColors.heading }]}>
            Please verify your meter number before making payment
          </Text>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={step === 'confirm'}
        onClose={cancelPayment}
        onConfirm={confirmPayment}
        amount={Number(amount)}
        serviceName="Electricity"
        providerName={getDiscoInfo()?.label}
        recipient={meterNumber}
        recipientLabel="Meter Number"
        walletBalance={wallet?.user?.walletBalance}
        additionalDetails={[
          {
            label: 'Customer Name',
            value: customerInfo?.customerName || customerInfo?.name || 'N/A',
          },
          {
            label: 'Meter Type',
            value: meterType === 'prepaid' ? 'Prepaid' : 'Postpaid',
          },
          {
            label: 'DISCO',
            value: getDiscoInfo()?.shortName || disco,
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
        loading={isPaying || isVerifyingPin}
        error={pinError}
        title="Enter Transaction PIN"
        subtitle={`Confirm payment of ${formatCurrency(Number(amount), 'NGN')}`}
      />

      {/* Result Modal */}
      <ResultModal
        visible={step === 'result'}
        onClose={resetFlow}
        type={result ? 'success' : 'error'}
        title={result ? 'Payment Successful!' : 'Payment Failed'}
        message={
          result
            ? `Your electricity payment of ${formatCurrency(Number(amount), 'NGN')} for meter ${meterNumber} was successful.`
            : 'Your electricity payment could not be completed. Please try again.'
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
  scrollContent: {
    padding: 16,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
  },
  meterTypeContainer: {
    marginBottom: 8,
  },
  meterTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  meterTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  meterTypeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  meterInputContainer: {
    marginBottom: 8,
  },
  meterInputWrapper: {
    flexDirection: 'row',
    gap: 12,
  },
  meterInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  verifyButton: {
    minWidth: 100,
  },
  customerInfoCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
  },
  customerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  customerInfoTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  customerDetails: {
    gap: 8,
  },
  customerDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  phoneInputContainer: {
    marginBottom: 8,
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 4,
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
});