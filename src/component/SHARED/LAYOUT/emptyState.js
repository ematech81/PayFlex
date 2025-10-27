
// components/shared/layout/EmptyState.jsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import PayButton from '../BUTTONS/payButton';


/**
 * Empty State Component
 * Reusable empty state display
 */

export default function EmptyState({
  icon = 'file-tray-outline',
  title = 'No Data',
  message = 'Nothing to show here yet',
  actionLabel,
  onAction,
}) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${themeColors.primary}15` },
        ]}
      >
        <Ionicons
          name={icon}
          size={64}
          color={themeColors.primary}
        />
      </View>

      <Text style={[styles.title, { color: themeColors.heading }]}>
        {title}
      </Text>

      <Text style={[styles.message, { color: themeColors.subheading }]}>
        {message}
      </Text>

      {actionLabel && onAction && (
        <PayButton
          title={actionLabel}
          onPress={onAction}
          style={styles.actionButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButton: {
    minWidth: 200,
  },
});