import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '100';

const LINKS = [
  {
    icon: 'document-text-outline',
    label: 'Terms of Service',
    url: 'https://payflex-privacy.netlify.app/terms.html',
    iconColor: '#3498DB',
  },
  {
    icon: 'shield-checkmark-outline',
    label: 'Privacy Policy',
    url: 'https://payflex-privacy.netlify.app/privacy.html',
    iconColor: '#4CAF50',
  },
  {
    icon: 'megaphone-outline',
    label: 'What\'s New',
    url: 'https://payflex.app/changelog',
    iconColor: '#FF9800',
  },
];

function LinkRow({ item, themeColors }) {
  return (
    <TouchableOpacity
      style={[styles.linkRow, { backgroundColor: themeColors.card }]}
      onPress={() => Linking.openURL(item.url)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${item.iconColor}18` }]}>
        <Ionicons name={item.icon} size={20} color={item.iconColor} />
      </View>
      <Text style={[styles.linkLabel, { color: themeColors.heading }]}>{item.label}</Text>
      <Ionicons name="open-outline" size={16} color={themeColors.subheading} />
    </TouchableOpacity>
  );
}

export default function About({ navigation }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      <View style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border || '#E0E0E0', paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={themeColors.heading} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.heading }]}>About</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* App identity */}
        <View style={styles.appSection}>
          <Image
            source={require('../../../assets/appStoreIcon.jpg')}
            style={styles.appLogo}
          />
          <Text style={[styles.appName, { color: themeColors.heading }]}>PayFlex</Text>
          <Text style={[styles.appTagline, { color: themeColors.subheading }]}>
            Pay smarter. Live better.
          </Text>
          <View style={[styles.versionBadge, { backgroundColor: `${themeColors.primary}15` }]}>
            <Text style={[styles.versionText, { color: themeColors.primary }]}>
              Version {APP_VERSION} (Build {BUILD_NUMBER})
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={[styles.descCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.descText, { color: themeColors.subheading }]}>
            PayFlex is a fast, secure, and convenient way to pay bills, buy airtime and data,
            pay for TV subscriptions, electricity, and more — all from one app. Your wallet,
            your rules.
          </Text>
        </View>

        {/* Links */}
        <Text style={[styles.sectionTitle, { color: themeColors.subheading }]}>LEGAL</Text>
        {LINKS.map(item => (
          <LinkRow key={item.label} item={item} themeColors={themeColors} />
        ))}

        <Text style={[styles.copyright, { color: themeColors.subtext }]}>
          © 2025 PayFlex. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 },
  appSection: { alignItems: 'center', marginBottom: 28 },
  appLogo: {
    width: 90,
    height: 90,
    borderRadius: 20,
    marginBottom: 12,
  },
  appName: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  appTagline: { fontSize: 14, marginBottom: 12 },
  versionBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  versionText: { fontSize: 13, fontWeight: '600' },
  descCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  descText: { fontSize: 14, lineHeight: 22 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  copyright: { fontSize: 12, textAlign: 'center', lineHeight: 20, marginTop: 24 },
});
