import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { useWallet } from 'context/WalletContext';
import { formatCurrency } from 'CONSTANT/formatCurrency';
 import { useAuth } from 'context/AuthContext';

/**
 * Profile Menu Item Component
 */
const ProfileMenuItem = ({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  themeColors,
  iconColor,
  showChevron = true,
  badge,
  danger = false,
}) => (
  <TouchableOpacity
    style={[styles.menuItem, { backgroundColor: themeColors.card }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.menuItemLeft}>
      <View style={[
        styles.iconContainer, 
        { backgroundColor: iconColor ? `${iconColor}20` : `${themeColors.primary}20` }
      ]}>
        <Ionicons 
          name={icon} 
          size={22} 
          color={danger ? themeColors.destructive : (iconColor || themeColors.primary)} 
        />
      </View>
      <View style={styles.menuItemContent}>
        <Text style={[
          styles.menuItemTitle, 
          { color: danger ? themeColors.destructive : themeColors.heading }
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.menuItemSubtitle, { color: themeColors.subheading }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
    <View style={styles.menuItemRight}>
      {badge && (
        <View style={[styles.badge, { backgroundColor: themeColors.primary }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {showChevron && (
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={themeColors.subtext} 
        />
      )}
    </View>
  </TouchableOpacity>
);

/**
 * Section Header Component
 */
const SectionHeader = ({ title, themeColors }) => (
  <Text style={[styles.sectionHeader, { color: themeColors.subheading }]}>
    {title}
  </Text>
);

/**
 * Main Profile Screen
 */
export default function ProfileScreen({ navigation }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  
  // ✅ Use wallet context directly
  const { 
    wallet, 
    logout: logoutFromWallet,
    transactionStats,
    fetchTransactions,
  } = useWallet();
  
  const user = wallet?.user;
  const walletBalance = user?.walletBalance || 0;
  const transactionPinSet = wallet?.transactionPinSet || false;
  const [balanceVisible, setBalanceVisible] = useState(true);


  // ========================================
  // HANDLERS
  // ========================================
  
  const handleLogout = useCallback(() => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutFromWallet();
              navigation.replace('Login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  }, [logoutFromWallet, navigation]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => navigation.navigate('DeleteAccount'),
        },
      ]
    );
  }, [navigation]);

  const handleRateApp = useCallback(() => {
    Alert.alert(
      'Rate PayFlex',
      'Would you like to rate us on the App Store?',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Rate Now', onPress: () => console.log('Open app store') },
      ]
    );
  }, []);

  
  // ========================================
  // RENDER
  // ========================================
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[styles.headerCard, { backgroundColor: themeColors.card }]}>
          {/* Avatar & Name */}
          <View style={styles.headerTop}>
            <View style={styles.avatarContainer}>
              {user?.profileImage ? (
                <Image 
                  source={{ uri: user.profileImage }} 
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.primary }]}>
                  <Text style={styles.avatarText}>
                  {/* {user ? user.firstName : ''} */}
                    {user?.firstName?.charAt(0)?.toUpperCase() || 'E'}
                  </Text>
                </View>
              )}
              <TouchableOpacity 
                style={[styles.editAvatarButton, { backgroundColor: themeColors.primary }]}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.headerInfo}>
              <Text style={[styles.userName, { color: themeColors.heading }]}>
                {user?.firstName || 'Emmanuel'}
              </Text>
              <Text style={[styles.userEmail, { color: themeColors.subheading }]}>
                {user?.email || 'user@email.com'}
              </Text>
              <TouchableOpacity 
                style={[styles.verificationBadge, { 
                  backgroundColor: user?.isVerified ? '#4CAF5020' : `${themeColors.primary}20` 
                }]}
                onPress={() => navigation.navigate('VerifyNIN')}
              >
                <Ionicons 
                  name={user?.isVerified ? "shield-checkmark" : "shield-outline"} 
                  size={14} 
                  color={user?.isVerified ? '#4CAF50' : themeColors.primary} 
                />
                <Text style={[
                  styles.verificationText, 
                  { color: user?.isVerified ? '#4CAF50' : themeColors.primary }
                ]}>
                  {user?.isVerified ? 'Verified' : 'Verify NIN'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Wallet Balance */}
          <View style={[styles.balanceCard, { backgroundColor: themeColors.primary }]}>
            <View style={styles.balanceHeader}>
              <Text style={[styles.balanceLabel, { color: themeColors.background }]}>
                Wallet Balance
              </Text>
              <TouchableOpacity 
                onPress={() => setBalanceVisible(!balanceVisible)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons 
                  name={balanceVisible ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color={themeColors.background} 
                />
              </TouchableOpacity>
            </View>
            <Text style={[styles.balanceAmount, { color: themeColors.card }]}>
              {balanceVisible 
                ? formatCurrency(wallet?.user?.walletBalance || 0, 'NGN')
                : '₦ ••••••'
              }
            </Text>
            <TouchableOpacity 
              style={[styles.fundWalletButton, { backgroundColor: themeColors.card }]}
              onPress={() => navigation.navigate('FundWallet')}
            >
              <Ionicons name="add-circle-outline" size={18} color={themeColors.primary} />
              <Text style={[styles.fundWalletText, {color: themeColors.primary}]}>Fund Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: themeColors.card }]}
            onPress={() => navigation.navigate('TransactionHistory')}
          >
            <Ionicons name="receipt-outline" size={24} color="#4CAF50" />
            <Text style={[styles.statValue, { color: themeColors.heading }]}>
              {wallet?.stats?.totalTransactions || 0}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.subheading }]}>
              Transactions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: themeColors.card }]}
            onPress={() => navigation.navigate('Expenses')}
          >
            <Ionicons name="trending-down-outline" size={24} color="#FF6B6B" />
            <Text style={[styles.statValue, { color: themeColors.heading }]}>
              {formatCurrency(wallet?.stats?.totalSpent || 0, 'NGN')}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.subheading }]}>
              Total Spent
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: themeColors.card }]}
            onPress={() => navigation.navigate('Referral')}
          >
            <Ionicons name="people-outline" size={24} color="#FFA500" />
            <Text style={[styles.statValue, { color: themeColors.heading }]}>
              {user?.referralCount || 0}
            </Text>
            <Text style={[styles.statLabel, { color: themeColors.subheading }]}>
              Referrals
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <SectionHeader title="ACCOUNT" themeColors={themeColors} />
        
        <ProfileMenuItem
          icon="person-outline"
          title="My Profile"
          subtitle="View and edit your profile"
          onPress={() => navigation.navigate('MyProfile')}
          themeColors={themeColors}
          iconColor="#4CAF50"
        />

        <ProfileMenuItem
          icon="bar-chart-outline"
          title="Analytics & Reports"
          subtitle="View your spending insights"
          onPress={() => navigation.navigate('Analytics')}
          themeColors={themeColors}
          iconColor="#1E40AF"
        />

        <ProfileMenuItem
          icon="wallet-outline"
          title="Expenses"
          subtitle="Track your spending by service"
          onPress={() => navigation.navigate('Expenses')}
          themeColors={themeColors}
          iconColor="#FF6B6B"
        />

        <ProfileMenuItem
          icon="receipt-outline"
          title="Transaction History"
          subtitle="View all your transactions"
          onPress={() => navigation.navigate('TransactionDetails')}
          themeColors={themeColors}
          iconColor="#7C3AED"
        />

        {/* Referral & Rewards */}
        <SectionHeader title="REWARDS" themeColors={themeColors} />
        
        <ProfileMenuItem
          icon="gift-outline"
          title="Referral Program"
          subtitle="Invite friends and earn rewards"
          onPress={() => navigation.navigate('Referral')}
          themeColors={themeColors}
          iconColor="#FFA500"
          badge={user?.referralEarnings ? `₦${user.referralEarnings}` : null}
        />

        {/* Settings Section */}
        <SectionHeader title="SETTINGS" themeColors={themeColors} />
        
        <ProfileMenuItem
          icon="settings-outline"
          title="Settings"
          subtitle="Payment, login & preferences"
          onPress={() => navigation.navigate('Settings')}
          themeColors={themeColors}
          iconColor="#6B7280"
        />

        <ProfileMenuItem
          icon="notifications-outline"
          title="Notifications"
          subtitle="Manage your notifications"
          onPress={() => navigation.navigate('Notification')}
          themeColors={themeColors}
          iconColor="#8B5CF6"
        />

        {/* Support Section */}
        <SectionHeader title="SUPPORT" themeColors={themeColors} />
        
        <ProfileMenuItem
          icon="help-circle-outline"
          title="Help & Support"
          subtitle="Contact us, FAQs"
          onPress={() => navigation.navigate('HelpSupport')}
          themeColors={themeColors}
          iconColor="#10B981"
        />

        <ProfileMenuItem
          icon="star-outline"
          title="Rate Us"
          subtitle="Share your feedback"
          onPress={handleRateApp}
          themeColors={themeColors}
          iconColor="#F59E0B"
        />

        <ProfileMenuItem
          icon="information-circle-outline"
          title="About"
          subtitle="Terms, privacy & app version"
          onPress={() => navigation.navigate('About')}
          themeColors={themeColors}
          iconColor="#6366F1"
        />

        {/* Danger Zone */}
        <SectionHeader title="ACCOUNT ACTIONS" themeColors={themeColors} />
        
        <ProfileMenuItem
          icon="log-out-outline"
          title="Logout"
          onPress={handleLogout}
          themeColors={themeColors}
          iconColor="#FF6B6B"
          showChevron={false}
        />

        <ProfileMenuItem
          icon="trash-outline"
          title="Delete Account"
          subtitle="Permanently delete your account"
          onPress={handleDeleteAccount}
          themeColors={themeColors}
          danger={true}
        />

        {/* App Version */}
        <Text style={[styles.appVersion, { color: themeColors.subtext }]}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ========================================
  // HEADER CARD
  // ========================================
  headerCard: {
    marginVertical: 30,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: "100%",
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ========================================
  // WALLET BALANCE CARD
  // ========================================
  balanceCard: {
    padding: 16,
    borderRadius: 18,
    marginTop: 12,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  fundWalletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  fundWalletText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // ========================================
  // QUICK STATS
  // ========================================
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },

  // ========================================
  // SECTION HEADER
  // ========================================
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  // ========================================
  // MENU ITEMS
  // ========================================
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // ========================================
  // APP VERSION
  // ========================================
  appVersion: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
    marginBottom: 8,
  },
});