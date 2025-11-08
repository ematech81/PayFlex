
// hooks/useServicePayment.js
import { useState, useRef, useEffect, useCallback } from 'react';
import { usePaymentFlow } from './usePaymentFlow';
import { useTransactionPin } from './useTransationPin';
import { useWallet } from 'context/WalletContext';

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
          console.log(`✅ [${serviceName}] Wallet refresh successful, PIN status:`, result.data?.transactionPinSet);
          isReturningFromPinSetup.current = true;
        } else {
          console.error(`⚠️ [${serviceName}] Wallet refresh failed`);
          isReturningFromPinSetup.current = true;
        }
      }
    });
    
    return unsubscribe;
  }, [navigation, route.params, serviceName]);

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
  }, [wallet?.transactionPinSet, pendingPaymentData, serviceName]);

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
    
    // Validate and start payment flow
    const valid = startPayment(paymentData, validatePayment);
    
    if (!valid) {
      console.log(`❌ [${serviceName}] Payment validation failed`);
      return false;
    }
    
    return true;
  }, [wallet, serviceName, validatePayment, startPayment, clearPinError]);

  /**
   * Direct to confirmation (used after PIN setup)
   * @param {Object} paymentData - Service-specific payment data
   */
  const startPaymentDirectToConfirm = useCallback((paymentData) => {
    clearPinError();
    console.log(`🚀 [${serviceName}] Starting payment directly to confirmation`);
    
    const valid = startPayment(paymentData, validatePayment);
    
    if (valid) {
      console.log(`✅ [${serviceName}] Payment validation passed, showing confirmation modal`);
    } else {
      console.log(`❌ [${serviceName}] Payment validation failed`);
      setPendingPaymentData(null);
    }
  }, [serviceName, startPayment, validatePayment, clearPinError]);

  /**
   * Process payment with PIN
   */
  const submitPayment = useCallback(async () => {
    clearPinError();
    
    const success = await processPayment(pin, executePurchase);
    
    if (success) {
      resetPin();
      setPendingPaymentData(null);
      isReturningFromPinSetup.current = false;
      
      // Refresh wallet after successful purchase
      await refreshWallet();
    }
    
    return success;
  }, [pin, executePurchase, processPayment, resetPin, clearPinError, refreshWallet]);

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
    isReturningFromPinSetup.current = false;
  }, [cancelPayment]);

  const handleTransactionComplete = useCallback((reference) => {
    resetFlow();
    resetPin();
    setPendingPaymentData(null);
    isReturningFromPinSetup.current = false;
    
    navigation.navigate('TransactionDetails', { reference });
  }, [navigation, resetFlow, resetPin]);

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
    
    // Utility
    restoreFormData: (restoreCallback) => {
      if (pendingPaymentData && restoreCallback) {
        restoreCallback(pendingPaymentData);
      }
    },
  };
}