
// components/shared/layout/LoadingOverlay.jsx
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Modal,
} from 'react-native';


/**
 * Loading Overlay Component
 * Reusable full-screen loading indicator
 */

export default function LoadingOverlay({
  visible,
  message = 'Processing...',
}) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: themeColors.card },
          ]}
        >
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.message, { color: themeColors.heading }]}>
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
  },
});