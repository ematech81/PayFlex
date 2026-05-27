
// src/screen/ElectricityPurchaseScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from 'utility/storageKeys';

// Shared Components
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

// Custom Components
import PinSetupModal from 'component/PinSetUpModal';

// Custom Hooks
import { useWallet } from 'context/WalletContext';

// Constants & Utils
import { ELECTRICITY_PROVIDERS } from 'CONSTANT/providerConstant';
import { ELECTRICITY_CONSTANTS } from 'CONSTANT/SERVICES/electricityServices';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { StatusBarComponent } from 'component/StatusBar';
import { useServicePayment } from 'HOOKS/UseServicePayment';
import { PaymentApiIPAddress } from "utility/apiIPAdress";

const { width } = Dimensions.get('window');

/**
 * Enhanced Meter Type Selector Component
 */
const MeterTypeSelector = ({ value, onChange, themeColors, error }) => (
  <View style={styles.meterTypeContainer}>
    <View style={styles.cardHeader}>
      <View style={styles.cardTitleContainer}>
        <LinearGradient
          colors={['#4FACFE', '#00F2FE']}
          style={styles.cardIcon}
        >
          <Ionicons name="speedometer" size={20} color="#FFFFFF" />
        </LinearGradient>
        <Text style={[styles.cardTitle, { color: themeColors.heading }]}>
          Meter Type
        </Text>
      </View>
      {error && (
        <View style={styles.errorBadge}>
          <Ionicons name="alert-circle" size={14} color="#EF4444" />
        </View>
      )}
    </View>

    <View style={styles.meterTypeButtons}>
      {ELECTRICITY_CONSTANTS.METER_TYPES.map((type) => (
        <TouchableOpacity
          key={type.value}
          style={[styles.meterTypeButton, { backgroundColor: themeColors.card }]}
          onPress={() => onChange(type.value)}
          activeOpacity={0.7}
          accessibilityLabel={`${type.label} meter type`}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === type.value }}
        >
          <LinearGradient
            colors={
              value === type.value
                ? ['#667EEA', '#764BA2']
                : ['transparent', 'transparent']
            }
            style={styles.meterTypeGradient}
          >
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor: value === type.value ? '#FFFFFF' : themeColors.border,
                  },
                ]}
              >
                {value === type.value && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </View>
            <View style={styles.meterTypeInfo}>
              <Text
                style={[
                  styles.meterTypeText,
                  {
                    color: value === type.value ? '#FFFFFF' : themeColors.heading,
                  },
                ]}
              >
                {type.label}
              </Text>
              <Text
                style={[
                  styles.meterTypeDesc,
                  {
                    color: value === type.value
                      ? 'rgba(255,255,255,0.8)'
                      : themeColors.subtext,
                  },
                ]}
              >
                {type.value === 'prepaid' ? 'Pay before use' : 'Pay after use'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
    {error && (
      <Text style={[styles.errorText, { color: themeColors.destructive }]}>
        {error}
      </Text>
    )}
  </View>
);

/**
 * Enhanced Meter Number Input Component
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
    <View style={styles.cardHeader}>
      <View style={styles.cardTitleContainer}>
        <LinearGradient
          colors={['#F093FB', '#F5576C']}
          style={styles.cardIcon}
        >
          <Ionicons name="keypad" size={20} color="#FFFFFF" />
        </LinearGradient>
        <Text style={[styles.cardTitle, { color: themeColors.heading }]}>
          Meter Number
        </Text>
      </View>
      {error && (
        <View style={styles.errorBadge}>
          <Ionicons name="alert-circle" size={14} color="#EF4444" />
        </View>
      )}
    </View>
    
    <View style={styles.meterInputWrapper}>
      <View
        style={[
          styles.meterInput,
          {
            backgroundColor: themeColors.card,
            borderColor: error 
              ? '#EF4444'
              : isVerified 
              ? '#10B981'
              : themeColors.border,
            borderWidth: isVerified ? 2 : 1.5,
          },
        ]}
      >
        <View style={styles.inputIconContainer}>
          <Ionicons
            name="keypad-outline"
            size={20}
            color={isVerified ? '#10B981' : themeColors.subtext}
          />
        </View>
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
          <View style={styles.verifiedIconContainer}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.verifiedIcon}
            >
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </LinearGradient>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.verifyButtonContainer,
          (!value || value.length < 10 || isVerified) && styles.verifyButtonDisabled,
        ]}
        onPress={onVerify}
        disabled={!value || value.length < 10 || isVerified}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            isVerified
              ? ['#10B981', '#059669']
              : !value || value.length < 10
              ? ['#9CA3AF', '#6B7280']
              : ['#667EEA', '#764BA2']
          }
          style={styles.verifyButtonGradient}
        >
          {isVerifying ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name={isVerified ? 'checkmark-circle' : 'shield-checkmark'}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.verifyButtonText}>
                {isVerified ? 'Verified' : 'Verify'}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>

    {error && (
      <Text style={[styles.errorText, { color: themeColors.destructive }]}>
        {error}
      </Text>
    )}

    {isVerified && customerInfo && (
      <View style={styles.customerInfoCard}>
        <LinearGradient
          colors={['#10B98115', '#05966915']}
          style={styles.customerInfoGradient}
        >
          <View style={styles.customerInfoHeader}>
            <View style={styles.verifiedBadge}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.verifiedBadgeGradient}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.verifiedBadgeText}>Meter Verified</Text>
              </LinearGradient>
            </View>
          </View>
          
          <View style={styles.customerDetails}>
            <View style={styles.customerDetailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="person" size={16} color="#10B981" />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: themeColors.subheading }]}>
                  Customer Name
                </Text>
                <Text style={[styles.detailValue, { color: themeColors.heading }]}>
                  {customerInfo.customerName || customerInfo.name || 'N/A'}
                </Text>
              </View>
            </View>
            
            {customerInfo.address && (
              <View style={styles.customerDetailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="location" size={16} color="#10B981" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: themeColors.subheading }]}>
                    Address
                  </Text>
                  <Text style={[styles.detailValue, { color: themeColors.heading }]}>
                    {customerInfo.address}
                  </Text>
                </View>
              </View>
            )}
            
            {customerInfo.outstandingBalance > 0 && (
              <View style={styles.customerDetailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: themeColors.subheading }]}>
                    Outstanding Balance
                  </Text>
                  <Text style={[styles.detailValue, { color: '#EF4444' }]}>
                    {formatCurrency(customerInfo.outstandingBalance, 'NGN')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    )}
  </View>
);

/**
 * Enhanced Phone Number Input Component
 */
const PhoneNumberInput = ({ value, onChangeText, error, themeColors }) => (
  <View style={styles.phoneInputContainer}>
    <View style={styles.cardHeader}>
      <View style={styles.cardTitleContainer}>
        <LinearGradient
          colors={['#43E97B', '#38F9D7']}
          style={styles.cardIcon}
        >
          <Ionicons name="call" size={20} color="#FFFFFF" />
        </LinearGradient>
        <Text style={[styles.cardTitle, { color: themeColors.heading }]}>
          Phone Number
        </Text>
      </View>
      <View style={styles.optionalBadge}>
        <Text style={[styles.optionalText, { color: themeColors.subtext }]}>
          Optional
        </Text>
      </View>
    </View>

    <View
      style={[
        styles.phoneInput,
        {
          backgroundColor: themeColors.card,
          borderColor: error ? '#EF4444' : themeColors.border,
        },
      ]}
    >
      <View style={styles.inputIconContainer}>
        <Ionicons name="call-outline" size={20} color={themeColors.subtext} />
      </View>
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
export default function ElectricityPurchaseScreen({ navigation, route }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { wallet, refreshWallet } = useWallet();

  // Local State
  const [meterNumber, setMeterNumber] = useState('');
  const [disco, setDisco] = useState('');
  const [meterType, setMeterType] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [customerInfo, setCustomerInfo] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // ========================================
  // VALIDATION FUNCTION
  // ========================================
  const validateElectricityPayment = useCallback((paymentData) => {
    const errors = {};

    if (!paymentData.meterNumber || paymentData.meterNumber.length < 10) {
      errors.meterNumber = ELECTRICITY_CONSTANTS.ERROR_MESSAGES.INVALID_METER;
    }

    if (!paymentData.disco) {
      errors.disco = ELECTRICITY_CONSTANTS.ERROR_MESSAGES.NO_DISCO;
    }

    if (!paymentData.meterType) {
      errors.meterType = ELECTRICITY_CONSTANTS.ERROR_MESSAGES.NO_METER_TYPE;
    }

    if (!paymentData.amount || paymentData.amount < ELECTRICITY_CONSTANTS.LIMITS.MIN_AMOUNT) {
      errors.amount = ELECTRICITY_CONSTANTS.ERROR_MESSAGES.AMOUNT_TOO_LOW;
    }

    if (paymentData.amount > ELECTRICITY_CONSTANTS.LIMITS.MAX_AMOUNT) {
      errors.amount = `Maximum amount is ${formatCurrency(ELECTRICITY_CONSTANTS.LIMITS.MAX_AMOUNT, 'NGN')}`;
    }

    if (!paymentData.customerInfo) {
      errors.meter = ELECTRICITY_CONSTANTS.ERROR_MESSAGES.METER_NOT_VERIFIED;
    }

    setValidationErrors(errors);

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, []);

  // ========================================
  // PURCHASE EXECUTOR FUNCTION
  // ========================================
  const executeElectricityPayment = useCallback(async (pin, paymentData) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

      const response = await fetch(`${PaymentApiIPAddress}/pay-electricity`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, 
        },
        body: JSON.stringify({
          meterNumber: paymentData.meterNumber,
          disco: paymentData.disco,
          meterType: paymentData.meterType,
          amount: paymentData.amount,
          phoneNumber: paymentData.phoneNumber,
          customerInfo: paymentData.customerInfo,
          pin,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Electricity payment failed');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Electricity payment error:', error);
      throw error;
    }
  }, []);

  // ========================================
  // UNIFIED PAYMENT HOOK
  // ========================================
  const payment = useServicePayment({
    serviceName: 'Electricity',
    validatePayment: validateElectricityPayment,
    executePurchase: executeElectricityPayment,
    navigation,
    route,
  });

  // ========================================
  // RESTORE FORM DATA AFTER PIN SETUP
  // ========================================
  useEffect(() => {
    payment.restoreFormData((data) => {
      console.log('📝 Restoring electricity payment form:', data);
      setMeterNumber(data.meterNumber);
      setDisco(data.disco);
      setMeterType(data.meterType);
      setPhoneNumber(data.phoneNumber);
      setAmount(data.amount);
      setCustomerInfo(data.customerInfo);
    });
  }, [payment.pendingPaymentData]);

  // ========================================
  // INITIAL WALLET LOAD
  // ========================================
  useEffect(() => {
    refreshWallet();
  }, []);

  // ========================================
  // METER VERIFICATION
  // ========================================
  const handleVerifyMeter = useCallback(async () => {
    if (!disco) {
      setValidationErrors(prev => ({ ...prev, disco: 'Please select a DISCO' }));
      return;
    }

    if (!meterType) {
      setValidationErrors(prev => ({ ...prev, meterType: 'Please select meter type' }));
      return;
    }

    if (!meterNumber || meterNumber.length < 10) {
      setValidationErrors(prev => ({ ...prev, meterNumber: 'Invalid meter number' }));
      return;
    }

    try {
      setIsVerifying(true);
      setValidationErrors({});

      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const response = await fetch(`${PaymentApiIPAddress}/verify-meter`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          meterNumber,
          disco,
          meterType,
        }),
      });

      if (!response.ok) {
        throw new Error('Meter verification failed');
      }

      const data = await response.json();
      
      if (data.success) {
        setCustomerInfo(data.data);
        console.log('✅ Meter verified:', data.data);
      } else {
        throw new Error(data.message || 'Invalid meter number');
      }
    } catch (error) {
      console.error('❌ Meter verification error:', error);
      setValidationErrors(prev => ({ 
        ...prev, 
        meterNumber: error.message || 'Verification failed' 
      }));
      setCustomerInfo(null);
    } finally {
      setIsVerifying(false);
    }
  }, [meterNumber, disco, meterType]);

  // ========================================
  // PAYMENT HANDLERS
  // ========================================
  const handleQuickAmount = useCallback((selectedAmount) => {
    setAmount(selectedAmount.toString());
    handlePayment(selectedAmount);
  }, [meterNumber, disco, meterType, phoneNumber, customerInfo]);

  const handleCustomPayment = useCallback(() => {
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount)) {
      setValidationErrors({ amount: 'Please enter a valid amount' });
      return;
    }
    handlePayment(paymentAmount);
  }, [amount, meterNumber, disco, meterType, phoneNumber, customerInfo]);

  const handlePayment = useCallback((paymentAmount) => {
    setValidationErrors({});

    const paymentData = {
      meterNumber,
      disco,
      meterType,
      amount: parseFloat(paymentAmount),
      phoneNumber,
      customerInfo,
    };

    payment.initiatePayment(paymentData);
  }, [meterNumber, disco, meterType, phoneNumber, customerInfo, payment]);

  const handleTransactionComplete = useCallback(() => {
    setMeterNumber('');
    setDisco('');
    setMeterType('');
    setPhoneNumber('');
    setAmount('');
    setCustomerInfo(null);
    
    payment.handleTransactionComplete(payment.result?.reference);
  }, [payment]);

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  const getDiscoInfo = useCallback(() => {
    return ELECTRICITY_PROVIDERS.find(p => p.value === disco);
  }, [disco]);

  // ========================================
  // COMPUTED VALUES
  // ========================================
  const isFormValid = meterNumber && disco && meterType && customerInfo && amount;

  // ========================================
  // LOADING STATE
  // ========================================
  if (wallet?.isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ScreenHeader title="Electricity" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667EEA" />
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

      {/* Header with Gradient */}
      <LinearGradient
        colors={isDarkMode ? ['#1a1a2e', '#16213e'] : ['#667EEA', '#764BA2']}
        style={styles.headerGradient}
      >
        <ScreenHeader
          title="Electricity Bill"
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

        {/* Distribution Company Card */}
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
                Distribution Company
              </Text>
            </View>
            {validationErrors.disco && (
              <View style={styles.errorBadge}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
              </View>
            )}
          </View>
          
          <ProviderSelector
            providers={ELECTRICITY_PROVIDERS}
            value={disco}
            onChange={setDisco}
            placeholder="Select DISCO"
            error={validationErrors.disco}
          />
        </View>

        {/* Meter Type Card */}
        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
          <MeterTypeSelector
            value={meterType}
            onChange={setMeterType}
            themeColors={themeColors}
            error={validationErrors.meterType}
          />
        </View>

        {/* Meter Number Card */}
        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
          <MeterNumberInput
            value={meterNumber}
            onChangeText={setMeterNumber}
            error={validationErrors.meterNumber}
            themeColors={themeColors}
            onVerify={handleVerifyMeter}
            isVerifying={isVerifying}
            isVerified={!!customerInfo}
            customerInfo={customerInfo}
          />
        </View>

        {/* Phone Number Card */}
        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
          <PhoneNumberInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            themeColors={themeColors}
          />
        </View>

        {/* Quick Amounts - Only show if meter is verified */}
        {customerInfo && (
          <>
            <View style={[styles.card, { backgroundColor: themeColors.card }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <LinearGradient
                    colors={['#FA8BFF', '#2BD2FF']}
                    style={styles.cardIcon}
                  >
                    <Ionicons name="flash" size={20} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[styles.cardTitle, { color: themeColors.heading }]}>
                    Quick Amounts
                  </Text>
                </View>
              </View>

              <View style={styles.quickAmountsGrid}>
                {ELECTRICITY_CONSTANTS.QUICK_AMOUNTS.map((quickAmount) => (
                  <TouchableOpacity
                    key={quickAmount.value}
                    style={[
                      styles.quickAmountCard,
                      amount === quickAmount.value.toString() && styles.quickAmountCardSelected,
                      { backgroundColor: isDarkMode ? '#2a2a3e' : '#F9FAFB' }
                    ]}
                    onPress={() => handleQuickAmount(quickAmount.value)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={
                        amount === quickAmount.value.toString()
                          ? ['#667EEA', '#764BA2']
                          : ['transparent', 'transparent']
                      }
                      style={styles.quickAmountGradient}
                    >
                      <Text style={[
                        styles.quickAmountText,
                        { 
                          color: amount === quickAmount.value.toString()
                            ? '#FFFFFF' 
                            : themeColors.heading 
                        }
                      ]}>
                        {formatCurrency(quickAmount.value, 'NGN')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
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
                minAmount={ELECTRICITY_CONSTANTS.LIMITS.MIN_AMOUNT}
                maxAmount={ELECTRICITY_CONSTANTS.LIMITS.MAX_AMOUNT}
                showBalance
                balance={wallet?.user?.walletBalance}
                error={validationErrors.amount}
              />

              {/* Fee preview */}
              {amount && parseFloat(amount) >= ELECTRICITY_CONSTANTS.LIMITS.MIN_AMOUNT && (() => {
                const base     = parseFloat(amount);
                const markup   = Math.max(base * 0.015, 50);
                const fee      = markup + 30;
                const total    = base + fee;
                return (
                  <View style={[styles.feePreview, { backgroundColor: `${themeColors.primary}0C`, borderColor: themeColors.border }]}>
                    <View style={styles.feePreviewRow}>
                      <Text style={[styles.feePreviewLabel, { color: themeColors.subheading }]}>Service Fee</Text>
                      <Text style={[styles.feePreviewValue, { color: themeColors.heading }]}>{formatCurrency(fee, 'NGN')}</Text>
                    </View>
                    <View style={[styles.feePreviewDivider, { backgroundColor: themeColors.border }]} />
                    <View style={styles.feePreviewRow}>
                      <Text style={[styles.feePreviewLabel, { color: themeColors.subheading }]}>Total Charged</Text>
                      <Text style={[styles.feePreviewValue, { color: themeColors.primary, fontWeight: '700' }]}>{formatCurrency(total, 'NGN')}</Text>
                    </View>
                  </View>
                );
              })()}

              <TouchableOpacity
                style={[
                  styles.payButtonContainer,
                  (!isFormValid || payment.step === 'processing') && styles.payButtonDisabled
                ]}
                onPress={handleCustomPayment}
                disabled={!isFormValid || payment.step === 'processing'}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    !isFormValid || payment.step === 'processing'
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
          </>
        )}

        {/* Error Display */}
        {validationErrors.meter && (
          <View style={styles.errorContainer}>
            <LinearGradient
              colors={['#FEE2E2', '#FECACA']}
              style={styles.errorGradient}
            >
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.errorText}>
                {validationErrors.meter}
              </Text>
            </LinearGradient>
          </View>
        )}

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

        {/* Info Banner */}
        {!customerInfo && (
          <View style={styles.infoBanner}>
            <LinearGradient
              colors={['#DBEAFE', '#BFDBFE']}
              style={styles.infoBannerGradient}
            >
              <Ionicons name="information-circle" size={24} color="#3B82F6" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Verify Your Meter</Text>
                <Text style={styles.infoText}>
                  Please verify your meter number before making payment to ensure successful transaction
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}
      </ScrollView>

      {/* ========================================
          MODALS - Using Unified System
          ======================================== */}

      {/* PIN Setup Modal */}
      <PinSetupModal
        visible={payment.showPinSetupModal}
        serviceName="Electricity Bill"
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
        title={payment.result ? 'Payment Successful!' : 'Payment Failed'}
        message={
          payment.result
            ? `Your electricity payment of ${formatCurrency(Number(amount), 'NGN')} for meter ${meterNumber} was successful.`
            : 'Your electricity payment could not be completed. Please try again.'
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
  headerGradient: {
    paddingBottom: 16,
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
    fontWeight: '600',
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
  optionalBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  optionalText: {
    fontSize: 11,
    fontWeight: '600',
  },
  meterTypeContainer: {
    gap: 12,
  },
  meterTypeButtons: {
    gap: 12,
  },
  meterTypeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  meterTypeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  radioContainer: {
    marginRight: 4,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  meterTypeInfo: {
    flex: 1,
  },
  meterTypeText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  meterTypeDesc: {
    fontSize: 12,
    fontWeight: '500',
  },
  meterInputContainer: {
    gap: 12,
  },
  meterInputWrapper: {
    flexDirection: 'row',
    gap: 12,
  },
  meterInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  inputIconContainer: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
    fontWeight: '500',
  },
  verifiedIconContainer: {
    marginLeft: 8,
  },
  verifiedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonContainer: {
    minWidth: 110,
    borderRadius: 14,
    overflow: 'hidden',
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 6,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  customerInfoCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  customerInfoGradient: {
    padding: 16,
  },
  customerInfoHeader: {
    marginBottom: 14,
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
  },
  verifiedBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  verifiedBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  customerDetails: {
    gap: 14,
  },
  customerDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#10B98120',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  phoneInputContainer: {
    gap: 12,
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  quickAmountCard: {
    width: (width - 32 - 40 - 24) / 3,
    margin: 6,
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
  infoBanner: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  infoBannerGradient: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E40AF',
    lineHeight: 18,
  },
  feePreview: {
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  feePreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feePreviewLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  feePreviewValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  feePreviewDivider: {
    height: 1,
    marginVertical: 2,
  },
});