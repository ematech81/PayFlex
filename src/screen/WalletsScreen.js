import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
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

const TOPUP_URL = `${PayStackApiIPAddress}/history`;

const TX_LABELS = {
  wallet_topup:      'Wallet Top-up',
  airtime:           'Airtime Recharge',
  data:              'Data Bundle',
  electricity:       'Electricity',
  tv:                'TV Subscription',
  education:         'Exam Pin',
  referral_bonus:    'Referral Bonus',
  transport_booking: 'Bus Booking',
  airtime_conversion:'Airtime to Cash',
};

const TX_ICONS = {
  wallet_topup:      'wallet',
  airtime:           'call',
  data:              'wifi',
  electricity:       'flash',
  tv:                'tv',
  education:         'school',
  referral_bonus:    'gift',
  transport_booking: 'bus',
  airtime_conversion:'swap-horizontal',
};

function TxRow({ tx, themeColors }) {
  const isSuccess = tx.status === 'success' || tx.status === 'completed';
  const isTopup = tx.type === 'wallet_topup';
  const label = TX_LABELS[tx.type] || tx.type;
  const icon  = TX_ICONS[tx.type]  || 'receipt-outline';
  const amountColor = isTopup
    ? (isSuccess ? '#2E7D32' : themeColors.error)
    : (isSuccess ? themeColors.error : themeColors.error);

  const date = tx.createdAt
    ? new Date(tx.createdAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <View style={[styles.txRow, { borderBottomColor: themeColors.border }]}>
      <View style={[styles.txIconWrap, { backgroundColor: isTopup ? '#E8F5E9' : `${themeColors.primary}15` }]}>
        <Ionicons name={`${icon}-outline`} size={20} color={isTopup ? '#2E7D32' : themeColors.primary} />
      </View>
      <View style={styles.txMid}>
        <Text style={[styles.txLabel, { color: themeColors.heading }]} numberOfLines={1}>{label}</Text>
        <Text style={[styles.txDate,  { color: themeColors.subheading }]}>{date}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: isTopup && isSuccess ? '#2E7D32' : themeColors.heading }]}>
          {isTopup ? '+' : '-'}{formatCurrency(tx.amount, 'NGN')}
        </Text>
        <View style={[
          styles.statusPill,
          { backgroundColor: isSuccess ? '#E8F5E920' : '#FFEBEE20',
            borderColor: isSuccess ? '#2E7D32' : '#C62828' },
        ]}>
          <Text style={[styles.statusText, { color: isSuccess ? '#2E7D32' : '#C62828' }]}>
            {tx.status}
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
  const { wallet, refreshWallet }   = useWallet();

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [topups, setTopups]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const user    = wallet?.user;
  const balance = Number(user?.walletBalance ?? 0);

  const fetchTopups = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!token) return;
      const res  = await fetch(TOPUP_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTopups(data.data?.transactions ?? []);
      }
    } catch {
      // silently fail — stale data stays visible
    }
  };

  // Stable ref so useFocusEffect never re-fires due to changing function identity
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
    }, []) // empty deps — only fires when screen gains focus
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshWalletRef.current(), fetchTopups()]);
    setRefreshing(false);
  }, []);

  const formattedBalance = balanceVisible
    ? formatCurrency(balance, 'NGN')
    : '₦ ••••••';

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      {/* ── Gradient header ── */}
      <LinearGradient
        colors={isDarkMode ? ['#1a1a2e', '#16213e'] : ['#667EEA', '#764BA2']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>My Wallet</Text>

        {/* Balance card */}
        <BlurView intensity={20} tint={isDarkMode ? 'dark' : 'light'} style={styles.card}>
          <LinearGradient
            colors={isDarkMode
              ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']
              : ['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.75)']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Label row */}
            <View style={styles.balanceLabelRow}>
              <Text style={[styles.balanceLabel, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)' }]}>
                Available Balance
              </Text>
              <TouchableOpacity onPress={() => setBalanceVisible(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons
                  name={balanceVisible ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)'}
                />
              </TouchableOpacity>
            </View>

            {/* Balance amount */}
            {loading ? (
              <ActivityIndicator size="large" color="#667EEA" style={{ marginVertical: 8 }} />
            ) : (
              <Text style={[styles.balanceAmount, { color: isDarkMode ? '#fff' : '#1a1a2e' }]}>
                {formattedBalance}
              </Text>
            )}

            {/* Actions */}
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.fundBtn}
                onPress={() => navigation.navigate('FundWallet')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#667EEA', '#764BA2']}
                  style={styles.fundBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.fundBtnText}>Fund Wallet</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.historyBtn, { borderColor: isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)' }]}
                onPress={() => navigation.navigate('Orders')}
                activeOpacity={0.8}
              >
                <Ionicons name="time-outline" size={16} color={isDarkMode ? '#fff' : '#667EEA'} />
                <Text style={[styles.historyBtnText, { color: isDarkMode ? '#fff' : '#667EEA' }]}>History</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </BlurView>
      </LinearGradient>

      {/* ── Body ── */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.primary}
            colors={[themeColors.primary]}
          />
        }
      >
        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
            <Ionicons name="trending-up-outline" size={22} color="#2E7D32" />
            <Text style={[styles.statValue, { color: themeColors.heading }]}>
              {formatCurrency(
                topups.filter(t => t.status === 'success').reduce((s, t) => s + t.amount, 0),
                'NGN'
              )}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.subheading }]}>Total Funded</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
            <Ionicons name="receipt-outline" size={22} color={themeColors.primary} />
            <Text style={[styles.statValue, { color: themeColors.heading }]}>
              {topups.filter(t => t.status === 'success').length}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.subheading }]}>Top-ups</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
            <Ionicons name="time-outline" size={22} color="#F59E0B" />
            <Text style={[styles.statValue, { color: themeColors.heading }]}>
              {topups.filter(t => t.status === 'pending').length}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.subheading }]}>Pending</Text>
          </View>
        </View>

        {/* Fund wallet banner (CTA if never topped up) */}
        {topups.length === 0 && !loading && (
          <TouchableOpacity
            style={[styles.emptyBanner, { backgroundColor: `${themeColors.primary}12`, borderColor: `${themeColors.primary}30` }]}
            onPress={() => navigation.navigate('FundWallet')}
            activeOpacity={0.8}
          >
            <Ionicons name="wallet-outline" size={28} color={themeColors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.emptyTitle, { color: themeColors.heading }]}>Fund Your Wallet</Text>
              <Text style={[styles.emptyMsg, { color: themeColors.subheading }]}>
                Top up your wallet to start making payments.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.subheading} />
          </TouchableOpacity>
        )}

        {/* Top-up history */}
        {topups.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>Top-up History</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
                <Text style={[styles.viewAll, { color: themeColors.primary }]}>View All →</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.txList, { backgroundColor: themeColors.card }]}>
              {topups.slice(0, 10).map((tx, i) => (
                <TxRow key={tx._id || i} tx={tx} themeColors={themeColors} />
              ))}
            </View>
          </>
        )}

        {/* Security note */}
        <Text style={[styles.secureNote, { color: themeColors.subheading }]}>
          <Ionicons name="lock-closed-outline" size={12} color={themeColors.subheading} />
          {'  '}Payments processed securely by Kora Pay
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 24 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center' },

  // Balance card
  card:         { borderRadius: 20, overflow: 'hidden', marginBottom: 4 },
  cardGradient: { borderRadius: 20, padding: 20 },
  balanceLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  balanceLabel:    { fontSize: 13, fontWeight: '500' },
  balanceAmount:   { fontSize: 34, fontWeight: '800', letterSpacing: 0.5, marginBottom: 20 },
  cardActions:  { flexDirection: 'row', gap: 12 },
  fundBtn:      { flex: 1, borderRadius: 10, overflow: 'hidden' },
  fundBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, gap: 6 },
  fundBtnText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  historyBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  paddingHorizontal: 20, paddingVertical: 13, borderRadius: 10, borderWidth: 1, gap: 5 },
  historyBtnText: { fontSize: 14, fontWeight: '600' },

  // Scroll body
  scroll: { padding: 16 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, alignItems: 'center', padding: 12,
    borderRadius: 14, gap: 4,
  },
  statValue: { fontSize: 15, fontWeight: '700' },
  statLabel: { fontSize: 11, textAlign: 'center' },

  // Empty banner
  emptyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 20,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptyMsg:   { fontSize: 13, marginTop: 2 },

  // Section header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle:  { fontSize: 16, fontWeight: '700' },
  viewAll:       { fontSize: 13, fontWeight: '600' },

  // Tx list
  txList: { borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
  txRow:  { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  txIconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  txMid:   { flex: 1 },
  txLabel: { fontSize: 14, fontWeight: '600' },
  txDate:  { fontSize: 12, marginTop: 2 },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount:{ fontSize: 14, fontWeight: '700' },
  statusPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },

  secureNote: { textAlign: 'center', fontSize: 12, marginTop: 4 },
});
