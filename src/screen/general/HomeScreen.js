

// src/screen/HomeScreen.js
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
  ActivityIndicator,
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

import { useWalletNavigation } from 'constants/useWalletNavigation';
import { useWalletBalance } from 'HOOKS';
import { PromoCard } from 'component/SHARED';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { useWallet } from 'context/WalletContext';
import { useNotifications } from 'context/NotificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddWalletFund from 'component/AddWalletFund';
import { StatusBarComponent } from 'component/StatusBar';

const { width, height } = Dimensions.get('window');
const CARD_PADDING = 16;
const ICON_SIZE = 18;

// Detect if device is tablet
const isTablet = () => {
  const aspectRatio = height / width;
  return (
    (Platform.OS === 'ios' && Platform.isPad) || 
    (Platform.OS === 'android' && aspectRatio < 1.6)
  );
};

// Services Configuration
const services = [
  {
    id: 'betting',
    label: 'Betting',
    icon: <FontAwesome name="soccer-ball-o" size={ICON_SIZE} />,
    screen: 'Betting',
    gradient: ['#FF6B6B', '#FF8E53'],
  },
  {
    id: 'jamb',
    label: 'JAMB',
    icon: <FontAwesome6 name="credit-card" size={ICON_SIZE} />,
    screen: 'EducationPurchase',
    gradient: ['#4E54C8', '#8F94FB'],
  },
  {
    id: 'airtim-cash',
    label: 'Airtime to Cash',
    icon: <FontAwesome5 name="exchange-alt" size={ICON_SIZE} />,
    screen: 'Airtime-Cash',
    gradient: ['#11998E', '#38EF7D'],
  },
  {
    id: 'tv',
    label: 'TV Subs',
    icon: <MaterialCommunityIcons name="television" size={ICON_SIZE} />,
    screen: 'TVSubscription',
    gradient: ['#F857A6', '#FF5858'],
  },
  {
    id: 'cac',
    label: 'CAC',
    icon: <Ionicons name="business" size={ICON_SIZE} />,
    screen: 'CACScreen',
    gradient: ['#0d6e6e', '#14b8a6'],
  },
  {
    id: 'nin',
    label: 'NIN',
    icon: <Ionicons name="card-outline" size={ICON_SIZE} />,
    screen: 'NINScreen',
    gradient: ['#A29BFE', '#6C5CE7'],
  },
  {
    id: 'waec',
    label: 'WAEC',
    icon: <MaterialCommunityIcons name="card-account-details" size={ICON_SIZE} />,
    screen: 'EducationPurchase',
    gradient: ['#667EEA', '#764BA2'],
  },
  {
    id: 'more',
    label: 'More',
    icon: <Feather name="more-horizontal" size={ICON_SIZE} />,
    screen: 'AllServices',
    gradient: ['#5F72BD', '#9B23EA'],
  },
];

// Quick Actions Configuration
const quickActions = [
  { 
    label: 'Airtime', 
    icon: 'call', 
    gradient: ['#667EEA', '#764BA2'], 
    screen: 'Airtime' 
  },
  { 
    label: 'Data', 
    icon: 'wifi', 
    gradient: ['#F093FB', '#F5576C'], 
    screen: 'Data' 
  },
  {
    label: 'Electricity',
    icon: 'flash',
    gradient: ['#4FACFE', '#00F2FE'],
    screen: 'ElectricityPurchase',
  },
  {
    label: 'Invoice',
    icon: 'document-text',
    gradient: ['#43E97B', '#38F9D7'],
    screen: 'Invoices',
  },
];

/**
 * Service Card Component (Memoized for performance)
 */
const ServiceCard = React.memo(({ service, onPress, themeColors }) => {
  const isDisabled = !service.screen;

  return (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isDisabled}
      accessibilityLabel={`${service.label} service`}
      accessibilityRole="button"
      accessibilityHint={
        isDisabled 
          ? 'Coming soon' 
          : `Navigate to ${service.label} screen`
      }
      accessibilityState={{ disabled: isDisabled }}
    >
      <LinearGradient
        colors={service.gradient}
        style={[
          styles.iconCircle,
          { opacity: isDisabled ? 0.5 : 1 },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {React.cloneElement(service.icon, { 
          color: '#FFFFFF' 
        })}
        {isDisabled && (
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Soon</Text>
          </View>
        )}
      </LinearGradient>
      <Text 
        style={[
          styles.serviceLabel, 
          { color: themeColors.heading }
        ]}
        numberOfLines={2}
      >
        {service.label}
      </Text>
    </TouchableOpacity>
  );
});

/**
 * Quick Action Item Component (Memoized)
 */
const QuickActionItem = React.memo(({ action, onPress }) => (
  <TouchableOpacity
    style={styles.quickActionItem}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityLabel={`${action.label} button`}
    accessibilityRole="button"
    accessibilityHint={`Navigate to ${action.label} screen`}
  >
    <LinearGradient
      colors={action.gradient}
      style={styles.quickActionIcon}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Ionicons name={action.icon} size={18} color="#fff" />
    </LinearGradient>
    <Text style={[styles.quickActionText, { color: '#1e293b' }]}>
      {action.label}
    </Text>
  </TouchableOpacity>
));

/**
 * Enhanced HomeScreen Component
 */
export default function HomeScreen({route}) {
  const navigation = useNavigation();
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { wallet, refreshWallet, transactions, fetchTransactions } = useWallet();
  const { unreadCount } = useNotifications();
  const [user, setUser] = useState(null);
  
  // State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Custom Hook for wallet balance management
  const {
    balance,
    formattedBalance,
    isVisible: balanceVisible,
    toggleVisibility,
  } = useWalletBalance();

  // Both light-mode and dark-mode gradients are dark — status bar icons must
  // always be white. useFocusEffect re-applies on every tab focus so returning
  // from other screens (which may set dark-content) doesn't break it.
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
      loadUserFromStorage();
    }
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  /**
   * Refresh handler
   */
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await Promise.all([
        refreshWallet(),
        fetchTransactions({ limit: 5, page: 1 }).catch(() => {}),
      ]);
    } catch (err) {
      setError('Failed to refresh. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  /**
   * Handle service navigation
   */
  const handleServicePress = useCallback((screen) => {
    if (screen) {
      navigation.navigate(screen);
    }
  }, [navigation]);

  /**
   * Handle quick action navigation
   */
  const handleQuickActionPress = useCallback((screen) => {
    navigation.navigate(screen);
  }, [navigation]);

  /**
   * Get greeting based on time
   */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Get user's first name
  const userName = wallet?.user?.name?.split(' ')[0] || 'User';

  const formatTxDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getTxName = (type) => {
    const names = {
      airtime: 'Airtime Recharge',
      data: 'Data Bundle',
      electricity: 'Electricity Payment',
      tv: 'TV Subscription',
      education: 'Exam Pin',
      wallet_topup: 'Wallet Top-up',
      referral_bonus: 'Referral Bonus',
      transport_booking: 'Bus Booking',
      flight_booking: 'Flight Booking',
    };
    return names[type] || type;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >

      {/* Header Section with Gradient */}
      <LinearGradient
        colors={isDarkMode ? ['#1a1a2e', '#16213e'] : ['#667EEA', '#764BA2']}
        style={styles.headerWrapper}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Top Bar */}
        <View style={styles.header}>
          <View style={styles.user}>
            <View>
              <Text style={styles.greetingTime}>
                {getGreeting()}
              </Text>
              <Text style={styles.greeting}>
                {user ? user.firstName : 'Welcome'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.avatar}
              accessibilityLabel="Notifications"
              accessibilityRole="button"
              onPress={() => navigation.navigate('Notifications')}
            >
              <View style={styles.notificationIconContainer}>
                <Ionicons name="notifications-outline" size={24} color="#ffffff" />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Wallet Card with Glassmorphism */}
        <View style={styles.walletWrapper}>
          <BlurView intensity={20} tint={isDarkMode ? "dark" : "light"} style={styles.walletBlur}>
            <LinearGradient
              colors={isDarkMode 
                ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] 
                : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
              style={styles.walletGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.walletInner}>
                {/* Top Section */}
                <View style={styles.walletTop}>
                  <View style={styles.balanceHeader}>
                    <View style={styles.balanceContainer}>
                      <Text style={[
                        styles.walletLabel,
                        { color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.6)' }
                      ]}>
                        Wallet Balance
                      </Text>
                      <TouchableOpacity
                        style={styles.balanceToggle}
                        onPress={toggleVisibility}
                        accessibilityLabel={
                          balanceVisible ? 'Hide balance' : 'Show balance'
                        }
                        accessibilityRole="button"
                      >
                        <Entypo
                          name={balanceVisible ? 'eye' : 'eye-with-line'}
                          size={18}
                          color={isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.6)'}
                        />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.historyBtn}
                      onPress={() => navigation.navigate('Orders')}
                      accessibilityLabel="View transaction history"
                      accessibilityRole="button"
                    >
                      <Ionicons 
                        name="time-outline" 
                        size={16} 
                        color={isDarkMode ? 'rgba(255,255,255,0.9)' : '#667EEA'} 
                      />
                      <Text style={[
                        styles.historyText,
                        { color: isDarkMode ? 'rgba(255,255,255,0.9)' : '#667EEA' }
                      ]}>
                        History
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Balance Display */}
                  <View style={styles.balanceWrapper}>
                    {isLoading ? (
                      <ActivityIndicator size="large" color="#667EEA" />
                    ) : (
                      <Text style={[
                        styles.walletAmount,
                        { color: isDarkMode ? '#ffffff' : '#1a1a2e' }
                      ]}>
                        {formattedBalance}
                      </Text>
                    )}
                  </View>

                  {/* Actions */}
                  <View style={styles.walletActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => navigation.navigate('Wallet')}
                      activeOpacity={0.8}
                      accessibilityLabel="Top up wallet"
                      accessibilityRole="button"
                    >
                      <LinearGradient
                        colors={['#667EEA', '#764BA2']}
                        style={styles.actionBtnGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
                        <Text style={styles.topText}>Top up</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => navigation.navigate('TransferScreen')}
                      activeOpacity={0.8}
                      accessibilityLabel="Bank transfer"
                      accessibilityRole="button"
                    >
                      <LinearGradient
                        colors={['#11998E', '#38EF7D']}
                        style={styles.actionBtnGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons name="arrow-up-circle-outline" size={20} color="#ffffff" />
                        <Text style={styles.topText}>Transfer</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View
        style={[
          styles.mainContent,
          { backgroundColor: themeColors.background },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={themeColors.primary}
              colors={[themeColors.primary]}
            />
          }
        >
          {/* Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons
                name="alert-circle"
                size={20}
                color="#EF4444"
              />
              <Text style={styles.errorText}>
                {error}
              </Text>
              <TouchableOpacity onPress={() => setError(null)}>
                <Ionicons
                  name="close"
                  size={20}
                  color="#EF4444"
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
                Quick Actions
              </Text>
            </View>
            <View style={[styles.quickActions, { backgroundColor: themeColors.card }]}>
              {quickActions.map((action, index) => (
                <QuickActionItem
                  key={index}
                  action={action}
                  onPress={() => handleQuickActionPress(action.screen)}
                />
              ))}
            </View>
          </View>

          {/* Services Grid */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
              Our Services
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AllServices')}
              accessibilityLabel="View all services"
            >
              <Text style={styles.viewAll}>
                View All →
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.section, { backgroundColor: themeColors.card }]}>
            <View style={styles.grid}>
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onPress={() => handleServicePress(service.screen)}
                  themeColors={themeColors}
                />
              ))}
            </View>
          </View>

          {/* Promo Section */}
          <PromoCard
            title="🎉 Refer And Win"
            subtitle="Invite your Friends and earn up to ₦10,000"
            buttonText="Refer Now"
            onPress={() => navigation.navigate('Referral')}
            gradientColors={['#FA8BFF', '#2BD2FF', '#2BFF88']}
          />

          {/* Recent Transactions Preview */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
              Recent Transactions
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Orders')}
              accessibilityLabel="View all transactions"
            >
              <Text style={styles.viewAll}>
                View All →
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.section, { backgroundColor: themeColors.card }]}>
            {transactions.length > 0 ? (
              transactions.slice(0, 3).map((tx, index) => (
                <TouchableOpacity
                  key={tx._id || index}
                  style={[
                    styles.txRow,
                    { borderBottomColor: themeColors.border },
                  ]}
                  onPress={() =>
                    navigation.navigate('TransactionDetails', {
                      reference: tx.reference,
                    })
                  }
                >
                  <View style={styles.txLeft}>
                    <LinearGradient
                      colors={[themeColors.gradientStart, themeColors.gradientEnd]}
                      style={styles.txIcon}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons
                        name="receipt-outline"
                        size={22}
                        color="#FFFFFF"
                      />
                    </LinearGradient>
                    <View>
                      <Text
                        style={[styles.txTitle, { color: themeColors.heading }]}
                      >
                        {getTxName(tx.type)}
                      </Text>
                      <Text
                        style={[
                          styles.txDate,
                          { color: themeColors.subheading },
                        ]}
                      >
                        {formatTxDate(tx.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.txRight}>
                    <Text
                      style={[
                        styles.txAmount,
                        {
                          color: ['success', 'successful', 'completed', 'confirmed'].includes(tx.status)
                            ? themeColors.success
                            : tx.status === 'pending'
                              ? themeColors.warning
                              : themeColors.error,
                        },
                      ]}
                    >
                      {formatCurrency(tx.amount, 'NGN')}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      {
                        backgroundColor: ['success', 'successful', 'completed', 'confirmed'].includes(tx.status)
                          ? `${themeColors.success}20`
                          : tx.status === 'pending'
                            ? `${themeColors.warning}20`
                            : `${themeColors.error}20`,
                      }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        {
                          color: ['success', 'successful', 'completed', 'confirmed'].includes(tx.status)
                            ? themeColors.success
                            : tx.status === 'pending'
                              ? themeColors.warning
                              : themeColors.error,
                        }
                      ]}>
                        {tx.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyTransactions}>
                <LinearGradient
                  colors={['#F3F4F6', '#E5E7EB']}
                  style={styles.emptyIcon}
                >
                  <Ionicons
                    name="receipt-outline"
                    size={40}
                    color="#9CA3AF"
                  />
                </LinearGradient>
                <Text
                  style={[
                    styles.emptyText,
                    { color: themeColors.subheading },
                  ]}
                >
                  No recent transactions
                </Text>
                <Text
                  style={[
                    styles.emptySubtext,
                    { color: themeColors.subtext },
                  ]}
                >
                  Your transaction history will appear here
                </Text>
              </View>
            )}
          </View>

          {__DEV__ && <AddWalletFund />}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: CARD_PADDING,
    paddingBottom: 100,
  },
  headerWrapper: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: CARD_PADDING,
    marginBottom: 20,
  },
  user: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingTime: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatar: {
    position: 'relative',
  },
  notificationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  walletWrapper: {
    marginHorizontal: CARD_PADDING,
  },
  walletBlur: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  walletGradient: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  walletInner: {
    padding: 14,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceToggle: {
    padding: 4,
  },
  walletTop: {
    width: '100%',
  },
  walletLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  balanceWrapper: {
    marginVertical: 8,
    alignItems: 'center',
  },
  walletAmount: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  walletActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    gap: 6,
  },
  topText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  historyText: {
    fontWeight: '600',
    fontSize: 14,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  mainContent: {
    flex: 1,
    paddingTop: 20,
    borderTopRightRadius: 28,
    borderTopLeftRadius: 28,
    marginTop: -8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  section: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667EEA', // matches gradientStart — update via themeColors.gradientStart if dynamic
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 20,
  },
  serviceCard: {
    width: (width - CARD_PADDING * 2 - 24) / 4,
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  comingSoonBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  comingSoonText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  serviceLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
  quickActionsContainer: {
    marginBottom: 8,
  },
  quickActions: {
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionItem: {
    alignItems: 'center',
    width: '23%',
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: CARD_PADDING,
    borderBottomWidth: 1,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  txDate: {
    fontSize: 13,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyTransactions: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
  },
});