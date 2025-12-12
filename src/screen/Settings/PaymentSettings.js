import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { ScreenHeader, PayButton } from 'component/SHARED';
import PinInput from 'component/SHARED/INPUT/pinInput';
import { changeTransactionPin } from 'AuthFunction/authService';

/**
 * Change Transaction PIN Screen
 */
export default function PaymentSettings({ navigation }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validatePins = () => {
    const newErrors = {};

    if (!currentPin || currentPin.length !== 4) {
      newErrors.currentPin = 'Enter your current PIN';
    }

    if (!newPin || newPin.length !== 4) {
      newErrors.newPin = 'Enter a new 4-digit PIN';
    }

    if (newPin === currentPin) {
      newErrors.newPin = 'New PIN must be different from current PIN';
    }

    if (!confirmPin || confirmPin.length !== 4) {
      newErrors.confirmPin = 'Confirm your new PIN';
    }

    if (newPin && confirmPin && newPin !== confirmPin) {
      newErrors.confirmPin = 'PINs do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePin = async () => {
    if (!validatePins()) return;

    try {
      setLoading(true);
      await changeTransactionPin(currentPin, newPin);

      Alert.alert(
        'Success',
        'Your transaction PIN has been changed successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to change PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />
      
      <ScreenHeader
        title="Change Transaction PIN"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current PIN */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Current PIN
          </Text>
          <PinInput
            value={currentPin}
            onChangeText={setCurrentPin}
            error={errors.currentPin}
          />
        </View>

        {/* New PIN */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: themeColors.heading }]}>
            New PIN
          </Text>
          <PinInput
            value={newPin}
            onChangeText={setNewPin}
            error={errors.newPin}
          />
        </View>

        {/* Confirm PIN */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Confirm New PIN
          </Text>
          <PinInput
            value={confirmPin}
            onChangeText={setConfirmPin}
            error={errors.confirmPin}
          />
        </View>

        {/* Submit Button */}
        <PayButton
          title="Change PIN"
          onPress={handleChangePin}
          loading={loading}
          disabled={loading || !currentPin || !newPin || !confirmPin}
          style={styles.submitButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  submitButton: {
    marginTop: 16,
  },
});