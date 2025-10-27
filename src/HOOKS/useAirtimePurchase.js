
// hooks/useAirtimePurchase.js
import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { detectNetworkFromPhone } from 'CONSTANT/providerConstant';
import { ValidationUtils } from 'UTILS/validationUtils';
import { AirtimeService } from 'SERVICES/airtimeService';
import { ErrorUtils } from 'UTILS/errorUtils';


/**
 * Airtime Purchase Hook
 * Handles airtime purchase logic
 */

export const useAirtimePurchase = () => {
  const { wallet } = useWallet();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Auto-detect network from phone number
   */
  const handlePhoneChange = (phone) => {
    setPhoneNumber(phone);
    
    // Auto-detect provider
    if (phone.length >= 4) {
      const detectedNetwork = detectNetworkFromPhone(phone);
      if (detectedNetwork && !provider) {
        setProvider(detectedNetwork);
      }
    }
  };

  /**
   * Validate airtime purchase data
   * @returns {Object} Validation result
   */
  const validatePurchase = () => {
    return ValidationUtils.validateAirtimePurchase({
      phone: phoneNumber,
      provider,
      amount,
    });
  };

  /**
   * Purchase airtime
   * @param {string} pin - Transaction PIN
   * @returns {Promise<Object|null>}
   */
  const purchaseAirtime = async (pin) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await AirtimeService.purchaseAirtime(
        {
          phoneNumber,
          amount,
          network: provider,
          pin,
        },
        wallet.token
      );

      if (response.success) {
        // Reset form on success
        resetForm();
        return response.data;
      } else {
        const errorMessage = response.data?.message || 'Purchase failed';
        setError(errorMessage);
        return null;
      }
    } catch (error) {
      const errorMessage = ErrorUtils.createUserMessage(error, 'purchasing airtime');
      setError(errorMessage);
      ErrorUtils.logError(error, 'purchaseAirtime', {
        phoneNumber,
        amount,
        provider,
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
    setPhoneNumber('');
    setAmount('');
    setProvider(null);
    setError(null);
  };

  /**
   * Clear error
   */
  const clearError = () => {
    setError(null);
  };

  return {
    phoneNumber,
    setPhoneNumber: handlePhoneChange,
    amount,
    setAmount,
    provider,
    setProvider,
    isLoading,
    error,
    validatePurchase,
    purchaseAirtime,
    resetForm,
    clearError,
  };
};