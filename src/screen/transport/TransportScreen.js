// screens/TransportScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'context/ThemeContext';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { ScreenHeader } from 'component/SHARED';
import travuService from 'SERVICES/travuService';
import FlightSearchTab from 'component/transport/FlightSearchTab';


// ============================================
// STEP INDICATOR COMPONENT
// ============================================

const StepIndicator = ({ currentStep, activeTab, themeColors }) => {
  // Bus steps
  const busSteps = [
    { id: 1, label: 'Search', icon: 'search' },
    { id: 2, label: 'Select', icon: 'bus' },
    { id: 3, label: 'Details', icon: 'person' },
    { id: 4, label: 'Seats', icon: 'grid' },
    { id: 5, label: 'Payment', icon: 'card' },
  ];

  // Flight steps
  const flightSteps = [
    { id: 1, label: 'Search', icon: 'search' },
    { id: 2, label: 'Select', icon: 'airplane' },
    { id: 3, label: 'Details', icon: 'person' },
    { id: 4, label: 'Seats', icon: 'grid' },
    { id: 5, label: 'Payment', icon: 'card' },
  ];

  // Orders - no steps needed
  const ordersSteps = [];

  // Choose steps based on active tab
  const steps = activeTab === 'bus' ? busSteps :
                activeTab === 'flight' ? flightSteps :
                ordersSteps;

  if (steps.length === 0) return null; // Hide for Orders tab

  return (
    <View style={styles.stepContainer}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                {
                  backgroundColor:
                    step.id <= currentStep
                      ? themeColors.primary
                      : themeColors.border,
                },
              ]}
            >
              {step.id < currentStep ? (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    { color: step.id === currentStep ? '#FFFFFF' : themeColors.subtext },
                  ]}
                >
                  {step.id}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                {
                  color:
                    step.id <= currentStep
                      ? themeColors.heading
                      : themeColors.subtext,
                  fontWeight: step.id === currentStep ? '700' : '500',
                },
              ]}
            >
              {step.label}
            </Text>
          </View>
          {index < steps.length - 1 && (
            <View
              style={[
                styles.stepConnector,
                {
                  backgroundColor:
                    step.id < currentStep
                      ? themeColors.primary
                      : themeColors.border,
                },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

// ============================================
// DROPDOWN SELECTOR COMPONENT
// ============================================
const DropdownSelector = ({
  label,
  placeholder,
  value,
  options,
  onSelect,
  icon,
  themeColors,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.dropdownContainer}>
      <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
        {label}
      </Text>
      <TouchableOpacity
        style={[styles.dropdown, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <View style={styles.dropdownLeft}>
          <Ionicons name={icon} size={20} color={themeColors.primary} />
          <Text
            style={[
              styles.dropdownText,
              {
                color: value ? themeColors.heading : themeColors.subtext,
              },
            ]}
          >
            {value || placeholder}
          </Text>
        </View>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={themeColors.subtext}
        />
      </TouchableOpacity>

      {/* Dropdown Options */}
      {isOpen && (
        <View style={[styles.dropdownOptions, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <ScrollView style={styles.optionsScroll} nestedScrollEnabled>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.option,
                  value === option && { backgroundColor: `${themeColors.primary}10` },
                ]}
                onPress={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: value === option ? themeColors.primary : themeColors.heading,
                      fontWeight: value === option ? '600' : '400',
                    },
                  ]}
                >
                  {option}
                </Text>
                {value === option && (
                  <Ionicons name="checkmark" size={18} color={themeColors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// ============================================
// POPULAR ROUTE CARD
// ============================================
const PopularRouteCard = ({ route, onBook, themeColors }) => (
  <TouchableOpacity
    style={[styles.popularCard, { backgroundColor: themeColors.card }]}
    activeOpacity={0.8}
  >
    <View style={styles.routeHeader}>
      <View style={styles.routeInfo}>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: themeColors.primary }]} />
          <Text style={[styles.routeCity, { color: themeColors.heading }]}>
            {route.origin}
          </Text>
        </View>

        <View style={styles.routeArrow}>
          <View style={[styles.arrowLine, { backgroundColor: themeColors.border }]} />
          <Ionicons name="arrow-forward" size={16} color={themeColors.primary} />
          <View style={[styles.arrowLine, { backgroundColor: themeColors.border }]} />
        </View>

        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.routeCity, { color: themeColors.heading }]}>
            {route.destination}
          </Text>
        </View>
      </View>
    </View>

    <View style={styles.routeDetails}>
      <View style={styles.routeDetailItem}>
        <Ionicons name="time-outline" size={14} color={themeColors.subtext} />
        <Text style={[styles.routeDetailText, { color: themeColors.subtext }]}>
          ~{route.duration}
        </Text>
      </View>
      <View style={styles.routeDetailItem}>
        <Ionicons name="cash-outline" size={14} color={themeColors.subtext} />
        <Text style={[styles.routeDetailText, { color: themeColors.subtext }]}>
          From ₦{route.minFare.toLocaleString()}
        </Text>
      </View>
    </View>

    <TouchableOpacity
      style={[styles.bookNowButton, { backgroundColor: themeColors.primary }]}
      onPress={() => onBook(route)}
    >
      <Text style={styles.bookNowText}>Book Now</Text>
      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
    </TouchableOpacity>
  </TouchableOpacity>
);

// ============================================
// MAIN TRANSPORT SCREEN
// ============================================
export default function TransportScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  // State Management
  const [activeTab, setActiveTab] = useState('bus'); // 'bus', 'flight', 'orders'
  const [currentStep, setCurrentStep] = useState(1);
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [popularRoutes, setPopularRoutes] = useState([]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load available states/cities
      const origins = travuService.getAvailableOrigins();
      const destinations = travuService.getAvailableDestinations();
      const allStates = [...new Set([...origins, ...destinations])].sort();
      setStates(allStates);

      // Load popular routes
      const routes = await travuService.getRoutes();
      const popularRoutesData = routes.data.map(route => ({
        ...route,
        duration: '6-8 hrs',
        minFare: 10000,
      }));
      setPopularRoutes(popularRoutesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Swap departure and destination
  const handleSwap = () => {
    const temp = departure;
    setDeparture(destination);
    setDestination(temp);
  };

  // Search for trips
  const handleSearch = async () => {
    if (!departure || !destination) {
      Alert.alert('Required Fields', 'Please select both departure and destination');
      return;
    }

    if (!travelDate) {
      // Default to today's date
      const today = new Date().toISOString().split('T')[0];
      setTravelDate(today);
    }

    setLoading(true);
    try {
      const results = await travuService.checkTrip({
        origin: departure,
        destination: destination,
        date: travelDate || new Date().toISOString().split('T')[0],
        sort: 'date',
      });

      if (results.error || !results.data || results.data.length === 0) {
        Alert.alert('No Trips Found', 'No available trips for this route. Try different dates or locations.');
      } else {
        // Navigate to results screen
        navigation.navigate('TransportResults', {
          trips: results.data,
          searchParams: { departure, destination, travelDate },
        });
        setCurrentStep(2);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to search trips');
    } finally {
      setLoading(false);
    }
  };

  // Quick book from popular routes
  const handleQuickBook = async (route) => {
    // Set departure and destination
    setDeparture(route.origin);
    setDestination(route.destination);
    
    // Set default date if not set
    if (!travelDate) {
      const today = new Date().toISOString().split('T')[0];
      setTravelDate(today);
    }

    // Wait a bit for state to update, then search
    setTimeout(async () => {
      setLoading(true);
      try {
        const results = await travuService.checkTrip({
          origin: route.origin,
          destination: route.destination,
          date: travelDate || new Date().toISOString().split('T')[0],
          sort: 'date',
        });

        if (results.error || !results.data || results.data.length === 0) {
          Alert.alert('No Trips Found', 'No available trips for this route. Try different dates or locations.');
        } else {
          // Navigate to results screen
          navigation.navigate('TransportResults', {
            trips: results.data,
            searchParams: { 
              departure: route.origin, 
              destination: route.destination, 
              travelDate: travelDate || new Date().toISOString().split('T')[0]
            },
          });
          setCurrentStep(2);
        }
      } catch (error) {
        Alert.alert('Error', error.message || 'Failed to search trips');
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      <ScreenHeader
        title="Transport"
        onBackPress={() => navigation.goBack()}
      />

      {/* Step Indicator */}
      {/* Step Indicator */}
    <StepIndicator 
     currentStep={currentStep} 
     activeTab={activeTab}
     themeColors={themeColors} 
     />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'bus' && { backgroundColor: themeColors.primary },
              activeTab !== 'bus' && { backgroundColor: themeColors.card },
            ]}
            onPress={() => setActiveTab('bus')}
          >
            <Ionicons
              name="bus"
              size={20}
              color={activeTab === 'bus' ? '#FFFFFF' : themeColors.subtext}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'bus' ? '#FFFFFF' : themeColors.subtext },
              ]}
            >
              Bus
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'flight' && { backgroundColor: themeColors.primary },
              activeTab !== 'flight' && { backgroundColor: themeColors.card },
            ]}
            onPress={() => setActiveTab('flight')}
          >
            <Ionicons
              name="airplane"
              size={20}
              color={activeTab === 'flight' ? '#FFFFFF' : themeColors.subtext}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'flight' ? '#FFFFFF' : themeColors.subtext },
              ]}
            >
              Flight
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'orders' && { backgroundColor: themeColors.primary },
              activeTab !== 'orders' && { backgroundColor: themeColors.card },
            ]}
            onPress={() => setActiveTab('orders')}
          >
            <Ionicons
              name="receipt"
              size={20}
              color={activeTab === 'orders' ? '#FFFFFF' : themeColors.subtext}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'orders' ? '#FFFFFF' : themeColors.subtext },
              ]}
            >
              My Orders
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bus Tab Content */}
        {activeTab === 'bus' && (
          <>
            {/* Search Card */}
            <View style={[styles.searchCard, { backgroundColor: themeColors.card }]}>
              <View style={styles.searchHeader}>
                <Ionicons name="search" size={24} color={themeColors.primary} />
                <Text style={[styles.searchTitle, { color: themeColors.heading }]}>
                  Find Your Trip
                </Text>
              </View>

              {/* Departure & Destination with Swap */}
              <View style={styles.routeSelectors}>
                <View style={styles.routeSelectorColumn}>
                  <DropdownSelector
                    label="From"
                    placeholder="Select departure"
                    value={departure}
                    options={states}
                    onSelect={setDeparture}
                    icon="location"
                    themeColors={themeColors}
                  />

                  <View style={styles.spacer} />

                  <DropdownSelector
                    label="To"
                    placeholder="Select destination"
                    value={destination}
                    options={states}
                    onSelect={setDestination}
                    icon="location-outline"
                    themeColors={themeColors}
                  />
                </View>

                {/* Swap Button */}
                <TouchableOpacity
                  style={[styles.swapButton, { backgroundColor: themeColors.background }]}
                  onPress={handleSwap}
                >
                  <Ionicons name="swap-vertical" size={20} color={themeColors.primary} />
                </TouchableOpacity>
              </View>

              {/* Travel Date */}
              <View style={styles.dateContainer}>
                <Text style={[styles.fieldLabel, { color: themeColors.heading }]}>
                  Travel Date
                </Text>
                <TouchableOpacity
                  style={[styles.dateInput, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}
                  onPress={() => {
                    // Date picker will be implemented
                    const today = new Date().toISOString().split('T')[0];
                    setTravelDate(today);
                  }}
                >
                  <Ionicons name="calendar-outline" size={20} color={themeColors.primary} />
                  <Text
                    style={[
                      styles.dateText,
                      { color: travelDate ? themeColors.heading : themeColors.subtext },
                    ]}
                  >
                    {travelDate || 'Select date'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Search Button */}
              <TouchableOpacity
                style={[
                  styles.searchButton,
                  { backgroundColor: themeColors.primary },
                  loading && { opacity: 0.6 },
                ]}
                onPress={handleSearch}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="search" size={20} color="#FFFFFF" />
                    <Text style={styles.searchButtonText}>Search Trips</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Popular Routes */}
            <View style={styles.popularSection}>
              <View style={styles.popularHeader}>
                <Text style={[styles.popularTitle, { color: themeColors.heading }]}>
                  Popular Routes
                </Text>
                <Text style={[styles.popularSubtitle, { color: themeColors.subtext }]}>
                  Quick book from trending destinations
                </Text>
              </View>

              <FlatList
                data={popularRoutes}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.popularList}
                renderItem={({ item }) => (
                  <PopularRouteCard
                    route={item}
                    onBook={handleQuickBook}
                    themeColors={themeColors}
                  />
                )}
              />
            </View>
          </>
        )}

        {/* Flight Tab Content */}
        {activeTab === 'flight' && (
         <FlightSearchTab
        navigation={navigation}
        themeColors={themeColors}
         />
         )}

        {/* My Orders Tab Content */}
        {activeTab === 'orders' && (
          <View style={[styles.comingSoonCard, { backgroundColor: themeColors.card }]}>
            <Ionicons name="receipt" size={64} color={themeColors.subtext} />
            <Text style={[styles.comingSoonTitle, { color: themeColors.heading }]}>
              My Orders
            </Text>
            <Text style={[styles.comingSoonText, { color: themeColors.subtext }]}>
              View and manage your transport bookings here.
            </Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Step Indicator
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  stepConnector: {
    height: 2,
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 26,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Search Card
  searchCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Route Selectors
  routeSelectors: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeSelectorColumn: {
    flex: 1,
  },
  spacer: {
    height: 16,
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },

  // Dropdown
  dropdownContainer: {
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    // width: "100%"
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownOptions: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    maxHeight: 200,
    borderRadius: 10,
    borderWidth: 1,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  optionsScroll: {
    maxHeight: 200,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  optionText: {
    fontSize: 14,
  },

  // Date
  dateContainer: {
    marginTop: 16,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Search Button
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  searchButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Popular Routes
  popularSection: {
    marginTop: 8,
  },
  popularHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  popularTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  popularSubtitle: {
    fontSize: 13,
  },
  popularList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  popularCard: {
    width: 280,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  routeHeader: {
    marginBottom: 12,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeCity: {
    fontSize: 15,
    fontWeight: '700',
  },
  routeArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  arrowLine: {
    width: 16,
    height: 1,
  },
  routeDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  routeDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeDetailText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bookNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  bookNowText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Coming Soon
  comingSoonCard: {
    marginHorizontal: 16,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});