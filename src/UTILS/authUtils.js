

/**
 * Authentication Validation Utilities
 */

import { AUTH_CONSTANTS } from "CONSTANT/authConstant";

export class AuthValidation {
  /**
   * Validate first name
   */
  static validateFirstName(firstName) {
    if (!firstName || !firstName.trim()) {
      return { isValid: false, error: AUTH_CONSTANTS.ERROR_MESSAGES.FIRST_NAME_REQUIRED };
    }
    return { isValid: true, error: null };
  }

  /**
   * Validate last name
   */
  static validateLastName(lastName) {
    if (!lastName || !lastName.trim()) {
      return { isValid: false, error: AUTH_CONSTANTS.ERROR_MESSAGES.LAST_NAME_REQUIRED };
    }
    return { isValid: true, error: null };
  }

  /**
   * Validate email
   */
  static validateEmail(email) {
    if (!email || !email.trim()) {
      return { isValid: false, error: AUTH_CONSTANTS.ERROR_MESSAGES.EMAIL_REQUIRED };
    }
    if (!AUTH_CONSTANTS.EMAIL.REGEX.test(email.trim())) {
      return { isValid: false, error: AUTH_CONSTANTS.ERROR_MESSAGES.EMAIL_INVALID };
    }
    return { isValid: true, error: null };
  }

  /**
   * Validate phone number
   */
  static validatePhone(phone) {
    if (!phone || !phone.trim()) {
      return { isValid: false, error: AUTH_CONSTANTS.ERROR_MESSAGES.PHONE_REQUIRED };
    }
    
    const cleanedPhone = phone.replace(/\D/g, '');
    
    if (!AUTH_CONSTANTS.PHONE.REGEX.test(cleanedPhone)) {
      return { isValid: false, error: AUTH_CONSTANTS.ERROR_MESSAGES.PHONE_INVALID };
    }
    
    return { isValid: true, error: null };
  }

  /**
   * Validate password
   */
  static validatePassword(password) {
    if (!password) {
      return { isValid: false, error: AUTH_CONSTANTS.ERROR_MESSAGES.PASSWORD_REQUIRED };
    }
    
    if (password.length < AUTH_CONSTANTS.PASSWORD.MIN_LENGTH) {
      return { isValid: false, error: AUTH_CONSTANTS.ERROR_MESSAGES.PASSWORD_WEAK };
    }
    
    return { isValid: true, error: null };
  }

  /**
   * Validate password match
   */
  static validatePasswordMatch(password, confirmPassword) {
    if (password !== confirmPassword) {
      return { isValid: false, error: AUTH_CONSTANTS.ERROR_MESSAGES.PASSWORD_MISMATCH };
    }
    return { isValid: true, error: null };
  }

  /**
   * Validate OTP
   */
  static validateOTP(otp) {
    if (!otp) {
      return { isValid: false, error: AUTH_CONSTANTS.ERROR_MESSAGES.OTP_REQUIRED };
    }
    
    const cleanedOTP = otp.replace(/\D/g, '');
    
    if (cleanedOTP.length !== AUTH_CONSTANTS.OTP.LENGTH) {
      return { isValid: false, error: AUTH_CONSTANTS.ERROR_MESSAGES.OTP_INVALID };
    }
    
    return { isValid: true, error: null };
  }

  
  /**
   * Validate PIN match
   */
  static validatePINMatch(pin, confirmPin) {
    if (pin !== confirmPin) {
      return { isValid: false, error: AUTH_CONSTANTS.ERROR_MESSAGES.LOGIN_PIN_MISMATCH };
    }
    return { isValid: true, error: null };
  }

  /**
   * Validate registration form
   */
  static validateRegistrationForm(formData) {
    const errors = {};

    const firstNameValidation = this.validateFirstName(formData.firstName);
    if (!firstNameValidation.isValid) {
      errors.firstName = firstNameValidation.error;
    }

    const lastNameValidation = this.validateLastName(formData.lastName);
    if (!lastNameValidation.isValid) {
      errors.lastName = lastNameValidation.error;
    }

    const emailValidation = this.validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error;
    }

    const phoneValidation = this.validatePhone(formData.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error;
    }

    const passwordValidation = this.validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.error;
    }

    const passwordMatchValidation = this.validatePasswordMatch(
      formData.password,
      formData.confirmPassword
    );
    if (!passwordMatchValidation.isValid) {
      errors.confirmPassword = passwordMatchValidation.error;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return cleaned;
};

/**
 * Clean phone number (remove formatting)
 */
export const cleanPhoneNumber = (phone) => {
  return phone.replace(/\D/g, '');
};