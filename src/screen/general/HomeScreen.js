import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  FontAwesome6,
  FontAwesome,
  Feather,
} from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { useWalletBalance } from 'HOOKS';
import { PromoCard } from 'component/SHARED';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { useWallet } from 'context/WalletContext';
import { useNotifications } from 'context/NotificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddWalletFund from 'component/AddWalletFund';

const { width } = Dimensions.get('window');
const H_PAD    = 16;
const ICON_BOX = 42;   // reduced from 56
const ICON_SIZE = 17;  // reduced from 22
const COL  = 4;
const ITEM_W = (width - H_PAD * 2) / COL;

const SERVICES = [
  { id: 'airtime',   label: 'Airtime',       screen: 'Airtime',            gradient: ['#4776E6', '#8E54E9'], icon: 'call',              lib: 'Ionicons' },
  { id: 'data',      label: 'Data',           screen: 'Data',               gradient: ['#A855F7', '#EC4899'], icon: 'wifi',              lib: 'Ionicons' },
  { id: 'elec',      label: 'Electricity',    screen: 'ElectricityPurchase',gradient: ['#F97316', '#EAB308'], icon: 'flash',             lib: 'Ionicons' },
  { id: 'invoice',   label: 'Invoice',        screen: 'Invoices',           gradient: ['#14B8A6', '#06B6D4'], icon: 'document-text',    lib: 'Ionicons' },
  { id: 'betting',   label: 'Betting',        screen: 'Betting',            gradient: ['#10B981', '#059669'], icon: 'soccer-ball-o',    lib: 'FontAwesome' },
  { id: 'jamb',      label: 'JAMB',           screen: 'EducationPurchase',  gradient: ['#F97316', '#EA580C'], icon: 'credit-card',      lib: 'FontAwesome6' },
  { id: 'tv',        label: 'TV Subs',        screen: 'TVSubscription',     gradient: ['#EF4444', '#EC4899'], icon: 'television',       lib: 'MaterialCommunity' },
  { id: 'atc',       label: 'Airtime Cash',   screen: 'Airtime-Cash',       gradient: ['#3B82F6', '#6366F1'], icon: 'exchange-alt',     lib: 'FontAwesome5' },
  { id: 'cac',       label: 'CAC',            screen: 'CACHub',             gradient: ['#0D9488', '#0891B2'], icon: 'business',         lib: 'Ionicons' },
  { id: 'nin',       label: 'NIN',            screen: 'NINScreen',          gradient: ['#8B5CF6', '#7C3AED'], icon: 'card-outline',     lib: 'Ionicons' },
  { id: 'transport', label: 'Transport',      screen: 'Transport',          gradient: ['#059669', '#10B981'], icon: 'bus',              lib: 'Ionicons' },
  { id: 'more',      label: 'More',           screen: 'AllServices',        gradient: ['#64748B', '#475569'], icon: 'more-horizontal',  lib: 'Feather' },
];

const ServiceIcon = ({ lib, icon, size }) => {
  const p = { name: icon, size, color: '#FFF' };
  if (lib === 'FontAwesome')       return <FontAwesome    {...p} />;
  if (lib === 'FontAwesome5')      return <FontAwesome5   {...p} />;
  if (lib === 'FontAwesome6')      return <FontAwesome6   {...p} />;
  if (lib === 'MaterialCommunity') return <MaterialCommunityIcons {...p} />;
  if (lib === 'Feather')           return <Feather        {...p} />;
  return <Ionicons {...p} />;
};

const ServiceCard = React.memo(({ svc, onPress, labelColor }) => (
  <TouchableOpacity style={ss.svcItem} onPress={onPress} activeOpacity={0.75}>
    <LinearGradient colors={svc.gradient} style={ss.svcBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <ServiceIcon lib={svc.lib} icon={svc.icon} size={ICON_SIZE} />
    </LinearGradient>
    <Text style={[ss.svcLabel, { color: labelColor }]} numberOfLines={2}>{svc.label}</Text>
  </TouchableOpacity>
));

const TX_NAMES = {
  airtime: 'Airtime Recharge', data: 'Data Bundle', electricity: 'Electricity Payment',
  tv: 'TV Subscription', education: 'Exam Pin', wallet_topup: 'Wallet Top-up',
  referral_bonus: 'Referral Bonus', transport_booking: 'Bus Booking',
  bank_transfer: 'Bank Transfer', cac_registration: 'CAC Registration',
};

const TX_ICONS = {
  airtime:           { icon: 'call-outline',              gradient: ['#4776E6', '#8E54E9'] },
  data:              { icon: 'wifi-outline',              gradient: ['#A855F7', '#EC4899'] },
  electricity:       { icon: 'flash-outline',             gradient: ['#F97316', '#EAB308'] },
  tv:                { icon: 'tv-outline',                gradient: ['#EF4444', '#EC4899'] },
  education:         { icon: 'school-outline',            gradient: ['#F97316', '#EA580C'] },
  wallet_topup:      { icon: 'wallet-outline',            gradient: ['#10B981', '#059669'] },
  referral_bonus:    { icon: 'gift-outline',              gradient: ['#8B5CF6', '#7C3AED'] },
  transport_booking: { icon: 'bus-outline',               gradient: ['#059669', '#10B981'] },
  bank_transfer:     { icon: 'arrow-up-circle-outline',   gradient: ['#14B8A6', '#06B6D4'] },
  cac_registration:  { icon: 'business-outline',         gradient: ['#0D9488', '#0891B2'] },
};

const isSuccess = s => ['success', 'successful', 'completed', 'confirmed'].includes(s);
const isPending = s => ['pending', 'processing', 'initiated'].includes(s);

export default function HomeScreen({ route }) {
  const navigation = useNavigation();
  const isDarkMode = useThem();
  const tc         = isDarkMode ? colors.dark : colors.light;
  const { wallet, refreshWallet, transactions, fetchTransactions } = useWallet();
  const { unreadCount } = useNotifications();
  const [user, setUser]          = useState(null);
  const [isRefreshing, setRefresh] = useState(false);

  const { formattedBalance, isVisible: balVisible, toggleVisibility } = useWalletBalance();

  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
    refreshWallet();
    fetchTransactions({ limit: 5, page: 1 }).catch(() => {});
  }, []));

  useEffect(() => {
    if (route.params?.user) setUser(route.params.user);
    else AsyncStorage.getItem('user').then(s => s && setUser(JSON.parse(s))).catch(() => {});
  }, []);

  const onRefresh = useCallback(async () => {
    setRefresh(true);
    await Promise.all([refreshWallet(), fetchTransactions({ limit: 5, page: 1 }).catch(() => {})]);
    setRefresh(false);
  }, []);

  const userName = user?.firstName || wallet?.user?.name?.split(' ')[0] || 'User';

  const formatTxDate = d => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <SafeAreaView style={[ss.root, { backgroundColor: tc.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── HEADER ── */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={ss.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={ss.topBar}>
          <View>
            <Text style={ss.welcomeText}>Welcome,</Text>
            <Text style={ss.userName}>{userName}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} activeOpacity={0.8}>
            <View style={ss.bellWrap}>
              <Ionicons name="notifications-outline" size={22} color="#FFF" />
              {unreadCount > 0 && (
                <View style={ss.bellBadge}>
                  <Text style={ss.bellBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* ── BALANCE CARD ── */}
        <BlurView intensity={18} tint="light" style={ss.cardBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.08)']}
            style={ss.cardGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={ss.cardTopRow}>
              <View style={ss.cardTopLeft}>
                <Text style={ss.balLabel}>Balance</Text>
                <TouchableOpacity onPress={toggleVisibility} style={{ padding: 4 }}>
                  <Ionicons
                    name={balVisible ? 'eye-outline' : 'eye-off-outline'}
                    size={16}
                    color="rgba(255,255,255,0.75)"
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={ss.historyChip} onPress={() => navigation.navigate('Orders')} activeOpacity={0.8}>
                <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.85)" />
                <Text style={ss.historyChipText}>History</Text>
              </TouchableOpacity>
            </View>

            <Text style={ss.balAmount}>{formattedBalance}</Text>

            <View style={ss.cardBtns}>
              <TouchableOpacity style={ss.cardBtnPrimary} onPress={() => navigation.navigate('Wallet')} activeOpacity={0.85}>
                <LinearGradient colors={['#667EEA', '#764BA2']} style={ss.cardBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="add-circle-outline" size={18} color="#FFF" />
                  <Text style={ss.cardBtnText}>Top Up</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={ss.cardBtnSecondary} onPress={() => navigation.navigate('VtuTransferScreen')} activeOpacity={0.85}>
                <Ionicons name="arrow-up-circle-outline" size={18} color="rgba(255,255,255,0.9)" />
                <Text style={ss.cardBtnTextSec}>Transfer</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </BlurView>
      </LinearGradient>

      {/* ── BODY ── */}
      <View style={[ss.body, { backgroundColor: tc.background }]}>
        <ScrollView
          contentContainerStyle={ss.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={tc.primary} colors={[tc.primary]} />}
        >
          {/* Services */}
          <View style={ss.sectionRow}>
            <Text style={[ss.sectionTitle, { color: tc.heading }]}>Our Services</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllServices')}>
              <Text style={ss.viewAll}>View All →</Text>
            </TouchableOpacity>
          </View>
          <View style={[ss.card, { backgroundColor: tc.card }]}>
            <View style={ss.grid}>
              {SERVICES.map(svc => (
                <ServiceCard key={svc.id} svc={svc} onPress={() => svc.screen && navigation.navigate(svc.screen)} labelColor={tc.heading} />
              ))}
            </View>
          </View>

          {/* Promo */}
          <PromoCard
            title="🎉 Refer And Win"
            subtitle="Invite your friends and earn up to ₦10,000"
            buttonText="Refer Now"
            onPress={() => navigation.navigate('Referral')}
            gradientColors={['#FA8BFF', '#2BD2FF', '#2BFF88']}
          />

          {/* Recent transactions */}
          <View style={ss.sectionRow}>
            <Text style={[ss.sectionTitle, { color: tc.heading }]}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
              <Text style={ss.viewAll}>View All →</Text>
            </TouchableOpacity>
          </View>
          <View style={[ss.card, { backgroundColor: tc.card }]}>
            {transactions.length > 0 ? transactions.slice(0, 5).map((tx, i) => {
              const txMeta     = TX_ICONS[tx.type] || { icon: 'receipt-outline', gradient: ['#64748B', '#475569'] };
              const success    = isSuccess(tx.status);
              const pending    = isPending(tx.status);
              const statusColor = success ? '#16A34A' : pending ? '#D97706' : '#DC2626';
              const statusBg    = success ? '#F0FDF4' : pending ? '#FFFBEB' : '#FEF2F2';
              const statusLabel = success ? 'Success' : pending ? 'Pending' : 'Failed';
              return (
                <TouchableOpacity
                  key={tx._id || i}
                  style={[ss.txRow, { borderBottomColor: tc.border, borderBottomWidth: i < 4 ? 1 : 0 }]}
                  onPress={() => navigation.navigate('TransactionDetails', { reference: tx.reference })}
                  activeOpacity={0.75}
                >
                  <LinearGradient colors={txMeta.gradient} style={ss.txIconBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name={txMeta.icon} size={20} color="#FFF" />
                  </LinearGradient>
                  <View style={ss.txMid}>
                    <Text style={[ss.txName, { color: tc.heading }]} numberOfLines={1}>{TX_NAMES[tx.type] || tx.type}</Text>
                    <Text style={[ss.txDate, { color: tc.subheading }]}>{formatTxDate(tx.createdAt)}</Text>
                  </View>
                  <View style={ss.txRight}>
                    <Text style={[ss.txAmount, { color: tc.heading }]}>-{formatCurrency(tx.amount, 'NGN')}</Text>
                    <View style={[ss.statusBadge, { backgroundColor: statusBg }]}>
                      <Text style={[ss.statusText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }) : (
              <View style={ss.emptyWrap}>
                <LinearGradient colors={['#F1F5F9', '#E2E8F0']} style={ss.emptyIcon}>
                  <Ionicons name="receipt-outline" size={36} color="#94A3B8" />
                </LinearGradient>
                <Text style={[ss.emptyTitle, { color: tc.heading }]}>No transactions yet</Text>
                <Text style={[ss.emptySub, { color: tc.subheading }]}>Your history will appear here</Text>
              </View>
            )}
          </View>

          {__DEV__ && <AddWalletFund />}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 14,
    paddingBottom: 28,
    paddingHorizontal: H_PAD,
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  welcomeText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginBottom: 2 },
  userName: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
  bellWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  bellBadge: {
    position: 'absolute', top: 3, right: 3,
    backgroundColor: '#F97316', minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: '#1a1a2e',
  },
  bellBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },

  // Balance card
  cardBlur: { borderRadius: 20, overflow: 'hidden' },
  cardGrad: { borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  historyChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  historyChipText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  balAmount: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5, textAlign: 'center', marginVertical: 10 },
  cardBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cardBtnPrimary: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  cardBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, gap: 6 },
  cardBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  cardBtnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', paddingVertical: 11 },
  cardBtnTextSec: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 14 },

  // Body
  body: { flex: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -16, overflow: 'hidden' },
  scroll: { paddingHorizontal: H_PAD, paddingTop: 20, paddingBottom: 110 },

  // Section header
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },
  viewAll: { fontSize: 13, fontWeight: '600', color: '#667EEA' },

  // Card shell
  card: { borderRadius: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },

  // Services grid — compact 4-per-row
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 14, paddingHorizontal: 6 },
  svcItem: { width: ITEM_W, alignItems: 'center', marginBottom: 14 },
  svcBox: {
    width: ICON_BOX, height: ICON_BOX, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  svcLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center', lineHeight: 13 },

  // Transactions
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  txIconBox: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txMid: { flex: 1, marginRight: 10 },
  txName: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  txDate: { fontSize: 12 },
  txRight: { alignItems: 'flex-end', gap: 5 },
  txAmount: { fontSize: 15, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Empty state
  emptyWrap: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  emptySub: { fontSize: 13 },
});
