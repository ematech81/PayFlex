
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { formatCurrency } from 'CONSTANT/formatCurrency';

/**
 * Amount Input Component
 * Reusable input for monetary amounts
 */
export default function AmountInput({
  value,
  onChangeText,
  label,
  placeholder = 'Enter amount',
  error,
  minAmount = 0,
  maxAmount = 1000000,
  disabled = false,
}) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [isFocused, setIsFocused] = React.useState(false);

  const handleChangeText = (text) => {
    // Only allow numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return;
    }
    
    onChangeText(cleaned);
  };

  const numericValue = parseFloat(value || 0);
  const showMinError = value && numericValue < minAmount;
  const showMaxError = value && numericValue > maxAmount;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: themeColors.heading }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: themeColors.background,
            borderColor: error || showMinError || showMaxError
              ? themeColors.destructive
              : isFocused
              ? themeColors.primary
              : themeColors.border,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <View style={styles.currencySymbol}>
          <Text style={[styles.currencyText, { color: themeColors.subheading }]}>
            ₦
          </Text>
        </View>
        
        <TextInput
          style={[styles.input, { color: themeColors.heading }]}
          value={value}
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={themeColors.subtext}
          keyboardType="numeric"
          editable={!disabled}
        />

        {value && numericValue > 0 && (
          <View style={styles.amountPreview}>
            <Text style={[styles.previewText, { color: themeColors.subtext }]}>
              {formatCurrency(numericValue, 'NGN')}
            </Text>
          </View>
        )}
      </View>

      {/* Error Messages */}
      {error && (
        <Text style={[styles.errorText, { color: themeColors.destructive }]}>
          {error}
        </Text>
      )}
      
      {showMinError && (
        <Text style={[styles.errorText, { color: themeColors.destructive }]}>
          Minimum amount is {formatCurrency(minAmount, 'NGN')}
        </Text>
      )}
      
      {showMaxError && (
        <Text style={[styles.errorText, { color: themeColors.destructive }]}>
          Maximum amount is {formatCurrency(maxAmount, 'NGN')}
        </Text>
      )}

      {/* Helper Text */}
      {!error && !showMinError && !showMaxError && minAmount > 0 && (
        <Text style={[styles.helperText, { color: themeColors.subtext }]}>
          Min: {formatCurrency(minAmount, 'NGN')} • Max: {formatCurrency(maxAmount, 'NGN')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  currencySymbol: {
    marginRight: 8,
  },
  currencyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  amountPreview: {
    paddingHorizontal: 8,
  },
  previewText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic',
  },
});







