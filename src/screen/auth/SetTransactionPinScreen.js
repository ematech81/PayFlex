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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { useWallet } from 'context/WalletContext';
import axios from 'axios';
import AuthHeader from 'component/AuthHeader';
import { ApiIPAddress } from 'utility/apiIPAdress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from 'utility/storageKeys';

const BASE_URL = ApiIPAddress;

export default function SetTransactionPinScreen({ navigation, route }) {
  const { fromScreen } = route.params || {};
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { wallet, updateTransactionPinStatus } = useWallet();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetPin = async () => {

    
    // Clear previous errors
    setError('');

    // Validation
    if (!pin || !/^\d{4}$/.test(pin)) {
      return setError('PIN must be exactly 4 digits');
    }
    if (pin !== confirmPin) {
      return setError('PINs do not match');
    }

    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      console.log('🔐 Creating transaction PIN...');
      
      const { data } = await axios.post(
        `${BASE_URL}/set-transaction-pin`,
        { pin },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );
      console.log('token', wallet.token)

      if (data.success) {
        console.log('✅ PIN created successfully on server');
        
        // ✅ FIX: Only update local status, DON'T call refreshWallet here
        await updateTransactionPinStatus(true);
        console.log('✅ Local PIN status updated to true');

        // Show success and navigate back
        Alert.alert(
          'Success', 
          'Transaction PIN created successfully!', 
          [
            {
              text: 'OK',
              onPress: () => {
                // ✅ FIX: Navigate back with fromPinSetup flag
                if (fromScreen) {
                  navigation.navigate(fromScreen, { 
                    fromPinSetup: true 
                  });
                } else {
                  navigation.goBack();
                }
              },
            },
          ]
        );
      } else {
        setError(data.message || 'Failed to set PIN');
        console.error('❌ Server returned failure:', data.message);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Network error. Please try again.';
      setError(message);
      console.error('❌ PIN setup failed:', err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        <AuthHeader
          title="Set Transaction PIN"
          subtitle="Create a 4-digit PIN to secure your transactions"
          showBack
          onBack={() => navigation.goBack()}
          // style={{paddingHorizontal: 16}}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info Banner */}
          <View style={[styles.infoBanner, { backgroundColor: `${themeColors.primary}10` }]}>
            <Ionicons name="information-circle" size={20} color={themeColors.primary} />
            <Text style={[styles.infoText, { color: themeColors.heading }]}>
              Please note: Your transaction PIN is different from your login PIN. 
              You'll need your transaction PIN to authorize payments.
            </Text>
          </View>

          {/* PIN Input */}
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Enter 4-Digit PIN
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input, 
                { 
                  color: themeColors.heading, 
                  borderColor: error && !pin ? themeColors.destructive : themeColors.border,
                  backgroundColor: themeColors.card,
                }
              ]}
              placeholder="••••"
              placeholderTextColor={themeColors.subtext}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={pin}
              onChangeText={(text) => {
                setPin(text);
                setError('');
              }}
              editable={!isLoading}
            />
            {pin.length === 4 && (
              <Ionicons 
                name="checkmark-circle" 
                size={24} 
                color={themeColors.primary} 
                style={styles.inputIcon}
              />
            )}
          </View>

          {/* Confirm PIN Input */}
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Confirm PIN
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input, 
                { 
                  color: themeColors.heading, 
                  borderColor: error && !confirmPin ? themeColors.destructive : themeColors.border,
                  backgroundColor: themeColors.card,
                }
              ]}
              placeholder="••••"
              placeholderTextColor={themeColors.subtext}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={confirmPin}
              onChangeText={(text) => {
                setConfirmPin(text);
                setError('');
              }}
              editable={!isLoading}
            />
            {confirmPin.length === 4 && confirmPin === pin && (
              <Ionicons 
                name="checkmark-circle" 
                size={24} 
                color={themeColors.primary} 
                style={styles.inputIcon}
              />
            )}
          </View>

          {/* Error Message */}
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: `${themeColors.destructive}15` }]}>
              <Ionicons name="alert-circle" size={20} color={themeColors.destructive} />
              <Text style={[styles.errorText, { color: themeColors.destructive }]}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* PIN Requirements */}
          <View style={[styles.requirementsContainer, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.requirementsTitle, { color: themeColors.heading }]}>
              PIN Requirements:
            </Text>
            <View style={styles.requirementItem}>
              <Ionicons 
                name={pin.length === 4 ? "checkmark-circle" : "ellipse-outline"} 
                size={18} 
                color={pin.length === 4 ? themeColors.primary : themeColors.subtext} 
              />
              <Text style={[styles.requirementText, { color: themeColors.subtext }]}>
                Must be exactly 4 digits
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons 
                name={/^\d+$/.test(pin) && pin.length > 0 ? "checkmark-circle" : "ellipse-outline"} 
                size={18} 
                color={/^\d+$/.test(pin) && pin.length > 0 ? themeColors.primary : themeColors.subtext} 
              />
              <Text style={[styles.requirementText, { color: themeColors.subtext }]}>
                Numbers only (0-9)
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons 
                name={pin === confirmPin && pin.length === 4 ? "checkmark-circle" : "ellipse-outline"} 
                size={18} 
                color={pin === confirmPin && pin.length === 4 ? themeColors.primary : themeColors.subtext} 
              />
              <Text style={[styles.requirementText, { color: themeColors.subtext }]}>
                Both PINs must match
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { 
                backgroundColor: isLoading || !pin || !confirmPin 
                  ? themeColors.subtext 
                  : themeColors.button 
              },
            ]}
            disabled={isLoading || !pin || !confirmPin}
            onPress={handleSetPin}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={themeColors.card} />
            ) : (
              <>
                <Text style={[styles.submitButtonText, { color: themeColors.card }]}>
                  Set Transaction PIN
                </Text>
                <Ionicons name="arrow-forward" size={20} color={themeColors.card} />
              </>
            )}
          </TouchableOpacity>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark" size={20} color={themeColors.primary} />
            <Text style={[styles.securityText, { color: themeColors.subtext }]}>
              Your PIN is encrypted and securely stored. Never share your PIN with anyone.
            </Text>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 8,
    textAlign: 'center',
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  requirementsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 13,
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 4,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});