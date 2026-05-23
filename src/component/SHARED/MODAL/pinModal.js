// components/shared/modals/PinModal.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import PinInput from '../INPUT/pinInput';
import PayButton from '../BUTTONS/payButton';

/**
 * PIN Modal Component
 * Reusable modal for PIN entry
 *
 * Keyboard avoidance: KeyboardAvoidingView is broken inside Modal on Android
 * (it measures against the main window, not the modal window). We listen to
 * Keyboard events directly and lift the sheet via marginBottom instead.
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Clear stale keyboard offset whenever the modal is hidden
  useEffect(() => {
    if (!visible) setKeyboardHeight(0);
  }, [visible]);

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
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: themeColors.background,
              marginBottom: keyboardHeight,
            },
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

          {/* Scrollable content so nothing clips on small screens */}
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
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
          </ScrollView>
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
  },
  container: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  content: {
    alignItems: 'center',
    paddingBottom: 8,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
