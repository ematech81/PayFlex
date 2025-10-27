

import { useState } from 'react';
import { useWallet } from 'context/WalletContext';
import { ErrorUtils } from 'UTILS/errorUtils';
import { ValidationUtils } from 'UTILS/validationUtils';
import { ElectricityService } from 'SERVICES/electricityService';

/**
 * Electricity Payment Hook
 * Handles electricity bill payment logic
 */

export const useElectricityPayment = () => {
  const { wallet } = useWallet();
  const [meterNumber, setMeterNumber] = useState('');
  const [disco, setDisco] = useState(null);
  const [meterType, setMeterType] = useState('prepaid'); // 'prepaid' | 'postpaid'
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerInfo, setCustomerInfo] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Verify meter number
   */
  const verifyMeter = async () => {
    const validation = ValidationUtils.validateMeterNumber(meterNumber);
    if (!validation.isValid) {
      setError(validation.error);
      return false;
    }

    if (!disco) {
      setError('Please select a distribution company');
      return false;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await ElectricityService.verifyMeter(
        meterNumber,
        disco,
        meterType,
        wallet.token
      );

      if (response.success) {
        setCustomerInfo(response.data?.data);
        return true;
      } else {
        setError(response.data?.message || 'Invalid meter number');
        return false;
      }
    } catch (error) {
      const errorMessage = ErrorUtils.createUserMessage(error, 'verifying meter');
      setError(errorMessage);
      ErrorUtils.logError(error, 'verifyMeter', {
        meterNumber: meterNumber.slice(-4),
        disco,
        meterType,
      });
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Pay electricity bill
   * @param {string} pin - Transaction PIN
   * @returns {Promise<Object|null>}
   */
  const payElectricityBill = async (pin) => {
    if (!customerInfo) {
      setError('Please verify meter number first');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await ElectricityService.payElectricityBill(
        {
          meterNumber,
          disco,
          meterType,
          amount,
          phone: phoneNumber,
          pin,
        },
        wallet.token
      );

      if (response.success) {
        resetForm();
        return response.data;
      } else {
        const errorMessage = response.data?.message || 'Payment failed';
        setError(errorMessage);
        return null;
      }
    } catch (error) {
      const errorMessage = ErrorUtils.createUserMessage(error, 'paying electricity bill');
      setError(errorMessage);
      ErrorUtils.logError(error, 'payElectricityBill', {
        disco,
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
    setMeterNumber('');
    setDisco(null);
    setMeterType('prepaid');
    setAmount('');
    setPhoneNumber('');
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
    meterNumber,
    setMeterNumber,
    disco,
    setDisco,
    meterType,
    setMeterType,
    amount,
    setAmount,
    phoneNumber,
    setPhoneNumber,
    customerInfo,
    isVerifying,
    isLoading,
    error,
    verifyMeter,
    payElectricityBill,
    resetForm,
    clearError,
  };
};