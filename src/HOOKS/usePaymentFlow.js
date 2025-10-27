
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
  const processPayment = async (pin, paymentFn) => {
    setIsLoading(true);
    setError(null);
    setStep('processing');

    try {
      const response = await paymentFn(pin);
      
      if (response.success) {
        setResult(response.data);
        setStep('result');
        return response.data;
      } else {
        const errorMessage = response.data?.message || 'Payment failed';
        setError(errorMessage);
        setStep('pin'); // Go back to PIN entry
        return null;
      }
    } catch (error) {
      const errorMessage = ErrorUtils.createUserMessage(error, 'processing payment');
      setError(errorMessage);
      setStep('pin'); // Go back to PIN entry
      ErrorUtils.logError(error, 'processPayment');
      return null;
    } finally {
      setIsLoading(false);
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