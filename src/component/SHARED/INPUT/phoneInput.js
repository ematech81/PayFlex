
// components/shared/inputs/PhoneInput.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { detectNetworkFromPhone } from 'CONSTANT/providerConstant';
import { ValidationUtils } from 'UTILS/validationUtils';
import { FormatUtils } from 'UTILS/formatUtils';


/**
 * Phone Input Component
 * Reusable phone number input with validation and auto-network detection
 */

export default function PhoneInput({
  value,
  onChangeText,
  onNetworkDetected,
  placeholder = '0XXX-XXXX-XXXX',
  showContactPicker = true,
  onContactPress,
  editable = true,
  error,
  label = 'Phone Number',
}) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [isFocused, setIsFocused] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Auto-detect network when phone number is complete
  useEffect(() => {
    if (value && value.length >= 4 && onNetworkDetected) {
      const network = detectNetworkFromPhone(value);
      if (network) {
        onNetworkDetected(network);
      }
    }
  }, [value]);

  const handleChangeText = (text) => {
    // Remove non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Limit to 11 digits
    const limited = cleaned.substring(0, 11);
    
    onChangeText(limited);

    // Clear error when user starts typing
    if (localError) {
      setLocalError(null);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Validate on blur
    if (value) {
      const validation = ValidationUtils.validatePhoneNumber(value);
      if (!validation.isValid) {
        setLocalError(validation.error);
      }
    }
  };

  const displayError = error || localError;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: themeColors.heading }]}>
          {label}
        </Text>
      )}
      
      <View
        style={[
          styles.inputContainer,
          { 
            backgroundColor: themeColors.card,
            borderColor: displayError 
              ? themeColors.destructive 
              : isFocused 
              ? themeColors.primary 
              : themeColors.border,
          },
        ]}
      >
        <Ionicons
          name="call-outline"
          size={20}
          color={isFocused ? themeColors.primary : themeColors.subtext}
          style={styles.icon}
        />
        
        <TextInput
          style={[styles.input, { color: themeColors.heading }]}
          placeholder={placeholder}
          placeholderTextColor={themeColors.subtext}
          keyboardType="phone-pad"
          value={FormatUtils.formatPhoneNumber(value)}
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          maxLength={14} // Formatted: 0803 456 7890
          editable={editable}
          accessibilityLabel={label}
          accessibilityHint="Enter your phone number"
        />

        {showContactPicker && onContactPress && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={onContactPress}
            accessibilityLabel="Select from contacts"
          >
            <Ionicons
              name="person-circle-outline"
              size={28}
              color={themeColors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {displayError && (
        <Text style={[styles.errorText, { color: themeColors.destructive }]}>
          {displayError}
        </Text>
      )}

      {value && value.length === 11 && !displayError && (
        <View style={styles.successIndicator}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={[styles.successText, { color: '#4CAF50' }]}>
            Valid phone number
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  contactButton: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  successIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 4,
  },
  successText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
});