import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { useWallet } from 'context/WalletContext';
import { formatCurrency } from 'CONSTANT/formatCurrency';

// Map transaction types → display category
const TYPE_CATEGORY = {
  airtime: { label: 'Airtime', icon: 'call-outline', color: '#6ae721' },
  data: { label: 'Data', icon: 'wifi-outline', color: '#3498DB' },
  electricity: { label: 'Electricity', icon: 'flash-outline', color: '#FFA502' },
  tv: { label: 'TV / Cable', icon: 'tv-outline', color: '#96CEB4' },
  education: { label: 'Education', icon: 'school-outline', color: '#9B59B6' },
  exam_pin: { label: 'Exam PIN', icon: 'document-text-outline', color: '#4ECDC4' },
  betting: { label: 'Betting', icon: 'football-outline', color: '#FF6B6B' },
  airtime_conversion: { label: 'Airtime to Cash', icon: 'swap-horizontal-outline', color: '#45B7D1' },
  nin_verification: { label: 'NIN Verify', icon: 'person-outline', color: '#A29BFE' },
  nin_phone_search: { label: 'NIN Search', icon: 'search-outline', color: '#A29BFE' },
  nin_tracking_search: { label: 'NIN Tracking', icon: 'search-outline', color: '#A29BFE' },
  bvn_verification: { label: 'BVN Verify', icon: 'card-outline', color: '#6C5CE7' },
  bvn_phone_search: { label: 'BVN Search', icon: 'search-outline', color: '#6C5CE7' },
  cac_registration: { label: 'CAC Reg.', icon: 'business-outline', color: '#81CEC6' },
  cac_validation: { label: 'CAC Validate', icon: 'checkmark-circle-outline', color: '#81CEC6' },
  transport_booking: { label: 'Transport', icon: 'bus-outline', color: '#DDA0DD' },
  flight_booking: { label: 'Flights', icon: 'airplane-outline', color: '#FFEAA7' },
  wallet_topup: { label: 'Top-up', icon: 'add-circle-outline', color: '#4CAF50' },
  referral_bonus: { label: 'Referral', icon: 'gift-outline', color: '#FFA500' },
};

function groupByCategory(transactions) {
  const map = {};
  for (const tx of transactions) {
    if (tx.status !== 'success' && tx.status !== 'completed') continue;
    if (tx.type === 'wallet_topup' || tx.type === 'referral_bonus') continue;
    const key = tx.type || 'other';
    if (!map[key]) map[key] = { type: key, total: 0, count: 0 };
    map[key].total += Number(tx.amount) || 0;
    map[key].count += 1;
  }
  return Object.values(map).sort((a, b) => b.total - a.total);
}

function StatCard({ label, value, icon, color, themeColors }) {
  return (
    <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.statValue, { color: themeColors.heading }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: themeColors.subheading }]}>{label}</Text>
    </View>
  );
}

export default function Analytics({ navigation }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { transactions, transactionStats, fetchTransactions, wallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      await fetchTransactions({ limit: 200 });
    } catch (_) {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchTransactions]);

  useEffect(() => { load(); }, []);

  const breakdown = groupByCategory(transactions || []);
  const totalSpent = breakdown.reduce((s, c) => s + c.total, 0);

  const successCount = (transactions || []).filter(
    t => t.status === 'success' || t.status === 'completed'
  ).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      <View style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border || '#E0E0E0' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={themeColors.heading} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.heading }]}>Analytics</Text>
        <TouchableOpacity onPress={() => load(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="refresh-outline" size={22} color={themeColors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        >
          {/* Summary cards */}
          <View style={styles.statsRow}>
            <StatCard
              label="Total Spent"
              value={formatCurrency(totalSpent, 'NGN')}
              icon="trending-down-outline"
              color="#FF6B6B"
              themeColors={themeColors}
            />
            <StatCard
              label="Transactions"
              value={String(successCount)}
              icon="receipt-outline"
              color="#4CAF50"
              themeColors={themeColors}
            />
            <StatCard
              label="Wallet"
              value={formatCurrency(wallet?.user?.walletBalance || 0, 'NGN')}
              icon="wallet-outline"
              color={themeColors.primary}
              themeColors={themeColors}
            />
          </View>

          {/* Breakdown by service */}
          <Text style={[styles.sectionTitle, { color: themeColors.subheading }]}>SPENDING BY SERVICE</Text>

          {breakdown.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: themeColors.card }]}>
              <Ionicons name="bar-chart-outline" size={40} color={themeColors.subtext} />
              <Text style={[styles.emptyText, { color: themeColors.subheading }]}>
                No spending data yet. Make your first purchase to see analytics here.
              </Text>
            </View>
          ) : (
            <>
              {breakdown.map((item) => {
                const meta = TYPE_CATEGORY[item.type] || { label: item.type, icon: 'ellipse-outline', color: '#888' };
                const pct = totalSpent > 0 ? (item.total / totalSpent) * 100 : 0;
                return (
                  <View key={item.type} style={[styles.row, { backgroundColor: themeColors.card }]}>
                    <View style={[styles.rowIcon, { backgroundColor: `${meta.color}20` }]}>
                      <Ionicons name={meta.icon} size={20} color={meta.color} />
                    </View>
                    <View style={styles.rowBody}>
                      <View style={styles.rowTop}>
                        <Text style={[styles.rowLabel, { color: themeColors.heading }]}>{meta.label}</Text>
                        <Text style={[styles.rowAmount, { color: themeColors.heading }]}>
                          {formatCurrency(item.total, 'NGN')}
                        </Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: meta.color }]} />
                      </View>
                      <Text style={[styles.rowCount, { color: themeColors.subheading }]}>
                        {item.count} transaction{item.count !== 1 ? 's' : ''} · {pct.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 2 },
  statLabel: { fontSize: 10, textAlign: 'center' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 14,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rowLabel: { fontSize: 14, fontWeight: '600' },
  rowAmount: { fontSize: 14, fontWeight: '700' },
  barTrack: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  barFill: { height: '100%', borderRadius: 2 },
  rowCount: { fontSize: 11 },
});
