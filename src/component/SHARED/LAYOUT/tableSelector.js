
// components/shared/layout/TabSelector.jsx
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';


/**
 * Tab Selector Component
 * Reusable tab switcher
 */

export default function TabSelector({
  tabs,
  selectedTab,
  onTabChange,
  style,
}) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeColors.card },
        style,
      ]}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.value}
          style={[
            styles.tab,
            selectedTab === tab.value && {
              backgroundColor: themeColors.primary,
            },
          ]}
          onPress={() => onTabChange(tab.value)}
          disabled={tab.disabled}
          accessibilityLabel={tab.label}
          accessibilityRole="tab"
          accessibilityState={{
            selected: selectedTab === tab.value,
            disabled: tab.disabled,
          }}
        >
          <Text
            style={[
              styles.tabText,
              { color: themeColors.heading },
              selectedTab === tab.value && { color: themeColors.card },
              tab.disabled && { color: themeColors.subtext },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontWeight: '500',
    fontSize: 15,
  },
});