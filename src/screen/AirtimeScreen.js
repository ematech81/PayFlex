
import AmountInput from 'component/SHARED/INPUT/amountInput';
import PhoneInput from 'component/SHARED/INPUT/phoneInput';
import { AIRTIME_CONSTANTS } from 'CONSTANT/SERVICES/airtimeServices';
import { NETWORK_PROVIDERS } from 'CONSTANT/providerConstant';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { useWallet } from 'context/WalletContext';
import { useAirtimePurchase, usePaymentFlow, useTransactionPin } from 'HOOKS';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';

import {
  ScreenHeader,
  TabSelector,
  ProviderSelector,
  QuickAmountButton,
  PayButton,
  ConfirmationModal,
  PinModal,
  ResultModal,
  PromoCard,
  LoadingOverlay,
} from 'component/SHARED';

const { height } = Dimensions.get('window');



export default function AirtimeScreen({ navigation, route }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { wallet, refreshWallet } = useWallet();

  // Local UI State
  const [selectedTab, setSelectedTab] = useState('Local');
  const [validationErrors, setValidationErrors] = useState({});
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  
  // ✅ FIX: Store complete pending payment data, not just amount
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  const isReturningFromPinSetup = useRef(false);

  // Custom Hooks
  const {
    phoneNumber,
    setPhoneNumber,
    amount,
    setAmount,
    provider,
    setProvider,
    isLoading: isPurchasing,
    error: purchaseError,
    validatePurchase,
    purchaseAirtime,
    resetForm,
    clearError: clearPurchaseError,
  } = useAirtimePurchase();

  const {
    pin,
    resetPin,
    pinError,
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

  // Tabs
  const tabs = [
    { label: 'Local', value: 'Local' },
    { label: 'International', value: 'International', disabled: true },
  ];

  // Initial wallet load
  useEffect(() => {
    refreshWallet();
  }, []);

  // ✅ FIX: Handle return from PIN setup screen - RESTORE FORM DATA
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      if (route.params?.fromPinSetup === true) {
        console.log('🔄 Returned from PIN setup, restoring payment data...');
        
        // Clear the route param immediately
        navigation.setParams({ fromPinSetup: undefined });
        
        // ✅ FIX: Restore form data from pending payment
        if (pendingPaymentData) {
          console.log('📝 Restoring form data:', pendingPaymentData);
          setPhoneNumber(pendingPaymentData.phoneNumber);
          setProvider(pendingPaymentData.provider);
          setAmount(pendingPaymentData.amount);
        }
        
        // Small delay to ensure server has processed
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Force wallet refresh from server with retry
        const result = await refreshWallet({ 
          maxRetries: 3, 
          retryDelay: 1500 
        });
        
        if (result.success) {
          console.log('✅ Wallet refresh successful, PIN status:', result.data?.transactionPinSet);
          isReturningFromPinSetup.current = true;
        } else {
          console.error('⚠️ Wallet refresh failed, checking local state');
          isReturningFromPinSetup.current = true;
        }
      }
    });

    return unsubscribe;
  }, [navigation, route.params, pendingPaymentData]);

  // ✅ FIX: Auto-resume payment after PIN setup - GO DIRECTLY TO CONFIRMATION
  useEffect(() => {
    const resumePayment = () => {
      // Only proceed if all conditions are met
      if (
        isReturningFromPinSetup.current &&
        wallet?.transactionPinSet === true &&
        pendingPaymentData !== null
      ) {
        console.log('✅ PIN now set, auto-resuming payment...');
        console.log('Payment details:', pendingPaymentData);
        
        // Reset flag
        isReturningFromPinSetup.current = false;
        
        // Small delay for smooth UX
        setTimeout(() => {
          // ✅ FIX: Skip validation and go directly to confirmation
          startPaymentDirectToConfirm(pendingPaymentData);
        }, 400);
      }
    };

    resumePayment();
  }, [wallet?.transactionPinSet, pendingPaymentData]);

  // ✅ FIX: Direct to confirmation modal (bypasses PIN check)
  const startPaymentDirectToConfirm = useCallback((paymentData) => {
    clearPurchaseError();
    clearPinError();

    console.log('🚀 Starting payment directly to confirmation');

    // Start the payment flow at confirmation step
    const valid = startPayment(
      { 
        phoneNumber: paymentData.phoneNumber, 
        provider: paymentData.provider, 
        amount: paymentData.amount 
      },
      validatePurchase
    );

    if (valid) {
      console.log('✅ Payment validation passed, showing confirmation modal');
      // The startPayment function should automatically advance to 'confirm' step
    } else {
      console.log('❌ Payment validation failed');
      // If validation fails, clear pending data
      setPendingPaymentData(null);
    }
  }, [startPayment, validatePurchase]);

  // ✅ FIX: Main payment handler - STORE COMPLETE PAYMENT DATA
  const handlePaymentWithCurrentState = useCallback((paymentAmount) => {
    clearPurchaseError();
    clearPinError();

    console.log('💳 Starting payment flow with current state, PIN status:', wallet?.transactionPinSet);
    
    // ✅ FIX: Store complete payment data for resume
    const paymentData = {
      phoneNumber,
      provider,
      amount: paymentAmount
    };

    if (!wallet?.transactionPinSet) {
      console.log('⚠️ PIN not set in current state, storing payment data and showing modal');
      
      // Store complete payment data for later resume
      setPendingPaymentData(paymentData);
      
      // Show modal instead of navigating directly
      setShowPinSetupModal(true);
      return;
    }

    // Clear any pending payment
    setPendingPaymentData(null);
    isReturningFromPinSetup.current = false;

    // Start the payment flow normally
    const valid = startPayment(paymentData, validatePurchase);

    if (!valid) {
      console.log('❌ Payment validation failed');
    }
  }, [wallet, phoneNumber, provider, validatePurchase, startPayment]);

  // ✅ FIX: Handle "Create PIN" from modal - PRESERVE PAYMENT DATA
  const handleCreatePin = () => {
    setShowPinSetupModal(false);
    console.log('🔐 Navigating to PIN setup with stored data:', pendingPaymentData);
    
    // Navigate to PIN setup - payment data is already stored in state
    navigation.navigate('SetTransactionPin', { 
      fromScreen: 'Airtime',
    });
  };


  // ✅ FIX: Quick amount handler with validation
  const handleQuickAmount = useCallback((value) => {
    setAmount(value);
    
    // Validate before proceeding
    if (!validatePurchase(value)) {
      return;
    }
    
    handlePaymentWithCurrentState(value); 
  }, [validatePurchase, handlePaymentWithCurrentState]); 


//IX: Custom payment handler with validation
const handleCustomPayment = useCallback(() => {
  // Validate before proceeding
  if (!validatePurchase(amount)) {
    return;
  }
  
  handlePaymentWithCurrentState(amount); // ✅ Change this line
}, [amount, validatePurchase, handlePaymentWithCurrentState]); // ✅ Add dependency


  // ✅ FIX: Handle cancel from modal - CLEAR PAYMENT DATA
  const handleCancelPinSetup = () => {
    setShowPinSetupModal(false);
    setPendingPaymentData(null);
    isReturningFromPinSetup.current = false;
    console.log('❌ User cancelled PIN setup, cleared pending data');
  };

  // ✅ FIX: Also clear pending data when payment is completed or cancelled
  const handlePaymentComplete = () => {
    setPendingPaymentData(null);
    isReturningFromPinSetup.current = false;
  };

  const handlePinSubmit = async () => {
    clearPinError();

    const success = await processPayment(pin, purchaseAirtime);
    if (success) {
      resetPin();
      handlePaymentComplete();
      // Refresh wallet after successful purchase
      await refreshWallet();
    }
  };

  const handleForgotPin = () => {
    resetPin();
    navigation.navigate('ResetPin', { pinType: 'transaction' });
  };

  const handleTransactionComplete = () => {
    resetFlow();
    resetPin();
    handlePaymentComplete();
    navigation.navigate('TransactionDetails', { reference: result?.reference });
  };

  // ✅ FIX: Also clear pending data when user cancels payment flow
  const handleCancelPayment = () => {
    cancelPayment();
    handlePaymentComplete();
  };

  const getProviderLogo = () => NETWORK_PROVIDERS.find(p => p.value === provider)?.logo;
  const getProviderName = () => NETWORK_PROVIDERS.find(p => p.value === provider)?.label;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ScreenHeader
          title="Airtime"
          onBackPress={() => navigation.goBack()}
          rightText="History"
          onRightPress={() => navigation.navigate('History')}
        />

        {/* Tabs */}
        <TabSelector
          tabs={tabs}
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
        />

        {/* Provider Selection */}
        <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
          Select Service Provider
        </Text>
        <ProviderSelector
          providers={NETWORK_PROVIDERS}
          value={provider}
          onChange={setProvider}
          placeholder="Select Network Provider"
          error={validationErrors.provider}
        />

        {/* Phone Number Input */}
        <PhoneInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          onNetworkDetected={setProvider}
          placeholder="08XX-XXX-XXXX"
          error={validationErrors.phoneNumber}
        />

        {/* Quick Amounts */}
        <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
          Top-up Amount
        </Text>
        <View style={styles.quickAmountsContainer}>
          {AIRTIME_CONSTANTS.QUICK_AMOUNTS.map((quickAmount) => (
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
            minAmount={AIRTIME_CONSTANTS.LIMITS.MIN_AMOUNT}
            maxAmount={AIRTIME_CONSTANTS.LIMITS.MAX_AMOUNT}
            showBalance
            balance={wallet?.user?.walletBalance}
            error={validationErrors.amount}
          />

          <PayButton
            title="Pay"
            onPress={handleCustomPayment}
            disabled={false}
            loading={isPurchasing}
            style={styles.payButton}
          />
        </View>

        {/* Error Display */}
        {(purchaseError || flowError) && (
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: `${themeColors.destructive}20` },
            ]}
          >
            <Text style={[styles.errorText, { color: themeColors.destructive }]}>
              {purchaseError || flowError}
            </Text>
          </View>
        )}

        {/* Promo Card */}
        <PromoCard
          title="🎉 Refer And Win"
          subtitle="Invite your Friends and earn up to ₦10,000"
          buttonText="Refer"
          onPress={() => navigation.navigate('Referral')}
        />
      </ScrollView>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={step === 'confirm'}
        onClose={handleCancelPayment} // ✅ FIX: Use updated cancel handler
        onConfirm={confirmPayment}
        amount={Number(amount)}
        serviceName="Airtime"
        providerLogo={getProviderLogo()}
        providerName={getProviderName()}
        recipient={phoneNumber}
        recipientLabel="Phone Number"
        walletBalance={wallet?.user?.walletBalance}
        loading={false}
      />

      {/* PIN Modal */}
      <PinModal
        visible={step === 'pin' || step === 'processing'}
        onClose={() => {
          resetPin();
          handleCancelPayment(); // ✅ FIX: Use updated cancel handler
        }}
        onSubmit={handlePinSubmit}
        onForgotPin={wallet?.transactionPinSet ? handleForgotPin : undefined}
        error={pinError}
        title="Enter Transaction PIN"
        subtitle={`Confirm payment of ${formatCurrency(Number(amount), 'NGN')}`}
      />

      {/* Result Modal */}
      <ResultModal
        visible={step === 'result'}
        onClose={() => {
          resetFlow();
          handlePaymentComplete(); // ✅ FIX: Clear pending data
        }}
        type={result ? 'success' : 'error'}
        title={result ? 'Purchase Successful!' : 'Purchase Failed'}
        message={
          result
            ? `Your airtime purchase of ${formatCurrency(Number(amount), 'NGN')} to ${phoneNumber} was successful.`
            : flowError || 'Your airtime purchase could not be completed. Please try again.'
        }
        primaryAction={{
          label: 'View Details',
          onPress: handleTransactionComplete,
        }}
        secondaryAction={{
          label: 'Done',
          onPress: () => {
            resetFlow();
            handlePaymentComplete(); // ✅ FIX: Clear pending data
          },
        }}
      />

      {/* Loading Overlay */}
      <LoadingOverlay
        visible={step === 'processing'}
        message="Processing your payment..."
      />

      {/* Transaction PIN Setup Required Modal */}
      <ResultModal
        visible={showPinSetupModal}
        onClose={handleCancelPinSetup}
        type="warning"
        title="Transaction PIN Required"
        message="You need to set up a transaction PIN before making payments. This helps keep your account secure."
        primaryAction={{
          label: 'Create PIN',
          onPress: handleCreatePin,
        }}
        secondaryAction={{
          label: 'Cancel',
          onPress: handleCancelPinSetup,
        }}
      />
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
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
});




// export default function AirtimeScreen({ navigation, route }) {
//   const isDarkMode = useThem();
//   const themeColors = isDarkMode ? colors.dark : colors.light;
//   const { wallet, refreshWallet } = useWallet();

//   // Local UI State
//   const [selectedTab, setSelectedTab] = useState('Local');
//   const [validationErrors, setValidationErrors] = useState({});
//   const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  
//   // ✅ FIX: Store pending payment amount for resume
//   const [pendingPaymentAmount, setPendingPaymentAmount] = useState(null);
//   const isReturningFromPinSetup = useRef(false);

//   // Custom Hooks
//   const {
//     phoneNumber,
//     setPhoneNumber,
//     amount,
//     setAmount,
//     provider,
//     setProvider,
//     isLoading: isPurchasing,
//     error: purchaseError,
//     validatePurchase,
//     purchaseAirtime,
//     clearError: clearPurchaseError,
//   } = useAirtimePurchase();

//   const {
//     pin,
//     resetPin,
//     pinError,
//     clearError: clearPinError,
//   } = useTransactionPin();

//   const {
//     step,
//     error: flowError,
//     result,
//     startPayment,
//     confirmPayment,
//     processPayment,
//     cancelPayment,
//     resetFlow,
//   } = usePaymentFlow();

//   // Tabs
//   const tabs = [
//     { label: 'Local', value: 'Local' },
//     { label: 'International', value: 'International', disabled: true },
//   ];

//   // Initial wallet load
//   useEffect(() => {
//     refreshWallet();
//   }, []);

//   // ✅ FIX: Handle return from PIN setup screen
//   useEffect(() => {
//     const unsubscribe = navigation.addListener('focus', async () => {
//       if (route.params?.fromPinSetup === true) {
//         console.log('🔄 Returned from PIN setup, refreshing wallet...');
        
//         // Small delay to ensure server has processed
//         await new Promise(resolve => setTimeout(resolve, 800));
        
//         // Force wallet refresh from server with retry
//         const result = await refreshWallet({ 
//           maxRetries: 3, 
//           retryDelay: 1500 
//         });
        
//         if (result.success) {
//           console.log('✅ Wallet refresh successful, PIN status:', result.data?.transactionPinSet);
//           isReturningFromPinSetup.current = true;
//         } else {
//           console.error('⚠️ Wallet refresh failed, checking local state');
//           // Even if refresh fails, local state should be updated
//           isReturningFromPinSetup.current = true;
//         }
        
//         // Clear the route param
//         navigation.setParams({ fromPinSetup: undefined });
//       }
//     });

//     return unsubscribe;
//   }, [navigation, route.params]);

//   // ✅ FIX: Auto-resume payment after PIN setup
//   useEffect(() => {
//     const resumePayment = () => {
//       // Only proceed if all conditions are met
//       if (
//         isReturningFromPinSetup.current &&
//         wallet?.transactionPinSet === true &&
//         pendingPaymentAmount !== null
//       ) {
//         console.log('✅ PIN now set, auto-resuming payment...');
//         console.log('Payment details:', {
//           amount: pendingPaymentAmount,
//           provider,
//           phoneNumber,
//           pinStatus: wallet?.transactionPinSet
//         });
        
//         // Reset flag
//         isReturningFromPinSetup.current = false;
        
//         // Small delay for smooth UX
//         setTimeout(() => {
//           handlePayment(pendingPaymentAmount);
//           setPendingPaymentAmount(null);
//         }, 400);
//       }
//     };

//     resumePayment();
//   }, [wallet?.transactionPinSet, pendingPaymentAmount]);

//   // ✅ FIX: Validate inputs before proceeding
//   const validateInputs = useCallback((paymentAmount) => {
//     const errors = {};

//     if (!provider) {
//       errors.provider = 'Please select a network provider to proceed';
//     }

//     if (!phoneNumber || phoneNumber.trim().length === 0) {
//       errors.phoneNumber = 'Please enter a mobile number to proceed';
//     } else if (phoneNumber.length < 11) {
//       errors.phoneNumber = 'Please enter a valid 11-digit phone number';
//     }

//     if (!paymentAmount || paymentAmount <= 0) {
//       errors.amount = 'Please enter a valid amount';
//     } else if (paymentAmount < AIRTIME_CONSTANTS.LIMITS.MIN_AMOUNT) {
//       errors.amount = `Minimum amount is ${formatCurrency(AIRTIME_CONSTANTS.LIMITS.MIN_AMOUNT, 'NGN')}`;
//     } else if (paymentAmount > AIRTIME_CONSTANTS.LIMITS.MAX_AMOUNT) {
//       errors.amount = `Maximum amount is ${formatCurrency(AIRTIME_CONSTANTS.LIMITS.MAX_AMOUNT, 'NGN')}`;
//     }

//     // Check wallet balance
//     if (wallet?.user?.walletBalance != null && paymentAmount > wallet.user.walletBalance) {
//       errors.amount = 'Insufficient wallet balance';
//     }

//     setValidationErrors(errors);
    
//     // Show first error as alert
//     if (Object.keys(errors).length > 0) {
//       const firstError = Object.values(errors)[0];
//       Alert.alert('Validation Error', firstError);
//       return false;
//     }

//     return true;
//   }, [provider, phoneNumber, wallet?.user?.walletBalance]);

//   // Clear validation errors when user makes changes
//   useEffect(() => {
//     if (Object.keys(validationErrors).length > 0) {
//       setValidationErrors({});
//     }
//   }, [provider, phoneNumber, amount]);

//   // ✅ FIX: Quick amount handler with validation
//   const handleQuickAmount = useCallback((value) => {
//     setAmount(value);
    
//     // Validate before proceeding
//     if (!validateInputs(value)) {
//       return;
//     }
    
//     handlePayment(value);
//   }, [validateInputs]);

//   // ✅ FIX: Custom payment handler with validation
//   const handleCustomPayment = useCallback(() => {
//     // Validate before proceeding
//     if (!validateInputs(amount)) {
//       return;
//     }
    
//     handlePayment(amount);
//   }, [amount, validateInputs]);

//   // ✅ FIX: Main payment handler with modal prompt
//   const handlePayment = useCallback((paymentAmount) => {
//     clearPurchaseError();
//     clearPinError();

//     console.log('💳 Starting payment flow, PIN status:', wallet?.transactionPinSet);
    
//     // ✅ FIX #1: Check if PIN is set
//     if (!wallet?.transactionPinSet) {
//       console.log('⚠️ PIN not set, showing modal prompt');
      
//       // Store payment details for later
//       setPendingPaymentAmount(paymentAmount);
      
//       // ✅ FIX: Show modal instead of navigating directly
//       setShowPinSetupModal(true);
//       return;
//     }

//     // Clear any pending payment
//     setPendingPaymentAmount(null);
//     isReturningFromPinSetup.current = false;

//     // Start the payment flow
//     const valid = startPayment(
//       { phoneNumber, provider, amount: paymentAmount },
//       validatePurchase
//     );

//     if (!valid) {
//       console.log('❌ Payment validation failed');
//     }
//   }, [wallet?.transactionPinSet, phoneNumber, provider, validatePurchase, startPayment]);

//   // ✅ FIX: Handle "Create PIN" from modal
//   const handleCreatePin = () => {
//     setShowPinSetupModal(false);
//     console.log('🔐 Navigating to PIN setup with stored data:', {
//       amount: pendingPaymentAmount,
//       provider,
//       phoneNumber
//     });
    
//     // Navigate to PIN setup
//     navigation.navigate('SetTransactionPin', { 
//       fromScreen: 'Airtime',
//     });
//   };

//   // ✅ FIX: Handle cancel from modal
//   const handleCancelPinSetup = () => {
//     setShowPinSetupModal(false);
//     setPendingPaymentAmount(null);
//     isReturningFromPinSetup.current = false;
//     console.log('❌ User cancelled PIN setup');
//   };

//   const handlePinSubmit = async () => {
//     clearPinError();

//     const success = await processPayment(pin, purchaseAirtime);
//     if (success) {
//       resetPin();
//       // Refresh wallet after successful purchase
//       await refreshWallet();
//     }
//   };

//   const handleForgotPin = () => {
//     resetPin();
//     navigation.navigate('ResetPin', { pinType: 'transaction' });
//   };

//   const handleTransactionComplete = () => {
//     resetFlow();
//     resetPin();
//     navigation.navigate('TransactionDetails', { reference: result?.reference });
//   };

//   const getProviderLogo = () => NETWORK_PROVIDERS.find(p => p.value === provider)?.logo;
//   const getProviderName = () => NETWORK_PROVIDERS.find(p => p.value === provider)?.label;

//   return (
//     <SafeAreaView
//       style={[styles.container, { backgroundColor: themeColors.background }]}
//     >
//       <ScrollView 
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Header */}
//         <ScreenHeader
//           title="Airtime"
//           onBackPress={() => navigation.goBack()}
//           rightText="History"
//           onRightPress={() => navigation.navigate('History')}
//         />

//         {/* Tabs */}
//         <TabSelector
//           tabs={tabs}
//           selectedTab={selectedTab}
//           onTabChange={setSelectedTab}
//         />

//         {/* Provider Selection */}
//         <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
//           Select Service Provider
//         </Text>
//         <ProviderSelector
//           providers={NETWORK_PROVIDERS}
//           value={provider}
//           onChange={setProvider}
//           placeholder="Select Network Provider"
//           error={validationErrors.provider}
//         />

//         {/* Phone Number Input */}
//         <PhoneInput
//           value={phoneNumber}
//           onChangeText={setPhoneNumber}
//           onNetworkDetected={setProvider}
//           placeholder="08XX-XXX-XXXX"
//           error={validationErrors.phoneNumber}
//         />

//         {/* Quick Amounts */}
//         <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
//           Top-up Amount
//         </Text>
//         <View style={styles.quickAmountsContainer}>
//           {AIRTIME_CONSTANTS.QUICK_AMOUNTS.map((quickAmount) => (
//             <QuickAmountButton
//               key={quickAmount.value}
//               amount={quickAmount.value}
//               onPress={handleQuickAmount}
//               isSelected={amount === quickAmount.value}
//             />
//           ))}
//         </View>

//         {/* Custom Amount Input */}
//         <View
//           style={[
//             styles.customAmountContainer,
//             { backgroundColor: themeColors.card },
//           ]}
//         >
//           <AmountInput
//             value={amount}
//             onChangeText={setAmount}
//             placeholder="Enter Amount"
//             minAmount={AIRTIME_CONSTANTS.LIMITS.MIN_AMOUNT}
//             maxAmount={AIRTIME_CONSTANTS.LIMITS.MAX_AMOUNT}
//             showBalance
//             balance={wallet?.user?.walletBalance}
//             error={validationErrors.amount}
//           />

//           {/* ✅ FIX: Always enabled Pay button */}
//           <PayButton
//             title="Pay"
//             onPress={handleCustomPayment}
//             disabled={false}
//             loading={isPurchasing}
//             style={styles.payButton}
//           />
//         </View>

//         {/* Error Display */}
//         {(purchaseError || flowError) && (
//           <View
//             style={[
//               styles.errorContainer,
//               { backgroundColor: `${themeColors.destructive}20` },
//             ]}
//           >
//             <Text style={[styles.errorText, { color: themeColors.destructive }]}>
//               {purchaseError || flowError}
//             </Text>
//           </View>
//         )}

//         {/* Promo Card */}
//         <PromoCard
//           title="🎉 Refer And Win"
//           subtitle="Invite your Friends and earn up to ₦10,000"
//           buttonText="Refer"
//           onPress={() => navigation.navigate('Referral')}
//         />
//       </ScrollView>

//       {/* Confirmation Modal */}
//       <ConfirmationModal
//         visible={step === 'confirm'}
//         onClose={cancelPayment}
//         onConfirm={confirmPayment}
//         amount={Number(amount)}
//         serviceName="Airtime"
//         providerLogo={getProviderLogo()}
//         providerName={getProviderName()}
//         recipient={phoneNumber}
//         recipientLabel="Phone Number"
//         walletBalance={wallet?.user?.walletBalance}
//         loading={false}
//       />

//       {/* PIN Modal */}
//       <PinModal
//         visible={step === 'pin' || step === 'processing'}
//         onClose={() => {
//           resetPin();
//           cancelPayment();
//         }}
//         onSubmit={handlePinSubmit}
//         onForgotPin={wallet?.transactionPinSet ? handleForgotPin : undefined}
//         error={pinError}
//         title="Enter Transaction PIN"
//         subtitle={`Confirm payment of ${formatCurrency(Number(amount), 'NGN')}`}
//       />

//       {/* Result Modal */}
//       <ResultModal
//         visible={step === 'result'}
//         onClose={resetFlow}
//         type={result ? 'success' : 'error'}
//         title={result ? 'Purchase Successful!' : 'Purchase Failed'}
//         message={
//           result
//             ? `Your airtime purchase of ${formatCurrency(Number(amount), 'NGN')} to ${phoneNumber} was successful.`
//             : flowError || 'Your airtime purchase could not be completed. Please try again.'
//         }
//         primaryAction={{
//           label: 'View Details',
//           onPress: handleTransactionComplete,
//         }}
//         secondaryAction={{
//           label: 'Done',
//           onPress: resetFlow,
//         }}
//       />

//       {/* Loading Overlay */}
//       <LoadingOverlay
//         visible={step === 'processing'}
//         message="Processing your payment..."
//       />

//       {/* ✅ FIX: Transaction PIN Setup Required Modal */}
//       <ResultModal
//         visible={showPinSetupModal}
//         onClose={handleCancelPinSetup}
//         type="warning"
//         title="Transaction PIN Required"
//         message="You need to set up a transaction PIN before making payments. This helps keep your account secure."
//         primaryAction={{
//           label: 'Create PIN',
//           onPress: handleCreatePin,
//         }}
//         secondaryAction={{
//           label: 'Cancel',
//           onPress: handleCancelPinSetup,
//         }}
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   scrollContent: {
//     padding: 16,
//     paddingBottom: 40,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     marginTop: 20,
//     marginBottom: 12,
//   },
//   quickAmountsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//     marginBottom: 20,
//   },
//   customAmountContainer: {
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   payButton: {
//     marginTop: 12,
//   },
//   errorContainer: {
//     borderRadius: 12,
//     padding: 12,
//     marginBottom: 16,
//   },
//   errorText: {
//     fontSize: 13,
//     fontWeight: '500',
//     textAlign: 'center',
//   },
// });