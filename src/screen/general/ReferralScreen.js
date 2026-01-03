// screens/ReferralScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Share,
  Clipboard,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from 'context/ThemeContext';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { ScreenHeader } from 'component/SHARED';
import { formatCurrency } from 'CONSTANT/formatCurrency';
// import referralAPI from '../services/referralService';

// ============================================
// STATS CARD COMPONENT
// ============================================
const StatsCard = ({ icon, label, value, color, themeColors }) => (
  <View style={[styles.statsCard, { backgroundColor: themeColors.card }]}>
    <View style={[styles.statsIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={[styles.statsValue, { color: themeColors.heading }]}>{value}</Text>
    <Text style={[styles.statsLabel, { color: themeColors.subtext }]}>{label}</Text>
  </View>
);

// ============================================
// MILESTONE CARD COMPONENT
// ============================================
const MilestoneCard = ({ milestone, reward, current, claimed, onClaim, themeColors }) => {
  const progress = (current / milestone) * 100;
  const isEligible = current >= milestone && !claimed;
  const isCompleted = claimed;

  return (
    <View style={[styles.milestoneCard, { backgroundColor: themeColors.card }]}>
      <View style={styles.milestoneHeader}>
        <View style={styles.milestoneInfo}>
          <Text style={[styles.milestoneTitle, { color: themeColors.heading }]}>
            {milestone} Referrals
          </Text>
          <Text style={[styles.milestoneReward, { color: themeColors.primary }]}>
            {formatCurrency(reward, 'NGN')}
          </Text>
        </View>
        {isCompleted ? (
          <View style={[styles.completedBadge, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={[styles.completedText, { color: '#10B981' }]}>Claimed</Text>
          </View>
        ) : isEligible ? (
          <TouchableOpacity
            style={[styles.claimButton, { backgroundColor: themeColors.primary }]}
            onPress={onClaim}
          >
            <Text style={styles.claimButtonText}>Claim</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.milestoneProgress, { color: themeColors.subtext }]}>
            {current}/{milestone}
          </Text>
        )}
      </View>
      
      {/* Progress Bar */}
      {!isCompleted && (
        <View style={[styles.progressBar, { backgroundColor: themeColors.border }]}>
          <View
            style={[
              styles.progressFill,
              { 
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: themeColors.primary 
              }
            ]}
          />
        </View>
      )}
    </View>
  );
};

// ============================================
// REFERRAL USER CARD
// ============================================
const ReferralUserCard = ({ user, themeColors }) => (
  <View style={[styles.userCard, { backgroundColor: themeColors.card }]}>
    <View style={[styles.userAvatar, { backgroundColor: `${themeColors.primary}20` }]}>
      <Text style={[styles.userInitial, { color: themeColors.primary }]}>
        {user.firstName.charAt(0).toUpperCase()}
      </Text>
    </View>
    <View style={styles.userInfo}>
      <Text style={[styles.userName, { color: themeColors.heading }]}>
        {user.firstName} {user.lastName}
      </Text>
      <Text style={[styles.userDate, { color: themeColors.subtext }]}>
        Joined {new Date(user.createdAt).toLocaleDateString()}
      </Text>
    </View>
    <View style={[styles.successBadge, { backgroundColor: '#10B98120' }]}>
      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
    </View>
  </View>
);

// ============================================
// MAIN SCREEN
// ============================================
export default function ReferralScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'history', 'leaderboard'

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const response = await referralAPI.getReferralInfo();
      if (response.success) {
        setReferralData(response.data);
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
      Alert.alert('Error', 'Failed to load referral information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReferralData();
  };

  const handleCopyCode = () => {
    Clipboard.setString(referralData.referralCode);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };

  const handleCopyLink = () => {
    Clipboard.setString(referralData.referralLink);
    Alert.alert('Copied!', 'Referral link copied to clipboard');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join PayFlex and get amazing rewards! Use my referral code: ${referralData.referralCode}\n\nOr click this link: ${referralData.referralLink}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleClaimMilestone = async (milestone) => {
    try {
      const response = await referralAPI.claimMilestoneReward(milestone);
      if (response.success) {
        Alert.alert('Success!', response.message);
        loadReferralData(); // Refresh data
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to claim reward');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  const milestones = [
    { count: 10, reward: 2000, claimed: referralData?.claimedMilestones?.includes(10) },
    { count: 25, reward: 5000, claimed: referralData?.claimedMilestones?.includes(25) },
    { count: 50, reward: 15000, claimed: referralData?.claimedMilestones?.includes(50) },
    { count: 100, reward: 50000, claimed: referralData?.claimedMilestones?.includes(100) },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />
      
      <ScreenHeader
        title="Referral Program"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Hero Card */}
        <LinearGradient
          colors={[themeColors.primary, '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroIcon}>
              <Ionicons name="gift" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.heroTitle}>Invite Friends & Earn</Text>
            <Text style={styles.heroSubtitle}>
              Get rewarded for every friend who joins PayFlex using your referral code or link
            </Text>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatsCard
            icon="people"
            label="Total Referrals"
            value={referralData?.totalReferrals || 0}
            color="#8B5CF6"
            themeColors={themeColors}
          />
          <StatsCard
            icon="cash"
            label="Total Earned"
            value={formatCurrency(referralData?.totalEarnings || 0, 'NGN')}
            color="#10B981"
            themeColors={themeColors}
          />
        </View>

        {/* Referral Code & Link */}
        <View style={[styles.referralCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
            Your Referral Code
          </Text>
          
          <View style={[styles.codeContainer, { backgroundColor: themeColors.background }]}>
            <Text style={[styles.codeText, { color: themeColors.primary }]}>
              {referralData?.referralCode}
            </Text>
            <TouchableOpacity
              style={[styles.copyButton, { backgroundColor: `${themeColors.primary}20` }]}
              onPress={handleCopyCode}
            >
              <Ionicons name="copy-outline" size={20} color={themeColors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
            <Text style={[styles.dividerText, { color: themeColors.subtext }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
          </View>

          <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
            Your Referral Link
          </Text>
          
          <View style={[styles.linkContainer, { backgroundColor: themeColors.background }]}>
            <Text
              style={[styles.linkText, { color: themeColors.subheading }]}
              numberOfLines={1}
            >
              {referralData?.referralLink}
            </Text>
            <TouchableOpacity
              style={[styles.copyButton, { backgroundColor: `${themeColors.primary}20` }]}
              onPress={handleCopyLink}
            >
              <Ionicons name="link-outline" size={20} color={themeColors.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: themeColors.primary }]}
            onPress={handleShare}
          >
            <Ionicons name="share-social" size={20} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>Share with Friends</Text>
          </TouchableOpacity>
        </View>

        {/* How It Works */}
        <View style={[styles.howItWorksCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
            How It Works
          </Text>
          
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: `${themeColors.primary}20` }]}>
              <Text style={[styles.stepNumberText, { color: themeColors.primary }]}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: themeColors.heading }]}>
                Share Your Code
              </Text>
              <Text style={[styles.stepText, { color: themeColors.subtext }]}>
                Share your unique referral code or link with friends
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: `${themeColors.primary}20` }]}>
              <Text style={[styles.stepNumberText, { color: themeColors.primary }]}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: themeColors.heading }]}>
                They Sign Up
              </Text>
              <Text style={[styles.stepText, { color: themeColors.subtext }]}>
                Your friend creates an account using your referral
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: `${themeColors.primary}20` }]}>
              <Text style={[styles.stepNumberText, { color: themeColors.primary }]}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: themeColors.heading }]}>
                Get Rewarded
              </Text>
              <Text style={[styles.stepText, { color: themeColors.subtext }]}>
                Earn ₦500-₦1000 instantly credited to your wallet
              </Text>
            </View>
          </View>
        </View>

        {/* Milestone Rewards */}
        <Text style={[styles.milestoneHeader, { color: themeColors.heading }]}>
          Milestone Rewards
        </Text>
        
        {milestones.map((milestone) => (
          <MilestoneCard
            key={milestone.count}
            milestone={milestone.count}
            reward={milestone.reward}
            current={referralData?.totalReferrals || 0}
            claimed={milestone.claimed}
            onClaim={() => handleClaimMilestone(milestone.count)}
            themeColors={themeColors}
          />
        ))}

        {/* Recent Referrals */}
        {referralData?.referredUsers?.length > 0 && (
          <>
            <Text style={[styles.milestoneHeader, { color: themeColors.heading }]}>
              Recent Referrals
            </Text>
            {referralData.referredUsers.map((user) => (
              <ReferralUserCard
                key={user._id}
                user={user}
                themeColors={themeColors}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Hero Card
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Referral Card
  referralCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  codeText: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  linkText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    marginRight: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // How It Works
  howItWorksCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Milestones
  milestoneHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  milestoneCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  milestoneReward: {
    fontSize: 18,
    fontWeight: '700',
  },
  milestoneProgress: {
    fontSize: 14,
    fontWeight: '600',
  },
  claimButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Referral Users
  userCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitial: {
    fontSize: 16,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  userDate: {
    fontSize: 12,
  },
  successBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});