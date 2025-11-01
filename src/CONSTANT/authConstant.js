

/**
 * Authentication Constants
 */

export const AUTH_CONSTANTS = {
  // PIN Configuration
  LOGIN_PIN: {
    LENGTH: 6,
    REGEX: /^\d{6}$/,
  },
  
  TRANSACTION_PIN: {
    LENGTH: 4,
    REGEX: /^\d{4}$/,
  },

  // Phone Validation
  PHONE: {
    LENGTH: 11,
    REGEX: /^\d{11}$/,
    PREFIX_REGEX: /^(070|080|081|090|091)/,
  },

  // Email Validation
  EMAIL: {
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },

  // Password Validation
  PASSWORD: {
    MIN_LENGTH: 6,
    REGEX: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/,
  },

  // OTP Configuration
  OTP: {
    LENGTH: 6,
    EXPIRY_MINUTES: 10,
    RESEND_DELAY_SECONDS: 60,
  },

  // Error Messages
  ERROR_MESSAGES: {
    // Registration
    FIRST_NAME_REQUIRED: 'First name is required',
    LAST_NAME_REQUIRED: 'Last name is required',
    EMAIL_REQUIRED: 'Email is required',
    EMAIL_INVALID: 'Please enter a valid email address',
    PHONE_REQUIRED: 'Phone number is required',
    PHONE_INVALID: 'Please enter a valid 11-digit phone number',
    PASSWORD_REQUIRED: 'Password is required',
    PASSWORD_WEAK: 'Password must be at least 6 characters with letters and numbers',
    PASSWORD_MISMATCH: 'Passwords do not match',
    
    // OTP
    OTP_REQUIRED: 'Please enter OTP code',
    OTP_INVALID: 'OTP must be 6 digits',
    OTP_EXPIRED: 'OTP has expired. Please request a new one',
    OTP_INCORRECT: 'Invalid OTP code',
    
    // PIN
    LOGIN_PIN_REQUIRED: 'Please enter your 6-digit PIN',
    LOGIN_PIN_INVALID: 'PIN must be 6 digits',
    LOGIN_PIN_MISMATCH: 'PINs do not match',
    PIN_INCORRECT: 'Incorrect PIN',
    
    // General
    NETWORK_ERROR: 'Network error. Please check your connection',
    SERVER_ERROR: 'Server error. Please try again later',
    ALL_FIELDS_REQUIRED: 'All fields are required',
  },

  // Success Messages
  SUCCESS_MESSAGES: {
    REGISTRATION: 'Registration successful!',
    OTP_SENT: 'OTP sent to your phone',
    OTP_VERIFIED: 'Phone number verified successfully',
    PIN_SET: 'Login PIN set successfully',
    LOGIN_SUCCESS: 'Login successful',
  },

  // Storage Keys
  STORAGE_KEYS: {
    TOKEN: 'token',
    USER: 'user',
    REQUIRE_PIN: 'requirePinOnOpen',
    PHONE_NUMBER: 'phoneNumber',
    BIOMETRIC_ENABLED: 'biometricEnabled',
  },
};