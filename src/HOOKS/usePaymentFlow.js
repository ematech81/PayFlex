
// hooks/usePaymentFlow.js
import { useWallet } from 'context/WalletContext';
import { useState } from 'react';
import { ValidationUtils } from 'UTILS/validationUtils';
import { ErrorUtils } from 'UTILS/errorUtils';


/**
 * Payment Flow Hook
 * Orchestrates the complete payment flow (validation -> confirmation -> PIN -> payment)
 */

export const usePaymentFlow = () => {
  const { wallet } = useWallet();
  const [step, setStep] = useState('input'); // 'input' | 'confirm' | 'pin' | 'processing' | 'result'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [pin, setPin] = useState('');

  /**
   * Start payment flow
   * @param {Object} paymentData - Payment data to validate
   * @param {Function} validationFn - Custom validation function
   * @returns {boolean} Whether validation passed
   */
  const startPayment = (paymentData, validationFn) => {
    setError(null);
    setResult(null);

    // Run custom validation
    const validation = validationFn ? validationFn(paymentData) : { isValid: true };
    
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors || {})[0];
      setError(firstError || 'Validation failed');
      return false;
    }

    // Check wallet balance
    if (paymentData.amount && wallet?.user?.walletBalance) {
      const balanceValidation = ValidationUtils.validateWalletBalance(
        wallet.user.walletBalance,
        paymentData.amount
      );
      
      if (!balanceValidation.isValid) {
        setError(balanceValidation.error);
        return false;
      }
    }

    setStep('confirm');
    return true;
  };

  /**
   * Confirm payment and proceed to PIN
   */
  const confirmPayment = () => {
    setStep('pin');
  };

  /**
   * Process payment with PIN
   * @param {string} pin - Transaction PIN
   * @param {Function} paymentFn - Payment service function
   * @returns {Promise<Object|null>} Payment result or null
   */
  // Inside usePaymentFlow.js
// const [pin, setPin] = useState('');

const processPayment = async (enteredPin, purchaseFunction) => {
  try {
    setStep('processing');
    
    // ✅ Use the enteredPin parameter, not state
    const result = await purchaseFunction(enteredPin);
    
    setResult(result);
    setStep('result');
    return true;
  } catch (error) {
    setError(error.message);
    setStep('result');
    return false;
  }
};

  /**
   * Cancel payment and reset flow
   */
  const cancelPayment = () => {
    setStep('input');
    setError(null);
    setResult(null);
  };

  /**
   * Reset entire flow
   */
  const resetFlow = () => {
    setStep('input');
    setIsLoading(false);
    setError(null);
    setResult(null);
  };

  /**
   * Go back to previous step
   */
  const goBack = () => {
    const stepSequence = ['input', 'confirm', 'pin', 'processing', 'result'];
    const currentIndex = stepSequence.indexOf(step);
    
    if (currentIndex > 0) {
      setStep(stepSequence[currentIndex - 1]);
      setError(null);
    }
  };

  return {
    step,
    isLoading,
    error,
    result,
    startPayment,
    confirmPayment,
    processPayment,
    cancelPayment,
    resetFlow,
    goBack,
    setError,
  };
};