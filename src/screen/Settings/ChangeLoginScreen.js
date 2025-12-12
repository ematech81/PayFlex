
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { ScreenHeader, PayButton } from 'component/SHARED';
import { changeLoginPin } from 'AuthFunction/authService';

/**
 * Custom 6-Digit PIN Input Component
 */
const SixDigitPinInput = ({ value, onChangeText, error, themeColors, autoFocus = false }) => {
  const inputRefs = useRef([]);
  const [focusedIndex, setFocusedIndex] = useState(autoFocus ? 0 : -1);

  const handleChangeText = (text, index) => {
    // Only allow numbers
    if (text && !/^\d$/.test(text)) return;

    const newPin = value.split('');
    newPin[index] = text;
    const updatedPin = newPin.join('');
    
    onChangeText(updatedPin);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleFocus = (index) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(-1);
  };

  return (
    <View>
      <View style={styles.pinContainer}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={[
              styles.pinBox,
              {
                backgroundColor: themeColors.background,
                borderColor: error
                  ? themeColors.destructive
                  : focusedIndex === index
                  ? themeColors.primary
                  : themeColors.border,
                color: themeColors.heading,
              },
            ]}
            value={value[index] || ''}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onFocus={() => handleFocus(index)}
            onBlur={handleBlur}
            keyboardType="number-pad"
            maxLength={1}
            secureTextEntry
            autoFocus={autoFocus && index === 0}
            selectTextOnFocus
          />
        ))}
      </View>
      {error && (
        <Text style={[styles.errorText, { color: themeColors.destructive }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

/**
 * Change Login PIN Screen
 */
export default function ChangeLoginPinScreen({ navigation }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validatePins = () => {
    const newErrors = {};

    if (!currentPin || currentPin.length !== 6) {
      newErrors.currentPin = 'Enter your current 6-digit PIN';
    }

    if (!newPin || newPin.length !== 6) {
      newErrors.newPin = 'Enter a new 6-digit PIN';
    }

    if (newPin === currentPin) {
      newErrors.newPin = 'New PIN must be different from current PIN';
    }

    // Check for sequential or repeated digits
    if (newPin.length === 6) {
      if (/^(\d)\1{5}$/.test(newPin)) {
        newErrors.newPin = 'PIN cannot be all the same digit';
      } else if (newPin === '123456' || newPin === '654321') {
        newErrors.newPin = 'PIN is too simple. Choose a stronger PIN';
      }
    }

    if (!confirmPin || confirmPin.length !== 6) {
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
      await changeLoginPin(currentPin, newPin);

      Alert.alert(
        'Success',
        'Your login PIN has been changed successfully. Please use your new PIN for future logins.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to change login PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />
      
      <ScreenHeader
        title="Change Login PIN"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: `${themeColors.primary}15` }]}>
          <Ionicons name="keypad-outline" size={40} color={themeColors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: themeColors.heading }]}>
              Secure Your Login
            </Text>
            <Text style={[styles.infoText, { color: themeColors.subheading }]}>
              Your login PIN protects access to your account
            </Text>
          </View>
        </View>

        {/* Current PIN */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Current Login PIN
          </Text>
          <SixDigitPinInput
            value={currentPin}
            onChangeText={setCurrentPin}
            error={errors.currentPin}
            themeColors={themeColors}
            autoFocus
          />
        </View>

        {/* New PIN */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: themeColors.heading }]}>
            New Login PIN
          </Text>
          <SixDigitPinInput
            value={newPin}
            onChangeText={setNewPin}
            error={errors.newPin}
            themeColors={themeColors}
          />
        </View>

        {/* Confirm PIN */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: themeColors.heading }]}>
            Confirm New PIN
          </Text>
          <SixDigitPinInput
            value={confirmPin}
            onChangeText={setConfirmPin}
            error={errors.confirmPin}
            themeColors={themeColors}
          />
        </View>

        {/* PIN Strength Indicator */}
        {newPin.length === 6 && (
          <View style={[styles.strengthCard, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.strengthTitle, { color: themeColors.heading }]}>
              PIN Strength
            </Text>
            
            <View style={styles.strengthItem}>
              <Ionicons 
                name={!/^(\d)\1{5}$/.test(newPin) ? "checkmark-circle" : "close-circle"} 
                size={18} 
                color={!/^(\d)\1{5}$/.test(newPin) ? "#4CAF50" : "#FF6B6B"}
              />
              <Text style={[styles.strengthText, { color: themeColors.subheading }]}>
                Not all same digits
              </Text>
            </View>

            <View style={styles.strengthItem}>
              <Ionicons 
                name={newPin !== '123456' && newPin !== '654321' ? "checkmark-circle" : "close-circle"} 
                size={18} 
                color={newPin !== '123456' && newPin !== '654321' ? "#4CAF50" : "#FF6B6B"}
              />
              <Text style={[styles.strengthText, { color: themeColors.subheading }]}>
                Not a sequential pattern
              </Text>
            </View>

            <View style={styles.strengthItem}>
              <Ionicons 
                name={newPin !== currentPin ? "checkmark-circle" : "close-circle"} 
                size={18} 
                color={newPin !== currentPin ? "#4CAF50" : "#FF6B6B"}
              />
              <Text style={[styles.strengthText, { color: themeColors.subheading }]}>
                Different from current PIN
              </Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <PayButton
          title="Change Login PIN"
          onPress={handleChangePin}
          loading={loading}
          disabled={loading || currentPin.length !== 6 || newPin.length !== 6 || confirmPin.length !== 6}
          style={styles.submitButton}
        />

        {/* Security Note */}
        <View style={[styles.noteCard, { backgroundColor: themeColors.card }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color={themeColors.primary} />
          <Text style={[styles.noteText, { color: themeColors.subheading }]}>
            Your login PIN is different from your transaction PIN. Use a unique 6-digit PIN for login security.
          </Text>
        </View>
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
    paddingTop: 16,
    paddingBottom: 40,
  },

  // ========================================
  // INFO CARD
  // ========================================
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },

  // ========================================
  // PIN INPUT SECTION
  // ========================================
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  pinBox: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },

  // ========================================
  // STRENGTH INDICATOR
  // ========================================
  strengthCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  strengthTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  strengthText: {
    fontSize: 13,
  },

  // ========================================
  // NOTE CARD
  // ========================================
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  // ========================================
  // BUTTON
  // ========================================
  submitButton: {
    marginTop: 8,
  },
});