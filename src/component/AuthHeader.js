
// src/components/AuthHeader.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';

export default function AuthHeader({ title, subtitle, showBack, onBack }) {
  const isDark = useThem();
  const theme = isDark ? colors.dark : colors.light;

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      {showBack && (
        <Ionicons
          name="arrow-back"
          size={28}
          color={theme.card}
          style={styles.backIcon}
          onPress={onBack}
        />
      )}
      <View style={styles.logo}>
        <View style={[styles.circle, { backgroundColor: theme.card }]}>
          <Ionicons name="wallet" size={36} color={theme.primary} />
        </View>
        <Text style={[styles.appName, { color: theme.card }]}>PayFlex</Text>
        {title && <Text style={[styles.title, { color: theme.card }]}>{title}</Text>}
        {subtitle && <Text style={[styles.subtitle, { color: theme.card }]}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 50, paddingBottom: 30, alignItems: 'center' },
  backIcon: { position: 'absolute', left: 20, top: 55 },
  logo: { alignItems: 'center' },
  circle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  appName: { fontSize: 26, fontWeight: 'bold', marginBottom: 6 },
  title: { fontSize: 30, fontWeight: 'bold', marginBottom: 6 },
  subtitle: { fontSize: 16, opacity: 0.9 },
});