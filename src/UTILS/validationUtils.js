
import { AIRTIME_CONSTANTS } from "CONSTANT/SERVICES/airtimeServices";
import { DATA_CONSTANTS } from "CONSTANT/SERVICES/dataServices";
import { COMMON_ERROR_MESSAGES, VALIDATION_CONSTANTS } from "CONSTANT/validationConstant";

/**
 * Validation Utilities
 * Centralized validation logic for all services
 */

export class ValidationUtils {
  /**
   * Validate phone number
   * @param {string} phone - Phone number to validate
   * @param {boolean} isInternational - Whether it's international number
   * @returns {Object} { isValid: boolean, error: string|null }
   */
  static validatePhoneNumber(phone, isInternational = false) {
    if (!phone) {
      return { isValid: false, error: COMMON_ERROR_MESSAGES.REQUIRED_FIELD };
    }

    const trimmedPhone = phone.trim();
    
    if (isInternational) {
      if (!VALIDATION_CONSTANTS.PHONE.INTERNATIONAL_REGEX.test(trimmedPhone)) {
        return { 
          isValid: false, 
          error: AIRTIME_CONSTANTS.ERROR_MESSAGES.INVALID_INTERNATIONAL_PHONE 
        };
      }
    } else {
      if (!VALIDATION_CONSTANTS.PHONE.REGEX.test(trimmedPhone)) {
        return { 
          isValid: false, 
          error: VALIDATION_CONSTANTS.PHONE.ERROR_MESSAGE 
        };
      }
    }

    return { isValid: true, error: null };
  }

  /**
   * Validate provider selection
   * @param {string} provider - Provider value
   * @returns {Object} { isValid: boolean, error: string|null }
   */
  static validateProvider(provider) {
    if (!provider) {
      return { 
        isValid: false, 
        error: AIRTIME_CONSTANTS.ERROR_MESSAGES.NO_PROVIDER 
      };
    }
    return { isValid: true, error: null };
  }

  /**
   * Validate amount
   * @param {string|number} amount - Amount to validate
   * @param {number} minAmount - Minimum allowed amount
   * @param {number} maxAmount - Maximum allowed amount
   * @returns {Object} { isValid: boolean, error: string|null }
   */
  static validateAmount(amount, minAmount = VALIDATION_CONSTANTS.AMOUNT.MIN, maxAmount = VALIDATION_CONSTANTS.AMOUNT.MAX) {
    if (!amount) {
      return { 
        isValid: false, 
        error: COMMON_ERROR_MESSAGES.REQUIRED_FIELD 
      };
    }

    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      return { 
        isValid: false, 
        error: VALIDATION_CONSTANTS.AMOUNT.ERROR_MESSAGE 
      };
    }

    if (numAmount < minAmount) {
      return { 
        isValid: false, 
        error: `Minimum amount is ₦${minAmount.toLocaleString()}` 
      };
    }

    if (numAmount > maxAmount) {
      return { 
        isValid: false, 
        error: `Maximum amount is ₦${maxAmount.toLocaleString()}` 
      };
    }

    return { isValid: true, error: null };
  }

  /**
   * Validate transaction PIN
   * @param {string} pin - PIN to validate
   * @returns {Object} { isValid: boolean, error: string|null }
   */
  static validatePin(pin) {
    if (!pin) {
      return { 
        isValid: false, 
        error: COMMON_ERROR_MESSAGES.REQUIRED_FIELD 
      };
    }

    if (!VALIDATION_CONSTANTS.PIN.REGEX.test(pin)) {
      return { 
        isValid: false, 
        error: VALIDATION_CONSTANTS.PIN.ERROR_MESSAGE 
      };
    }

    return { isValid: true, error: null };
  }

  /**
   * Validate wallet balance
   * @param {number} walletBalance - Current wallet balance
   * @param {number} amount - Amount to spend
   * @returns {Object} { isValid: boolean, error: string|null }
   */
  static validateWalletBalance(walletBalance, amount) {
    const numAmount = Number(amount);
    
    if (isNaN(numAmount)) {
      return { 
        isValid: false, 
        error: VALIDATION_CONSTANTS.AMOUNT.ERROR_MESSAGE 
      };
    }

    if (walletBalance < numAmount) {
      return { 
        isValid: false, 
        error: COMMON_ERROR_MESSAGES.INSUFFICIENT_BALANCE 
      };
    }

    return { isValid: true, error: null };
  }

  /**
   * Validate meter number (Electricity)
   * @param {string} meterNumber - Meter number to validate
   * @returns {Object} { isValid: boolean, error: string|null }
   */
  static validateMeterNumber(meterNumber) {
    if (!meterNumber) {
      return { 
        isValid: false, 
        error: COMMON_ERROR_MESSAGES.REQUIRED_FIELD 
      };
    }

    const trimmed = meterNumber.trim();

    if (!VALIDATION_CONSTANTS.METER.REGEX.test(trimmed)) {
      return { 
        isValid: false, 
        error: VALIDATION_CONSTANTS.METER.ERROR_MESSAGE 
      };
    }

    return { isValid: true, error: null };
  }

  /**
   * Validate smartcard number (TV)
   * @param {string} smartcardNumber - Smartcard number to validate
   * @returns {Object} { isValid: boolean, error: string|null }
   */
  static validateSmartcardNumber(smartcardNumber) {
    if (!smartcardNumber) {
      return { 
        isValid: false, 
        error: COMMON_ERROR_MESSAGES.REQUIRED_FIELD 
      };
    }

    const trimmed = smartcardNumber.trim();

    if (!VALIDATION_CONSTANTS.SMARTCARD.REGEX.test(trimmed)) {
      return { 
        isValid: false, 
        error: VALIDATION_CONSTANTS.SMARTCARD.ERROR_MESSAGE 
      };
    }

    return { isValid: true, error: null };
  }

  /**
   * Validate email
   * @param {string} email - Email to validate
   * @returns {Object} { isValid: boolean, error: string|null }
   */
  static validateEmail(email) {
    if (!email) {
      return { 
        isValid: false, 
        error: COMMON_ERROR_MESSAGES.REQUIRED_FIELD 
      };
    }

    if (!VALIDATION_CONSTANTS.EMAIL.REGEX.test(email)) {
      return { 
        isValid: false, 
        error: VALIDATION_CONSTANTS.EMAIL.ERROR_MESSAGE 
      };
    }

    return { isValid: true, error: null };
  }

  /**
   * Validate airtime purchase data
   * @param {Object} data - { phone, provider, amount }
   * @returns {Object} { isValid: boolean, errors: Object }
   */
  static validateAirtimePurchase(data) {
    const errors = {};

    const phoneValidation = this.validatePhoneNumber(data.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error;
    }

    const providerValidation = this.validateProvider(data.provider);
    if (!providerValidation.isValid) {
      errors.provider = providerValidation.error;
    }

    const amountValidation = this.validateAmount(
      data.amount, 
      AIRTIME_CONSTANTS.LIMITS.MIN_AMOUNT, 
      AIRTIME_CONSTANTS.LIMITS.MAX_AMOUNT
    );
    if (!amountValidation.isValid) {
      errors.amount = amountValidation.error;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate data purchase
   * @param {Object} data - { phone, provider, planId }
   * @returns {Object} { isValid: boolean, errors: Object }
   */
  static validateDataPurchase(data) {
    const errors = {};

    const phoneValidation = this.validatePhoneNumber(data.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error;
    }

    const providerValidation = this.validateProvider(data.provider);
    if (!providerValidation.isValid) {
      errors.provider = providerValidation.error;
    }

    if (!data.planId) {
      errors.plan = DATA_CONSTANTS.ERROR_MESSAGES.NO_PLAN_SELECTED;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}