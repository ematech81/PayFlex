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
import { useNavigation } from '@react-navigation/native';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';

import { useWalletNavigation } from 'constants/useWalletNavigation';
import { useWalletBalance } from 'HOOKS';
import { PromoCard } from 'component/SHARED';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { useWallet } from 'context/WalletContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddWalletFund from 'component/AddWalletFund';






const { width, height } = Dimensions.get('window');
const CARD_PADDING = 13;
const ICON_SIZE = 22;

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
  },
  {
    id: 'jamb',
    label: 'JAMB',
    icon: <FontAwesome6 name="credit-card" size={ICON_SIZE} stokeWidth='20' />,
    screen: 'EducationPurchase', 
  },
  {
    id: 'airtim-cash',
    label: 'Airtime to Cash',
   icon: <FontAwesome5 name="exchange-alt" size={ICON_SIZE}  stokeWidth='20'/>,
    screen: 'Airtime-Cash', 
  },
  {
    id: 'tv',
    label: 'TV Subs',
    icon: <MaterialCommunityIcons name="television" size={ICON_SIZE}  stokeWidth='20'/>,
    screen: 'TVSubscription',
  },
  {
    id: 'flights',
    label: 'Flights',
    icon: <FontAwesome5 name="plane" size={ICON_SIZE} stokeWidth='20' />,
    screen: 'TransportScreen', // Not implemented yet
  },
  {
    id: 'hotels',
    label: 'Hotels',
    icon: <Ionicons name="bed" size={ICON_SIZE} stokeWidth='20' />,
    screen: null, // Not implemented yet
  },
  {
    id: 'waec',
    label: 'WAEC',
    icon: <MaterialCommunityIcons name="card-account-details" size={ICON_SIZE} stokeWidth='20' />,
    screen: 'EducationPurchase', // Not implemented yet
  },
  {
    id: 'more',
    label: 'More',
    icon: <Feather name="more-horizontal" size={ICON_SIZE} stokeWidth='20' />,
    screen: 'AllServices', 
  },
];

// Quick Actions Configuration
const quickActions = [
  { 
    label: 'Airtime', 
    icon: 'call', 
    bg: '#2563eb', 
    screen: 'Airtime' 
  },
  { 
    label: 'Data', 
    icon: 'wifi', 
    bg: '#f97316', 
    screen: 'Data' 
  },
  {
    label: 'Electricity',
    icon: 'flash',
    bg: '#16a34a',
    screen: 'ElectricityPurchase',
  },
  {
    label: 'Invoice',
    icon: 'document-text',
    bg: '#64748b',
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
      <View style={styles.serviceIconWrap}>
        <View
          style={[
            styles.iconCircle,
            { 
              backgroundColor: `${themeColors.buttonBackground}15`,
              opacity: isDisabled ? 0.5 : 1,
            },
          ]}
        >
          {React.cloneElement(service.icon, { 
            color: themeColors.primary 
          })}
        </View>
        {isDisabled && (
          <View style={[
            styles.comingSoonBadge, 
            { backgroundColor: themeColors.primary }
          ]}>
            <Text style={styles.comingSoonText}>Soon</Text>
          </View>
        )}
      </View>
      <Text 
        style={[
          styles.serviceLabel, 
          { color: themeColors.heading }
        ]}
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
    <View
      style={[
        styles.quickActionIcon,
        { backgroundColor: action.bg },
      ]}
    >
      <Ionicons name={action.icon} size={19} color="#fff" />
    </View>
    <Text style={styles.quickActionText}>{action.label}</Text>
  </TouchableOpacity>
));

/**
 * Enhanced HomeScreen Component
 */
export default function HomeScreen({route}) {
  const navigation = useNavigation();
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { wallet,refreshWallet } = useWallet();
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

useEffect(() => {
    refreshWallet();
  }, []);




  useEffect(() => {
    // 1️⃣ If user was passed from navigation, use it
    if (route.params?.user) {
      setUser(route.params.user);
    } else {
      // 2️⃣ Otherwise, load from AsyncStorage
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
      // TODO: Refresh wallet balance from API
      await new Promise(resolve => setTimeout(resolve, 1000));
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.primary }]}
    >
      <StatusBar
        barStyle= "light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header Section */}
      <View style={styles.headerWrapper}>
        {/* Top Bar */}
        <View style={styles.header}>
          <View style={styles.user}>
            <View>
              <Text style={[styles.greetingTime, { color: themeColors.card }]}>
                {getGreeting()}
              </Text>
              <Text style={[styles.greeting, { color: themeColors.card }]}>
              {user ? user.firstName : ''}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              accessibilityLabel="Notifications"
              accessibilityRole="button"
            >
              <Ionicons name="notifications-outline" size={20} color="#ffffff" />
              {/* Notification Badge */}
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Wallet Card with Glassmorphism */}
        <View style={styles.walletWrapper}>
           
            <View style={styles.walletInner}>
              {/* Top Section */}
              <View style={styles.walletTop}>
                <View style={styles.historyContainer}>
                  <View style={styles.balanceContainer}>
                    <Text style={styles.walletLabel}>
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
                        size={20}
                        color="rgba(255,255,255,0.9)"
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.historyBtn}
                    onPress={() => navigation.navigate('Orders')}
                    accessibilityLabel="View transaction history"
                    accessibilityRole="button"
                  >
                    <Text style={styles.historyText}>History</Text>
                  </TouchableOpacity>
                </View>

                {/* Balance Display */}
                <View style={styles.balanceWrapper}>
                  {isLoading ? (
                    <ActivityIndicator size="large" color="#471c1cff" />
                  ) : (
                    <Text style={styles.walletAmount}>
                      {/* {walletBalance} */}
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
                    <Ionicons name="add-circle" size={18} color="#ffffff" />
                    <Text style={styles.topText}>Top up</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cardDetails}
                    onPress={() => navigation.navigate('Wallet')}
                    accessibilityLabel="View linked card details"
                    accessibilityRole="button"
                  >
                    <Text style={styles.actionText}>
                      Linked Card *****78903
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
        </View>
        {/* <TouchableOpacity
        onPress={navigation.navigate('TransactionDetails')}
        ><Text style={{fontSize: 22, paddingLeft: 20, color: '#ffffff'}}>Go to transaction details</Text></TouchableOpacity> */}
      </View>

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
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: `${themeColors.destructive}20` },
              ]}
            >
              <Ionicons
                name="alert-circle"
                size={16}
                color={themeColors.destructive}
              />
              <Text
                style={[styles.errorText, { color: themeColors.destructive }]}
              >
                {error}
              </Text>
              <TouchableOpacity onPress={() => setError(null)}>
                <Ionicons
                  name="close"
                  size={16}
                  color={themeColors.destructive}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Actions */}
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
                Quick Action
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.quickActions, { backgroundColor: themeColors.card }]}
              contentContainerStyle={styles.quickActionsContent}
            >
              {quickActions.map((action, index) => (
                <QuickActionItem
                  key={index}
                  action={action}
                  onPress={() => handleQuickActionPress(action.screen)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Services Grid */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
              Services
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AllServices')}
              accessibilityLabel="View all services"
            >
              <Text style={[styles.viewAll, { color: themeColors.subheading }]}>
                View All
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
            buttonText="Refer"
            onPress={() => navigation.navigate('Referral')}
            gradientColors={['#FFD98E', '#FFB800']}
          />

          {/* Recent Transactions Preview (Optional) */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
              Recent Transactions
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Orders')}
              accessibilityLabel="View all transactions"
            >
              <Text style={[styles.viewAll, { color: themeColors.subheading }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.section, { backgroundColor: themeColors.card }]}>
            {wallet?.recentTransactions?.length > 0 ? (
              wallet.recentTransactions.slice(0, 3).map((tx, index) => (
                <TouchableOpacity
                  key={index}
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
                    <View
                      style={[
                        styles.txIcon,
                        { backgroundColor: `${themeColors.primary}15` },
                      ]}
                    >
                      <Ionicons
                        name="receipt-outline"
                        size={20}
                        color={themeColors.primary}
                      />
                    </View>
                    <View>
                      <Text
                        style={[styles.txTitle, { color: themeColors.heading }]}
                      >
                        {tx.type}
                      </Text>
                      <Text
                        style={[
                          styles.txDate,
                          { color: themeColors.subheading },
                        ]}
                      >
                        {tx.date}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.txAmount,
                      {
                        color:
                          tx.status === 'success'
                            ? '#16a34a'
                            : themeColors.destructive,
                      },
                    ]}
                  >
                    {formatCurrency(tx.amount, 'NGN')}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyTransactions}>
                <Ionicons
                  name="receipt-outline"
                  size={48}
                  color={themeColors.subtext}
                />
                <Text
                  style={[
                    styles.emptyText,
                    { color: themeColors.subheading },
                  ]}
                >
                  No recent transactions
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
    height: isTablet() ? height * 0.33 : height * 0.45,
  },
  header: {
    marginTop: 30,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  user: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  greetingTime: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    opacity: 0.9,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  walletWrapper: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  walletGradient: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  walletInner: {
    padding: 20,
  },
  balanceWrapper: {
    marginVertical: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  balanceContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  balanceToggle: {
    padding: 4,
  },
  walletTop: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500',
  },
  walletAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  walletActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ccc',
    // backgroundColor: 'rgba(255,255,255,0.15)',
    gap: 6,
  },
  topText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  historyBtn: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  cardDetails: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyText: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    fontSize: 13,
  },
  actionText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    paddingTop: 10,
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
    marginTop: -7,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: CARD_PADDING,
    paddingVertical: 16,
  },
  serviceCard: {
    width: (width - CARD_PADDING * 2 - 28) / 4,
    alignItems: 'center',
    marginBottom: 35,
  },
  serviceIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
    // backgroundColor: 'red'
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#000'
  },
  comingSoonBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  comingSoonText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '700',
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  quickActions: {
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    borderRadius: 20,
    paddingVertical: 16,
  },
  quickActionsContent: {
    paddingHorizontal: CARD_PADDING,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width - CARD_PADDING * 2,
  },
  quickActionItem: {
    alignItems: 'center',
    width: '23%',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: CARD_PADDING,
    borderBottomWidth: 1,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  txDate: {
    fontSize: 12,
    marginTop: 4,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyTransactions: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
});