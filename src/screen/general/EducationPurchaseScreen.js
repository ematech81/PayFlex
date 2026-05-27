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
  Modal,
  Clipboard,
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
import { purchaseExamPin, verifyJAMBProfile, getExamProducts } from 'AuthFunction/paymentService';

/**
 * Exam Product Card Component
 */
const ExamProductCard = React.memo(({
  product,
  examType,
  onPress,
  themeColors,
  isSelected,
  price: priceProp,
  isUnavailable,
}) => {
  const price = priceProp ?? EXAM_PRICES[examType]?.[product.code] ?? 0;

  return (
    <TouchableOpacity
      style={[
        styles.productCard,
        {
          backgroundColor: themeColors.card,
          borderColor: isSelected ? themeColors.primary : themeColors.border,
          borderWidth: isSelected ? 2 : 1,
          opacity: isUnavailable ? 0.55 : 1,
        },
      ]}
      onPress={isUnavailable ? undefined : onPress}
      activeOpacity={isUnavailable ? 1 : 0.7}
    >
      <View style={styles.productHeader}>
        <Text style={[styles.productName, { color: themeColors.heading }]}>
          {product.name}
        </Text>
        {isUnavailable ? (
          <View style={[styles.comingSoonBadge, { backgroundColor: '#FF990020' }]}>
            <Text style={[styles.comingSoonText, { color: '#CC6600' }]}>Coming Soon</Text>
          </View>
        ) : isSelected ? (
          <View style={[styles.selectedBadge, { backgroundColor: themeColors.primary }]}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.productDetails}>
        <Text style={[styles.productPrice, { color: isUnavailable ? themeColors.subtext : themeColors.primary }]}>
          {isUnavailable ? 'Price TBC' : formatCurrency(price, 'NGN')}
        </Text>
        {product.requiresProfile && !isUnavailable && (
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

// ─── PIN Delivery Modal ───────────────────────────────────────────────────────
const PinDeliveryModal = ({ visible, result, productName, examBody, onDone, onViewHistory, themeColors }) => {
  const [copiedIdx, setCopiedIdx] = useState(null);
  const pins   = result?.data?.pins   || [];
  const isPending = result?.pending === true;
  const quantity  = result?.data?.quantity || pins.length || 1;

  const copyPin = useCallback((pin, idx) => {
    Clipboard.setString(pin);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }, []);

  const copyAll = useCallback(() => {
    Clipboard.setString(pins.map(p => p.pin).join('\n'));
    setCopiedIdx('all');
    setTimeout(() => setCopiedIdx(null), 2000);
  }, [pins]);

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={pinStyles.backdrop}>
        <View style={[pinStyles.sheet, { backgroundColor: themeColors.background }]}>

          {/* Header */}
          <View style={[pinStyles.iconWrap, { backgroundColor: isPending ? '#FFF7E6' : '#E8F5E9' }]}>
            <Text style={pinStyles.iconEmoji}>{isPending ? '⏳' : '✅'}</Text>
          </View>
          <Text style={[pinStyles.title, { color: themeColors.heading }]}>
            {isPending ? 'Processing…' : 'Purchase Successful!'}
          </Text>
          <Text style={[pinStyles.subtitle, { color: themeColors.subheading }]}>
            {productName}{quantity > 1 ? ` × ${quantity}` : ''}
          </Text>

          {isPending ? (
            // JAMB async delivery
            <View style={[pinStyles.pendingBox, { backgroundColor: `${themeColors.primary}10`, borderColor: `${themeColors.primary}30` }]}>
              <Text style={[pinStyles.pendingText, { color: themeColors.heading }]}>
                Your JAMB e-PIN is being processed and will be delivered to your registered phone number and email address once confirmed.
              </Text>
              <Text style={[pinStyles.pendingHint, { color: themeColors.subtext }]}>
                You can also check your Transaction History to retrieve it.
              </Text>
            </View>
          ) : (
            <>
              {/* Save warning */}
              <View style={pinStyles.warningBox}>
                <Text style={pinStyles.warningText}>
                  ⚠️  Save your PIN(s) before closing. They are also saved in your Transaction History.
                </Text>
              </View>

              {/* PIN list */}
              <ScrollView style={pinStyles.pinList} showsVerticalScrollIndicator={false}>
                {pins.map((item, idx) => (
                  <View key={idx} style={[pinStyles.pinRow, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                    {quantity > 1 && (
                      <Text style={[pinStyles.pinIndex, { color: themeColors.subtext }]}>PIN {idx + 1}</Text>
                    )}
                    <Text style={[pinStyles.pinValue, { color: themeColors.heading }]}>{item.pin}</Text>
                    {item.serial ? (
                      <Text style={[pinStyles.pinSerial, { color: themeColors.subtext }]}>Serial: {item.serial}</Text>
                    ) : null}
                    <TouchableOpacity
                      style={[pinStyles.copyBtn, { backgroundColor: copiedIdx === idx ? '#E8F5E9' : `${themeColors.primary}15` }]}
                      onPress={() => copyPin(item.pin, idx)}
                    >
                      <Text style={[pinStyles.copyBtnText, { color: copiedIdx === idx ? '#2E7D32' : themeColors.primary }]}>
                        {copiedIdx === idx ? '✓ Copied' : 'Copy'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              {/* Copy All */}
              {pins.length > 1 && (
                <TouchableOpacity
                  style={[pinStyles.copyAllBtn, { borderColor: themeColors.primary }]}
                  onPress={copyAll}
                >
                  <Text style={[pinStyles.copyAllText, { color: themeColors.primary }]}>
                    {copiedIdx === 'all' ? '✓ All PINs Copied!' : 'Copy All PINs'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Action buttons */}
          <View style={pinStyles.actions}>
            <TouchableOpacity
              style={[pinStyles.actionBtn, pinStyles.secondaryBtn, { borderColor: themeColors.border }]}
              onPress={onViewHistory}
            >
              <Text style={[pinStyles.actionBtnText, { color: themeColors.heading }]}>View History</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pinStyles.actionBtn, pinStyles.primaryBtn, { backgroundColor: themeColors.primary }]}
              onPress={onDone}
            >
              <Text style={[pinStyles.actionBtnText, { color: '#fff' }]}>Done</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const pinStyles = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  iconWrap:    { width: 64, height: 64, borderRadius: 32, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  iconEmoji:   { fontSize: 30 },
  title:       { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  subtitle:    { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  warningBox:  { backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12, marginBottom: 14, borderLeftWidth: 3, borderLeftColor: '#F59E0B' },
  warningText: { fontSize: 13, color: '#92400E', lineHeight: 19 },
  pinList:     { maxHeight: 260, marginBottom: 12 },
  pinRow:      { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  pinIndex:    { fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  pinValue:    { fontSize: 26, fontWeight: '800', letterSpacing: 3, marginBottom: 4 },
  pinSerial:   { fontSize: 12, marginBottom: 8 },
  copyBtn:     { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  copyBtnText: { fontSize: 13, fontWeight: '600' },
  copyAllBtn:  { borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 12 },
  copyAllText: { fontSize: 14, fontWeight: '600' },
  pendingBox:  { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  pendingText: { fontSize: 14, lineHeight: 22, marginBottom: 8 },
  pendingHint: { fontSize: 12, lineHeight: 18 },
  actions:     { flexDirection: 'row', gap: 12, marginTop: 4 },
  actionBtn:   { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryBtn:  {},
  secondaryBtn:{ borderWidth: 1 },
  actionBtnText: { fontSize: 15, fontWeight: '700' },
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
  const [apiPrices, setApiPrices] = useState({});
  const [apiAvailability, setApiAvailability] = useState({});

  // JAMB Specific State
  const [profileCode, setProfileCode] = useState('');
  const [verifiedCandidate, setVerifiedCandidate] = useState(null);
  const [verifyingProfile, setVerifyingProfile] = useState(false);
  const [senderEmail, setSenderEmail] = useState('');

  // ========================================
  // VALIDATION FUNCTION
  // ========================================
  const validateEducationPayment = useCallback((paymentData) => {
    const errors = {};

    if (!paymentData.service) {
      errors.service = 'Please select an exam type';
    }

    if (!paymentData.product_code) {
      errors.product = 'Please select a product';
    }

    if (!paymentData.quantity || paymentData.quantity < 1 || paymentData.quantity > 50) {
      errors.quantity = 'Quantity must be between 1 and 50';
    }

    // JAMB-specific validation — phone/profile only required for JAMB
    if (paymentData.service === 'jamb') {
      const cleanPhone = (paymentData.phone || '').replace(/\s/g, '');
      if (!cleanPhone || !/^0\d{10}$/.test(cleanPhone)) {
        errors.phone = 'Valid 11-digit phone number is required for JAMB';
      }
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
  // INITIAL WALLET LOAD + API PRICE FETCH
  // ========================================
  useEffect(() => {
    refreshWallet();
    getExamProducts()
      .then((products) => {
        const priceLookup = {};
        const availLookup = {};
        products.forEach(({ examBody, productCode, sellingPrice, available }) => {
          if (!priceLookup[examBody]) { priceLookup[examBody] = {}; availLookup[examBody] = {}; }
          priceLookup[examBody][String(productCode)] = sellingPrice;
          availLookup[examBody][String(productCode)] = available !== false;
        });
        setApiPrices(priceLookup);
        setApiAvailability(availLookup);
      })
      .catch(() => {});
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
    setQuantity(prev => Math.max(1, Math.min(50, prev + delta)));
  }, []);

  const handlePurchase = useCallback(() => {
    if (!selectedProduct) {
      setValidationErrors({ product: 'Please select a product' });
      return;
    }

    setValidationErrors({});

    const cleanPhone = phoneNumber.replace(/\s/g, '');
    const price = getPriceForProduct(selectedExam, selectedProduct.code);

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

  const getPriceForProduct = useCallback((examType, productCode) => {
    return (
      apiPrices[examType]?.[String(productCode)] ??
      EXAM_PRICES[examType]?.[productCode] ??
      0
    );
  }, [apiPrices]);

  const getTotalAmount = useCallback(() => {
    if (!selectedProduct) return 0;
    return getPriceForProduct(selectedExam, selectedProduct.code) * quantity;
  }, [selectedExam, selectedProduct, quantity, getPriceForProduct]);

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
        onRightPress={() => navigation.navigate('Orders')}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: selectedProduct ? 200 : 40 }]}
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

        {/* JAMB how-to instructions */}
        {selectedExam === 'jamb' && (
          <View style={[styles.jambInstructions, { backgroundColor: '#FFF0F0', borderColor: '#FFCCCC' }]}>
            <Text style={[styles.jambInstructionsTitle, { color: '#CC0000' }]}>
              How to get your Profile Code
            </Text>
            {[
              "SMS 'NIN' followed by a space and your 11-digit NIN to 55019 — e.g. NIN 00123456789.",
              "You will receive an SMS with your 10-digit Profile Code and your registered NIN name.",
              "Enter the Profile Code below and complete payment.",
              "Your JAMB e-PIN will be delivered to your phone number once payment is confirmed.",
            ].map((step, i) => (
              <View key={i} style={styles.jambStep}>
                <View style={[styles.jambStepBadge, { backgroundColor: '#CC0000' }]}>
                  <Text style={styles.jambStepNum}>{i + 1}</Text>
                </View>
                <Text style={[styles.jambStepText, { color: themeColors.heading }]}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Product Selection */}
        <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
          Select Product Type
        </Text>
        <View style={styles.productsContainer}>
          {EXAM_PRODUCTS[selectedExam]?.map((product) => {
            const avail = apiAvailability[selectedExam];
            const isUnavailable = avail ? avail[product.code] === false : false;
            return (
              <ExamProductCard
                key={product.code}
                product={product}
                examType={selectedExam}
                onPress={() => handleProductSelect(product)}
                themeColors={themeColors}
                isSelected={selectedProduct?.code === product.code}
                price={getPriceForProduct(selectedExam, product.code)}
                isUnavailable={isUnavailable}
              />
            );
          })}
        </View>

        {/* Quantity Selector — all exam types */}
        {selectedProduct && (
          <View style={styles.quantitySection}>
            <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
              Number of PINs
            </Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity
                style={[styles.quantityButton, { backgroundColor: themeColors.card, opacity: quantity <= 1 ? 0.4 : 1 }]}
                onPress={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Text style={[styles.quantityButtonText, { color: themeColors.heading }]}>−</Text>
              </TouchableOpacity>

              <Text style={[styles.quantityValue, { color: themeColors.heading }]}>
                {quantity}
              </Text>

              <TouchableOpacity
                style={[styles.quantityButton, { backgroundColor: themeColors.card, opacity: quantity >= 50 ? 0.4 : 1 }]}
                onPress={() => handleQuantityChange(1)}
                disabled={quantity >= 50}
              >
                <Text style={[styles.quantityButtonText, { color: themeColors.heading }]}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.quantityHint, { color: themeColors.subtext }]}>
              Max 50 PINs per order
            </Text>
          </View>
        )}

        {/* JAMB-specific fields */}
        {selectedExam === 'jamb' && selectedProduct && (
          <>
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
            <PhoneInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="08XX-XXX-XXXX"
              label="Phone Number (to receive PIN)"
              error={validationErrors.phone}
            />
          </>
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

      {/* Success: show PINs */}
      <PinDeliveryModal
        visible={payment.step === 'result' && !!payment.result}
        result={payment.result}
        productName={selectedProduct?.name}
        examBody={selectedExam}
        onDone={payment.resetFlow}
        onViewHistory={handleTransactionComplete}
        themeColors={themeColors}
      />

      {/* Error */}
      <ResultModal
        visible={payment.step === 'result' && !payment.result}
        onClose={payment.resetFlow}
        type="error"
        title="Purchase Failed"
        message="Your exam PIN purchase could not be completed. Please try again."
        primaryAction={{ label: 'Try Again', onPress: payment.resetFlow }}
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
    comingSoonBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    comingSoonText: {
      fontSize: 11,
      fontWeight: '600',
    },
  
    // ========================================
    // JAMB INSTRUCTIONS
    // ========================================
    jambInstructions: {
      marginTop: 16,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
    },
    jambInstructionsTitle: {
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    jambStep: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 10,
      gap: 10,
    },
    jambStepBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 1,
      flexShrink: 0,
    },
    jambStepNum: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
    jambStepText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 20,
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
    quantityHint: {
      textAlign: 'center',
      fontSize: 12,
      marginTop: 8,
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