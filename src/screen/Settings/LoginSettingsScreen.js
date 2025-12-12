import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { ScreenHeader } from 'component/SHARED';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Login Settings Option Component
 */
const LoginOption = ({ 
  icon, 
  title, 
  description, 
  onPress, 
  themeColors,
  iconColor,
}) => (
  <TouchableOpacity
    style={[styles.optionCard, { backgroundColor: themeColors.card }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.optionIcon, { backgroundColor: `${iconColor}20` }]}>
      <Ionicons name={icon} size={32} color={iconColor} />
    </View>
    <Text style={[styles.optionTitle, { color: themeColors.heading }]}>
      {title}
    </Text>
    <Text style={[styles.optionDescription, { color: themeColors.subheading }]}>
      {description}
    </Text>
    <View style={[styles.optionButton, { backgroundColor: themeColors.primary }]}>
      <Text style={styles.optionButtonText}>Proceed</Text>
      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
    </View>
  </TouchableOpacity>
);

/**
 * Toggle Setting Component
 */
const ToggleSetting = ({ 
  icon, 
  title, 
  description, 
  value, 
  onToggle, 
  themeColors,
  iconColor,
}) => (
  <View style={[styles.toggleCard, { backgroundColor: themeColors.card }]}>
    <View style={styles.toggleLeft}>
      <View style={[styles.toggleIcon, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.toggleContent}>
        <Text style={[styles.toggleTitle, { color: themeColors.heading }]}>
          {title}
        </Text>
        <Text style={[styles.toggleDescription, { color: themeColors.subheading }]}>
          {description}
        </Text>
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: themeColors.border, true: `${themeColors.primary}80` }}
      thumbColor={value ? themeColors.primary : '#f4f3f4'}
    />
  </View>
);

/**
 * Login Settings Screen
 */
export default function LoginSettingsScreen({ navigation }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const [autoLogin, setAutoLogin] = React.useState(false);
  const [biometricLogin, setBiometricLogin] = React.useState(false);

  // Load settings on mount
  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [autoLoginValue, biometricValue] = await Promise.all([
        AsyncStorage.getItem('autoLogin'),
        AsyncStorage.getItem('biometricLogin'),
      ]);
      
      setAutoLogin(autoLoginValue === 'true');
      setBiometricLogin(biometricValue === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleAutoLoginToggle = async (value) => {
    try {
      await AsyncStorage.setItem('autoLogin', String(value));
      setAutoLogin(value);
    } catch (error) {
      console.error('Error saving auto-login setting:', error);
    }
  };

  const handleBiometricToggle = async (value) => {
    try {
      await AsyncStorage.setItem('biometricLogin', String(value));
      setBiometricLogin(value);
    } catch (error) {
      console.error('Error saving biometric setting:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />
      
      <ScreenHeader
        title="Login Settings"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: `${themeColors.primary}15` }]}>
          <Ionicons name="information-circle" size={24} color={themeColors.primary} />
          <Text style={[styles.infoText, { color: themeColors.heading }]}>
            Manage your login PIN and security preferences
          </Text>
        </View>

        {/* PIN Management */}
        <Text style={[styles.sectionTitle, { color: themeColors.subheading }]}>
          PIN MANAGEMENT
        </Text>

        <LoginOption
          icon="keypad-outline"
          title="Change Login PIN"
          description="Update your 6-digit login PIN"
          onPress={() => navigation.navigate('ChangeLogin')}
          themeColors={themeColors}
          iconColor="#4CAF50"
        />

        {/* Login Preferences */}
        <Text style={[styles.sectionTitle, { color: themeColors.subheading }]}>
          LOGIN PREFERENCES
        </Text>

        <ToggleSetting
          icon="log-in-outline"
          title="Auto Login"
          description="Stay logged in automatically"
          value={autoLogin}
          onToggle={handleAutoLoginToggle}
          themeColors={themeColors}
          iconColor="#1E40AF"
        />

        <ToggleSetting
          icon="finger-print-outline"
          title="Biometric Login"
          description="Use fingerprint or face ID"
          value={biometricLogin}
          onToggle={handleBiometricToggle}
          themeColors={themeColors}
          iconColor="#7C3AED"
        />

        {/* Security Tips */}
        <View style={[styles.tipsCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.tipsTitle, { color: themeColors.heading }]}>
            Security Tips
          </Text>
          
          <View style={styles.tipItem}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={[styles.tipText, { color: themeColors.subheading }]}>
              Never share your login PIN with anyone
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={[styles.tipText, { color: themeColors.subheading }]}>
              Use a unique PIN different from your transaction PIN
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={[styles.tipText, { color: themeColors.subheading }]}>
              Change your PIN regularly for better security
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={[styles.tipText, { color: themeColors.subheading }]}>
              Enable biometric login for faster and secure access
            </Text>
          </View>
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
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // ========================================
  // INFO BANNER
  // ========================================
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  // ========================================
  // SECTION TITLE
  // ========================================
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 16,
    textTransform: 'uppercase',
  },

  // ========================================
  // OPTIONS
  // ========================================
  optionCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  optionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  optionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // ========================================
  // TOGGLE SETTINGS
  // ========================================
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  toggleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  toggleContent: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  // ========================================
  // SECURITY TIPS
  // ========================================
  tipsCard: {
    padding: 20,
    borderRadius: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});