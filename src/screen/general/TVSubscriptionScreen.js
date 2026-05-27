

// src/screen/TVSubscriptionScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Imports
import {
  ScreenHeader,
  PayButton,
  ConfirmationModal,
  PinModal,
  ResultModal,
  PromoCard,
  LoadingOverlay,
} from 'component/SHARED';

import PinSetupModal from 'component/PinSetUpModal';
import { useServicePayment } from 'HOOKS/UseServicePayment';
import { useWallet } from 'context/WalletContext';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { getTVBouquets, purchaseTVSubscription, renewTVSubscription, verifySmartcard } from 'AuthFunction/paymentService';
import { customImages } from 'constants/serviceImages';
import { StatusBarComponent } from 'component/StatusBar';

const { width } = Dimensions.get('window');

// Constants
const TV_CONSTANTS = {
  LIMITS: {
    MIN_AMOUNT: 1000,
    MAX_AMOUNT: 100000,
  },
};

const TV_PROVIDERS = [
  { 
    label: 'DSTV', 
    value: 'dstv', 
    logo: customImages.Dstv,
    requiresSmartcard: true,
    gradient: ['#FF6B6B', '#FF8E53']
  },
  { 
    label: 'GOTV', 
    value: 'gotv', 
    logo: customImages.Gotv,
    requiresSmartcard: true,
    gradient: ['#4E54C8', '#8F94FB']
  },
  { 
    label: 'Startimes', 
    value: 'startimes', 
    logo: customImages.Startimes,
    requiresSmartcard: true,
    gradient: ['#11998E', '#38EF7D']
  },
  { 
    label: 'Showmax', 
    value: 'showmax', 
    logo: customImages.Showmax,
    requiresSmartcard: false,
    gradient: ['#F857A6', '#FF5858']
  },
];

/**
 * TV Subscription Screen - Modern & Professional Design
 */
export default function TVSubscriptionScreen({ navigation, route }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { wallet, refreshWallet } = useWallet();

  // State Management
  const [provider, setProvider] = useState('');
  const [smartcardNumber, setSmartcardNumber] = useState('');
  const [bouquets, setBouquets] = useState([]);
  const [selectedBouquet, setSelectedBouquet] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [subscriptionType, setSubscriptionType] = useState('change');
  
  // Loading States
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoadingBouquets, setIsLoadingBouquets] = useState(false);
  
  // Validation
  const [validationErrors, setValidationErrors] = useState({});

  // ========================================
  // Fetch Bouquets When Provider Changes
  // ========================================
  useEffect(() => {
    if (provider) {
      fetchBouquets();
    } else {
      setBouquets([]);
      setSelectedBouquet(null);
      setCustomerData(null);
    }
  }, [provider]);

  const fetchBouquets = async () => {
    setIsLoadingBouquets(true);
    setValidationErrors({});
    
    try {
      const response = await getTVBouquets(provider);
      
      if (response.success) {
        setBouquets(response.data.bouquets || []);
      } else {
        throw new Error(response.message || 'Failed to load bouquets');
      }
    } catch (error) {
      console.error('❌ Error fetching bouquets:', error);
      setValidationErrors({ provider: 'Failed to load bouquets. Please try again.' });
    } finally {
      setIsLoadingBouquets(false);
    }
  };

  const handleVerifySmartcard = async () => {
    const providerInfo = TV_PROVIDERS.find(p => p.value === provider);
    
    if (providerInfo && !providerInfo.requiresSmartcard) {
      console.log('⏭️ Skipping smartcard verification for', provider);
      
      setCustomerData({
        customerName: 'Showmax Customer',
        smartcardNumber: smartcardNumber || 'N/A',
        currentBouquet: null,
        renewalAmount: null,
        dueDate: null,
        status: 'ACTIVE',
      });
      
      Alert.alert(
        '✅ Ready for Showmax',
        'Proceed to select your Showmax package.\n\nNote: Showmax subscriptions are activated via email/phone.',
        [{ text: 'OK' }]
      );
      
      fetchBouquets();
      return;
    }
  
    if (!smartcardNumber || smartcardNumber.length < 10) {
      setValidationErrors({ smartcard: 'Enter a valid smartcard number (10-11 digits)' });
      return;
    }
  
    if (!provider) {
      setValidationErrors({ provider: 'Please select a TV provider first' });
      return;
    }
  
    try {
      setIsVerifying(true);
      const response = await verifySmartcard(smartcardNumber, provider);
      
      console.log('📡 Verification response:', response);
      
      if (response.success) {
        setCustomerData(response.data);
        console.log('✅ Smartcard verified:', response.data);
        
        Alert.alert(
          '✅ Verification Successful',
          `Customer: ${response.data.customerName || 'N/A'}\nCurrent Package: ${response.data.currentBouquet || 'N/A'}`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(response.message || 'Verification failed');
      }
    } catch (error) {
      console.error('❌ Verification error:', error);
      setValidationErrors({ smartcard: error.message || 'Verification failed' });
      Alert.alert('Verification Failed', error.message || 'Could not verify smartcard number');
    } finally {
      setIsVerifying(false);
    }
  };

  // ========================================
  // Validation Function
  // ========================================
  const validateTVPayment = useCallback((paymentData) => {
    console.log('🔍 Validating TV subscription payment:', paymentData);
    
    const errors = {};

    const cleanSmartCard = (paymentData.smartcardNumber || '').replace(/\s/g, '');
    if (!cleanSmartCard || cleanSmartCard.length < 10) {
      errors.smartcard = 'Invalid smartcard number';
    }

    if (!paymentData.provider) {
      errors.provider = 'Please select a TV provider';
    }

    if (!paymentData.customerData) {
      errors.smartcard = 'Please verify smartcard first';
    }

    if (paymentData.subscriptionType === 'change' && !paymentData.variation_code) {
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

    return { isValid, errors };
  }, []);

  // ========================================
  // Execute Purchase
  // ========================================
  const executeTVPurchase = useCallback(async (pin, paymentData) => {
    console.log('💳 Executing TV purchase:', paymentData);

    const userPhone = wallet?.user?.phone || wallet?.user?.phoneNumber || '';
    console.log('📱 Using phone number:', userPhone);
    
    try {
      let response;
      
      if (paymentData.subscriptionType === 'renew') {
        response = await renewTVSubscription(pin, {
          smartcardNumber: paymentData.smartcardNumber,
          provider: paymentData.provider,
          amount: paymentData.amount,
          phone: userPhone,
        });
      } else {
        response = await purchaseTVSubscription(pin, {
          smartcardNumber: paymentData.smartcardNumber,
          provider: paymentData.provider,
          variation_code: paymentData.variation_code,
          amount: paymentData.amount,
          phone: userPhone,
        });
      }

      console.log('✅ Purchase response:', response);
      return response;
    } catch (error) {
      console.error('❌ TV subscription error:', error);
      throw error;
    }
  }, [wallet]);

  // ========================================
  // Unified Payment Hook
  // ========================================
  const payment = useServicePayment({
    serviceName: 'TV Subscription',
    validatePayment: validateTVPayment,
    executePurchase: executeTVPurchase,
    navigation,
    route,
  });

  // ========================================
  // Restore Form Data After PIN Setup
  // ========================================
  useEffect(() => {
    payment.restoreFormData((data) => {
      console.log('📝 Restoring TV subscription form:', data);
      setSmartcardNumber(data.smartcardNumber || '');
      setProvider(data.provider || '');
      setSelectedBouquet(data.selectedBouquet || null);
      setCustomerData(data.customerData || null);
      setSubscriptionType(data.subscriptionType || 'change');
    });
  }, [payment.pendingPaymentData]);

  // ========================================
  // Initial Wallet Load
  // ========================================
  useEffect(() => {
    refreshWallet();
  }, []);

  // ========================================
  // Payment Handler
  // ========================================
  const handlePayment = useCallback(() => {
    setValidationErrors({});

    const cleanSmartCard = smartcardNumber.replace(/\s/g, '');
    const amount = getAmount();

    const paymentData = {
      smartcardNumber: cleanSmartCard,
      provider,
      variation_code: subscriptionType === 'change' ? selectedBouquet?.variation_code : undefined,
      amount,
      subscriptionType,
      customerData,
      selectedBouquet: subscriptionType === 'change' ? selectedBouquet : null,
    };

    console.log('🚀 Initiating payment:', paymentData);
    payment.initiatePayment(paymentData);
  }, [smartcardNumber, provider, selectedBouquet, subscriptionType, customerData, payment]);

  const handleTransactionComplete = useCallback(() => {
    setSmartcardNumber('');
    setProvider('');
    setSelectedBouquet(null);
    setCustomerData(null);
    setSubscriptionType('change');
    setBouquets([]);
    
    payment.handleTransactionComplete(payment.result?.reference);
  }, [payment]);

  // ========================================
  // Helper Functions
  // ========================================
  const getAmount = () => {
    let rawAmount = 0;
    
    if (subscriptionType === 'renew') {
      rawAmount = parseFloat(
        customerData?.renewalAmount || 
        customerData?.Renewal_Amount || 
        customerData?.renewal_amount || 
        0
      );
    } else {
      rawAmount = parseFloat(
        selectedBouquet?.variation_amount || 
        selectedBouquet?.fixedPrice || 
        0
      );
    }
    
    return isNaN(rawAmount) ? 0 : rawAmount;
  };

  const getDisplayAmount = () => {
    if (subscriptionType === 'change' && selectedBouquet) {
      return parseFloat(selectedBouquet.userPays ?? selectedBouquet.variation_amount ?? 0);
    }
    return getAmount();
  };

  const canProceed = () => {
    const providerInfo = TV_PROVIDERS.find(p => p.value === provider);
    const hasBasicData = provider && customerData;
    
    if (providerInfo?.requiresSmartcard) {
      if (!smartcardNumber || smartcardNumber.length < 10) {
        return false;
      }
    } else {
      if (!smartcardNumber || smartcardNumber.trim().length === 0) {
        return false;
      }
    }
    
    const isNotProcessing = payment.step !== 'processing';
    const isDevelopmentMode = __DEV__;
    const hasValidAmount = isDevelopmentMode ? true : getAmount() > 0;
    
    let hasTypeRequirement = false;
    
    if (subscriptionType === 'renew') {
      if (providerInfo?.requiresSmartcard) {
        hasTypeRequirement = isDevelopmentMode ? true : getAmount() > 0;
      } else {
        hasTypeRequirement = false;
      }
    } else if (subscriptionType === 'change') {
      hasTypeRequirement = !!selectedBouquet;
    }
    
    return hasBasicData && isNotProcessing && hasValidAmount && hasTypeRequirement;
  };
  
  const cleanBouquetName = (bouquet) => {
    if (!bouquet) return '';
    let cleanName = bouquet.name || '';
    const price = parseFloat(bouquet.variation_amount || 0);
    const formatted = price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const patterns = [
      new RegExp(`\\s+N${formatted.replace(/,/g, ',')}$`),
      new RegExp(` - ${formatted} Naira - `, 'g'),
      new RegExp(` - N${formatted} - `, 'g'),
      new RegExp(` - ${formatted} - `, 'g'),
      new RegExp(` - N${formatted}$`, 'g'),
      new RegExp(` - ${formatted}$`, 'g'),
    ];

    patterns.forEach(pattern => {
      cleanName = cleanName.replace(pattern, '');
    });

    return cleanName.trim();
  };

  // ========================================
  // Render Components
  // ========================================
  const renderCustomerInfo = () => {
    if (!customerData) return null;

    return (
      <View style={styles.customerInfoCard}>
        <LinearGradient
          colors={['#10B98115', '#05966915']}
          style={styles.customerInfoGradient}
        >
          <View style={styles.verifiedHeader}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.verifiedBadge}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.verifiedBadgeText}>Customer Verified</Text>
            </LinearGradient>
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
                  {customerData.customerName}
                </Text>
              </View>
            </View>
            
            {customerData.currentBouquet && (
              <View style={styles.customerDetailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="tv" size={16} color="#10B981" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: themeColors.subheading }]}>
                    Current Package
                  </Text>
                  <Text style={[styles.detailValue, { color: themeColors.heading }]}>
                    {customerData.currentBouquet}
                  </Text>
                </View>
              </View>
            )}
            
            {customerData.renewalAmount && (
              <View style={styles.customerDetailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="cash" size={16} color="#10B981" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: themeColors.subheading }]}>
                    Renewal Amount
                  </Text>
                  <Text style={[styles.detailValue, { color: themeColors.heading }]}>
                    {formatCurrency(parseFloat(customerData.renewalAmount), 'NGN')}
                  </Text>
                </View>
              </View>
            )}
            
            {customerData.dueDate && (
              <View style={styles.customerDetailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="calendar" size={16} color="#10B981" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: themeColors.subheading }]}>
                    Due Date
                  </Text>
                  <Text style={[styles.detailValue, { color: themeColors.heading }]}>
                    {customerData.dueDate}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderBouquetCard = ({ item: bouquet }) => {
    const isSelected = selectedBouquet?.variation_code === bouquet.variation_code;
    const price = parseFloat(bouquet.userPays ?? bouquet.variation_amount ?? 0);
    const cleanName = cleanBouquetName(bouquet);

    return (
      <TouchableOpacity
        key={bouquet.variation_code}
        style={[
          styles.bouquetCard,
          { backgroundColor: themeColors.card },
          isSelected && styles.bouquetCardSelected,
        ]}
        onPress={() => setSelectedBouquet(bouquet)}
        activeOpacity={0.7}
      >
        {isSelected && (
          <LinearGradient
            colors={['#667EEA', '#764BA2']}
            style={styles.selectionIndicator}
          />
        )}
        
        <View style={styles.bouquetContent}>
          <View style={styles.bouquetInfo}>
            <Text 
              style={[styles.bouquetName, { color: themeColors.heading }]}
              numberOfLines={2}
            >
              {cleanName}
            </Text>
            <View style={styles.bouquetPriceRow}>
              <Text style={styles.bouquetPrice}>
                {formatCurrency(price, 'NGN')}
              </Text>
            </View>
          </View>
          
          {isSelected && (
            <View style={styles.selectedIconContainer}>
              <LinearGradient
                colors={['#667EEA', '#764BA2']}
                style={styles.selectedIcon}
              >
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              </LinearGradient>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ========================================
  // Main Render
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
          title="TV Subscription"
          onBackPress={() => navigation.goBack()}
          rightText="History"
          onRightPress={() => navigation.navigate('Orders')}
          textColor="#FFFFFF"
          iconColor="#FFFFFF"
        />
      </LinearGradient>

      <View style={styles.mainContainer}>
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

          {/* Provider Selection Card */}
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <LinearGradient
                  colors={['#667EEA', '#764BA2']}
                  style={styles.cardIcon}
                >
                  <Ionicons name="tv" size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.cardTitle, { color: themeColors.heading }]}>
                  TV Provider
                </Text>
              </View>
              {validationErrors.provider && (
                <View style={styles.errorBadge}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                </View>
              )}
            </View>
            
            <View style={styles.providerGrid}>
              {TV_PROVIDERS.map((p) => {
                const isSelected = provider === p.value;
                return (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.providerCell,
                      { backgroundColor: isDarkMode ? '#2a2a3e' : '#F3F4F6' },
                      isSelected && styles.providerCellSelected,
                    ]}
                    onPress={() => {
                      setProvider(p.value);
                      setCustomerData(null);
                      setSmartcardNumber('');
                      setSelectedBouquet(null);
                    }}
                    activeOpacity={0.75}
                  >
                    {isSelected && (
                      <LinearGradient colors={p.gradient} style={StyleSheet.absoluteFill} borderRadius={14} />
                    )}
                    <Image source={p.logo} style={styles.providerCellLogo} resizeMode="contain" />
                    <Text style={[styles.providerCellLabel, { color: isSelected ? '#fff' : themeColors.subheading }]}>
                      {p.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.providerCheck}>
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

          {/* Smartcard/Email Input Card */}
          {provider && (
            <View style={[styles.card, { backgroundColor: themeColors.card }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <LinearGradient
                    colors={['#F093FB', '#F5576C']}
                    style={styles.cardIcon}
                  >
                    <Ionicons 
                      name={TV_PROVIDERS.find(p => p.value === provider)?.requiresSmartcard ? 'keypad' : 'mail'} 
                      size={20} 
                      color="#FFFFFF" 
                    />
                  </LinearGradient>
                  <Text style={[styles.cardTitle, { color: themeColors.heading }]}>
                    {TV_PROVIDERS.find(p => p.value === provider)?.requiresSmartcard 
                      ? 'Smartcard Number' 
                      : 'Email/Phone'}
                  </Text>
                </View>
                {validationErrors.smartcard && (
                  <View style={styles.errorBadge}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  </View>
                )}
              </View>

              <View style={styles.inputWrapper}>
                <View
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDarkMode ? '#2a2a3e' : '#F9FAFB',
                      borderColor: validationErrors.smartcard ? '#EF4444' : themeColors.border,
                    },
                  ]}
                >
                  <View style={styles.inputIconContainer}>
                    <Ionicons 
                      name={TV_PROVIDERS.find(p => p.value === provider)?.requiresSmartcard ? 'keypad-outline' : 'mail-outline'} 
                      size={20} 
                      color={themeColors.subtext} 
                    />
                  </View>
                  <TextInput
                    style={[styles.textInput, { color: themeColors.heading }]}
                    value={smartcardNumber}
                    onChangeText={(text) => {
                      if (TV_PROVIDERS.find(p => p.value === provider)?.requiresSmartcard) {
                        setSmartcardNumber(text.replace(/\D/g, ''));
                      } else {
                        setSmartcardNumber(text);
                      }
                      setValidationErrors({ ...validationErrors, smartcard: undefined });
                      setCustomerData(null);
                    }}
                    placeholder={
                      TV_PROVIDERS.find(p => p.value === provider)?.requiresSmartcard 
                        ? 'Enter 10-11 digit number' 
                        : 'Enter email or phone'
                    }
                    placeholderTextColor={themeColors.subtext}
                    keyboardType={TV_PROVIDERS.find(p => p.value === provider)?.requiresSmartcard ? 'numeric' : 'email-address'}
                    maxLength={TV_PROVIDERS.find(p => p.value === provider)?.requiresSmartcard ? 11 : undefined}
                    editable={!isVerifying}
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.verifyButtonContainer,
                    (!provider || !smartcardNumber || isVerifying) && styles.verifyButtonDisabled,
                  ]}
                  onPress={handleVerifySmartcard}
                  disabled={isVerifying || !provider || !smartcardNumber}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      !provider || !smartcardNumber || isVerifying
                        ? ['#9CA3AF', '#6B7280']
                        : ['#667EEA', '#764BA2']
                    }
                    style={styles.verifyButtonGradient}
                  >
                    {isVerifying ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
                        <Text style={styles.verifyButtonText}>Verify</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {validationErrors.smartcard && (
                <Text style={[styles.errorText, { color: '#EF4444' }]}>
                  {validationErrors.smartcard}
                </Text>
              )}

              {provider === 'showmax' && (
                <Text style={[styles.helpText, { color: themeColors.subtext }]}>
                  Showmax will be activated on the provided email/phone
                </Text>
              )}
            </View>
          )}

          {/* Customer Info */}
          {renderCustomerInfo()}

          {/* Subscription Type Card */}
          {customerData && TV_PROVIDERS.find(p => p.value === provider)?.requiresSmartcard && (
            <View style={[styles.card, { backgroundColor: themeColors.card }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <LinearGradient
                    colors={['#4FACFE', '#00F2FE']}
                    style={styles.cardIcon}
                  >
                    <Ionicons name="options" size={20} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[styles.cardTitle, { color: themeColors.heading }]}>
                    Subscription Type
                  </Text>
                </View>
              </View>

              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { backgroundColor: themeColors.card }
                  ]}
                  onPress={() => {
                    setSubscriptionType('renew');
                    setSelectedBouquet(null);
                  }}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      subscriptionType === 'renew'
                        ? ['#667EEA', '#764BA2']
                        : ['transparent', 'transparent']
                    }
                    style={styles.typeButtonGradient}
                  >
                    <View style={styles.radioContainer}>
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor: subscriptionType === 'renew' ? '#FFFFFF' : themeColors.border,
                          },
                        ]}
                      >
                        {subscriptionType === 'renew' && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.typeButtonText,
                        {
                          color: subscriptionType === 'renew' ? '#FFFFFF' : themeColors.heading,
                        },
                      ]}
                    >
                      Renew Current
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { backgroundColor: themeColors.card }
                  ]}
                  onPress={() => setSubscriptionType('change')}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      subscriptionType === 'change'
                        ? ['#667EEA', '#764BA2']
                        : ['transparent', 'transparent']
                    }
                    style={styles.typeButtonGradient}
                  >
                    <View style={styles.radioContainer}>
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor: subscriptionType === 'change' ? '#FFFFFF' : themeColors.border,
                          },
                        ]}
                      >
                        {subscriptionType === 'change' && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.typeButtonText,
                        {
                          color: subscriptionType === 'change' ? '#FFFFFF' : themeColors.heading,
                        },
                      ]}
                    >
                      Change Package
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Bouquet Selection */}
          {customerData && subscriptionType === 'change' && (
            <View style={[styles.card, { backgroundColor: themeColors.card }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <LinearGradient
                    colors={['#43E97B', '#38F9D7']}
                    style={styles.cardIcon}
                  >
                    <Ionicons name="grid" size={20} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[styles.cardTitle, { color: themeColors.heading }]}>
                    Select Package
                  </Text>
                </View>
                {bouquets.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{bouquets.length}</Text>
                  </View>
                )}
              </View>

              {isLoadingBouquets ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#667EEA" />
                  <Text style={[styles.loadingText, { color: themeColors.heading }]}>
                    Loading packages...
                  </Text>
                </View>
              ) : (
                <View style={styles.bouquetsContainer}>
                  {bouquets.map((bouquet) => renderBouquetCard({ item: bouquet }))}
                </View>
              )}

              {validationErrors.bouquet && (
                <Text style={[styles.errorText, { color: '#EF4444' }]}>
                  {validationErrors.bouquet}
                </Text>
              )}
            </View>
          )}

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
            title="🎉 Get Rewards"
            subtitle="Earn cashback on every TV subscription"
            buttonText="Learn More"
            onPress={() => navigation.navigate('Rewards')}
            gradientColors={['#FA8BFF', '#2BD2FF', '#2BFF88']}
          />

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Sticky Pay Button */}
        {customerData && canProceed() && (
          <View style={styles.stickyFooter}>
            <LinearGradient
              colors={isDarkMode 
                ? ['rgba(26, 26, 46, 0.98)', 'rgba(22, 33, 62, 0.98)']
                : ['rgba(255, 255, 255, 0.98)', 'rgba(249, 250, 251, 0.98)']}
              style={styles.footerGradient}
            >
              {__DEV__ && getAmount() === 0 && (
                <View style={styles.testingBanner}>
                  <Text style={styles.testingText}>🛠️ TESTING MODE: Amount is 0</Text>
                </View>
              )}

              <View style={styles.paymentSummary}>
                <Text style={[styles.summaryLabel, { color: themeColors.subheading }]}>
                  {subscriptionType === 'renew' ? 'Total (incl. fee)' : 'Total Charged'}
                </Text>
                <Text style={styles.summaryAmount}>
                  {formatCurrency(getDisplayAmount(), 'NGN')}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.payButtonContainer,
                  payment.step === 'processing' && styles.payButtonDisabled
                ]}
                onPress={handlePayment}
                disabled={payment.step === 'processing'}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    payment.step === 'processing'
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
                      <Text style={styles.payButtonText}>Subscribe Now</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}
      </View>

      {/* ========================================
          MODALS
          ======================================== */}

      {/* PIN Setup Modal */}
      <PinSetupModal
        visible={payment.showPinSetupModal}
        serviceName="TV Subscription"
        paymentAmount={getAmount()}
        onCreatePin={payment.handleCreatePin}
        onCancel={payment.handleCancelPinSetup}
        isDarkMode={isDarkMode}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={payment.step === 'confirm'}
        onClose={payment.handleCancelPayment}
        onConfirm={payment.confirmPayment}
        amount={getDisplayAmount()}
        serviceName="TV Subscription"
        providerName={provider.toUpperCase()}
        recipient={smartcardNumber}
        recipientLabel="Smartcard Number"
        additionalInfo={
          subscriptionType === 'renew'
            ? `Renew: ${customerData?.currentBouquet}`
            : `Package: ${cleanBouquetName(selectedBouquet)}`
        }
        additionalDetails={
          subscriptionType === 'change' && selectedBouquet?.convenienceFee
            ? [{ label: 'Convenience Fee', value: formatCurrency(Number(selectedBouquet.convenienceFee), 'NGN') }]
            : undefined
        }
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
        subtitle={`Confirm payment of ${formatCurrency(getDisplayAmount(), 'NGN')}`}
      />

      {/* Success/Error Result Modal */}
      <ResultModal
        visible={payment.step === 'result'}
        onClose={() => {
          payment.resetFlow();
          setSmartcardNumber('');
          setProvider('');
          setSelectedBouquet(null);
          setCustomerData(null);
        }}
        type={payment.result ? 'success' : 'error'}
        title={payment.result ? 'Subscription Successful!' : 'Subscription Failed'}
        message={
          payment.result
            ? `Your TV subscription of ${formatCurrency(getAmount(), 'NGN')} was successful.`
            : payment.flowError || 'Your TV subscription could not be completed. Please try again.'
        }
        primaryAction={{
          label: 'View Details',
          onPress: handleTransactionComplete,
        }}
        secondaryAction={{
          label: 'Done',
          onPress: () => {
            payment.resetFlow();
            setSmartcardNumber('');
            setProvider('');
            setSelectedBouquet(null);
            setCustomerData(null);
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
// Styles
// ========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 16,
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 200,
  },
  bottomSpacer: {
    height: 40,
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
  countBadge: {
    backgroundColor: '#667EEA15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#667EEA',
  },
  inputWrapper: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
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
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  helpText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    fontStyle: 'italic',
  },
  customerInfoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  customerInfoGradient: {
    padding: 16,
  },
  verifiedHeader: {
    marginBottom: 14,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    alignSelf: 'flex-start',
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
  typeSelector: {
    gap: 12,
  },
  typeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  typeButtonGradient: {
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
  typeButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  bouquetsContainer: {
    gap: 12,
  },
  bouquetCard: {
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  bouquetCardSelected: {
    shadowColor: '#667EEA',
    shadowOpacity: 0.3,
    elevation: 6,
  },
  selectionIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  bouquetContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bouquetInfo: {
    flex: 1,
    marginRight: 12,
  },
  bouquetName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 20,
  },
  bouquetPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bouquetPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#667EEA',
    letterSpacing: 0.3,
  },
  selectedIconContainer: {
    marginLeft: 8,
  },
  selectedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
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
  stickyFooter: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  footerGradient: {
    padding: 20,
  },
  testingBanner: {
    backgroundColor: '#FFA500',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  testingText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  paymentSummary: {
    marginBottom: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#667EEA',
    letterSpacing: 0.5,
  },
  payButtonContainer: {
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
    borderColor: 'rgba(255,255,255,0.4)',
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
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerError: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 8,
  },
});