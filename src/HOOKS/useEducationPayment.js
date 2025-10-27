// hooks/useEducationPayment.js
import { useState, useEffect } from 'react';
import { useWallet } from 'context/WalletContext';
import { ErrorUtils } from 'UTILS/errorUtils';
import { EducationService } from 'SERVICES/educationService';

/**
 * Education Payment Hook
 * Handles educational exam payment logic (WAEC, JAMB, NECO)
 */

export const useEducationPayment = () => {
  const { wallet } = useWallet();
  const [examBody, setExamBody] = useState(null); // 'waec' | 'jamb' | 'neco'
  const [selectedExamType, setSelectedExamType] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [examTypes, setExamTypes] = useState([]);
  const [isLoadingExamTypes, setIsLoadingExamTypes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load exam types when exam body changes
   */
  useEffect(() => {
    if (examBody) {
      loadExamTypes(examBody);
    } else {
      setExamTypes([]);
      setSelectedExamType(null);
    }
  }, [examBody]);

  /**
   * Load exam types for selected exam body
   * @param {string} body - Exam body (waec, jamb, neco)
   */
  const loadExamTypes = async (body) => {
    setIsLoadingExamTypes(true);
    setError(null);

    try {
      const response = await EducationService.getExamTypes(body, wallet.token);
      
      if (response.success) {
        setExamTypes(response.data?.data || []);
      } else {
        setError('Failed to load exam types');
        setExamTypes([]);
      }
    } catch (error) {
      const errorMessage = ErrorUtils.createUserMessage(error, 'loading exam types');
      setError(errorMessage);
      setExamTypes([]);
      ErrorUtils.logError(error, 'loadExamTypes', { body });
    } finally {
      setIsLoadingExamTypes(false);
    }
  };

  /**
   * Validate exam payment
   * @returns {Object} Validation result
   */
  const validatePayment = () => {
    const errors = {};

    if (!examBody) {
      errors.examBody = 'Please select an exam body';
    }

    if (!selectedExamType) {
      errors.examType = 'Please select an exam type';
    }

    const qty = Number(quantity);
    if (!quantity || isNaN(qty) || qty < 1) {
      errors.quantity = 'Please enter a valid quantity';
    }

    if (qty > 10) {
      errors.quantity = 'Maximum quantity is 10';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  /**
   * Calculate total amount
   * @returns {number}
   */
  const calculateTotal = () => {
    if (!selectedExamType || !quantity) return 0;
    return selectedExamType.price * Number(quantity);
  };

  /**
   * Pay for exam
   * @param {string} pin - Transaction PIN
   * @returns {Promise<Object|null>}
   */
  const payForExam = async (pin) => {
    const validation = validatePayment();
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      setError(firstError);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await EducationService.payForExam(
        {
          examBody,
          examType: selectedExamType.code,
          quantity: Number(quantity),
          amount: calculateTotal(),
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
      const errorMessage = ErrorUtils.createUserMessage(error, 'paying for exam');
      setError(errorMessage);
      ErrorUtils.logError(error, 'payForExam', {
        examBody,
        examType: selectedExamType?.name,
        quantity,
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
    setExamBody(null);
    setSelectedExamType(null);
    setQuantity('1');
    setExamTypes([]);
    setError(null);
  };

  /**
   * Clear error
   */
  const clearError = () => {
    setError(null);
  };

  return {
    examBody,
    setExamBody,
    selectedExamType,
    setSelectedExamType,
    quantity,
    setQuantity,
    examTypes,
    isLoadingExamTypes,
    isLoading,
    error,
    validatePayment,
    calculateTotal,
    payForExam,
    loadExamTypes,
    resetForm,
    clearError,
  };
};