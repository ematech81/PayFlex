
// hooks/useServicePayment.js
import { useState, useRef, useEffect, useCallback } from 'react';

import { useWallet } from 'context/WalletContext';
import { useTransactionPin } from './useTransationPin';
import { usePaymentFlow } from './usePaymentFlow';
/**
 * Unified payment hook for all VTpass services
 * Handles PIN checking, payment flow, and state restoration
 * 
 * @param {Object} config
 * @param {string} config.serviceName - Name of service (e.g., 'Airtime', 'Data', 'Electricity')
 * @param {Function} config.validatePayment - Validation function for service-specific data
 * @param {Function} config.executePurchase - API call function to complete purchase
 * @param {Object} config.navigation - React Navigation object
 * @param {Object} config.route - React Navigation route object
 * @returns {Object} Payment flow methods and state
 */
export function useServicePayment({ 
  serviceName, 
  validatePayment, 
  executePurchase,
  navigation,
  route 
}) {
  const { wallet, refreshWallet } = useWallet();
  
  // Local state
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  const [currentPaymentData, setCurrentPaymentData] = useState(null); //  ADD: Store current payment
  const isReturningFromPinSetup = useRef(false);
  
  // Payment flow hooks
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

  // ========================================
  // EFFECT 1: Handle Return from PIN Setup
  // ========================================
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      if (route.params?.fromPinSetup === true) {
        console.log(`🔄 [${serviceName}] Returned from PIN setup, restoring payment data...`);
        
        // Clear route param
        navigation.setParams({ fromPinSetup: undefined });
        
        // Wait for server processing
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Refresh wallet with retry
        const result = await refreshWallet({
          maxRetries: 3,
          retryDelay: 1500
        });
        
        if (result.success) {
          console.log(` [${serviceName}] Wallet refresh successful, PIN status:`, result.data?.transactionPinSet);
          isReturningFromPinSetup.current = true;
        } else {
          console.error(` [${serviceName}] Wallet refresh failed`);
          isReturningFromPinSetup.current = true;
        }
      }
    });
    
    return unsubscribe;
  }, [navigation, route.params, serviceName, refreshWallet]);

  // ========================================
  // EFFECT 2: Auto-Resume Payment After PIN Setup
  // ========================================
  useEffect(() => {
    const resumePayment = () => {
      if (
        isReturningFromPinSetup.current &&
        wallet?.transactionPinSet === true &&
        pendingPaymentData !== null
      ) {
        console.log(`✅ [${serviceName}] PIN now set, auto-resuming payment...`);
        console.log('Payment details:', pendingPaymentData);
        
        isReturningFromPinSetup.current = false;
        
        // Small delay for smooth UX
        setTimeout(() => {
          startPaymentDirectToConfirm(pendingPaymentData);
        }, 400);
      }
    };
    
    resumePayment();
  }, [wallet?.transactionPinSet, pendingPaymentData, serviceName, startPaymentDirectToConfirm]);

  // ========================================
  // CORE PAYMENT METHODS
  // ========================================

  /**
   * Main payment initiator - checks PIN and starts flow
   * @param {Object} paymentData - Service-specific payment data
   */
  const initiatePayment = useCallback((paymentData) => {
    clearPinError();
    console.log(`💳 [${serviceName}] Starting payment flow, PIN status:`, wallet?.transactionPinSet);
    console.log(`📦 [${serviceName}] Payment data:`, paymentData);
    
    //  CRITICAL FIX: Store payment data for later use
    setCurrentPaymentData(paymentData);
    
    // Check if PIN is set
    if (!wallet?.transactionPinSet) {
      console.log(`⚠️ [${serviceName}] PIN not set, storing payment data and showing modal`);
      
      // Store complete payment data for later resume
      setPendingPaymentData(paymentData);
      
      // Show PIN setup modal
      setShowPinSetupModal(true);
      return false;
    }
    
    // Clear any pending payment
    setPendingPaymentData(null);
    isReturningFromPinSetup.current = false;
    
    // ✅ FIX: Run validation first to get detailed result
    console.log(`🔍 [${serviceName}] Running validation...`);
    const validationResult = validatePayment(paymentData);
    console.log(`📊 [${serviceName}] Validation result:`, validationResult);
    
    // Handle different validation return formats
    let isValid = false;
    if (typeof validationResult === 'boolean') {
      isValid = validationResult;
    } else if (validationResult && typeof validationResult === 'object') {
      // Check for both 'isValid' and 'valid' properties
      isValid = validationResult.isValid ?? validationResult.valid ?? false;
    }
    
    console.log(`🎯 [${serviceName}] Final validation status:`, isValid);
    
    if (!isValid) {
      console.log(`❌ [${serviceName}] Payment validation failed`, validationResult?.errors);
      return false;
    }
    
    // Start payment flow with validated data
    console.log(`🚀 [${serviceName}] Starting payment flow...`);
    const started = startPayment(paymentData, validatePayment);
    console.log(`📍 [${serviceName}] Payment flow started:`, started);
    
    if (!started) {
      console.log(`❌ [${serviceName}] Failed to start payment flow`);
      return false;
    }
    
    console.log(`✅ [${serviceName}] Payment flow started successfully`);
    return true;
  }, [wallet, serviceName, validatePayment, startPayment, clearPinError]);

  /**
   * Direct to confirmation (used after PIN setup)
   * @param {Object} paymentData - Service-specific payment data
   */
  const startPaymentDirectToConfirm = useCallback((paymentData) => {
    clearPinError();
    console.log(`🚀 [${serviceName}] Starting payment directly to confirmation`);
    
    // ✅ CRITICAL FIX: Store payment data
    setCurrentPaymentData(paymentData);
    
    // ✅ FIX: Validate first before calling startPayment
    const validationResult = validatePayment(paymentData);
    const isValid = validationResult?.isValid ?? validationResult?.valid ?? validationResult;
    
    if (!isValid) {
      console.log(`❌ [${serviceName}] Payment validation failed`);
      setPendingPaymentData(null);
      return;
    }
    
    const started = startPayment(paymentData, validatePayment);
    
    if (started) {
      console.log(`✅ [${serviceName}] Payment validation passed, showing confirmation modal`);
    } else {
      console.log(`❌ [${serviceName}] Failed to start payment`);
      setPendingPaymentData(null);
    }
  }, [serviceName, startPayment, validatePayment, clearPinError]);



  /**
   * Process payment with PIN
   * NOTE: The PIN should come from the PinModal, not from useTransactionPin hook
   */
  const submitPayment = useCallback(async (enteredPin) => {
    clearPinError();
    
    console.log(`💳 [${serviceName}] Processing payment with PIN...`);
    console.log(`🔐 [${serviceName}] Entered PIN:`, enteredPin); // Should have value now
    console.log(`📦 [${serviceName}] Current payment data:`, currentPaymentData);
    
    if (!currentPaymentData) {
      console.error(`❌ [${serviceName}] No payment data available!`);
      return false;
    }
    
    if (!enteredPin || enteredPin.length !== 4) {
      console.error(`❌ [${serviceName}] Invalid PIN:`, enteredPin);
      // Set error for display
      return false;
    }
    
    // ✅ Use enteredPin (from modal) instead of pin (from hook state)
    const success = await processPayment(enteredPin, async (transactionPin) => {
      console.log(`🔐 [${serviceName}] Executing purchase with PIN:`, transactionPin);
      return await executePurchase(transactionPin, currentPaymentData);
    });
    
    if (success) {
      resetPin();
      setPendingPaymentData(null);
      setCurrentPaymentData(null);
      isReturningFromPinSetup.current = false;
      
      await refreshWallet();
    }
    
    return success;
  }, [currentPaymentData, executePurchase, processPayment, resetPin, clearPinError, refreshWallet, serviceName]);

  // ========================================
  // PIN SETUP HANDLERS
  // ========================================

  /**
   * Handle "Create PIN" from modal
   */
  const handleCreatePin = useCallback(() => {
    setShowPinSetupModal(false);
    console.log(`🔐 [${serviceName}] Navigating to PIN setup with stored data:`, pendingPaymentData);
    
    navigation.navigate('SetTransactionPin', {
      fromScreen: serviceName,
    });
  }, [navigation, serviceName, pendingPaymentData]);

  /**
   * Handle cancel from PIN setup modal
   */
  const handleCancelPinSetup = useCallback(() => {
    setShowPinSetupModal(false);
    setPendingPaymentData(null);
    isReturningFromPinSetup.current = false;
    console.log(`❌ [${serviceName}] User cancelled PIN setup, cleared pending data`);
  }, [serviceName]);

  // ========================================
  // PAYMENT FLOW HANDLERS
  // ========================================

  const handleCancelPayment = useCallback(() => {
    cancelPayment();
    setPendingPaymentData(null);
    setCurrentPaymentData(null); // Clear current payment data
    isReturningFromPinSetup.current = false;
  }, [cancelPayment]);


// function to handle successful transaction
const handleTransactionComplete = useCallback((reference) => {
  console.log('🎯 [ServicePayment] handleTransactionComplete called');
  console.log('📝 Reference received:', reference);
  console.log('📦 Full result object:', result); // ✅ Add this
  
  resetFlow();
  resetPin();
  setPendingPaymentData(null);
  setCurrentPaymentData(null);
  isReturningFromPinSetup.current = false;
  
  // ✅ Try multiple reference locations
  const finalReference = 
    reference || 
    result?.reference || 
    result?.data?.reference ||
    result?.data?._id;
  
  if (!finalReference) {
    console.warn('⚠️ No reference found in any location');
    console.log('Available result keys:', Object.keys(result || {}));
    return;
  }
  
  console.log('🧭 Navigating to TransactionDetails with reference:', finalReference);
  
  setTimeout(() => {
    navigation.navigate('TransactionDetails', { reference: finalReference });
  }, 100);
}, [navigation, resetFlow, resetPin, result]); // ✅ Add 'result' to dependencies




  // const handleTransactionComplete = useCallback((reference) => {
  //   console.log('🎯 [ServicePayment] handleTransactionComplete called');
  //   console.log('📝 Reference received:', reference);
    
  //   if (!reference) {
  //     console.warn('⚠️ No reference provided, just resetting flow');
  //     resetFlow();
  //     resetPin();
  //     setPendingPaymentData(null);
  //     setCurrentPaymentData(null);
  //     isReturningFromPinSetup.current = false;
  //     return;
  //   }
    
  //   resetFlow();
  //   resetPin();
  //   setPendingPaymentData(null);
  //   setCurrentPaymentData(null);
  //   isReturningFromPinSetup.current = false;
    
  //   console.log('🧭 Navigating to TransactionDetails with reference:', reference);
  //   navigation.navigate('TransactionDetails', { reference });
  // }, [navigation, resetFlow, resetPin]);

  const handleForgotPin = useCallback(() => {
    resetPin();
    navigation.navigate('ResetPin', { pinType: 'transaction' });
  }, [navigation, resetPin]);

  // ========================================
  // RETURN API
  // ========================================

  return {
    // State
    step,
    result,
    flowError,
    pinError,
    showPinSetupModal,
    pendingPaymentData,
    hasPendingPayment: pendingPaymentData !== null,
    
    // PIN state
    pin,
    resetPin,
    clearPinError,
    
    // Core payment methods
    initiatePayment,
    submitPayment,
    confirmPayment,
    
    // PIN setup handlers
    handleCreatePin,
    handleCancelPinSetup,
    
    // Flow handlers
    handleCancelPayment,
    handleTransactionComplete,
    handleForgotPin,
    resetFlow,
    
    // Utility
    restoreFormData: (restoreCallback) => {
      if (pendingPaymentData && restoreCallback) {
        restoreCallback(pendingPaymentData);
      }
    },
  };
}