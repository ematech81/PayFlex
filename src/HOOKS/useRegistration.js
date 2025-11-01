// hooks/useRegistration.js
import { useState } from 'react';
import { AuthService } from 'AuthFunction/authService';
import { AuthValidation } from 'UTILS/authUtils';

/**
 * Registration Hook
 * Handles user registration logic
 */

export const useRegistration = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  /**
   * Update form field
   */
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    const validation = AuthValidation.validateRegistrationForm(formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
    }
    
    return validation.isValid;
  };

  /**
   * Register user
   */
  const register = async () => {
    if (!validateForm()) {
      return { success: false, error: 'Please fix the errors' };
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await AuthService.register(formData);
      
      if (response.success) {
        setUserId(response.data.userId);
        return {
          success: true,
          userId: response.data.userId,
        };
      } else {
        const errorMessage = response.data?.message || 'Registration failed';
        setErrors({ general: errorMessage });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = ErrorUtils.createUserMessage(error, 'registering');
      setErrors({ general: errorMessage });
      ErrorUtils.logError(error, 'useRegistration.register', formData.phone);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset form
   */
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    });
    setErrors({});
    setUserId(null);
  };

  return {
    formData,
    errors,
    isLoading,
    userId,
    updateField,
    register,
    resetForm,
  };
};