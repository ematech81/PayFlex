
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







// // components/shared/inputs/AmountInput.jsx
// import React, { useState } from 'react';
// import {
//   View,
//   TextInput,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
// } from 'react-native';
// import { useThem } from 'constants/useTheme';
// import { colors } from 'constants/colors';
// import { ValidationUtils } from 'UTILS/validationUtils';
// import { FormatUtils } from 'UTILS/formatUtils';

// /**
//  * Amount Input Component
//  * Reusable amount input with currency symbol and validation
//  */

// export default function AmountInput({
//   value,
//   onChangeText,
//   placeholder = 'Enter Amount',
//   label = 'Amount',
//   minAmount,
//   maxAmount,
//   editable = true,
//   error,
//   showBalance = false,
//   balance,
//   currencySymbol = '₦',
// }) {
//   const isDarkMode = useThem();
//   const themeColors = isDarkMode ? colors.dark : colors.light;
//   const [isFocused, setIsFocused] = useState(false);
//   const [localError, setLocalError] = useState(null);

//   const handleChangeText = (text) => {
//     // Remove non-numeric characters except decimal point
//     const cleaned = text.replace(/[^0-9.]/g, '');
    
//     // Ensure only one decimal point
//     const parts = cleaned.split('.');
//     const formatted = parts.length > 2 
//       ? `${parts[0]}.${parts.slice(1).join('')}` 
//       : cleaned;
    
//     onChangeText(formatted);

//     // Clear error when user starts typing
//     if (localError) {
//       setLocalError(null);
//     }
//   };

//   const handleBlur = () => {
//     setIsFocused(false);
    
//     // Validate on blur
//     if (value) {
//       const validation = ValidationUtils.validateAmount(value, minAmount, maxAmount);
//       if (!validation.isValid) {
//         setLocalError(validation.error);
//       }

//       // Check balance if provided
//       if (showBalance && balance !== undefined) {
//         const balanceValidation = ValidationUtils.validateWalletBalance(balance, value);
//         if (!balanceValidation.isValid) {
//           setLocalError(balanceValidation.error);
//         }
//       }
//     }
//   };

//   const displayError = error || localError;
//   const numValue = Number(value);
//   const isValid = !displayError && numValue > 0;

//   return (
//     <View style={styles.container}>
//       <View style={styles.labelRow}>
//         {label && (
//           <Text style={[styles.label, { color: themeColors.heading }]}>
//             {label}
//           </Text>
//         )}
//         {showBalance && balance !== undefined && (
//           <Text style={[styles.balanceText, { color: themeColors.subheading }]}>
//             Balance: {FormatUtils.formatCurrency(balance, 'NGN')}
//           </Text>
//         )}
//       </View>
      
//       <View
//         style={[
//           styles.inputContainer,
//           { 
//             backgroundColor: themeColors.card,
//             borderColor: displayError 
//               ? themeColors.destructive 
//               : isFocused 
//               ? themeColors.primary 
//               : themeColors.border,
//           },
//         ]}
//       >
//         <Text style={[styles.currencySymbol, { color: themeColors.heading }]}>
//           {currencySymbol}
//         </Text>
        
//         <TextInput
//           style={[styles.input, { color: themeColors.heading }]}
//           placeholder={placeholder}
//           placeholderTextColor={themeColors.subtext}
//           keyboardType="decimal-pad"
//           value={value}
//           onChangeText={handleChangeText}
//           onFocus={() => setIsFocused(true)}
//           onBlur={handleBlur}
//           editable={editable}
//           accessibilityLabel={label}
//           accessibilityHint="Enter the amount"
//         />

//         {isValid && (
//           <Text style={[styles.formattedAmount, { color: themeColors.subheading }]}>
//             {FormatUtils.formatCurrency(numValue, 'NGN')}
//           </Text>
//         )}
//       </View>

//       {displayError && (
//         <Text style={[styles.errorText, { color: themeColors.destructive }]}>
//           {displayError}
//         </Text>
//       )}

//       {minAmount && maxAmount && !displayError && (
//         <Text style={[styles.hintText, { color: themeColors.subtext }]}>
//           Min: {FormatUtils.formatCurrency(minAmount, 'NGN')} • Max: {FormatUtils.formatCurrency(maxAmount, 'NGN')}
//         </Text>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     marginVertical: 8,
//   },
//   labelRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 6,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   balanceText: {
//     fontSize: 12,
//     fontWeight: '500',
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderRadius: 12,
//     borderWidth: 1.5,
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//   },
//   currencySymbol: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginRight: 8,
//   },
//   input: {
//     flex: 1,
//     fontSize: 16,
//     paddingVertical: 12,
//   },
//   formattedAmount: {
//     fontSize: 12,
//     marginLeft: 8,
//   },
//   errorText: {
//     fontSize: 12,
//     marginTop: 4,
//     marginLeft: 4,
//   },
//   hintText: {
//     fontSize: 11,
//     marginTop: 4,
//     marginLeft: 4,
//   },
// });