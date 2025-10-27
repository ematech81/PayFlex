
// hooks/useTransactionPin.js
import { useState } from 'react';
import { PaymentService } from 'SERVICES/API/paymentService';
import { ValidationUtils } from 'UTILS/validationUtils';
import { ErrorUtils } from 'UTILS/errorUtils';

/**
 * Transaction PIN Hook
 * Handles PIN verification logic
 */

export const useTransactionPin = () => {
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  /**
   * Verify transaction PIN
   * @param {string} token - JWT token
   * @returns {Promise<boolean>}
   */
  const verifyPin = async (token) => {
    // Validate PIN format
    const validation = ValidationUtils.validatePin(pin);
    if (!validation.isValid) {
      setPinError(validation.error);
      return false;
    }

    setIsVerifying(true);
    setPinError(null);

    try {
      const response = await PaymentService.verifyTransactionPin(pin, token);
      
      if (response.success) {
        setIsVerified(true);
        return true;
      } else {
        setPinError(response.data?.message || 'Invalid PIN');
        return false;
      }
    } catch (error) {
      const errorMessage = ErrorUtils.createUserMessage(error, 'verifying PIN');
      setPinError(errorMessage);
      ErrorUtils.logError(error, 'verifyPin', { pin: '****' });
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Reset PIN state
   */
  const resetPin = () => {
    setPin('');
    setPinError(null);
    setIsVerified(false);
  };

  /**
   * Clear PIN error
   */
  const clearError = () => {
    setPinError(null);
  };

  return {
    pin,
    setPin,
    pinError,
    setPinError,
    isVerifying,
    isVerified,
    verifyPin,
    resetPin,
    clearError,
  };
};