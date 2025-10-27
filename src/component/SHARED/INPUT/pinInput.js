

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
} from 'react-native';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';



/**
 * PIN Input Component
 * 4-digit PIN input with individual boxes
 */

export default function PinInput({
  value,
  onChangeText,
  error,
  label = 'Enter PIN',
  autoFocus = false,
}) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [pins, setPins] = useState(['', '', '', '']);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    if (autoFocus && inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, []);

  const handleChangeText = (text, index) => {
    // Only allow numbers
    const cleaned = text.replace(/\D/g, '');
    
    if (cleaned.length === 0) {
      // Handle backspace
      const newPins = [...pins];
      newPins[index] = '';
      setPins(newPins);
      onChangeText(newPins.join(''));
      
      // Move to previous input
      if (index > 0) {
        inputRefs[index - 1].current?.focus();
      }
    } else {
      // Handle input
      const newPins = [...pins];
      newPins[index] = cleaned[cleaned.length - 1]; // Take last character
      setPins(newPins);
      onChangeText(newPins.join(''));
      
      // Move to next input
      if (index < 3 && cleaned.length > 0) {
        inputRefs[index + 1].current?.focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && pins[index] === '' && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: themeColors.heading }]}>
          {label}
        </Text>
      )}
      
      <View style={styles.pinContainer}>
        {pins.map((pin, index) => (
          <View
            key={index}
            style={[
              styles.pinBox,
              {
                backgroundColor: themeColors.card,
                borderColor: error 
                  ? themeColors.destructive 
                  : pin 
                  ? themeColors.primary 
                  : themeColors.border,
              },
            ]}
          >
            <TextInput
              ref={inputRefs[index]}
              style={[styles.pinInput, { color: themeColors.heading }]}
              value={pin}
              onChangeText={(text) => handleChangeText(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              secureTextEntry
              textAlign="center"
              accessibilityLabel={`PIN digit ${index + 1}`}
            />
          </View>
        ))}
      </View>

      {error && (
        <Text style={[styles.errorText, { color: themeColors.destructive }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  pinBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinInput: {
    width: '100%',
    height: '100%',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});