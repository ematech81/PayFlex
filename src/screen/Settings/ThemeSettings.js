// screens/ThemeSettingsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'context/ThemeContext';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { ScreenHeader } from 'component/SHARED';

/**
 * Theme Option Card Component
 */
const ThemeOptionCard = ({ 
  icon, 
  title, 
  description, 
  isSelected, 
  onPress, 
  themeColors,
  preview,
}) => (
  <TouchableOpacity
    style={[
      styles.optionCard,
      {
        backgroundColor: themeColors.card,
        borderColor: isSelected ? themeColors.primary : themeColors.border,
        borderWidth: isSelected ? 2 : 1,
      },
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.optionHeader}>
      <View style={styles.optionLeft}>
        <View style={[
          styles.optionIcon,
          { 
            backgroundColor: isSelected 
              ? `${themeColors.primary}20` 
              : `${themeColors.subtext}10` 
          }
        ]}>
          <Ionicons 
            name={icon} 
            size={28} 
            color={isSelected ? themeColors.primary : themeColors.subtext} 
          />
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, { color: themeColors.heading }]}>
            {title}
          </Text>
          <Text style={[styles.optionDescription, { color: themeColors.subheading }]}>
            {description}
          </Text>
        </View>
      </View>
      {isSelected && (
        <View style={[styles.selectedBadge, { backgroundColor: themeColors.primary }]}>
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
        </View>
      )}
    </View>

    {/* Theme Preview */}
    {preview && (
      <View style={styles.previewContainer}>
        <View style={styles.preview}>
          {preview}
        </View>
      </View>
    )}
  </TouchableOpacity>
);

/**
 * Theme Preview Component
 */
const ThemePreview = ({ mode }) => {
  const previewColors = mode === 'dark' ? colors.dark : colors.light;
  
  return (
    <View style={[styles.previewBox, { backgroundColor: previewColors.background }]}>
      <View style={[styles.previewCard, { backgroundColor: previewColors.card }]}>
        <View style={[styles.previewHeader, { backgroundColor: previewColors.primary }]} />
        <View style={styles.previewContent}>
          <View style={[styles.previewLine, { backgroundColor: previewColors.heading }]} />
          <View style={[styles.previewLine, { backgroundColor: previewColors.subheading, width: '70%' }]} />
          <View style={[styles.previewLine, { backgroundColor: previewColors.subtext, width: '50%' }]} />
        </View>
      </View>
    </View>
  );
};

/**
 * Theme Settings Screen
 */
export default function ThemeSettings({ navigation }) {
  const { themeMode, isDarkMode, setTheme } = useTheme();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const handleThemeChange = (mode) => {
    setTheme(mode);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />
      
      <ScreenHeader
        title="Theme Settings"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Theme Info */}
        <View style={[styles.infoCard, { backgroundColor: `${themeColors.primary}15` }]}>
          <Ionicons name="information-circle" size={24} color={themeColors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: themeColors.heading }]}>
              Current Theme
            </Text>
            <Text style={[styles.infoText, { color: themeColors.subheading }]}>
              {themeMode === 'system' 
                ? `Following system settings (${isDarkMode ? 'Dark' : 'Light'})` 
                : themeMode === 'dark' 
                ? 'Dark mode enabled' 
                : 'Light mode enabled'
              }
            </Text>
          </View>
        </View>

        {/* Theme Options */}
        <View style={styles.optionsContainer}>
          {/* Light Mode */}
          <ThemeOptionCard
            icon="sunny"
            title="Light Mode"
            description="Use light theme at all times"
            isSelected={themeMode === 'light'}
            onPress={() => handleThemeChange('light')}
            themeColors={themeColors}
            preview={<ThemePreview mode="light" />}
          />

          {/* Dark Mode */}
          <ThemeOptionCard
            icon="moon"
            title="Dark Mode"
            description="Use dark theme at all times"
            isSelected={themeMode === 'dark'}
            onPress={() => handleThemeChange('dark')}
            themeColors={themeColors}
            preview={<ThemePreview mode="dark" />}
          />

          {/* System Default */}
          <ThemeOptionCard
            icon="phone-portrait"
            title="System Default"
            description="Follow device theme settings"
            isSelected={themeMode === 'system'}
            onPress={() => handleThemeChange('system')}
            themeColors={themeColors}
          />
        </View>

        {/* Benefits Section */}
        <View style={[styles.benefitsCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.benefitsTitle, { color: themeColors.heading }]}>
            Dark Mode Benefits
          </Text>
          
          <View style={styles.benefitItem}>
            <Ionicons name="eye-outline" size={20} color="#10B981" />
            <Text style={[styles.benefitText, { color: themeColors.subheading }]}>
              Reduces eye strain in low-light conditions
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="battery-charging-outline" size={20} color="#F59E0B" />
            <Text style={[styles.benefitText, { color: themeColors.subheading }]}>
              Saves battery life on OLED screens
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="moon-outline" size={20} color="#6366F1" />
            <Text style={[styles.benefitText, { color: themeColors.subheading }]}>
              Better viewing experience at night
            </Text>
          </View>
        </View>

        {/* Note */}
        <View style={[styles.noteCard, { backgroundColor: themeColors.card }]}>
          <Ionicons name="bulb-outline" size={18} color={themeColors.primary} />
          <Text style={[styles.noteText, { color: themeColors.subheading }]}>
            <Text style={{ fontWeight: '700' }}>Tip: </Text>
            Choose "System Default" to automatically switch between light and dark mode 
            based on your device settings.
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
    padding: 16,
    paddingBottom: 40,
  },

  // ========================================
  // INFO CARD
  // ========================================
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },

  // ========================================
  // THEME OPTIONS
  // ========================================
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  selectedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ========================================
  // THEME PREVIEW
  // ========================================
  previewContainer: {
    marginTop: 12,
  },
  preview: {
    alignItems: 'center',
  },
  previewBox: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  previewCard: {
    width: '90%',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewHeader: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  previewContent: {
    gap: 8,
  },
  previewLine: {
    height: 6,
    borderRadius: 3,
  },

  // ========================================
  // BENEFITS
  // ========================================
  benefitsCard: {
    padding: 20,
    borderRadius: 16,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  // ========================================
  // NOTE CARD
  // ========================================
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});