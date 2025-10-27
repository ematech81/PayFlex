
// components/shared/buttons/PayButton.jsx
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';


/**
 * Pay Button Component
 * Reusable primary action button for payments
 */

export default function PayButton({
  title = 'Pay',
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
}) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: disabled || loading
            ? themeColors.subtext
            : themeColors.primary,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={themeColors.card} />
      ) : (
        <Text
          style={[
            styles.text,
            { color: themeColors.card },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  text: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});