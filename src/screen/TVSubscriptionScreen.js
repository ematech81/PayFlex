
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
  FlatList,
  StatusBar
} from 'react-native';

// Imports
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
import { Ionicons } from '@expo/vector-icons';

import PinSetupModal from 'component/PinSetUpModal';
import { useServicePayment } from 'HOOKS/UseServicePayment';
import { useWallet } from 'context/WalletContext';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { getTVBouquets, purchaseTVSubscription, renewTVSubscription, verifySmartcard } from 'AuthFunction/paymentService';
import { customImages } from 'constants/serviceImages';



//   // Constants
  const TV_CONSTANTS = {
    LIMITS: {
      MIN_AMOUNT: 1000,
      MAX_AMOUNT: 100000,
    },
  };

  const TV_PROVIDERS = [
    { label: 'DSTV', value: 'dstv', logo: customImages.Dstv },
    { label: 'GOTV', value: 'gotv', logo: customImages.Gotv },
    { label: 'Startimes', value: 'startimes', logo: customImages.Startimes },
    { label: 'Showmax', value: 'showmax', logo: customImages.Showmax },
  ];






/**
 * TV Subscription Screen - Optimized Structure
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
  //  const [phoneNumber, setPhoneNumber] = useState('');
  const [subscriptionType, setSubscriptionType] = useState('change'); // 'change' or 'renew'
  
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

  // ========================================
  // Verify Smartcard
  // ========================================
  const handleVerifySmartcard = async () => {
    // Validation
    if (!smartcardNumber || smartcardNumber.length < 10) {
      setValidationErrors({ smartcard: 'Enter a valid smartcard number (10-11 digits)' });
      return;
    }

    if (!provider) {
      setValidationErrors({ provider: 'Please select a TV provider first' });
      return;
    }

    setIsVerifying(true);
    setValidationErrors({});
    setCustomerData(null);

    try {
      const response = await verifySmartcard(smartcardNumber, provider);
      
      if (response.success) {
        setCustomerData(response.data);
        
        // Show success alert with customer info
        Alert.alert(
          '✅ Verification Successful',
          `Customer: ${response.data.customerName}\nCurrent Package: ${response.data.currentBouquet || 'N/A'}`,
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

    // Validate smartcard
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
        // Renew current bouquet
        response = await renewTVSubscription(pin, {
          smartcardNumber: paymentData.smartcardNumber,
          provider: paymentData.provider,
          amount: paymentData.amount,
          phone: userPhone,
        });
      } else {
        // Change/subscribe to new bouquet
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
    
    // Calculate amount
    const amount = getAmount();

    // Prepare payment data
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
    // Reset form
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
      // ✅ Handle multiple possible field names from VTPass
      rawAmount = parseFloat(
        customerData?.renewalAmount || 
        customerData?.Renewal_Amount || 
        customerData?.renewal_amount || 
        0
      );
    } else {
      // ✅ For change package
      rawAmount = parseFloat(
        selectedBouquet?.variation_amount || 
        selectedBouquet?.fixedPrice || 
        0
      );
    }
    
    return isNaN(rawAmount) ? 0 : rawAmount;
  };
  
  const canProceed = () => {
    // Basic requirements
    const hasBasicData = provider && smartcardNumber && customerData;
    const isNotProcessing = payment.step !== 'processing';
    const hasValidAmount = getAmount() > 0;
    
    // Type-specific requirements
    let hasTypeRequirement = false;
    
    if (subscriptionType === 'renew') {
      // ✅ For renewal, just need customer data with renewal amount
      hasTypeRequirement = !!(
        customerData?.renewalAmount || 
        customerData?.Renewal_Amount || 
        customerData?.renewal_amount
      );
    } else if (subscriptionType === 'change') {
      // ✅ For change, need selected bouquet
      hasTypeRequirement = !!selectedBouquet;
    }
    
    console.log('🔍 canProceed check:', {
      hasBasicData,
      isNotProcessing,
      hasValidAmount,
      hasTypeRequirement,
      subscriptionType,
      renewalAmount: customerData?.renewalAmount,
      selectedBouquet: !!selectedBouquet,
    });
    
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
      <View style={[styles.customerCard, { backgroundColor: `${themeColors.success}20` }]}>
        <Text style={[styles.customerCardTitle, { color: themeColors.success }]}>
          ✓ Customer Verified
        </Text>
        <View style={styles.customerRow}>
          <Text style={[styles.customerLabel, { color: themeColors.mutedText }]}>Name:</Text>
          <Text style={[styles.customerValue, { color: themeColors.text }]}>
            {customerData.customerName}
          </Text>
        </View>
        {customerData.currentBouquet && (
          <View style={styles.customerRow}>
            <Text style={[styles.customerLabel, { color: themeColors.mutedText }]}>
              Current Package:
            </Text>
            <Text style={[styles.customerValue, { color: themeColors.text }]}>
              {customerData.currentBouquet}
            </Text>
          </View>
        )}
        {customerData.renewalAmount && (
          <View style={styles.customerRow}>
            <Text style={[styles.customerLabel, { color: themeColors.mutedText }]}>
              Renewal Amount:
            </Text>
            <Text style={[styles.customerValue, { color: themeColors.text }]}>
              {formatCurrency(parseFloat(customerData.renewalAmount), 'NGN')}
            </Text>
          </View>
        )}
        {customerData.dueDate && (
          <View style={styles.customerRow}>
            <Text style={[styles.customerLabel, { color: themeColors.mutedText }]}>Due Date:</Text>
            <Text style={[styles.customerValue, { color: themeColors.text }]}>
              {customerData.dueDate}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderBouquetCard = ({ item: bouquet }) => {
    const isSelected = selectedBouquet?.variation_code === bouquet.variation_code;
    const price = parseFloat(bouquet.variation_amount || 0);
    const cleanName = cleanBouquetName(bouquet);

    return (
      <TouchableOpacity
        key={bouquet.variation_code}
        style={[
          styles.bouquetCard,
          { 
            backgroundColor: isSelected ? `${themeColors.primary}20` : themeColors.card,
            borderColor: isSelected ? themeColors.primary : themeColors.border,
          },
        ]}
        onPress={() => setSelectedBouquet(bouquet)}
      >
        <View style={styles.bouquetInfo}>
          <Text style={[styles.bouquetName, { color: themeColors.text }]}>
            {cleanName}
          </Text>
          <Text style={[styles.bouquetPrice, { color: themeColors.primary }]}>
            {formatCurrency(price, 'NGN')}
          </Text>
        </View>
        {isSelected && (
          <Text style={[styles.checkmark, { color: themeColors.primary }]}>✓</Text>
        )}
      </TouchableOpacity>
    );
  };

  // ========================================
  // Main Render
  // ========================================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
    <StatusBar
           barStyle= { isDarkMode ? 'light-content' : 'dark-content'}
          //  barStyle= "dark-content"
           backgroundColor="transparent"
           translucent
         />
      <View style={styles.mainContainer}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <ScreenHeader
            title="TV Sub"
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
            onChange={(value) => {
              setProvider(value);
              setCustomerData(null);
              setSmartcardNumber('');
              setSelectedBouquet(null);
            }}
            placeholder="Select TV Provider"
            error={validationErrors.provider}
          />

          {/* Smartcard Number Input */}
          <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
            Smartcard / IUC Number
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                { 
                  color: themeColors.text, 
                  borderColor: validationErrors.smartcard ? themeColors.destructive : themeColors.border,
                  backgroundColor: themeColors.card,
                },
              ]}
              value={smartcardNumber}
              onChangeText={(text) => {
                setSmartcardNumber(text.replace(/\D/g, ''));
                setValidationErrors({ ...validationErrors, smartcard: undefined });
                setCustomerData(null);
              }}
              placeholder="Enter 10-11 digit number"
              placeholderTextColor={themeColors.mutedText}
              keyboardType="numeric"
              maxLength={11}
              editable={!isVerifying}
            />
            <TouchableOpacity
              style={[
                styles.verifyButton,
                { backgroundColor: (!provider || !smartcardNumber || isVerifying) 
                    ? themeColors.subheading 
                    : themeColors.primary 
                },
              ]}
              onPress={handleVerifySmartcard}
              disabled={isVerifying || !provider || !smartcardNumber}
            >
              {isVerifying ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>
          {validationErrors.smartcard && (
            <Text style={[styles.errorText, { color: themeColors.destructive }]}>
              {validationErrors.smartcard}
            </Text>
          )}

          {/* Customer Info */}
          {renderCustomerInfo()}

          {/* Subscription Type Selection */}
          {customerData && (
            <>
              <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
                Subscription Type
              </Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: subscriptionType === 'renew' 
                        ? themeColors.primary 
                        : themeColors.card,
                      borderColor: subscriptionType === 'renew'
                        ? themeColors.primary
                        : themeColors.border,
                    },
                  ]}
                  onPress={() => {
                    setSubscriptionType('renew');
                    setSelectedBouquet(null);
                  }}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: subscriptionType === 'renew' ? '#fff' : themeColors.text },
                    ]}
                  >
                    Renew Current
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: subscriptionType === 'change' 
                        ? themeColors.primary 
                        : themeColors.card,
                      borderColor: subscriptionType === 'change'
                        ? themeColors.primary
                        : themeColors.border,
                    },
                  ]}
                  onPress={() => setSubscriptionType('change')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: subscriptionType === 'change' ? '#fff' : themeColors.text },
                    ]}
                  >
                    Change Package
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

         
          {/* Bouquet Selection (Only for Change) */}
{customerData && subscriptionType === 'change' && (
  <>
    <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
      Select Bouquet
    </Text>
    {isLoadingBouquets ? (
      <ActivityIndicator 
        size="large" 
        color={themeColors.primary} 
        style={styles.loader} 
      />
    ) : (
      <View style={styles.bouquetsContainer}>
        {bouquets.map((bouquet) => renderBouquetCard({ item: bouquet }))}
      </View>
    )}
    {validationErrors.bouquet && (
      <Text style={[styles.errorText, { color: themeColors.destructive }]}>
        {validationErrors.bouquet}
      </Text>
    )}
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

      
        <View style={styles.bottomSpacer} />
 

          {/* Promo Card */}
          <PromoCard
            title="🎉 Get Rewards"
            subtitle="Earn cashback on every TV subscription"
            buttonText="Learn More"
            onPress={() => navigation.navigate('Rewards')}
          />
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Sticky Pay Button */}
        {canProceed() && (
        <View style={[styles.stickyFooter, { backgroundColor: themeColors.background }]}>
          <PayButton
            title={`Pay ${formatCurrency(getAmount(), 'NGN')}`}
            onPress={handlePayment}
            disabled={!canProceed()}
            loading={payment.step === 'processing'}
            style={styles.payButton}
          />
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
        amount={getAmount()}
        serviceName="TV Subscription"
        providerName={provider.toUpperCase()}
        recipient={smartcardNumber}
        recipientLabel="Smartcard Number"
        additionalInfo={
          subscriptionType === 'renew'
            ? `Renew: ${customerData?.currentBouquet}`
            : `Package: ${cleanBouquetName(selectedBouquet)}`
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
        subtitle={`Confirm payment of ${formatCurrency(getAmount(), 'NGN')}`}
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
  mainContainer: {
    flex: 1,
    position: 'relative', // Important for sticky footer positioning
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  bottomSpacer: {
    height: 80, // Space for the sticky button
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
    borderTopWidth: 3,
    borderTopColor: '#5403f5ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    height: 200
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  verifyButton: {
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 90,
  },
  verifyButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  customerCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  customerCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  customerLabel: {
    fontSize: 14,
  },
  customerValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bouquetsContainer: {
    gap: 10,
  },
  bouquetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  bouquetInfo: {
    flex: 1,
  },
  bouquetName: {
    fontSize: 16,
    fontWeight: '600',
  },
  bouquetPrice: {
    fontSize: 16,
    marginTop: 4,
    fontWeight: 'bold',
    marginTop: 10
  },
  checkmark: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  payButton: {
    marginTop: 24,
  },
  errorContainer: {
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  loader: {
    marginVertical: 20,
  },
});