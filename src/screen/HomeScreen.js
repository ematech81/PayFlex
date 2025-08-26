import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ScrollView,
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
import PromoCarousel from 'component/promoCarousel';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_PADDING = 13;
const ICON_SIZE = 19;

const services = [
  {
    id: 'beting',
    label: 'Betting',
    icon: <FontAwesome name="soccer-ball-o" size={ICON_SIZE} />,
  },
  {
    id: 'jamb',
    label: 'JAMB',
    icon: <FontAwesome6 name="credit-card" size={ICON_SIZE} />,
  },
  {
    id: 'bills',
    label: 'Bills',
    icon: <Ionicons name="document-text" size={ICON_SIZE} />,
  },
  {
    id: 'tv',
    label: 'TV Subs',
    icon: <MaterialCommunityIcons name="television" size={ICON_SIZE} />,
    screen: 'TVSubscription',
  },
  {
    id: 'flights',
    label: 'Flights',
    icon: <FontAwesome5 name="plane" size={ICON_SIZE} />,
  },
  {
    id: 'hotels',
    label: 'Hotels',
    icon: <Ionicons name="bed" size={ICON_SIZE} />,
  },
  {
    id: 'waec',
    label: 'WAEC',
    icon: (
      <MaterialCommunityIcons name="card-account-details" size={ICON_SIZE} />
    ),
  },
  {
    id: 'more',
    label: 'More',
    icon: <Feather name="more-vertical" size={ICON_SIZE} />,
  },
];

const quickActions = [
  { label: 'Airtime', icon: 'call', bg: '#2563eb', screen: 'Airtime' },
  { label: 'Data', icon: 'wifi', bg: '#f97316', screen: 'Data' },
  {
    label: 'Electricity',
    icon: 'flash',
    bg: '#16a34a',
    screen: 'ElectricityPurchase',
  },
  { label: 'More', icon: 'ellipsis-horizontal', bg: '#64748b' },
];

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        // soft premium light gradient background
        colors={['#F7FBFF', '#F5F6FA', '#EFF6FF']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safe}>
          {/* Greeting */}
          <View style={styles.header}>
            <View style={styles.user}>
              <Text style={styles.greeting}>Hi Emmanuel</Text>
              <TouchableOpacity style={styles.avatar}>
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color="#2b2b2b"
                />
              </TouchableOpacity>
            </View>
            <View style={{ width: '100%' }}>
              <Text style={styles.subGreeting}>
                What do you want to pay for today?
              </Text>
            </View>
          </View>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Wallet Card (glassmorphism) */}
            <View style={styles.walletWrapper}>
              <BlurView intensity={60} tint="light" style={styles.walletCard}>
                <View style={styles.walletInner}>
                  <View style={styles.walletTop}>
                    <View style={styles.historyContainer}>
                      <View style={styles.balanceContainer}>
                        <Text style={styles.walletLabel}>Wallet Balance</Text>
                        <TouchableOpacity style={styles.balanceToggle}>
                          <Entypo name="eye" size={24} color="#ccc" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.walletActions}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.depositBtn]}
                        >
                          <Ionicons name="add-circle" size={18} color="#fff" />
                          <Text style={styles.actionText}>History</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    {/* balance */}
                    <View style={{ width: '100%' }}>
                      <Text style={styles.walletAmount}>₦15,000</Text>
                    </View>
                    <View style={styles.walletActions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.depositBtn]}
                      >
                        <Ionicons name="add-circle" size={18} color="#fff" />
                        <Text style={styles.actionText}>Deposit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.withdrawBtn]}
                      >
                        <Ionicons
                          name="cash-outline"
                          size={18}
                          color="#2b2b2b"
                        />
                        <Text style={[styles.actionText, { color: '#2b2b2b' }]}>
                          Withdraw
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* <View style={styles.walletFooter}>
                  <Text style={styles.cardSmall}>
                    Linked card • • • • 1234
                  </Text>
                  <Text style={styles.cardSmall}>Last top-up: Aug 8</Text>
                </View> */}
                </View>
              </BlurView>
            </View>

            {/* Quick Actions */}
            <View>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.quickActions}
                contentContainerStyle={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                {quickActions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickActionItem}
                    onPress={() => navigation.navigate(action.screen)}
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
                ))}
              </ScrollView>
            </View>

            {/* Services Grid */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Services</Text>
              {/* <TouchableOpacity>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity> */}
            </View>

            <View style={styles.section}>
              <View style={styles.grid}>
                {services.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.serviceCard}
                    onPress={() => navigation.navigate(s.screen)}
                  >
                    <LinearGradient
                      colors={['#ffffff', '#f6f8ff']}
                      style={styles.serviceIconWrap}
                    >
                      <View style={styles.iconCircle}>
                        {React.cloneElement(s.icon, { color: '#4A00E0' })}
                      </View>
                    </LinearGradient>

                    <Text style={styles.serviceLabel}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Promotions Banner */}
            <View
              style={[
                styles.promoSection,
                { paddingHorizontal: CARD_PADDING / 2 },
              ]}
            >
              <LinearGradient
                colors={['#FFD98E', '#FFB800']}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.promoCard}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.promoTitle}>🎉 Refer And Win</Text>
                  <Text style={styles.promoSubtitle}>
                    Invite your Friends and earn up to ₦10,000
                  </Text>
                </View>
                <TouchableOpacity style={styles.promoBtn}>
                  <Text style={styles.promoBtnText}>Refer</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
            {/* <PromoCarousel data={promoData} /> */}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: CARD_PADDING,
    paddingBottom: 120,
  },
  header: {
    marginTop: 30,
    justifyContent: 'flext-start',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  user: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A00E0',
    // color: '#0f1724',
  },
  subGreeting: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'left',
    paddingBottom: 10,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },

  walletWrapper: {
    marginTop: 18,
    marginBottom: 12,
  },
  walletCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  walletInner: {
    padding: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    backgroundColor: '#fff',

    borderWidth: 1,
    borderColor: '#4A00E0',
    // borderColor: '#4A00E0',
  },
  historyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // alignItems: 'center',
    width: '100%',
  },
  balanceContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 5,
  },
  balanceToggle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletTop: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletLabel: {
    color: '#374151',
    fontSize: 12,
    marginBottom: 6,
  },
  walletAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0b1220',
  },
  walletActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginLeft: 8,
    width: 100,
  },
  depositBtn: {
    backgroundColor: '#4A00E0',
  },
  withdrawBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6E8F0',
    paddingRight: 5,
  },
  actionText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 12,
  },
  walletFooter: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardSmall: {
    fontSize: 12,
    color: '#6b7280',
  },

  section: {
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  promoSection: {
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: CARD_PADDING / 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f1724',
  },
  viewAll: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },

  grid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: CARD_PADDING / 2,
    paddingVertical: 7,
  },
  serviceCard: {
    width: (width - CARD_PADDING * 2 - 28) / 4,
    alignItems: 'center',
    marginBottom: 14,
  },
  serviceIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,0,224,0.08)',
  },
  serviceLabel: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'center',
  },

  promoCard: {
    borderRadius: 16,
    padding: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2b2b2b',
  },
  promoSubtitle: {
    fontSize: 13,
    color: '#2b2b2b',
    marginTop: 4,
  },
  promoBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  promoBtnText: {
    fontWeight: '700',
    color: '#FF9A00',
  },

  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  txLeft: { flexDirection: 'row', alignItems: 'center' },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txTitle: { fontSize: 14, fontWeight: '700', color: '#0f1724' },
  txDate: { fontSize: 12, color: '#9AA0B4', marginTop: 4 },
  txAmount: { fontSize: 14, fontWeight: '800' },

  bottomNav: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 5,
    height: 66,
    borderRadius: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    paddingHorizontal: 14,
  },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 12, marginTop: 4, color: '#9AA0B4' },

  quickActions: {
    paddingVertical: 18,
    marginBottom: 10,
    marginTop: 5,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    // elevation: 2,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 10,
  },
  quickActionItem: {
    alignItems: 'center',
    marginRight: 20,
    width: '20%',
  },
  quickActionIcon: {
    width: 30,
    height: 30,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickActionText: { fontSize: 12, color: '#1e293b' },
});
