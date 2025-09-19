import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { useWallet } from 'context/WalletContext';
import axios from 'axios';
import WelcomeComponent from 'component/WelcomeComponent';

const BASE_URL = 'http://192.168.100.137:5000/api/auth';

export default function SetTransactionPinScreen({ navigation, route }) {
  const { onSuccess } = route.params || {};
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { wallet } = useWallet();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetPin = async () => {
    if (!pin || !/^\d{4}$/.test(pin)) {
      setError('PIN must be 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${BASE_URL}/set-transaction-pin`,
        { pin },
        { headers: { Authorization: `Bearer ${wallet.token}` } }
      );
      if (response.data.success) {
        Alert.alert('Success', 'Transaction PIN set successfully', [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
              if (onSuccess) onSuccess();
            },
          },
        ]);
      } else {
        setError(response.data.message || 'Failed to set PIN');
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
      <View style={([styles.header], { backgroundColor: themeColors.primary })}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.heading} />
        </TouchableOpacity>
      </View>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="#4a00e0"
      />
      <WelcomeComponent />
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={[styles.headerTitle, { color: themeColors.heading }]}>
          Set Transaction PIN
        </Text>
        <Text style={[styles.label, { color: themeColors.heading }]}>
          Enter 4-Digit PIN
        </Text>
        <TextInput
          style={[
            styles.input,
            { color: themeColors.heading, borderColor: themeColors.border },
          ]}
          placeholder="****"
          placeholderTextColor={themeColors.subtext}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          value={pin}
          onChangeText={setPin}
          accessibilityLabel="Transaction PIN input"
        />
        <Text style={[styles.label, { color: themeColors.heading }]}>
          Confirm PIN
        </Text>
        <TextInput
          style={[
            styles.input,
            { color: themeColors.heading, borderColor: themeColors.border },
          ]}
          placeholder="****"
          placeholderTextColor={themeColors.subtext}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          value={confirmPin}
          onChangeText={setConfirmPin}
          accessibilityLabel="Confirm transaction PIN input"
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
          onPress={handleSetPin}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={themeColors.card} />
          ) : (
            <Text
              style={[styles.submitButtonText, { color: themeColors.card }]}
            >
              Set PIN
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    marginTop: 20,
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
  contentHeader: {
    padding: 20,
    width: '100%',
    minHeight: '45%',
    alignItems: 'center',
    justifyCntent: 'center',
  },
});
