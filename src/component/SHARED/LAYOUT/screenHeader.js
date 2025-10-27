
// components/shared/layout/ScreenHeader.jsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';


/**
 * Screen Header Component
 * Reusable header with back button and optional right action
 */

export default function ScreenHeader({
  title,
  onBackPress,
  rightComponent,
  rightText,
  onRightPress,
  showBack = true,
}) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        {showBack && onBackPress && (
          <TouchableOpacity
            onPress={onBackPress}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={themeColors.heading} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.title, { color: themeColors.heading }]}>
        {title}
      </Text>

      <View style={styles.rightContainer}>
        {rightComponent || (
          rightText && onRightPress ? (
            <TouchableOpacity
              onPress={onRightPress}
              accessibilityLabel={rightText}
              accessibilityRole="button"
            >
              <Text style={[styles.rightText, { color: themeColors.primary }]}>
                {rightText}
              </Text>
            </TouchableOpacity>
          ) : null
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 4,
  },
  leftContainer: {
    width: 100,
    alignItems: 'flex-start',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  rightContainer: {
    width: 100,
    alignItems: 'flex-end',
  },
  rightText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});