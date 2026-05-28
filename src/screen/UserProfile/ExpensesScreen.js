import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { useWallet } from 'context/WalletContext';
import { formatCurrency } from 'CONSTANT/formatCurrency';

const TYPE_META = {
  airtime:          { label: 'Airtime',         icon: 'call-outline',             color: '#6ae721' },
  data:             { label: 'Data',             icon: 'wifi-outline',             color: '#3498DB' },
  electricity:      { label: 'Electricity',      icon: 'flash-outline',            color: '#FFA502' },
  tv:               { label: 'TV / Cable',       icon: 'tv-outline',               color: '#96CEB4' },
  education:        { label: 'Education',        icon: 'school-outline',           color: '#9B59B6' },
  exam_pin:         { label: 'Exam PIN',         icon: 'document-text-outline',    color: '#4ECDC4' },
  betting:          { label: 'Betting',          icon: 'football-outline',         color: '#FF6B6B' },
  airtime_conversion: { label: 'Airtime→Cash',  icon: 'swap-horizontal-outline',  color: '#45B7D1' },
  nin_verification: { label: 'NIN Verify',       icon: 'person-outline',           color: '#A29BFE' },
  nin_phone_search: { label: 'NIN Search',       icon: 'search-outline',           color: '#A29BFE' },
  nin_tracking_search: { label: 'NIN Track',     icon: 'search-outline',           color: '#A29BFE' },
  bvn_verification: { label: 'BVN Verify',       icon: 'card-outline',             color: '#6C5CE7' },
  bvn_phone_search: { label: 'BVN Search',       icon: 'search-outline',           color: '#6C5CE7' },
  cac_registration: { label: 'CAC Reg.',         icon: 'business-outline',         color: '#81CEC6' },
  cac_validation:   { label: 'CAC Validate',     icon: 'checkmark-circle-outline', color: '#81CEC6' },
  transport_booking: { label: 'Transport',       icon: 'bus-outline',              color: '#DDA0DD' },
  flight_booking:   { label: 'Flight',           icon: 'airplane-outline',         color: '#FFEAA7' },
  wallet_topup:     { label: 'Wallet Top-up',    icon: 'add-circle-outline',       color: '#4CAF50' },
  referral_bonus:   { label: 'Referral Bonus',   icon: 'gift-outline',             color: '#FFA500' },
};

const PERIODS = [
  { key: 'all', label: 'All time' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '3 months' },
];

function periodStart(key) {
  const now = Date.now();
  if (key === '7d') return now - 7 * 86400000;
  if (key === '30d') return now - 30 * 86400000;
  if (key === '90d') return now - 90 * 86400000;
  return 0;
}

function fmtDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusColor(status) {
  if (status === 'success' || status === 'completed') return '#4CAF50';
  if (status === 'failed') return '#FF6B6B';
  if (status === 'refunded') return '#FFA502';
  return '#888';
}

const TransactionItem = ({ item, themeColors }) => {
  const meta = TYPE_META[item.type] || { label: item.type || 'Other', icon: 'ellipse-outline', color: '#888' };
  const isCredit = item.type === 'wallet_topup' || item.type === 'referral_bonus';
  return (
    <View style={[styles.txItem, { backgroundColor: themeColors.card }]}>
      <View style={[styles.txIcon, { backgroundColor: `${meta.color}18` }]}>
        <Ionicons name={meta.icon} size={20} color={meta.color} />
      </View>
      <View style={styles.txBody}>
        <Text style={[styles.txLabel, { color: themeColors.heading }]} numberOfLines={1}>
          {meta.label}
          {item.phoneNumber ? ` · ${item.phoneNumber}` : ''}
          {item.smartcardNumber ? ` · ${item.smartcardNumber}` : ''}
          {item.meterNumber ? ` · ${item.meterNumber}` : ''}
        </Text>
        <View style={styles.txMeta}>
          <Text style={[styles.txDate, { color: themeColors.subheading }]}>{fmtDate(item.createdAt)}</Text>
          <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
          <Text style={[styles.txStatus, { color: statusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={[styles.txAmount, { color: isCredit ? '#4CAF50' : themeColors.heading }]}>
        {isCredit ? '+' : '-'}{formatCurrency(item.amount, 'NGN')}
      </Text>
    </View>
  );
};

export default function ExpensesScreen({ navigation }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { transactions, fetchTransactions } = useWallet();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('30d');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try { await fetchTransactions({ limit: 300 }); } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [fetchTransactions]);

  useEffect(() => { load(); }, []);

  const since = periodStart(period);
  const filtered = (transactions || []).filter(t => {
    if (since && new Date(t.createdAt).getTime() < since) return false;
    return true;
  });

  const totalSpent = filtered
    .filter(t => (t.status === 'success' || t.status === 'completed') && t.type !== 'wallet_topup' && t.type !== 'referral_bonus')
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      <View style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border || '#E0E0E0', paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={themeColors.heading} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.heading }]}>Expenses</Text>
        <TouchableOpacity onPress={() => load(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="refresh-outline" size={22} color={themeColors.primary} />
        </TouchableOpacity>
      </View>

      {/* Period filter */}
      <View style={styles.filterRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[styles.filterChip, {
              backgroundColor: period === p.key ? themeColors.primary : themeColors.card,
            }]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.filterChipText, { color: period === p.key ? '#FFF' : themeColors.subheading }]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Total */}
      <View style={[styles.totalCard, { backgroundColor: themeColors.primary }]}>
        <Text style={[styles.totalLabel, { color: '#FFFFFF99' }]}>Total Spent</Text>
        <Text style={[styles.totalAmount, { color: '#FFF' }]}>{formatCurrency(totalSpent, 'NGN')}</Text>
        <Text style={[styles.totalSub, { color: '#FFFFFF99' }]}>{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id || item.reference}
          renderItem={({ item }) => <TransactionItem item={item} themeColors={themeColors} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="receipt-outline" size={48} color={themeColors.subtext} />
              <Text style={[styles.emptyText, { color: themeColors.subheading }]}>
                No transactions found for this period.
              </Text>
            </View>
          }
        />
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  totalCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  totalLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  totalAmount: { fontSize: 28, fontWeight: '800', marginBottom: 2 },
  totalSub: { fontSize: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  txIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txBody: { flex: 1 },
  txLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  txMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  txDate: { fontSize: 11 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  txStatus: { fontSize: 11, textTransform: 'capitalize' },
  txAmount: { fontSize: 14, fontWeight: '700' },
  emptyWrap: { paddingTop: 60, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
