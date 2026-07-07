import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const FAQS = [
  {
    q: 'How do I fund my wallet?',
    a: 'Tap "Fund Wallet" on the home screen or profile page. You can top up using your debit card via Korapay. Funds reflect instantly after successful payment.',
  },
  {
    q: 'How long does airtime purchase take?',
    a: 'Airtime is delivered almost instantly after a successful payment — usually within a few seconds.',
  },
  {
    q: 'What should I do if my transaction is debited but the service was not delivered?',
    a: 'Check your transaction history for the status. If it shows "failed", your balance is typically auto-refunded within minutes. Contact support if the issue persists after 30 minutes.',
  },
  {
    q: 'How do I reset my transaction PIN?',
    a: 'Go to Settings → Payment Settings. You can change your 4-digit transaction PIN by entering your current PIN and a new one.',
  },
  {
    q: 'How do I reset my login PIN?',
    a: 'On the login screen, tap "Forgot PIN?" and follow the OTP verification steps sent to your registered phone number.',
  },
  {
    q: 'What is the Airtime to Cash service?',
    a: 'Airtime to Cash lets you convert excess airtime into wallet balance. A small processing fee applies. Funds are credited to your wallet within a few minutes.',
  },
  {
    q: 'How does the Referral Program work?',
    a: 'Share your unique referral code with friends. When they sign up and make their first transaction, you earn a referral bonus credited directly to your wallet.',
  },
  {
    q: 'Is my money safe in the PayFlex wallet?',
    a: 'Yes. Your wallet balance is secured and backed by licensed payment infrastructure. We use end-to-end encryption and require PIN verification for all transactions.',
  },
];

const CONTACT = [
  { icon: 'mail-outline', label: 'Email Support', value: 'support@techsphereapp.com', action: () => Linking.openURL('mailto:support@techsphereapp.com') },
  { icon: 'logo-whatsapp', label: 'WhatsApp', value: '', action: () => Linking.openURL('https://wa.me/2349011495230') },
];

function FAQItem({ item, themeColors }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(v => !v);
  };

  return (
    <TouchableOpacity
      style={[styles.faqItem, { backgroundColor: themeColors.card, borderColor: themeColors.border || '#F0F0F0' }]}
      onPress={toggle}
      activeOpacity={0.8}
    >
      <View style={styles.faqHeader}>
        <Text style={[styles.faqQ, { color: themeColors.heading, flex: 1, paddingRight: 8 }]}>{item.q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={themeColors.subheading} />
      </View>
      {open && (
        <Text style={[styles.faqA, { color: themeColors.subheading }]}>{item.a}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function HelpSupport({ navigation }) {
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
        <Text style={[styles.headerTitle, { color: themeColors.heading }]}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact options */}
        <Text style={[styles.sectionTitle, { color: themeColors.subheading }]}>CONTACT US</Text>
        <View style={styles.contactRow}>
          {CONTACT.map(c => (
            <TouchableOpacity
              key={c.label}
              style={[styles.contactCard, { backgroundColor: themeColors.card }]}
              onPress={c.action}
              activeOpacity={0.8}
            >
              <View style={[styles.contactIcon, { backgroundColor: `${themeColors.primary}15` }]}>
                <Ionicons name={c.icon} size={22} color={themeColors.primary} />
              </View>
              <Text style={[styles.contactLabel, { color: themeColors.heading }]}>{c.label}</Text>
              {!!c.value && <Text style={[styles.contactValue, { color: themeColors.subheading }]}>{c.value}</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Hours */}
        <View style={[styles.hoursCard, { backgroundColor: `${themeColors.primary}10` }]}>
          <Ionicons name="time-outline" size={18} color={themeColors.primary} />
          <Text style={[styles.hoursText, { color: themeColors.heading }]}>
            Support hours: Mon – Sat, 8 AM – 8 PM (WAT)
          </Text>
        </View>

        {/* FAQ */}
        <Text style={[styles.sectionTitle, { color: themeColors.subheading, marginTop: 24 }]}>
          FREQUENTLY ASKED QUESTIONS
        </Text>
        {FAQS.map((item, i) => (
          <FAQItem key={i} item={item} themeColors={themeColors} />
        ))}
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
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  contactRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  contactCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactLabel: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  contactValue: { fontSize: 11, textAlign: 'center' },
  hoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  hoursText: { fontSize: 13, flex: 1 },
  faqItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  faqHeader: { flexDirection: 'row', alignItems: 'center' },
  faqQ: { fontSize: 15, fontWeight: '600' },
  faqA: { fontSize: 14, lineHeight: 20, marginTop: 10 },
});
