
// components/shared/cards/PromoCard.jsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';

/**
 * Promo Card Component
 * Reusable promotional banner
 */

export default function PromoCard({
  title,
  subtitle,
  buttonText,
  onPress,
  gradientColors,
}) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const defaultGradient = [themeColors.neutral, themeColors.primary];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors || defaultGradient}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: themeColors.heading }]}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.subheading }]}>
            {subtitle}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: themeColors.card }]}
          onPress={onPress}
          activeOpacity={0.8}
          accessibilityLabel={buttonText}
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, { color: themeColors.primary }]}>
            {buttonText}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  gradient: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
},
content: {
  flex: 1,
  marginRight: 12,
},
title: {
  fontSize: 16,
  fontWeight: '800',
  marginBottom: 4,
},
subtitle: {
  fontSize: 13,
  lineHeight: 18,
},
button: {
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
buttonText: {
  fontWeight: '700',
  fontSize: 14,
},
});