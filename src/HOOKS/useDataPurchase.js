
import { useState, useEffect } from 'react';
import { detectNetworkFromPhone } from 'CONSTANT/providerConstant';
import { useWallet } from 'context/WalletContext';
import { DataService } from 'SERVICES/dataService';
import { ValidationUtils } from 'UTILS/validationUtils';
import { ErrorUtils } from 'UTILS/errorUtils';


/**
 * Data Purchase Hook
 * Handles data bundle purchase logic
 */

export const useDataPurchase = () => {
  const { wallet } = useWallet();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [dataPlans, setDataPlans] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Auto-detect network and load plans
   */
  const handlePhoneChange = (phone) => {
    setPhoneNumber(phone);
    
    if (phone.length >= 4) {
      const detectedNetwork = detectNetworkFromPhone(phone);
      if (detectedNetwork && detectedNetwork !== provider) {
        setProvider(detectedNetwork);
        setSelectedPlan(null); // Reset plan when provider changes
      }
    }
  };

  /**
   * Load data plans when provider changes
   */
  useEffect(() => {
    if (provider) {
      loadDataPlans(provider);
    } else {
      setDataPlans([]);
      setSelectedPlan(null);
    }
  }, [provider]);

  /**
   * Load data plans for selected provider
   * @param {string} network - Network provider
   */
  const loadDataPlans = async (network) => {
    setIsLoadingPlans(true);
    setError(null);

    try {
      const response = await DataService.getDataPlans(network, wallet.token);
      
      if (response.success) {
        setDataPlans(response.data?.data || []);
      } else {
        setError('Failed to load data plans');
        setDataPlans([]);
      }
    } catch (error) {
      const errorMessage = ErrorUtils.createUserMessage(error, 'loading data plans');
      setError(errorMessage);
      setDataPlans([]);
      ErrorUtils.logError(error, 'loadDataPlans', { network });
    } finally {
      setIsLoadingPlans(false);
    }
  };

  /**
   * Validate data purchase
   * @returns {Object} Validation result
   */
  const validatePurchase = () => {
    return ValidationUtils.validateDataPurchase({
      phone: phoneNumber,
      provider,
      planId: selectedPlan?.variation_code,
    });
  };

  /**
   * Purchase data bundle
   * @param {string} pin - Transaction PIN
   * @returns {Promise<Object|null>}
   */
  const purchaseData = async (pin) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await DataService.purchaseData(
        {
          phoneNumber,
          amount: selectedPlan.variation_amount,
          network: provider,
          variation_code: selectedPlan.variation_code,
          pin,
        },
        wallet.token
      );

      if (response.success) {
        resetForm();
        return response.data;
      } else {
        const errorMessage = response.data?.message || 'Purchase failed';
        setError(errorMessage);
        return null;
      }
    } catch (error) {
      const errorMessage = ErrorUtils.createUserMessage(error, 'purchasing data');
      setError(errorMessage);
      ErrorUtils.logError(error, 'purchaseData', {
        phoneNumber,
        provider,
        plan: selectedPlan?.name,
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
    setProvider(null);
    setSelectedPlan(null);
    setDataPlans([]);
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
    provider,
    setProvider,
    selectedPlan,
    setSelectedPlan,
    dataPlans,
    isLoadingPlans,
    isLoading,
    error,
    validatePurchase,
    purchaseData,
    loadDataPlans,
    resetForm,
    clearError,
  };
};