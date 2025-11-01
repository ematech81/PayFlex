// hooks/useOTPVerification.js
import { AUTH_CONSTANTS } from 'CONSTANT/authConstant';
import { useState, useEffect, useRef } from 'react';
import { AuthService } from 'AuthFunction/authService';
import { AuthValidation } from 'UTILS/authUtils';
``


/**
 * OTP Verification Hook
 * Handles OTP verification logic
 */

export const useOTPVerification = (phone, userId) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(AUTH_CONSTANTS.OTP.RESEND_DELAY_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const timerRef = useRef(null);

  /**
   * Start resend timer
   */
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [resendTimer]);

  /**
   * Update OTP digit
   */
  const updateOTP = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const newOTP = [...otp];
    newOTP[index] = value;
    setOtp(newOTP);

    // Clear error when user types
    if (error) {
      setError(null);
    }
  };

  /**
   * Verify OTP
   */
  const verifyOTP = async () => {
    const otpString = otp.join('');
    
    // Validate OTP
    const validation = AuthValidation.validateOTP(otpString);
    if (!validation.isValid) {
      setError(validation.error);
      return { success: false };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await AuthService.verifyOTP(phone, otpString, userId);
      
      if (response.success) {
        setToken(response.data.token);
        setUser(response.data.user);
        return {
          success: true,
          token: response.data.token,
          user: response.data.user,
        };
      } else {
        const errorMessage = response.data?.message || AUTH_CONSTANTS.ERROR_MESSAGES.OTP_INCORRECT;
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = ErrorUtils.createUserMessage(error, 'verifying OTP');
      setError(errorMessage);
      ErrorUtils.logError(error, 'useOTPVerification.verifyOTP', { phone, userId });
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resend OTP
   */
  const resendOTP = async () => {
    if (!canResend) return;

    setIsResending(true);
    setError(null);

    try {
      const response = await AuthService.resendOTP(phone, userId);
      
      if (response.success) {
        // Reset timer
        setResendTimer(AUTH_CONSTANTS.OTP.RESEND_DELAY_SECONDS);
        setCanResend(false);
        
        // Clear OTP input
        setOtp(['', '', '', '', '', '']);
        
        return { success: true };
      } else {
        const errorMessage = response.data?.message || 'Failed to resend OTP';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = ErrorUtils.createUserMessage(error, 'resending OTP');
      setError(errorMessage);
      ErrorUtils.logError(error, 'useOTPVerification.resendOTP', { phone, userId });
      return { success: false, error: errorMessage };
    } finally {
      setIsResending(false);
    }
  };

  /**
   * Reset OTP
   */
  const resetOTP = () => {
    setOtp(['', '', '', '', '', '']);
    setError(null);
  };

  return {
    otp,
    error,
    isLoading,
    isResending,
    resendTimer,
    canResend,
    token,
    user,
    updateOTP,
    verifyOTP,
    resendOTP,
    resetOTP,
  };
};