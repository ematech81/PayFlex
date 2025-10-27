
// components/shared/providers/ProviderSelector.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';


/**
 * Provider Selector Component
 * Reusable dropdown for selecting service providers
 */

export default function ProviderSelector({
  providers,
  value,
  onChange,
  placeholder = 'Select Provider',
  label,
  error,
  disabled = false,
  showIcon = true,
}) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [isFocused, setIsFocused] = useState(false);

  const selectedProvider = providers.find((p) => p.value === value);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: themeColors.heading }]}>
          {label}
        </Text>
      )}
      
      <View
        style={[
          styles.dropdownContainer,
          {
            backgroundColor: themeColors.card,
            borderColor: error 
              ? themeColors.destructive 
              : isFocused 
              ? themeColors.primary 
              : themeColors.border,
          },
        ]}
      >
        <Dropdown
          style={styles.dropdown}
          data={providers}
          labelField="label"
          valueField="value"
          value={value}
          placeholder={placeholder}
          placeholderStyle={{ color: themeColors.subtext, fontSize: 14 }}
          selectedTextStyle={{ color: themeColors.heading, fontSize: 14 }}
          onChange={(item) => onChange(item.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disable={disabled}
          renderLeftIcon={() => {
            if (!showIcon) return null;
            
            if (selectedProvider && selectedProvider.logo) {
              return (
                <Image
                  source={selectedProvider.logo}
                  style={styles.providerLogo}
                />
              );
            }
            
            return (
              <Ionicons
                name="business-outline"
                size={22}
                color={themeColors.subtext}
                style={styles.icon}
              />
            );
          }}
          renderItem={(item) => (
            <View style={styles.item}>
              {item.logo && (
                <Image
                  source={item.logo}
                  style={styles.itemLogo}
                />
              )}
              <Text style={[styles.itemText, { color: themeColors.heading }]}>
                {item.label}
              </Text>
            </View>
          )}
          accessibilityLabel={label || 'Provider selector'}
        />
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
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  dropdownContainer: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dropdown: {
    height: 50,
  },
  providerLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
    resizeMode: 'contain',
    borderRadius: 12,
  },
  icon: {
    marginRight: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  itemLogo: {
    width: 28,
    height: 28,
    marginRight: 12,
    resizeMode: 'contain',
    borderRadius: 14,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});