// src/services/AuthService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';

const BASE_URL = 'http://192.168.43.191:5000/api/auth';

const getDeviceId = async () => {
  let id = await AsyncStorage.getItem('deviceId');
  if (!id) {
    id = `${Device.modelName}-${Device.osBuildId}-${Date.now()}`;
    await AsyncStorage.setItem('deviceId', id);
  }
  return id;
};

export const AuthService = {
  register: async (data) => {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  verifyOtp: async (phone, otp) => {
    const res = await fetch(`${BASE_URL}/phone/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });
    return res.json();
  },

  resendOtp: async (phone) => {
    const res = await fetch(`${BASE_URL}/phone/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    return res.json();
  },

  setPin: async (pin) => {
    const token = await AsyncStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/set-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pin }),
    });
    return res.json();
  },

  login: async (phone, pin) => {
    const deviceId = await getDeviceId();
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin, deviceId }),
    });
    const data = await res.json();

    if (data.success && !data.isNewDevice) {
      await AsyncStorage.multiSet([
        ['token', data.token],
        ['user', JSON.stringify(data.user)],
        ['phone', phone],
        ['requirePinOnOpen', String(data.user.requirePinOnOpen)],
      ]);
    }
    return data;
  },

  forgotPin: async (phone) => {
    const res = await fetch(`${BASE_URL}/forgot-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    return res.json();
  },

  verifyResetCode: async (phone, code) => {
    const res = await fetch(`${BASE_URL}/verify-reset-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    return res.json();
  },

  setPinAfterReset: async (resetToken, pin) => {
    const res = await fetch(`${BASE_URL}/set-pin-after-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, pin }),
    });
    return res.json();
  },

  updateRequirePin: async (requirePin) => {
    const token = await AsyncStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/update-require-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ requirePin }),
    });
    return res.json();
  },
};