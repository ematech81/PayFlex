
// hooks/useBettingPayment.js
import { useState } from 'react';
import { useWallet } from 'context/WalletContext';
import { BettingService } from 'SERVICES/bettingService';
import { ValidationUtils } from 'UTILS/validationUtils';
import { ErrorUtils } from 'UTILS/errorUtils';

/**
 * Betting Payment Hook
 * Handles betting account funding logic
 */

export const useBettingPayment = () => {
  const { wallet } = useWallet();
  const [customerId, setCustomerId] = useState('');
  const [provider, setProvider] = useState(null);
  const [amount, setAmount] = useState('');
  const [customerInfo, setCustomerInfo] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Verify betting account
   */
  const verifyBettingAccount = async () => {
    if (!customerId.trim()) {
      setError('Please enter your customer ID');
      return false;
    }

    if (!provider) {
      setError('Please select a betting provider');
      return false;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await BettingService.verifyBettingAccount(
        customerId,
        provider,
        wallet.token
      );

      if (response.success) {
        setCustomerInfo(response.data?.data);
        return true;
      } else {
        setError(response.data?.message || 'Invalid customer ID');
        return false;
      }
    } catch (error) {
      const errorMessage = ErrorUtils.createUserMessage(error, 'verifying account');
      setError(errorMessage);
      ErrorUtils.logError(error, 'verifyBettingAccount', {
        customerId: customerId.slice(-4),
        provider,
      });
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Validate funding
   * @returns {Object} Validation result
   */
  const validateFunding = () => {
    const errors = {};

    if (!customerId.trim()) {
      errors.customerId = 'Customer ID is required';
    }

    if (!provider) {
      errors.provider = 'Please select a betting provider';
    }

    const amountValidation = ValidationUtils.validateAmount(amount, 100, 1000000);
    if (!amountValidation.isValid) {
      errors.amount = amountValidation.error;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  /**
   * Fund betting account
   * @param {string} pin - Transaction PIN
   * @returns {Promise<Object|null>}
   */
  const fundBettingAccount = async (pin) => {
    const validation = validateFunding();
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      setError(firstError);
      return null;
    }

    if (!customerInfo) {
      setError('Please verify customer ID first');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await BettingService.fundBettingAccount(
        {
          customerId,
          provider,
          amount: Number(amount),
          pin,
        },
        wallet.token
      );

      if (response.success) {
        resetForm();
        return response.data;
      } else {
        const errorMessage = response.data?.message || 'Funding failed';
        setError(errorMessage);
        return null;
      }
    } catch (error) {
      const errorMessage = ErrorUtils.createUserMessage(error, 'funding betting account');
      setError(errorMessage);
      ErrorUtils.logError(error, 'fundBettingAccount', {
        provider,
        amount,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset form
   */
  const resetForm = () => {
    setCustomerId('');
    setProvider(null);
    setAmount('');
    setCustomerInfo(null);
    setError(null);
  };

  /**
   * Clear error
   */
  const clearError = () => {
    setError(null);
  };

  return {
    customerId,
    setCustomerId,
    provider,
    setProvider,
    amount,
    setAmount,
    customerInfo,
    isVerifying,
    isLoading,
    error,
    verifyBettingAccount,
    validateFunding,
    fundBettingAccount,
    resetForm,
    clearError,
  };
};