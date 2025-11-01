
// hooks/useDeviceDetection.js
import { useState, useEffect } from 'react';
import { DeviceUtils } from 'UTILS/deviceDetentionUtils';



/**
 * Device Detection Hook
 * Manage device trust and verification
 */

export const useDeviceDetection = (userId) => {
  const [deviceId, setDeviceId] = useState(null);
  const [isTrusted, setIsTrusted] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      initializeDevice();
    }
  }, [userId]);

  /**
   * Initialize device detection
   */
  const initializeDevice = async () => {
    try {
      setIsLoading(true);

      const id = await DeviceUtils.getDeviceId();
      const trusted = await DeviceUtils.isDeviceTrusted(userId);
      const info = await DeviceUtils.getDeviceInfo();

      setDeviceId(id);
      setIsTrusted(trusted);
      setDeviceInfo(info);
    } catch (error) {
      console.error('Error initializing device:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Trust current device
   */
  const trustThisDevice = async () => {
    try {
      const success = await DeviceUtils.trustDevice(userId);
      if (success) {
        setIsTrusted(true);
      }
      return success;
    } catch (error) {
      console.error('Error trusting device:', error);
      return false;
    }
  };

  /**
   * Untrust current device
   */
  const untrustThisDevice = async () => {
    try {
      const success = await DeviceUtils.untrustDevice(userId);
      if (success) {
        setIsTrusted(false);
      }
      return success;
    } catch (error) {
      console.error('Error untrusting device:', error);
      return false;
    }
  };

  /**
   * Get device fingerprint
   */
  const getFingerprint = async () => {
    return await DeviceUtils.getDeviceFingerprint();
  };

  return {
    deviceId,
    isTrusted,
    deviceInfo,
    isLoading,
    trustThisDevice,
    untrustThisDevice,
    getFingerprint,
    refreshDeviceStatus: initializeDevice,
  };
};

// Example usage in AuthService login method:
/*
// services/auth.service.js - Update login method

static async login(phone, pin) {
  try {
    console.log('=== LOGIN REQUEST ===');
    console.log('Phone:', phone);
    
    // Get device fingerprint
    const deviceFingerprint = await DeviceUtils.getDeviceFingerprint();
    
    const response = await apiService.post('/auth/login', {
      phone,
      pin,
      deviceInfo: deviceFingerprint, // Send to backend
    });

    console.log('Login Response:', { ...response, data: { ...response.data, token: '****' } });
    
    // Store credentials if login successful
    if (response.success && response.data) {
      await this.storeCredentials(response.data.token, response.data.user);
      
      // Trust device if not flagged as new
      if (!response.data.isNewDevice) {
        await DeviceUtils.trustDevice(response.data.user._id);
      }
    }
    
    return response;
  } catch (error) {
    console.error('AuthService.login error:', error);
    throw error;
  }
}
*/