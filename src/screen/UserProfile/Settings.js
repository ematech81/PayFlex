import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { ScreenHeader } from 'component/SHARED';

/**
 * Settings Menu Item Component
 */
const SettingsMenuItem = ({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  themeColors,
  iconColor,
  showChevron = true,
  rightElement,
}) => (
  <TouchableOpacity
    style={[styles.menuItem, { backgroundColor: themeColors.card }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.menuItemLeft}>
      <View style={[
        styles.iconContainer, 
        { backgroundColor: iconColor ? `${iconColor}20` : `${themeColors.primary}20` }
      ]}>
        <Ionicons 
          name={icon} 
          size={22} 
          color={iconColor || themeColors.primary} 
        />
      </View>
      <View style={styles.menuItemContent}>
        <Text style={[styles.menuItemTitle, { color: themeColors.heading }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.menuItemSubtitle, { color: themeColors.subheading }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
    <View style={styles.menuItemRight}>
      {rightElement}
      {showChevron && (
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={themeColors.subtext} 
        />
      )}
    </View>
  </TouchableOpacity>
);

/**
 * Section Header Component
 */
const SectionHeader = ({ title, themeColors }) => (
  <Text style={[styles.sectionHeader, { color: themeColors.subheading }]}>
    {title}
  </Text>
);

/**
 * Main Settings Screen
 */
export default function SettingsScreen({ navigation }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />
      
      <ScreenHeader
        title="Settings"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Security Settings */}
        <SectionHeader title="SECURITY" themeColors={themeColors} />
        
        <SettingsMenuItem
          icon="lock-closed-outline"
          title="Payment Settings"
          subtitle="Change or reset transaction PIN"
          onPress={() => navigation.navigate('PaymentSettings')}
          themeColors={themeColors}
          iconColor="#4CAF50"
        />

        <SettingsMenuItem
          icon="key-outline"
          title="Login Settings"
          subtitle="Password, auto-login & security"
          onPress={() => navigation.navigate('LoginSettings')}
          themeColors={themeColors}
          iconColor="#1E40AF"
        />

        <SettingsMenuItem
          icon="shield-checkmark-outline"
          title="Verify NIN"
          subtitle="Verify your identity"
          onPress={() => navigation.navigate('VerifyNIN')}
          themeColors={themeColors}
          iconColor="#7C3AED"
        />

        {/* App Preferences */}
        <SectionHeader title="PREFERENCES" themeColors={themeColors} />
        
        <SettingsMenuItem
          icon="moon-outline"
          title="Dark Mode"
          subtitle="Switch between light and dark theme"
          onPress={() => navigation.navigate('ThemeSettings')}
          themeColors={themeColors}
          iconColor="#F59E0B"
        />

        <SettingsMenuItem
          icon="language-outline"
          title="Language"
          subtitle="English (Default)"
          onPress={() => navigation.navigate('LanguageSettings')}
          themeColors={themeColors}
          iconColor="#10B981"
        />

        <SettingsMenuItem
          icon="notifications-outline"
          title="Notifications"
          subtitle="Manage notification preferences"
          onPress={() => navigation.navigate('NotificationSettings')}
          themeColors={themeColors}
          iconColor="#8B5CF6"
        />

        {/* Privacy Settings */}
        <SectionHeader title="PRIVACY" themeColors={themeColors} />
        
        <SettingsMenuItem
          icon="eye-outline"
          title="Privacy Settings"
          subtitle="Control your data and privacy"
          onPress={() => navigation.navigate('PrivacySettings')}
          themeColors={themeColors}
          iconColor="#6B7280"
        />

        <SettingsMenuItem
          icon="finger-print-outline"
          title="Biometric Login"
          subtitle="Use fingerprint or face ID"
          onPress={() => navigation.navigate('BiometricSettings')}
          themeColors={themeColors}
          iconColor="#EC4899"
        />

        {/* Data Management */}
        <SectionHeader title="DATA MANAGEMENT" themeColors={themeColors} />
        
        <SettingsMenuItem
          icon="cloud-download-outline"
          title="Download Data"
          subtitle="Export your transaction history"
          onPress={() => navigation.navigate('DownloadData')}
          themeColors={themeColors}
          iconColor="#06B6D4"
        />

        <SettingsMenuItem
          icon="trash-outline"
          title="Clear Cache"
          subtitle="Free up storage space"
          onPress={() => navigation.navigate('ClearCache')}
          themeColors={themeColors}
          iconColor="#FF6B6B"
        />

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: themeColors.subtext }]}>
            PayFlex v1.0.0
          </Text>
          <Text style={[styles.appInfoText, { color: themeColors.subtext }]}>
            © 2025 PayFlex. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ========================================
  // SECTION HEADER
  // ========================================
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: 16,
    marginTop: 24,
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  // ========================================
  // MENU ITEMS
  // ========================================
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // ========================================
  // APP INFO
  // ========================================
  appInfo: {
    alignItems: 'center',
    marginTop: 32,
    gap: 4,
  },
  appInfoText: {
    fontSize: 12,
  },
});