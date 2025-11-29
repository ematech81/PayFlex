
// components/shared/buttons/QuickAmountButton.jsx
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { height } = Dimensions.get('window');

/**
 * Quick Amount Button Component
 * Reusable button for quick amount selection
 */

export default function QuickAmountButton({ amount, onPress, isSelected = false }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: isSelected ? themeColors.primary : themeColors.card,
          borderColor: isSelected ? themeColors.primary : themeColors.border,
        },
      ]}
      onPress={() => onPress(amount)}
      activeOpacity={0.7}
      accessibilityLabel={`Quick amount ${amount}`}
      accessibilityRole="button"
    >
      <Text
        style={[
          styles.text,
          {
            color: isSelected ? themeColors.card : themeColors.primary,
          },
        ]}
      >
        ₦{amount}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    margin: 5,
    width: '30%',
    height: height * 0.07,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  text: {
    fontWeight: '600',
    fontSize: 15,
  },
});