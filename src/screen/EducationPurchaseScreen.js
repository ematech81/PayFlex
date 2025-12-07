import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
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
  EmptyState,
} from 'component/SHARED';

// Custom Components
import PhoneInput from 'component/SHARED/INPUT/phoneInput';
import { useServicePayment } from 'HOOKS/UseServicePayment';
import PinSetupModal from 'component/PinSetUpModal';
import { useWallet } from 'context/WalletContext';
import JAMBVerificationCard from 'component/JAMBVerificationCard';

// Constants & Utils
import { EXAM_PROVIDERS, EXAM_PRODUCTS, EXAM_PRICES } from 'CONSTANT/educationConstant';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { StatusBarComponent } from 'component/StatusBar';
import { purchaseExamPin, verifyJAMBProfile } from 'AuthFunction/paymentService';

/**
 * Exam Product Card Component
 */
const ExamProductCard = React.memo(({ 
  product, 
  examType, 
  onPress, 
  themeColors, 
  isSelected 
}) => {
  const price = EXAM_PRICES[examType]?.[product.code] || 0;
  
  return (
    <TouchableOpacity
      style={[
        styles.productCard,
        { 
          backgroundColor: themeColors.card,
          borderColor: isSelected ? themeColors.primary : themeColors.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.productHeader}>
        <Text style={[styles.productName, { color: themeColors.heading }]}>
          {product.name}
        </Text>
        {isSelected && (
          <View style={[styles.selectedBadge, { backgroundColor: themeColors.primary }]}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </View>

      <View style={styles.productDetails}>
        <Text style={[styles.productPrice, { color: themeColors.primary }]}>
          {formatCurrency(price, 'NGN')}
        </Text>
        {product.requiresProfile && (
          <View style={[styles.requiresBadge, { backgroundColor: `${themeColors.primary}20` }]}>
            <Text style={[styles.requiresText, { color: themeColors.primary }]}>
              Requires Profile Code
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

/**
 * Education Purchase Screen
 */
export default function EducationPurchaseScreen({ navigation, route }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { wallet, refreshWallet } = useWallet();

  // Local State
  const [selectedExam, setSelectedExam] = useState('waec');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [validationErrors, setValidationErrors] = useState({});

  // JAMB Specific State
  const [profileCode, setProfileCode] = useState('');
  const [verifiedCandidate, setVerifiedCandidate] = useState(null);
  const [verifyingProfile, setVerifyingProfile] = useState(false);
  const [senderEmail, setSenderEmail] = useState('');

  // ========================================
  // VALIDATION FUNCTION
  // ========================================
  const validateEducationPayment = useCallback((paymentData) => {
    console.log('🔍 Validating education payment:', paymentData);
    
    const errors = {};

    // Phone validation
    const cleanPhone = (paymentData.phone || '').replace(/\s/g, '');
    const phoneRegex = /^0\d{10}$/;
    
    if (!cleanPhone) {
      errors.phone = 'Phone number is required';
    } else if (cleanPhone.length !== 11) {
      errors.phone = 'Phone number must be 11 digits';
    } else if (!phoneRegex.test(cleanPhone)) {
      errors.phone = 'Invalid Nigerian phone number';
    }

    if (!paymentData.service) {
      errors.service = 'Please select an exam type';
    }

    if (!paymentData.product_code) {
      errors.product = 'Please select a product';
    }

    if (!paymentData.quantity || paymentData.quantity < 1 || paymentData.quantity > 5) {
      errors.quantity = 'Quantity must be between 1 and 5';
    }

    // JAMB specific validation
    if (paymentData.service === 'jamb') {
      if (!paymentData.profilecode) {
        errors.profilecode = 'Profile code is required for JAMB';
      }
      if (!paymentData.sender) {
        errors.sender = 'Email is required for JAMB';
      } else if (!/\S+@\S+\.\S+/.test(paymentData.sender)) {
        errors.sender = 'Invalid email format';
      }
      if (!verifiedCandidate) {
        errors.verification = 'Please verify profile code first';
      }
    }

    const isValid = Object.keys(errors).length === 0;
    console.log('✅ Validation result:', { isValid, errors });
    setValidationErrors(errors);

    return { isValid, errors };
  }, [verifiedCandidate]);

  // ========================================
  // UNIFIED PAYMENT HOOK
  // ========================================
  const payment = useServicePayment({
    serviceName: 'Education',
    validatePayment: validateEducationPayment,
    executePurchase: async (pin, paymentData) => {
      return await purchaseExamPin(pin, paymentData);
    },
    navigation,
    route,
  });

  // ========================================
  // RESTORE FORM DATA AFTER PIN SETUP
  // ========================================
  useEffect(() => {
    payment.restoreFormData((data) => {
      console.log('📝 Restoring education purchase form:', data);
      setPhoneNumber(data.phone);
      setSelectedExam(data.service);
      setSelectedProduct(data.selectedProduct);
      setQuantity(data.quantity);
      if (data.service === 'jamb') {
        setProfileCode(data.profilecode);
        setSenderEmail(data.sender);
        setVerifiedCandidate(data.verifiedCandidate);
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
  // RESET JAMB DATA ON EXAM CHANGE
  // ========================================
  useEffect(() => {
    if (selectedExam !== 'jamb') {
      setProfileCode('');
      setVerifiedCandidate(null);
      setSenderEmail('');
    }
    setSelectedProduct(null);
    setValidationErrors({});
  }, [selectedExam]);

  // ========================================
  // JAMB PROFILE VERIFICATION
  // ========================================
  const handleVerifyProfile = useCallback(async () => {
    if (!profileCode || !selectedProduct) {
      Alert.alert('Error', 'Please enter profile code and select a product');
      return;
    }

    try {
      setVerifyingProfile(true);
      const result = await verifyJAMBProfile(profileCode, selectedProduct.code);
      
      if (result.success) {
        setVerifiedCandidate(result.data);
        Alert.alert('Success', `Verified: ${result.data.customerName}`);
      } else {
        Alert.alert('Verification Failed', result.message || 'Invalid profile code');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to verify profile code');
    } finally {
      setVerifyingProfile(false);
    }
  }, [profileCode, selectedProduct]);

  // ========================================
  // HANDLERS
  // ========================================
  const handleProductSelect = useCallback((product) => {
    setSelectedProduct(product);
    setValidationErrors({});
    
    // Reset JAMB verification if product changes
    if (selectedExam === 'jamb') {
      setVerifiedCandidate(null);
    }
  }, [selectedExam]);

  const handleQuantityChange = useCallback((delta) => {
    setQuantity(prev => Math.max(1, Math.min(5, prev + delta)));
  }, []);

  const handlePurchase = useCallback(() => {
    if (!selectedProduct) {
      setValidationErrors({ product: 'Please select a product' });
      return;
    }

    setValidationErrors({});

    const cleanPhone = phoneNumber.replace(/\s/g, '');
    const price = EXAM_PRICES[selectedExam]?.[selectedProduct.code] || 0;

    const paymentData = {
      service: selectedExam,
      product_code: selectedProduct.code,
      quantity,
      phone: cleanPhone,
      amount: price * quantity,
      selectedProduct,
    };

    // Add JAMB specific data
    if (selectedExam === 'jamb') {
      paymentData.profilecode = profileCode;
      paymentData.sender = senderEmail;
      paymentData.verifiedCandidate = verifiedCandidate;
    }

    payment.initiatePayment(paymentData);
  }, [phoneNumber, selectedExam, selectedProduct, quantity, profileCode, senderEmail, verifiedCandidate, payment]);

  const handleTransactionComplete = useCallback(() => {
    payment.handleTransactionComplete(payment.result?.reference);
  }, [payment]);

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  const getExamProvider = useCallback(() => {
    return EXAM_PROVIDERS[selectedExam];
  }, [selectedExam]);

  const getTotalAmount = useCallback(() => {
    if (!selectedProduct) return 0;
    const price = EXAM_PRICES[selectedExam]?.[selectedProduct.code] || 0;
    return price * quantity;
  }, [selectedExam, selectedProduct, quantity]);

  // ========================================
  // TABS CONFIGURATION
  // ========================================
  const examTabs = Object.values(EXAM_PROVIDERS).map(provider => ({
    label: provider.label,
    value: provider.value,
  }));

  // ========================================
  // LOADING STATE
  // ========================================
  if (wallet?.isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ScreenHeader title="Education" onBackPress={() => navigation.goBack()} />
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
        title="Education"
        onBackPress={() => navigation.goBack()}
        rightText="History"
        onRightPress={() => navigation.navigate('MainTabs', {screen: 'Orders'})}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Exam Type Tabs */}
        <TabSelector
          tabs={examTabs}
          selectedTab={selectedExam}
          onTabChange={setSelectedExam}
        />

        {/* Exam Info Card */}
        <View style={[styles.infoCard, { backgroundColor: themeColors.card }]}>
          <Image 
            source={getExamProvider().logo} 
            style={styles.examLogo}
            resizeMode="contain"
          />
          <View style={styles.infoContent}>
            <Text style={[styles.examTitle, { color: themeColors.heading }]}>
              {getExamProvider().label}
            </Text>
            <Text style={[styles.examDescription, { color: themeColors.subheading }]}>
              {getExamProvider().description}
            </Text>
          </View>
        </View>

        {/* Product Selection */}
        <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
          Select Product Type
        </Text>
        <View style={styles.productsContainer}>
          {EXAM_PRODUCTS[selectedExam]?.map((product) => (
            <ExamProductCard
              key={product.code}
              product={product}
              examType={selectedExam}
              onPress={() => handleProductSelect(product)}
              themeColors={themeColors}
              isSelected={selectedProduct?.code === product.code}
            />
          ))}
        </View>

        {/* JAMB Verification (conditional) */}
        {selectedExam === 'jamb' && selectedProduct && (
          <JAMBVerificationCard
            profileCode={profileCode}
            onProfileCodeChange={setProfileCode}
            senderEmail={senderEmail}
            onSenderEmailChange={setSenderEmail}
            verifiedCandidate={verifiedCandidate}
            onVerify={handleVerifyProfile}
            verifying={verifyingProfile}
            themeColors={themeColors}
          />
        )}

        {/* Phone Number Input */}
        <PhoneInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="08XX-XXX-XXXX"
          label="Recipient Phone Number"
          error={validationErrors.phone}
        />

        {/* Quantity Selector */}
        {selectedProduct && (
          <View style={styles.quantitySection}>
            <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
              Quantity
            </Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity
                style={[styles.quantityButton, { backgroundColor: themeColors.card }]}
                onPress={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Text style={[styles.quantityButtonText, { color: themeColors.heading }]}>
                  -
                </Text>
              </TouchableOpacity>
              
              <Text style={[styles.quantityValue, { color: themeColors.heading }]}>
                {quantity}
              </Text>
              
              <TouchableOpacity
                style={[styles.quantityButton, { backgroundColor: themeColors.card }]}
                onPress={() => handleQuantityChange(1)}
                disabled={quantity >= 5}
              >
                <Text style={[styles.quantityButtonText, { color: themeColors.heading }]}>
                  +
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Error Display */}
        {validationErrors.product && (
          <View style={[styles.errorContainer, { backgroundColor: `${themeColors.destructive}20` }]}>
            <Text style={[styles.errorText, { color: themeColors.destructive }]}>
              {validationErrors.product}
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

      {/* Sticky Purchase Button */}
      {selectedProduct && (
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
                {getExamProvider().label} - {selectedProduct.name}
              </Text>
              <Text style={[styles.footerQuantity, { color: themeColors.subtext }]}>
                Quantity: {quantity}
              </Text>
              <Text style={[styles.footerPrice, { color: themeColors.primary }]}>
                {formatCurrency(getTotalAmount(), 'NGN')}
              </Text>
            </View>
          </View>
          <PayButton
            title="Purchase Now"
            onPress={handlePurchase}
            disabled={payment.step === 'processing'}
            loading={payment.step === 'processing'}
            style={styles.purchaseButton}
          />
        </View>
      )}

      {/* ========================================
          MODALS
          ======================================== */}

      <PinSetupModal
        visible={payment.showPinSetupModal}
        serviceName="Exam PIN"
        paymentAmount={getTotalAmount()}
        onCreatePin={payment.handleCreatePin}
        onCancel={payment.handleCancelPinSetup}
        isDarkMode={isDarkMode}
      />

      <ConfirmationModal
        visible={payment.step === 'confirm'}
        onClose={payment.handleCancelPayment}
        onConfirm={payment.confirmPayment}
        amount={getTotalAmount()}
        serviceName={`${getExamProvider().label} - ${selectedProduct?.name}`}
        providerLogo={getExamProvider().logo}
        providerName={getExamProvider().label}
        recipient={phoneNumber.replace(/\s/g, '')}
        recipientLabel="Phone Number"
        walletBalance={wallet?.user?.walletBalance}
        additionalDetails={[
          { label: 'Product', value: selectedProduct?.name || 'N/A' },
          { label: 'Quantity', value: quantity.toString() },
          ...(selectedExam === 'jamb' && verifiedCandidate ? [
            { label: 'Candidate', value: verifiedCandidate.customerName },
            { label: 'Profile Code', value: profileCode },
          ] : []),
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
        subtitle={`Confirm purchase of ${quantity} ${selectedProduct?.name}`}
      />

      <ResultModal
        visible={payment.step === 'result'}
        onClose={payment.resetFlow}
        type={payment.result ? 'success' : 'error'}
        title={payment.result ? 'Purchase Successful!' : 'Purchase Failed'}
        message={
          payment.result
            ? `Your ${getExamProvider().label} ${selectedProduct?.name} purchase was successful. PINs sent to ${phoneNumber.replace(/\s/g, '')}.`
            : 'Your exam PIN purchase could not be completed. Please try again.'
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
        message="Processing your purchase..."
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
    // EXAM INFO CARD
    // ========================================
    infoCard: {
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
    examLogo: {
      width: 60,
      height: 60,
      marginRight: 16,
    },
    infoContent: {
      flex: 1,
    },
    examTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 4,
    },
    examDescription: {
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
    // PRODUCT CARDS
    // ========================================
    productsContainer: {
      gap: 12,
    },
    productCard: {
      padding: 16,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    productHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    productName: {
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
      marginRight: 8,
    },
    selectedBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkmark: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: 'bold',
    },
    productDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    productPrice: {
      fontSize: 18,
      fontWeight: '700',
    },
    requiresBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    requiresText: {
      fontSize: 11,
      fontWeight: '600',
    },
  
    // ========================================
    // QUANTITY SELECTOR
    // ========================================
    quantitySection: {
      marginTop: 20,
    },
    quantityControl: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      gap: 20,
    },
    quantityButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    quantityButtonText: {
      fontSize: 24,
      fontWeight: '600',
    },
    quantityValue: {
      fontSize: 28,
      fontWeight: '700',
      minWidth: 50,
      textAlign: 'center',
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
      marginBottom: 2,
    },
    footerQuantity: {
      fontSize: 12,
      marginBottom: 4,
    },
    footerPrice: {
      fontSize: 22,
      fontWeight: '700',
    },
    purchaseButton: {
      width: '100%',
    },
  });