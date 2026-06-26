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
  Entypo,
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
const CARD_PADDING = 16;
const ICON_SIZE = 16;

const services = [
  { id: 'betting',   label: 'Betting',       icon: <FontAwesome name="soccer-ball-o" size={ICON_SIZE} />,           screen: 'Betting',            gradient: ['#FF6B6B', '#FF8E53'] },
  { id: 'jamb',      label: 'JAMB',          icon: <FontAwesome6 name="credit-card" size={ICON_SIZE} />,            screen: 'EducationPurchase',  gradient: ['#4E54C8', '#8F94FB'] },
  { id: 'atc',       label: 'Airtime-Cash',  icon: <FontAwesome5 name="exchange-alt" size={ICON_SIZE} />,           screen: 'Airtime-Cash',       gradient: ['#11998E', '#38EF7D'] },
  { id: 'tv',        label: 'TV Subs',       icon: <MaterialCommunityIcons name="television" size={ICON_SIZE} />,   screen: 'TVSubscription',     gradient: ['#F857A6', '#FF5858'] },
  { id: 'cac',       label: 'CAC',           icon: <Ionicons name="business" size={ICON_SIZE} />,                   screen: 'CACHub',             gradient: ['#0d6e6e', '#14b8a6'] },
  { id: 'nin',       label: 'NIN',           icon: <Ionicons name="card-outline" size={ICON_SIZE} />,               screen: 'NINScreen',          gradient: ['#A29BFE', '#6C5CE7'] },
  { id: 'transport', label: 'Transport',     icon: <Ionicons name="bus-outline" size={ICON_SIZE} />,                screen: 'Transport',          gradient: ['#43E97B', '#38F9D7'] },
  { id: 'more',      label: 'More',          icon: <Feather name="more-horizontal" size={ICON_SIZE} />,             screen: 'AllServices',        gradient: ['#5F72BD', '#9B23EA'] },
];

const quickActions = [
  { label: 'Airtime',     icon: 'call',          gradient: ['#667EEA', '#764BA2'], screen: 'Airtime' },
  { label: 'Data',        icon: 'wifi',          gradient: ['#F093FB', '#F5576C'], screen: 'Data' },
  { label: 'Electricity', icon: 'flash',         gradient: ['#4FACFE', '#00F2FE'], screen: 'ElectricityPurchase' },
  { label: 'Invoice',     icon: 'document-text', gradient: ['#43E97B', '#38F9D7'], screen: 'Invoices' },
];

const ServiceCard = React.memo(({ service, onPress, themeColors }) => (
  <TouchableOpacity
    style={ss.serviceCard}
    onPress={onPress}
    activeOpacity={0.75}
    accessibilityLabel={`${service.label} service`}
    accessibilityRole="button"
  >
    <LinearGradient
      colors={service.gradient}
      style={ss.iconCircle}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {React.cloneElement(service.icon, { color: '#FFFFFF' })}
    </LinearGradient>
    <Text style={[ss.serviceLabel, { color: themeColors.heading }]} numberOfLines={2}>
      {service.label}
    </Text>
  </TouchableOpacity>
));

const QuickActionItem = React.memo(({ action, onPress }) => (
  <TouchableOpacity style={ss.qaItem} onPress={onPress} activeOpacity={0.75}>
    <LinearGradient colors={action.gradient} style={ss.qaIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Ionicons name={action.icon} size={17} color="#fff" />
    </LinearGradient>
    <Text style={ss.qaText}>{action.label}</Text>
  </TouchableOpacity>
));

export default function HomeScreen({ route }) {
  const navigation  = useNavigation();
  const isDarkMode  = useThem();
  const tc          = isDarkMode ? colors.dark : colors.light;
  const { wallet, refreshWallet, transactions, fetchTransactions } = useWallet();
  const { unreadCount } = useNotifications();
  const [user, setUser]             = useState(null);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);

  const { formattedBalance, isVisible: balanceVisible, toggleVisibility } = useWalletBalance();

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('transparent');
        StatusBar.setTranslucent(true);
      }
      refreshWallet();
      fetchTransactions({ limit: 5, page: 1 }).catch(() => {});
    }, [])
  );

  useEffect(() => {
    if (route.params?.user) {
      setUser(route.params.user);
    } else {
      AsyncStorage.getItem('user')
        .then(s => s && setUser(JSON.parse(s)))
        .catch(() => {});
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await Promise.all([
        refreshWallet(),
        fetchTransactions({ limit: 5, page: 1 }).catch(() => {}),
      ]);
    } catch {
      setError('Failed to refresh. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatTxDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const txLabel = (type) => ({
    airtime: 'Airtime Recharge', data: 'Data Bundle', electricity: 'Electricity',
    tv: 'TV Subscription', education: 'Exam Pin', wallet_topup: 'Wallet Top-up',
    referral_bonus: 'Referral Bonus', transport_booking: 'Bus Booking',
  }[type] || type);

  const txColor = (status) =>
    ['success', 'successful', 'completed', 'confirmed'].includes(status) ? tc.success
    : ['pending', 'processing'].includes(status) ? tc.warning
    : tc.error;

  return (
    <SafeAreaView style={[ss.root, { backgroundColor: tc.background }]}>
      {/* ── Header gradient ── */}
      <LinearGradient
        colors={isDarkMode ? ['#1a1a2e', '#16213e'] : ['#667EEA', '#764BA2']}
        style={ss.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Top bar */}
        <View style={ss.topBar}>
          <View>
            <Text style={ss.greetTxt}>{greeting()}</Text>
            <Text style={ss.nameTxt}>{user?.firstName || wallet?.user?.firstName || 'Welcome'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={ss.bellWrap}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {unreadCount > 0 && (
              <View style={ss.badge}>
                <Text style={ss.badgeTxt}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Wallet card */}
        <View style={ss.cardWrap}>
          <BlurView intensity={20} tint={isDarkMode ? 'dark' : 'light'} style={ss.blur}>
            <LinearGradient
              colors={isDarkMode ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
              style={ss.cardGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Balance row */}
              <View style={ss.balRow}>
                <View style={ss.balLeft}>
                  <Text style={[ss.balLabel, { color: isDarkMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.55)' }]}>Wallet Balance</Text>
                  <TouchableOpacity onPress={toggleVisibility} style={ss.eyeBtn}>
                    <Entypo name={balanceVisible ? 'eye' : 'eye-with-line'} size={16} color={isDarkMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.55)'} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Orders')} style={ss.histBtn}>
                  <Ionicons name="time-outline" size={14} color={isDarkMode ? 'rgba(255,255,255,0.8)' : '#667EEA'} />
                  <Text style={[ss.histTxt, { color: isDarkMode ? 'rgba(255,255,255,0.8)' : '#667EEA' }]}>History</Text>
                </TouchableOpacity>
              </View>

              {/* Amount */}
              <Text style={[ss.amount, { color: isDarkMode ? '#fff' : '#1a1a2e' }]}>{formattedBalance}</Text>

              {/* Action buttons */}
              <View style={ss.actRow}>
                <TouchableOpacity style={ss.actBtn} onPress={() => navigation.navigate('Wallet')} activeOpacity={0.8}>
                  <LinearGradient colors={['#667EEA', '#764BA2']} style={ss.actGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="add-circle-outline" size={18} color="#fff" />
                    <Text style={ss.actTxt}>Top up</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={ss.actBtn} onPress={() => navigation.navigate('VtuTransferScreen')} activeOpacity={0.8}>
                  <LinearGradient colors={['#11998E', '#38EF7D']} style={ss.actGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="arrow-up-circle-outline" size={18} color="#fff" />
                    <Text style={ss.actTxt}>Transfer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </BlurView>
        </View>
      </LinearGradient>

      {/* ── Body ── */}
      <View style={[ss.body, { backgroundColor: tc.background }]}>
        <ScrollView
          contentContainerStyle={ss.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={tc.primary} colors={[tc.primary]} />}
        >
          {error && (
            <View style={ss.errBanner}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={ss.errTxt}>{error}</Text>
              <TouchableOpacity onPress={() => setError(null)}><Ionicons name="close" size={18} color="#EF4444" /></TouchableOpacity>
            </View>
          )}

          {/* Quick actions */}
          <View style={ss.secHead}>
            <Text style={[ss.secTitle, { color: tc.heading }]}>Quick Actions</Text>
          </View>
          <View style={[ss.qaRow, { backgroundColor: tc.card }]}>
            {quickActions.map((a, i) => (
              <QuickActionItem key={i} action={a} onPress={() => navigation.navigate(a.screen)} />
            ))}
          </View>

          {/* Services grid */}
          <View style={ss.secHead}>
            <Text style={[ss.secTitle, { color: tc.heading }]}>Our Services</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllServices')}>
              <Text style={ss.viewAll}>View All →</Text>
            </TouchableOpacity>
          </View>
          <View style={[ss.gridWrap, { backgroundColor: tc.card }]}>
            <View style={ss.grid}>
              {services.map(s => (
                <ServiceCard key={s.id} service={s} onPress={() => navigation.navigate(s.screen)} themeColors={tc} />
              ))}
            </View>
          </View>

          {/* Promo */}
          <PromoCard
            title="🎉 Refer And Win"
            subtitle="Invite your Friends and earn up to ₦10,000"
            buttonText="Refer Now"
            onPress={() => navigation.navigate('Referral')}
            gradientColors={['#FA8BFF', '#2BD2FF', '#2BFF88']}
          />

          {/* Recent transactions */}
          <View style={ss.secHead}>
            <Text style={[ss.secTitle, { color: tc.heading }]}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
              <Text style={ss.viewAll}>View All →</Text>
            </TouchableOpacity>
          </View>
          <View style={[ss.txWrap, { backgroundColor: tc.card }]}>
            {transactions.length > 0 ? transactions.slice(0, 3).map((tx, i) => (
              <TouchableOpacity
                key={tx._id || i}
                style={[ss.txRow, { borderBottomColor: tc.border }]}
                onPress={() => navigation.navigate('TransactionDetails', { reference: tx.reference })}
              >
                <View style={ss.txLeft}>
                  <LinearGradient colors={[tc.gradientStart || '#667EEA', tc.gradientEnd || '#764BA2']} style={ss.txIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name="receipt-outline" size={20} color="#fff" />
                  </LinearGradient>
                  <View>
                    <Text style={[ss.txTitle, { color: tc.heading }]}>{txLabel(tx.type)}</Text>
                    <Text style={[ss.txDate, { color: tc.subheading }]}>{formatTxDate(tx.createdAt)}</Text>
                  </View>
                </View>
                <View style={ss.txRight}>
                  <Text style={[ss.txAmt, { color: txColor(tx.status) }]}>{formatCurrency(tx.amount, 'NGN')}</Text>
                  <View style={[ss.statusBadge, { backgroundColor: `${txColor(tx.status)}20` }]}>
                    <Text style={[ss.statusTxt, { color: txColor(tx.status) }]}>{tx.status}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )) : (
              <View style={ss.emptyTx}>
                <LinearGradient colors={['#F3F4F6', '#E5E7EB']} style={ss.emptyIcon}>
                  <Ionicons name="receipt-outline" size={36} color="#9CA3AF" />
                </LinearGradient>
                <Text style={[ss.emptyTxt, { color: tc.subheading }]}>No recent transactions</Text>
                <Text style={[ss.emptySub, { color: tc.subtext }]}>Your transaction history will appear here</Text>
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
  root:     { flex: 1 },
  // ── Header ──
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 10,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: CARD_PADDING, marginBottom: 20,
  },
  greetTxt: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.8)', marginBottom: 3 },
  nameTxt:  { fontSize: 22, fontWeight: '700', color: '#fff' },
  bellWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: '#EF4444', minWidth: 16, height: 16,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: '#fff',
  },
  badgeTxt: { color: '#fff', fontSize: 9, fontWeight: '700' },
  // ── Wallet card ──
  cardWrap: { marginHorizontal: CARD_PADDING },
  blur:     { borderRadius: 22, overflow: 'hidden' },
  cardGrad: {
    borderRadius: 22, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 14, elevation: 8,
  },
  balRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  balLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balLabel: { fontSize: 12, fontWeight: '600' },
  eyeBtn:   { padding: 4 },
  histBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10 },
  histTxt:  { fontWeight: '600', fontSize: 13 },
  amount:   { fontSize: 26, fontWeight: '800', letterSpacing: 0.3, marginVertical: 8, textAlign: 'center' },
  actRow:   { flexDirection: 'row', gap: 10, marginTop: 4 },
  actBtn:   { flex: 1, borderRadius: 12, overflow: 'hidden' },
  actGrad:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 5 },
  actTxt:   { color: '#fff', fontWeight: '700', fontSize: 14 },
  // ── Body ──
  body:   { flex: 1, marginTop: -8, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  scroll: { paddingHorizontal: CARD_PADDING, paddingTop: 18, paddingBottom: 100 },
  errBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 14, marginBottom: 14, backgroundColor: '#FEE2E2',
  },
  errTxt: { flex: 1, fontSize: 13, fontWeight: '600', color: '#EF4444' },
  // ── Section headers ──
  secHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 2 },
  secTitle: { fontSize: 18, fontWeight: '700' },
  viewAll:  { fontSize: 13, fontWeight: '600', color: '#667EEA' },
  // ── Quick actions ──
  qaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderRadius: 20, paddingVertical: 14, paddingHorizontal: 14,
    marginBottom: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  qaItem: { alignItems: 'center', width: '23%' },
  qaIcon: {
    width: 42, height: 42, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  qaText: { fontSize: 11, fontWeight: '600', textAlign: 'center', color: '#1e293b' },
  // ── Services grid ──
  gridWrap: {
    borderRadius: 20, marginBottom: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingVertical: 14 },
  serviceCard: {
    width: (width - CARD_PADDING * 2 - 20) / 4,
    alignItems: 'center', marginBottom: 12,
  },
  iconCircle: {
    width: 36, height: 36, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', marginBottom: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  serviceLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center', lineHeight: 13 },
  // ── Transactions ──
  txWrap: {
    borderRadius: 20, overflow: 'hidden', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  txRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: CARD_PADDING, borderBottomWidth: 1 },
  txLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  txIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txTitle:{ fontSize: 14, fontWeight: '600', marginBottom: 3 },
  txDate: { fontSize: 12 },
  txRight:{ alignItems: 'flex-end' },
  txAmt:  { fontSize: 15, fontWeight: '700', marginBottom: 5 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  statusTxt:   { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  emptyTx:   { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTxt:  { fontSize: 15, fontWeight: '600', marginBottom: 5 },
  emptySub:  { fontSize: 13 },
});
