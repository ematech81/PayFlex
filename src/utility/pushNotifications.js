import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from 'utility/storageKeys';
import { ApiIPAddress } from 'utility/apiIPAdress';

const PUSH_TOKEN_KEY = '@payflex_push_token';

// Configure how notifications are displayed when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
  }),
});

/**
 * Request permission and register the Expo push token.
 * Saves the token to AsyncStorage and syncs it to the backend.
 * Safe to call every time the app opens — skips if token hasn't changed.
 */
export async function registerForPushNotifications() {
  // Push notifications don't work on simulators/emulators
  if (!Device.isDevice) {
    console.log('[push] Skipping — not a physical device');
    return null;
  }

  // Android: create notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'PayFlex Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4a00e0',
    });
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[push] Permission denied');
    return null;
  }

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: undefined, // Uses app.json extra.eas.projectId if set
  });
  const token = tokenData.data;

  // Only sync to backend if token changed
  const stored = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (token !== stored) {
    await syncTokenToBackend(token);
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  }

  console.log('[push] Registered token:', token);
  return token;
}

async function syncTokenToBackend(token) {
  try {
    const authToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!authToken) return; // not logged in yet

    const res = await fetch(`${ApiIPAddress}/auth/push-token`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log('[push] Token synced to backend');
  } catch (err) {
    console.warn('[push] Failed to sync token:', err.message);
  }
}

/**
 * Clear the stored push token (call on logout so old tokens don't linger).
 */
export async function clearPushToken() {
  await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
}
