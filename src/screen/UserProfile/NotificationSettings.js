import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';

const PREFS_KEY = '@payflex_notification_prefs';

const NOTIFICATION_GROUPS = [
  {
    title: 'Transactions',
    items: [
      { key: 'txSuccess', label: 'Successful transactions', subtitle: 'When a payment completes', icon: 'checkmark-circle-outline', iconColor: '#4CAF50' },
      { key: 'txFailed', label: 'Failed transactions', subtitle: 'When a payment fails', icon: 'close-circle-outline', iconColor: '#FF6B6B' },
      { key: 'walletTopup', label: 'Wallet top-up', subtitle: 'When funds are added', icon: 'wallet-outline', iconColor: '#3498DB' },
    ],
  },
  {
    title: 'Account & Security',
    items: [
      { key: 'newDevice', label: 'New device login', subtitle: 'When your account is accessed from a new device', icon: 'phone-portrait-outline', iconColor: '#FF9800' },
      { key: 'pinChange', label: 'PIN changes', subtitle: 'When your PIN is updated', icon: 'lock-closed-outline', iconColor: '#9C27B0' },
      { key: 'profileUpdate', label: 'Profile updates', subtitle: 'When your profile info changes', icon: 'person-outline', iconColor: '#00BCD4' },
    ],
  },
  {
    title: 'Promotions',
    items: [
      { key: 'promos', label: 'Offers & promotions', subtitle: 'Deals and cashback opportunities', icon: 'gift-outline', iconColor: '#FFA500' },
      { key: 'referral', label: 'Referral rewards', subtitle: 'When a referral earns you a reward', icon: 'people-outline', iconColor: '#4CAF50' },
    ],
  },
];

const DEFAULT_PREFS = NOTIFICATION_GROUPS
  .flatMap(g => g.items)
  .reduce((acc, item) => ({ ...acc, [item.key]: true }), {});

export default function NotificationSettings({ navigation }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY).then(raw => {
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    });
  }, []);

  const toggle = async (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  };

  const allOn = Object.values(prefs).every(Boolean);
  const toggleAll = async () => {
    const val = !allOn;
    const updated = Object.keys(prefs).reduce((acc, k) => ({ ...acc, [k]: val }), {});
    setPrefs(updated);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      <View style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border || '#E0E0E0' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={themeColors.heading} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.heading }]}>Notifications</Text>
        <TouchableOpacity onPress={toggleAll}>
          <Text style={[styles.toggleAll, { color: themeColors.primary }]}>
            {allOn ? 'Mute all' : 'Enable all'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {NOTIFICATION_GROUPS.map(group => (
          <View key={group.title} style={styles.group}>
            <Text style={[styles.groupTitle, { color: themeColors.subheading }]}>{group.title.toUpperCase()}</Text>
            <View style={[styles.groupCard, { backgroundColor: themeColors.card }]}>
              {group.items.map((item, idx) => (
                <View
                  key={item.key}
                  style={[
                    styles.row,
                    idx < group.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: themeColors.border || '#F0F0F0' },
                  ]}
                >
                  <View style={[styles.iconWrap, { backgroundColor: `${item.iconColor}18` }]}>
                    <Ionicons name={item.icon} size={20} color={item.iconColor} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={[styles.rowLabel, { color: themeColors.heading }]}>{item.label}</Text>
                    <Text style={[styles.rowSub, { color: themeColors.subheading }]}>{item.subtitle}</Text>
                  </View>
                  <Switch
                    value={!!prefs[item.key]}
                    onValueChange={() => toggle(item.key)}
                    trackColor={{ false: '#D0D0D0', true: `${themeColors.primary}80` }}
                    thumbColor={prefs[item.key] ? themeColors.primary : '#F4F4F4'}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={[styles.note, { color: themeColors.subtext }]}>
          Push notification delivery depends on your device settings. Make sure PayFlex notifications are enabled in your phone settings.
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
  toggleAll: { fontSize: 14, fontWeight: '600' },
  content: { paddingVertical: 16, paddingBottom: 40 },
  group: { marginBottom: 24 },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: 16,
    marginBottom: 8,
  },
  groupCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  rowSub: { fontSize: 12 },
  note: { fontSize: 12, lineHeight: 18, marginHorizontal: 16, textAlign: 'center' },
});
