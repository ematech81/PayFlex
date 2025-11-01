// utils/device.utils.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

/**
 * Device Detection Utilities
 * Track and verify devices for security
 */

const DEVICE_STORAGE_KEY = 'deviceId';
const TRUSTED_DEVICES_KEY = 'trustedDevices';

export class DeviceUtils {
  /**
   * Get unique device identifier
   */
  static async getDeviceId() {
    try {
      // Try to get existing device ID
      let deviceId = await AsyncStorage.getItem(DEVICE_STORAGE_KEY);

      if (!deviceId) {
        // Generate new device ID from device info
        const deviceInfo = await this.getDeviceInfo();
        deviceId = this.generateDeviceId(deviceInfo);
        await AsyncStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
      }

      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      return null;
    }
  }

  /**
   * Get device information
   */
  static async getDeviceInfo() {
    try {
      const info = {
        platform: Platform.OS,
        osVersion: Platform.Version,
        deviceName: Device.deviceName,
        modelName: Device.modelName,
        brand: Device.brand,
        manufacturer: Device.manufacturer,
        deviceYearClass: Device.deviceYearClass,
        isDevice: Device.isDevice,
      };

      // Add iOS specific info
      if (Platform.OS === 'ios') {
        info.systemName = Device.osName;
        info.systemVersion = Device.osVersion;
        info.identifierForVendor = await Application.getIosIdForVendorAsync();
      }

      // Add Android specific info
      if (Platform.OS === 'android') {
        info.androidId = Application.androidId;
      }

      return info;
    } catch (error) {
      console.error('Error getting device info:', error);
      return {
        platform: Platform.OS,
        osVersion: Platform.Version,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Generate device ID from device info
   */
  static generateDeviceId(deviceInfo) {
    // Create a unique hash-like ID from device info
    const components = [
      deviceInfo.platform,
      deviceInfo.brand,
      deviceInfo.modelName,
      deviceInfo.identifierForVendor || deviceInfo.androidId || '',
      Date.now().toString(),
    ].filter(Boolean);

    return components.join('-').replace(/\s/g, '_');
  }

  /**
   * Check if device is trusted
   */
  static async isDeviceTrusted(userId) {
    try {
      const deviceId = await this.getDeviceId();
      const trustedDevicesStr = await AsyncStorage.getItem(
        `${TRUSTED_DEVICES_KEY}_${userId}`
      );

      if (!trustedDevicesStr) {
        return false;
      }

      const trustedDevices = JSON.parse(trustedDevicesStr);
      return trustedDevices.includes(deviceId);
    } catch (error) {
      console.error('Error checking trusted device:', error);
      return false;
    }
  }

  /**
   * Add device to trusted list
   */
  static async trustDevice(userId) {
    try {
      const deviceId = await this.getDeviceId();
      const trustedDevicesStr = await AsyncStorage.getItem(
        `${TRUSTED_DEVICES_KEY}_${userId}`
      );

      let trustedDevices = trustedDevicesStr
        ? JSON.parse(trustedDevicesStr)
        : [];

      if (!trustedDevices.includes(deviceId)) {
        trustedDevices.push(deviceId);
        await AsyncStorage.setItem(
          `${TRUSTED_DEVICES_KEY}_${userId}`,
          JSON.stringify(trustedDevices)
        );
      }

      return true;
    } catch (error) {
      console.error('Error trusting device:', error);
      return false;
    }
  }

  /**
   * Remove device from trusted list
   */
  static async untrustDevice(userId, deviceId = null) {
    try {
      const currentDeviceId = deviceId || (await this.getDeviceId());
      const trustedDevicesStr = await AsyncStorage.getItem(
        `${TRUSTED_DEVICES_KEY}_${userId}`
      );

      if (!trustedDevicesStr) {
        return true;
      }

      let trustedDevices = JSON.parse(trustedDevicesStr);
      trustedDevices = trustedDevices.filter((id) => id !== currentDeviceId);

      await AsyncStorage.setItem(
        `${TRUSTED_DEVICES_KEY}_${userId}`,
        JSON.stringify(trustedDevices)
      );

      return true;
    } catch (error) {
      console.error('Error untrusting device:', error);
      return false;
    }
  }

  /**
   * Get all trusted devices for user
   */
  static async getTrustedDevices(userId) {
    try {
      const trustedDevicesStr = await AsyncStorage.getItem(
        `${TRUSTED_DEVICES_KEY}_${userId}`
      );

      if (!trustedDevicesStr) {
        return [];
      }

      return JSON.parse(trustedDevicesStr);
    } catch (error) {
      console.error('Error getting trusted devices:', error);
      return [];
    }
  }

  /**
   * Clear all trusted devices for user
   */
  static async clearTrustedDevices(userId) {
    try {
      await AsyncStorage.removeItem(`${TRUSTED_DEVICES_KEY}_${userId}`);
      return true;
    } catch (error) {
      console.error('Error clearing trusted devices:', error);
      return false;
    }
  }

  /**
   * Get device fingerprint (for backend verification)
   */
  static async getDeviceFingerprint() {
    try {
      const deviceInfo = await this.getDeviceInfo();
      return {
        deviceId: await this.getDeviceId(),
        platform: deviceInfo.platform,
        osVersion: deviceInfo.osVersion,
        deviceName: deviceInfo.deviceName,
        modelName: deviceInfo.modelName,
        brand: deviceInfo.brand,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error getting device fingerprint:', error);
      return null;
    }
  }
}
