import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  StatusBar
} from 'react-native';
import React, { useCallback, useRef, useEffect } from 'react';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';

import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  FontAwesome6,
  FontAwesome,
  Feather,
  Foundation,
} from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const CARD_PADDING = 16;
const CARD_SPACING = 12;
const GRID_COLUMNS = 3;

const services = [
  {
    id: 'airtime',
    label: 'Airtime',
    icon: 'call',
    iconLib: Ionicons,
    screen: 'Airtime',
    color: '#6ae721ff',
  },
  {
    id: 'data',
    label: 'Data',
    icon: 'wifi',
    iconLib: Feather,
    screen: 'Data',
    color: '#3498DB',
  },
  {
    id: 'betting',
    label: 'Betting',
    icon: 'soccer-ball-o',
    iconLib: FontAwesome,
    screen: 'Betting',
    color: '#FF6B6B',
  },
  {
    id: 'jamb',
    label: 'JAMB',
    icon: 'credit-card',
    iconLib: FontAwesome6,
    screen: 'EducationPurchase',
    color: '#4ECDC4',
  },
  {
    id: 'airtime-cash',
    label: 'Airtime to Cash',
    icon: 'exchange-alt',
    iconLib: FontAwesome5,
    screen: 'Airtime-Cash',
    color: '#45B7D1',
  },
  {
    id: 'tv',
    label: 'TV Subs',
    icon: 'television',
    iconLib: MaterialCommunityIcons,
    screen: 'TVSubscription',
    color: '#96CEB4',
  },
  {
    id: 'flights',
    label: 'Flights',
    icon: 'plane',
    iconLib: FontAwesome5,
    screen: 'fv[Airtime',
    color: '#FFEAA7',
  },
  {
    id: 'hotels',
    label: 'Hotels',
    icon: 'bed',
    iconLib: Ionicons,
    screen: 'Airtime',
    color: '#DDA0DD',
  },
  {
    id: 'waec',
    label: 'WAEC',
    icon: 'card-account-details',
    iconLib: MaterialCommunityIcons,
    screen: 'EducationPurchase',
    color: '#FDCB6E',
  },
  {
    id: 'nin',
    label: 'NIN',
    icon: 'torso-business',
    iconLib: Foundation,
    screen: 'NINScreen',
    color: '#A29BFE',
  },
  {
    id: 'cac',
    label: 'CAC',
    icon: 'business',
    iconLib: Ionicons,
    screen: 'Airtime',
    color: '#81CEC6',
  },
  {
    id: 'electricity',
    label: 'Electricity',
    icon: 'flash',
    iconLib: Ionicons,
    screen: 'ElectricityPurchase',
    color: '#FFA502',
  },
 
  {
    id: 'education',
    label: 'Education',
    icon: 'graduation-cap',
    iconLib: FontAwesome5,
    screen: 'EducationPurchase',
    color: '#9B59B6',
  },


  
  // =======to be removed=======
  {
    id: 'category',
    label: 'Categories',
    icon: 'graduation-cap',
    iconLib: FontAwesome5,
    screen: 'Category',
    color: '#08f13fff',
  },
];

const ServiceCard = React.memo(({ service, onPress, index, themeColors }) => {
  const isDisabled = !service.screen;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 7,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const IconComponent = service.iconLib;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        style={[
          styles.serviceCard,
          {
            backgroundColor: themeColors.card,
            borderColor: isDisabled 
              ? `${themeColors.text}20` 
              : `${service.color}20`,
          },
        ]}
        onPress={() => onPress(service.screen)}
        activeOpacity={0.8}
        disabled={isDisabled}
      >
        <View style={styles.serviceIconContainer}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDisabled
                  ? `${themeColors.text}15`
                  : `${service.color}15`,
              },
            ]}
          >
            <IconComponent
              name={service.icon}
              size={24}
              color={isDisabled ? `${themeColors.text}70` : themeColors.primary}
              // stokeWidth='30'/
            />
          </View>
          
          {isDisabled && (
            <View style={[styles.comingSoonBadge]}>
              <Text style={styles.comingSoonText}>SOON</Text>
            </View>
          )}
        </View>
        
        <Text
          style={[
            styles.serviceLabel,
            {
              color: isDisabled
                ? `${themeColors.text}60`
                : themeColors.text,
            },
          ]}
          numberOfLines={2}
        >
          {service.label}
        </Text>
        
        {!isDisabled && (
          <View style={[styles.activeIndicator, { backgroundColor: service.color }]} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const AllServicesScreen = ({ navigation }) => {
  const scrollY = useRef(new Animated.Value(0)).current;
   const isDarkMode = useThem();
    const themeColors = isDarkMode ? colors.dark : colors.light;


  
  // // For demo purposes - you can replace with your actual theme hook
  // const themeColors = {
  //   background: '#FFFFFF',
  //   card: '#FFFFFF',
  //   text: '#1A1A1A',
  //   primary: '#6C63FF',
  //   lightText: '#666666',
  //   border: '#EEEEEE',
  // };

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [120, 80],
    extrapolate: 'clamp',
  });

  const handleServicePress = useCallback((screen) => {
    if (screen) {
      navigation.navigate(screen);
    } else {
      // Optional: Show a toast or message for unavailable services
      console.log('Service coming soon');
    }
  }, [navigation]);

  const cardWidth = (width - (CARD_PADDING * 2) - (CARD_SPACING * (GRID_COLUMNS - 1))) / GRID_COLUMNS;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={themeColors.background} />
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header,
          { 
            height: headerHeight,
            backgroundColor: themeColors.background,
            borderBottomColor: themeColors.border,
          }
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>
              All Services
            </Text>
            <Text style={[styles.headerSubtitle, { color: themeColors.lightText }]}>
              {services.length} services available
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => navigation.navigate('Search')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="search" size={22} color={themeColors.text} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Services Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              All Services
            </Text>
            <View style={styles.servicesCount}>
              <Text style={[styles.servicesCountText, { color: themeColors.primary }]}>
                {services.filter(s => s.screen).length} Active
              </Text>
            </View>
          </View>
          
          <View style={styles.grid}>
            {services.map((service, index) => (
              <View
                key={service.id}
                style={{
                  width: cardWidth,
                  marginBottom: 20,
                  marginHorizontal: CARD_SPACING / 2,
                }}
              >
                <ServiceCard
                  service={service}
                  onPress={handleServicePress}
                  index={index}
                  themeColors={themeColors}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Recent Transactions Section */}
        <View style={[styles.recentSection, { backgroundColor: themeColors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Recently Used
            </Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: themeColors.primary }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Placeholder for recent services */}
          <View style={styles.recentList}>
            <Text style={[styles.placeholderText, { color: themeColors.lightText }]}>
              No recent services
            </Text>
          </View>
        </View>

        {/* Quick Tips */}
        <View style={[styles.tipsContainer, { backgroundColor: `${themeColors.primary}10` }]}>
          <Feather name="info" size={20} color={themeColors.primary} />
          <Text style={[styles.tipsText, { color: themeColors.text }]}>
            Tap on any service to get started. Services marked "SOON" are coming in future updates.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AllServicesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  searchButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: CARD_PADDING,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  servicesCount: {
    backgroundColor: '#F0F0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  servicesCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginHorizontal: -CARD_SPACING / 2,
  },
  serviceCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  serviceIconContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4757',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  comingSoonText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  serviceLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  recentSection: {
    marginTop: 32,
    padding: 20,
    borderRadius: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recentList: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginTop: 12,
  },
  placeholderText: {
    fontSize: 14,
    textAlign: 'center',
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 24,
  },
  tipsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 12,
  },
});