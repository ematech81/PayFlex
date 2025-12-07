import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { getBeneficiaries, saveBeneficiary, deleteBeneficiary, updateBeneficiaryUsage } from 'utility/beneficiaryStorage';

/**
 * Network Detection Logic
 * Detects network provider from Nigerian phone number prefix
 */
const detectNetwork = (phoneNumber) => {
  if (!phoneNumber || phoneNumber.length < 4) return null;

  const prefix = phoneNumber.substring(0, 4);

  // MTN prefixes
  const mtnPrefixes = ['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916'];
  // Airtel prefixes
  const airtelPrefixes = ['0802', '0808', '0708', '0812', '0701', '0902', '0907', '0901', '0912'];
  // Glo prefixes
  const gloPrefixes = ['0805', '0807', '0705', '0815', '0811', '0905', '0915'];
  // 9mobile prefixes
  const etisalatPrefixes = ['0809', '0818', '0817', '0909', '0908'];

  if (mtnPrefixes.includes(prefix)) return 'mtn';
  if (airtelPrefixes.includes(prefix)) return 'airtel';
  if (gloPrefixes.includes(prefix)) return 'glo';
  if (etisalatPrefixes.includes(prefix)) return '9mobile';

  return null;
};

/**
 * Validate Nigerian Phone Number
 */
const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return { isValid: false, message: '' };
  
  const cleaned = phoneNumber.replace(/\s/g, '');
  
  if (cleaned.length < 11) {
    return { isValid: false, message: '' };
  }
  
  if (cleaned.length === 11 && /^0[7-9][0-1]\d{8}$/.test(cleaned)) {
    return { isValid: true, message: 'Valid phone number' };
  }
  
  return { isValid: false, message: 'Invalid phone number format' };
};

/**
 * Beneficiary Input Component
 * Smart input with dropdown for saved beneficiaries + network detection
 */
export default function BeneficiaryInput({
  value,
  onChangeText,
  onBeneficiarySelect,
  onNetworkDetected, // ✅ NEW: Callback when network is detected
  serviceType,
  placeholder,
  label,
  error,
  keyboardType = 'default',
  maxLength,
  autoCapitalize = 'none',
  displayField,
  identifierField = 'phoneNumber',
  secondaryField,
  icon = 'call-outline',
  enableNetworkDetection = false, // ✅ NEW: Enable network detection for phone inputs
  enableValidation = false, // ✅ NEW: Enable validation feedback
}) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [detectedNetwork, setDetectedNetwork] = useState(null);
  const [validation, setValidation] = useState({ isValid: false, message: '' });
  const dropdownHeight = useRef(new Animated.Value(0)).current;

  // Load beneficiaries on mount
  useEffect(() => {
    loadBeneficiaries();
  }, [serviceType]);

  // ✅ Network detection effect
  useEffect(() => {
    if (enableNetworkDetection && value) {
      const network = detectNetwork(value);
      setDetectedNetwork(network);
      
      if (network && onNetworkDetected) {
        onNetworkDetected(network);
      }
    }
  }, [value, enableNetworkDetection, onNetworkDetected]);

  // ✅ Validation effect
  useEffect(() => {
    if (enableValidation && value) {
      const result = validatePhoneNumber(value);
      setValidation(result);
    } else {
      setValidation({ isValid: false, message: '' });
    }
  }, [value, enableValidation]);

  const loadBeneficiaries = async () => {
    const data = await getBeneficiaries(serviceType);
    setBeneficiaries(data);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (beneficiaries.length > 0) {
      openDropdown();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setTimeout(() => {
      if (!showDropdown) {
        closeDropdown();
      }
    }, 200);
  };

  const openDropdown = () => {
    setShowDropdown(true);
    Animated.timing(dropdownHeight, {
      toValue: Math.min(beneficiaries.length * 70, 280),
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const closeDropdown = () => {
    Animated.timing(dropdownHeight, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => setShowDropdown(false));
  };

  const toggleDropdown = () => {
    if (beneficiaries.length === 0) {
      return;
    }
    showDropdown ? closeDropdown() : openDropdown();
  };

  const handleSelectBeneficiary = async (beneficiary) => {
    const identifier = beneficiary[identifierField];
    
    onChangeText(identifier);
    
    if (onBeneficiarySelect) {
      onBeneficiarySelect(beneficiary);
    }

    // ✅ Trigger network detection for selected beneficiary
    if (enableNetworkDetection && beneficiary.network && onNetworkDetected) {
      onNetworkDetected(beneficiary.network);
    }

    await updateBeneficiaryUsage(serviceType, identifier);
    
    closeDropdown();
  };

  const handleDeleteBeneficiary = async (beneficiary) => {
    const identifier = beneficiary[identifierField];
    await deleteBeneficiary(serviceType, identifier);
    loadBeneficiaries();
  };

  const renderBeneficiary = ({ item }) => {
    const identifier = item[identifierField];
    const secondary = secondaryField ? item[secondaryField] : null;
    const displayText = displayField ? displayField(item) : identifier;

    return (
      <TouchableOpacity
        style={[styles.beneficiaryItem, { backgroundColor: themeColors.card }]}
        onPress={() => handleSelectBeneficiary(item)}
        activeOpacity={0.7}
      >
        <View style={styles.beneficiaryLeft}>
          <View style={[styles.iconCircle, { backgroundColor: `${themeColors.primary}20` }]}>
            <Ionicons name={icon} size={20} color={themeColors.primary} />
          </View>
          <View style={styles.beneficiaryInfo}>
            <Text style={[styles.beneficiaryText, { color: themeColors.heading }]}>
              {displayText}
            </Text>
            {secondary && (
              <Text style={[styles.beneficiarySecondary, { color: themeColors.subheading }]}>
                {secondary}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteBeneficiary(item)}
          style={styles.deleteButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color={themeColors.destructive} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: themeColors.heading }]}>
          {label}
        </Text>
      )}

      <View style={styles.inputContainer}>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: themeColors.background,
              borderColor: error
                ? themeColors.destructive
                : validation.isValid
                ? '#4CAF50'
                : isFocused
                ? themeColors.primary
                : themeColors.border,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={
              validation.isValid
                ? '#4CAF50'
                : isFocused
                ? themeColors.primary
                : themeColors.subtext
            }
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, { color: themeColors.heading }]}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor={themeColors.subtext}
            keyboardType={keyboardType}
            maxLength={maxLength}
            autoCapitalize={autoCapitalize}
          />
          {validation.isValid && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color="#4CAF50"
              style={styles.validationIcon}
            />
          )}
          {beneficiaries.length > 0 && (
            <TouchableOpacity onPress={toggleDropdown} style={styles.dropdownButton}>
              <Ionicons
                name={showDropdown ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={themeColors.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Dropdown List */}
        {showDropdown && beneficiaries.length > 0 && (
          <Animated.View
            style={[
              styles.dropdown,
              {
                height: dropdownHeight,
                backgroundColor: themeColors.background,
                borderColor: themeColors.border,
              },
            ]}
          >
            <FlatList
              data={beneficiaries}
              renderItem={renderBeneficiary}
              keyExtractor={(item, index) => `${item[identifierField]}-${index}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.dropdownContent}
            />
          </Animated.View>
        )}
      </View>

      {/* ✅ Validation Message */}
      {!error && validation.message && (
        <Text style={[styles.validationText, { color: validation.isValid ? '#4CAF50' : themeColors.destructive }]}>
          {validation.message}
        </Text>
      )}

      {/* Error Message */}
      {error && (
        <Text style={[styles.errorText, { color: themeColors.destructive }]}>
          {error}
        </Text>
      )}

      {/* Hint Text */}
      {beneficiaries.length === 0 && value && !error && (
        <Text style={[styles.hintText, { color: themeColors.subtext }]}>
          This will be saved for quick access next time
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
  inputContainer: {
    position: 'relative',
    zIndex: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  validationIcon: {
    marginRight: 8,
  },
  dropdownButton: {
    padding: 4,
  },

  // Dropdown styles
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  dropdownContent: {
    paddingVertical: 4,
  },
  beneficiaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: 4,
    marginVertical: 2,
    borderRadius: 8,
  },
  beneficiaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  beneficiaryInfo: {
    flex: 1,
  },
  beneficiaryText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  beneficiarySecondary: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },

  // Messages
  validationText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic',
  },
});