
// hooks/useFormValidation.js
import { useState, useCallback } from 'react';

/**
 * Form Validation Hook
 * Generic form validation handler
 */

export const useFormValidation = (initialValues = {}, validationFn) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle input change
   * @param {string} name - Field name
   * @param {any} value - Field value
   */
  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  /**
   * Handle input blur
   * @param {string} name - Field name
   */
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate single field if validation function provided
    if (validationFn) {
      const validation = validationFn(values);
      if (validation.errors && validation.errors[name]) {
        setErrors(prev => ({ ...prev, [name]: validation.errors[name] }));
      }
    }
  }, [values, validationFn]);

  /**
   * Validate all fields
   * @returns {boolean} Whether form is valid
   */
  const validate = useCallback(() => {
    if (!validationFn) return true;

    const validation = validationFn(values);
    
    if (!validation.isValid) {
      setErrors(validation.errors || {});
      return false;
    }

    setErrors({});
    return true;
  }, [values, validationFn]);

  /**
   * Handle form submit
   * @param {Function} onSubmit - Submit callback
   */
  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true);

    const isValid = validate();
    if (!isValid) {
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate]);

  /**
   * Reset form
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Set form values
   * @param {Object} newValues - New values
   */
  const setFormValues = useCallback((newValues) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  /**
   * Get field props
   * @param {string} name - Field name
   * @returns {Object} Field props
   */
  const getFieldProps = useCallback((name) => ({
    value: values[name] || '',
    error: touched[name] ? errors[name] : null,
    onChangeText: (value) => handleChange(name, value),
    onBlur: () => handleBlur(name),
  }), [values, errors, touched, handleChange, handleBlur]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    validate,
    reset,
    setFormValues,
    getFieldProps,
  };
};