
// hooks/useTVSubscription.js
import { useWallet } from 'context/WalletContext';
import { useState, useEffect } from 'react';
import { TVService } from 'SERVICES/tvService';
import { ValidationUtils } from 'UTILS/validationUtils';
import { ErrorUtils } from 'UTILS/errorUtils';

/**
 * TV Subscription Hook
 * Handles TV/Cable subscription logic
 */

export const useTVSubscription = () => {
  const { wallet } = useWallet();
  const [smartcardNumber, setSmartcardNumber] = useState('');
  const [provider, setProvider] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [packages, setPackages] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load TV packages when provider changes
   */
  useEffect(() => {
    if (provider) {
      loadPackages(provider);
    } else {
      setPackages([]);
      setSelectedPackage(null);
    }
  }, [provider]);

  /**
   * Verify smartcard number
   */
  const verifySmartcard = async () => {
    const validation = ValidationUtils.validateSmartcardNumber(smartcardNumber);
    if (!validation.isValid) {
      setError(validation.error);
      return false;
    }

    if (!provider) {
      setError('Please select a TV provider');
      return false;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await TVService.verifySmartcard(
        smartcardNumber,
        provider,
        wallet.token
      );

      if (response.success) {
        setCustomerInfo(response.data?.data);
        return true;
      } else {
        setError(response.data?.message || 'Invalid smartcard number');
        return false;
      }
    } catch (error) {
      const errorMessage = ErrorUtils.createUserMessage(error, 'verifying smartcard');
      setError(errorMessage);
      ErrorUtils.logError(error, 'verifySmartcard', {
        smartcardNumber: smartcardNumber.slice(-4),
        provider,
      });
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Load TV packages
   * @param {string} tvProvider - TV provider
   */
  const loadPackages = async (tvProvider) => {
    setIsLoadingPackages(true);
    setError(null);

    try {
      const response = await TVService.getTVPackages(tvProvider, wallet.token);
      
      if (response.success) {
        setPackages(response.data?.data || []);
      } else {
        setError('Failed to load packages');
        setPackages([]);
      }
    } catch (error) {
      const errorMessage = ErrorUtils.createUserMessage(error, 'loading packages');
      setError(errorMessage);
      setPackages([]);
      ErrorUtils.logError(error, 'loadPackages', { tvProvider });
    } finally {
      setIsLoadingPackages(false);
    }
  };

  /**
   * Subscribe to TV package
   * @param {string} pin - Transaction PIN
   * @returns {Promise<Object|null>}
   */
  const subscribeTVPackage = async (pin) => {
    if (!customerInfo) {
      setError('Please verify smartcard number first');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await TVService.subscribeTVPackage(
        {
          smartcardNumber,
          provider,
          packageCode: selectedPackage.code,
          amount: selectedPackage.price,
          pin,
        },
        wallet.token
      );

      if (response.success) {
        resetForm();
        return response.data;
      } else {
        const errorMessage = response.data?.message || 'Subscription failed';
        setError(errorMessage);
        return null;
      }
    } catch (error) {
      const errorMessage = ErrorUtils.createUserMessage(error, 'subscribing to package');
      setError(errorMessage);
      ErrorUtils.logError(error, 'subscribeTVPackage', {
        provider,
        package: selectedPackage?.name,
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
    setSmartcardNumber('');
    setProvider(null);
    setSelectedPackage(null);
    setCustomerInfo(null);
    setPackages([]);
    setError(null);
  };

  /**
   * Clear error
   */
  const clearError = () => {
    setError(null);
  };

  return {
    smartcardNumber,
    setSmartcardNumber,
    provider,
    setProvider,
    selectedPackage,
    setSelectedPackage,
    customerInfo,
    packages,
    isVerifying,
    isLoadingPackages,
    isLoading,
    error,
    verifySmartcard,
    subscribeTVPackage,
    loadPackages,
    resetForm,
    clearError,
  };
};