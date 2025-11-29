
// components/shared/modals/PinModal.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import PinInput from '../INPUT/pinInput';
import PayButton from '../BUTTONS/payButton';


const { height } = Dimensions.get('window');

/**
 * PIN Modal Component
 * Reusable modal for PIN entry
 */

export default function PinModal({
  visible,
  onClose,
  onSubmit,
  onForgotPin,
  loading = false,
  error,
  title = 'Enter Transaction PIN',
  subtitle,
}) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [pin, setPin] = useState('');
  const [localError, setLocalError] = useState(null);

  const handleSubmit = () => {
    if (pin.length !== 4) {
      setLocalError('Please enter 4-digit PIN');
      return;
    }
    setLocalError(null);
    onSubmit(pin);
  };

  const handleClose = () => {
    setPin('');
    setLocalError(null);
    onClose();
  };

  const displayError = error || localError;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: themeColors.background },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            disabled={loading}
            accessibilityLabel="Close"
          >
            <Ionicons name="close-circle" size={28} color={themeColors.primary} />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            <Ionicons
              name="shield-checkmark"
              size={48}
              color={themeColors.primary}
              style={styles.icon}
            />

            <Text style={[styles.title, { color: themeColors.heading }]}>
              {title}
            </Text>

            {subtitle && (
              <Text style={[styles.subtitle, { color: themeColors.subheading }]}>
                {subtitle}
              </Text>
            )}

            <PinInput
              value={pin}
              onChangeText={setPin}
              error={displayError}
              autoFocus
            />

            <PayButton
              title="Submit"
              onPress={handleSubmit}
              loading={loading}
              disabled={pin.length !== 4}
              style={styles.submitButton}
            />

            {onForgotPin && (
              <TouchableOpacity
                onPress={onForgotPin}
                disabled={loading}
                style={styles.forgotButton}
                accessibilityLabel="Forgot PIN"
              >
                <Text style={[styles.forgotText, { color: themeColors.primary }]}>
                  Forgot PIN?
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    minHeight: height * 0.45,
    // borderRadius: 24,
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,

  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  submitButton: {
    width: '100%',
    marginTop: 24,
  },
  forgotButton: {
    marginTop: 16,
    padding: 8,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
  },
});