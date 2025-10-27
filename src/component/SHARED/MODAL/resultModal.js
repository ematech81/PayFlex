
// components/shared/modals/ResultModal.jsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from 'constants/colors';
import PayButton from '../BUTTONS/payButton';
import { useThem } from 'constants/useTheme';

/**
 * Result Modal Component
 * Reusable modal for success/error feedback
 */

export default function ResultModal({
  visible,
  onClose,
  type = 'success', // 'success' | 'error' | 'warning'
  title,
  message,
  primaryAction,
  secondaryAction,
}) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return {
          name: 'checkmark-circle',
          color: '#4CAF50',
        };
      case 'error':
        return {
          name: 'close-circle',
          color: themeColors.destructive,
        };
      case 'warning':
        return {
          name: 'alert-circle',
          color: '#FFA500',
        };
      default:
        return {
          name: 'information-circle',
          color: themeColors.primary,
        };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: themeColors.background },
          ]}
        >
          <Ionicons
            name={iconConfig.name}
            size={72}
            color={iconConfig.color}
            style={styles.icon}
          />

          <Text style={[styles.title, { color: themeColors.heading }]}>
            {title}
          </Text>

          {message && (
            <Text style={[styles.message, { color: themeColors.subheading }]}>
              {message}
            </Text>
          )}

          <View style={styles.actions}>
            {primaryAction && (
              <PayButton
                title={primaryAction.label}
                onPress={primaryAction.onPress}
                style={styles.primaryButton}
              />
            )}

            {secondaryAction && (
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  { borderColor: themeColors.border },
                ]}
                onPress={secondaryAction.onPress}
              >
                <Text
                  style={[
                    styles.secondaryText,
                    { color: themeColors.heading },
                  ]}
                >
                  {secondaryAction.label}
                </Text>
              </TouchableOpacity>
            )}

            {!primaryAction && !secondaryAction && (
              <PayButton
                title="OK"
                onPress={onClose}
                style={styles.primaryButton}
              />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '600',
  },
});