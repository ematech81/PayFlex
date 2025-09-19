import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { useWallet } from 'context/WalletContext';
import axios from 'axios';
import WelcomeComponent from 'component/WelcomeComponent';

const BASE_URL = 'http://192.168.100.137:5000/api/auth';

export default function ResetPinScreen({ navigation, route }) {
  const { pinType } = route.params; // 'transaction' or 'login'
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { wallet, updateTransactionPinStatus } = useWallet();
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleRequestOtp = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.post(
        `${BASE_URL}/phone/resend-otp`,
        { phone: wallet.user.phone },
        { headers: { Authorization: `Bearer ${wallet.token}` } }
      );
      if (response.data.success) {
        setOtpSent(true);
        Alert.alert('Success', 'OTP sent to your phone');
      } else {
        setError(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPin = async () => {
    const pinLength = pinType === 'transaction' ? 4 : 6;
    if (!otp || !/^\d{6}$/.test(otp)) {
      setError('OTP must be 6 digits');
      return;
    }
    if (!pin || !new RegExp(`^\\d{${pinLength}}$`).test(pin)) {
      setError(`PIN must be exactly ${pinLength} digits`);
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const endpoint =
        pinType === 'transaction'
          ? '/reset-transaction-pin'
          : '/reset-login-pin';
      const response = await axios.post(
        `${BASE_URL}${endpoint}`,
        { pin, otp },
        { headers: { Authorization: `Bearer ${wallet.token}` } }
      );
      if (response.data.success) {
        if (pinType === 'transaction') {
          await updateTransactionPinStatus();
        }
        Alert.alert(
          'Success',
          `${
            pinType === 'transaction' ? 'Transaction' : 'Login'
          } PIN reset successfully`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        setError(response.data.message || 'Failed to reset PIN');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <WelcomeComponent />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.heading} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.heading }]}>
          Reset {pinType === 'transaction' ? 'Transaction' : 'Login'} PIN
        </Text>
      </View>
      {!otpSent ? (
        <>
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Request OTP to reset your{' '}
            {pinType === 'transaction' ? 'transaction' : 'login'} PIN
          </Text>
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: isLoading
                  ? themeColors.subtext
                  : themeColors.button,
              },
            ]}
            disabled={isLoading}
            onPress={handleRequestOtp}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={themeColors.card} />
            ) : (
              <Text
                style={[styles.submitButtonText, { color: themeColors.card }]}
              >
                Send OTP
              </Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Enter OTP
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: themeColors.heading, borderColor: themeColors.border },
            ]}
            placeholder="******"
            placeholderTextColor={themeColors.subtext}
            keyboardType="numeric"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            accessibilityLabel="OTP input"
          />
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Enter New {pinType === 'transaction' ? '4-Digit' : '6-Digit'} PIN
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: themeColors.heading, borderColor: themeColors.border },
            ]}
            placeholder={pinType === 'transaction' ? '****' : '******'}
            placeholderTextColor={themeColors.subtext}
            keyboardType="numeric"
            maxLength={pinType === 'transaction' ? 4 : 6}
            secureTextEntry
            value={pin}
            onChangeText={setPin}
            accessibilityLabel="New PIN input"
          />
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Confirm New PIN
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: themeColors.heading, borderColor: themeColors.border },
            ]}
            placeholder={pinType === 'transaction' ? '****' : '******'}
            placeholderTextColor={themeColors.subtext}
            keyboardType="numeric"
            maxLength={pinType === 'transaction' ? 4 : 6}
            secureTextEntry
            value={confirmPin}
            onChangeText={setConfirmPin}
            accessibilityLabel="Confirm PIN input"
          />
          {error ? (
            <Text style={[styles.error, { color: themeColors.destructive }]}>
              {error}
            </Text>
          ) : null}
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: isLoading
                  ? themeColors.subtext
                  : themeColors.button,
              },
            ]}
            disabled={isLoading}
            onPress={handleResetPin}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={themeColors.card} />
            ) : (
              <Text
                style={[styles.submitButtonText, { color: themeColors.card }]}
              >
                Reset PIN
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  error: {
    fontSize: 14,
    marginBottom: 20,
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
