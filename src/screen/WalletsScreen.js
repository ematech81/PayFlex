import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { useWallet } from 'context/WalletContext';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { StatusBarComponent } from 'component/StatusBar';
import { STORAGE_KEYS } from 'utility/storageKeys';
import { PayStackApiIPAddress } from 'utility/apiIPAdress';

const TOPUP_URL  = `${PayStackApiIPAddress}/history`;
const CARD_COLOR = '#5C35C9'; // solid purple card

const QUICK_ACTIONS = [
  { label: 'Bills',        icon: 'receipt-outline',      screen: 'ElectricityPayment' },
  { label: 'Airtime',      icon: 'call-outline',          screen: 'Airtime' },
  { label: 'Data',         icon: 'wifi-outline',          screen: 'DataPurchase' },
  { label: 'Airtime-Cash', icon: 'swap-horizontal-outline', screen: 'Airtime-Cash' },
];

const TX_LABELS = {
  wallet_topup:       'Wallet Top-up',
  airtime:            'Airtime Recharge',
  data:               'Data Bundle',
  electricity:        'Electricity',
  tv:                 'TV Subscription',
  education:          'Exam Pin',
  referral_bonus:     'Referral Bonus',
  transport_booking:  'Bus Booking',
  airtime_conversion: 'Airtime to Cash',
  betting:            'Betting Wallet',
};

function TxRow({ tx, themeColors }) {
  const isCredit  = tx.type === 'wallet_topup' || tx.type === 'referral_bonus';
  const isSuccess = tx.status === 'success' || tx.status === 'completed';
  const label     = TX_LABELS[tx.type] || tx.type;
  const date      = tx.createdAt
    ? new Date(tx.createdAt).toLocaleDateString('en-US', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <View style={[styles.txRow, { borderBottomColor: themeColors.border }]}>
      <View style={[styles.txIconWrap, { backgroundColor: isCredit ? '#EAF4FF' : '#F3F0FF' }]}>
        <Ionicons
          name={isCredit ? 'arrow-down-outline' : 'arrow-up-outline'}
          size={20}
          color={isCredit ? '#1565C0' : CARD_COLOR}
        />
      </View>
      <View style={styles.txMid}>
        <Text style={[styles.txLabel, { color: themeColors.heading }]} numberOfLines={1}>{label}</Text>
        <Text style={[styles.txDate,  { color: themeColors.subheading }]}>{date}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: isCredit ? '#2E7D32' : themeColors.heading }]}>
          {isCredit ? '+' : '-'}{formatCurrency(tx.amount, 'NGN')}
        </Text>
        <View style={[
          styles.statusPill,
          { backgroundColor: isSuccess ? '#E8F5E9' : '#FFF3E0' },
        ]}>
          <Text style={[styles.statusText, { color: isSuccess ? '#2E7D32' : '#E65100' }]}>
            {isSuccess ? (isCredit ? 'RECEIVED' : 'SENT') : tx.status.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function WalletsScreen() {
  const navigation  = useNavigation();
  const insets      = useSafeAreaInsets();
  const isDarkMode  = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { wallet, refreshWallet } = useWallet();

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [topups, setTopups]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const user    = wallet?.user;
  const balance = Number(user?.walletBalance ?? 0);
  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'U';

  const fetchTopups = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!token) return;
      const res  = await fetch(TOPUP_URL, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setTopups(data.data?.transactions ?? []);
    } catch { /* silent fail */ }
  };

  const refreshWalletRef = useRef(refreshWallet);
  refreshWalletRef.current = refreshWallet;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        setLoading(true);
        await Promise.all([refreshWalletRef.current(), fetchTopups()]);
        if (active) setLoading(false);
      }
      load();
      return () => { active = false; };
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshWalletRef.current(), fetchTopups()]);
    setRefreshing(false);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: isDarkMode ? '#0f0f1a' : '#F5F6FA' }]}>
      <StatusBarComponent />

      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8, backgroundColor: isDarkMode ? '#0f0f1a' : '#F5F6FA' }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={[styles.appName, { color: themeColors.heading }]}>PayFlex</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="notifications-outline" size={24} color={themeColors.heading} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CARD_COLOR} colors={[CARD_COLOR]} />
        }
      >
        {/* ── Balance card ── */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardLabel}>TOTAL BALANCE</Text>
            <TouchableOpacity
              style={styles.cardIconBtn}
              onPress={() => setBalanceVisible(v => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#fff" size="large" style={{ marginVertical: 14 }} />
          ) : (
            <Text style={styles.cardBalance}>
              {balanceVisible ? formatCurrency(balance, 'NGN') : '₦ ••••••'}
            </Text>
          )}

          <View style={styles.cardBtns}>
            <TouchableOpacity
              style={styles.addMoneyBtn}
              onPress={() => navigation.navigate('FundWallet')}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={18} color={CARD_COLOR} />
              <Text style={[styles.addMoneyText, { color: CARD_COLOR }]}>Add Money</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.historyCardBtn}
              onPress={() => navigation.navigate('Orders')}
              activeOpacity={0.85}
            >
              <Ionicons name="time-outline" size={18} color="#fff" />
              <Text style={styles.historyCardText}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Quick actions ── */}
        <View style={[styles.quickRow, { backgroundColor: isDarkMode ? '#1a1a2e' : '#fff' }]}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.quickItem}
              onPress={() => navigation.navigate(a.screen)}
              activeOpacity={0.75}
            >
              <View style={styles.quickIconWrap}>
                <Ionicons name={a.icon} size={22} color={CARD_COLOR} />
              </View>
              <Text style={[styles.quickLabel, { color: themeColors.heading }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Kora Pay info row ── */}
        <TouchableOpacity
          style={[styles.infoRow, { backgroundColor: isDarkMode ? '#1a1a2e' : '#fff' }]}
          onPress={() => navigation.navigate('FundWallet')}
          activeOpacity={0.85}
        >
          <View style={styles.infoIconWrap}>
            <MaterialCommunityIcons name="shield-check-outline" size={22} color={CARD_COLOR} />
            <View style={styles.infoOnline} />
          </View>
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: themeColors.heading }]}>Secure Payments</Text>
            <Text style={[styles.infoSub,   { color: themeColors.subheading }]}>Powered by Kora Pay</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={themeColors.subheading} />
        </TouchableOpacity>

        {/* ── Recent transactions ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
            <Text style={[styles.seeAll, { color: CARD_COLOR }]}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.txList, { backgroundColor: isDarkMode ? '#1a1a2e' : '#fff' }]}>
          {topups.length === 0 && !loading ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="wallet-outline" size={40} color={themeColors.subheading} />
              <Text style={[styles.emptyTitle, { color: themeColors.heading }]}>No transactions yet</Text>
              <Text style={[styles.emptyMsg,   { color: themeColors.subheading }]}>
                Tap Add Money to fund your wallet.
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: CARD_COLOR }]}
                onPress={() => navigation.navigate('FundWallet')}
              >
                <Text style={styles.emptyBtnText}>Add Money</Text>
              </TouchableOpacity>
            </View>
          ) : (
            topups.slice(0, 10).map((tx, i) => (
              <TxRow key={tx._id || i} tx={tx} themeColors={themeColors} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 12 },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: CARD_COLOR, alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  avatarText:  { color: '#fff', fontSize: 14, fontWeight: '700' },
  appName:     { flex: 1, fontSize: 18, fontWeight: '700' },

  // Balance card
  card: {
    backgroundColor: CARD_COLOR,
    borderRadius: 20, padding: 22,
    marginBottom: 16,
  },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardLabel:  { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', letterSpacing: 1.2 },
  cardIconBtn:{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  cardBalance:{ color: '#fff', fontSize: 32, fontWeight: '800', marginVertical: 14 },
  cardBtns:   { flexDirection: 'row', gap: 12, marginTop: 4 },
  addMoneyBtn:{
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: '#fff', borderRadius: 12, paddingVertical: 13,
  },
  addMoneyText: { fontSize: 15, fontWeight: '700' },
  historyCardBtn:{
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingVertical: 13,
  },
  historyCardText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Quick actions
  quickRow: {
    flexDirection: 'row', borderRadius: 16,
    paddingVertical: 16, marginBottom: 12,
  },
  quickItem:    { flex: 1, alignItems: 'center', gap: 8 },
  quickIconWrap:{
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontSize: 12, fontWeight: '600' },

  // Info row
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 16, marginBottom: 20, gap: 14,
  },
  infoIconWrap: { position: 'relative' },
  infoOnline:   {
    position: 'absolute', top: 0, right: 0,
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: '#4CAF50', borderWidth: 1.5, borderColor: '#fff',
  },
  infoText:  { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '700' },
  infoSub:   { fontSize: 12, marginTop: 2 },

  // Section header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle:  { fontSize: 16, fontWeight: '700' },
  seeAll:        { fontSize: 13, fontWeight: '700' },

  // Tx list
  txList: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  txRow:  { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  txIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  txMid:   { flex: 1 },
  txLabel: { fontSize: 14, fontWeight: '600' },
  txDate:  { fontSize: 12, marginTop: 2 },
  txRight: { alignItems: 'flex-end', gap: 5 },
  txAmount:{ fontSize: 14, fontWeight: '700' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '700' },

  // Empty state
  emptyWrap: { alignItems: 'center', padding: 32, gap: 8 },
  emptyTitle:{ fontSize: 16, fontWeight: '700', marginTop: 4 },
  emptyMsg:  { fontSize: 13, textAlign: 'center' },
  emptyBtn:  { marginTop: 12, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
