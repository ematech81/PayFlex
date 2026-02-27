// screens/FlightSearchScreen.js
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { useTheme } from 'context/ThemeContext';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { ScreenHeader } from 'component/SHARED';
import flightService from 'AuthFunction/transport/flightServices';
import { mockSearchFlights, mockGetPopularRoutes } from 'SERVICES/mockFlightData';

// ============================================
// AIRPORT SEARCH MODAL COMPONENT
// ============================================
const AirportSearchModal = ({ visible, onClose, onSelect, title, themeColors }) => {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchText.length >= 2) {
      searchAirports();
    } else {
      setResults([]);
    }
  }, [searchText]);

  const searchAirports = async () => {
    try {
      setLoading(true);
      const response = await flightService.searchAirports(searchText, {
        subType: 'AIRPORT,CITY',
        limit: 10,
        view: 'LIGHT',
      });
      setResults(response.data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (airport) => {
    onSelect({
      code: airport.iataCode,
      name: airport.name,
      city: airport.address?.cityName || '',
      country: airport.address?.countryName || '',
    });
    setSearchText('');
    setResults([]);
    onClose();
  };

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: themeColors.heading }]}>
            {title}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={themeColors.subtext} />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={[styles.searchInputContainer, { backgroundColor: themeColors.background }]}>
          <Ionicons name="search" size={20} color={themeColors.subtext} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.heading }]}
            placeholder="Enter city or airport code"
            placeholderTextColor={themeColors.subtext}
            value={searchText}
            onChangeText={setSearchText}
            autoFocus
          />
        </View>

        {/* Results */}
        <ScrollView style={styles.resultsContainer}>
          {loading ? (
            <ActivityIndicator size="small" color={themeColors.primary} style={styles.loader} />
          ) : results.length > 0 ? (
            results.map((airport) => (
              <TouchableOpacity
                key={airport.id}
                style={[styles.airportItem, { borderBottomColor: themeColors.border }]}
                onPress={() => handleSelect(airport)}
              >
                <Ionicons name="airplane" size={20} color={themeColors.primary} />
                <View style={styles.airportInfo}>
                  <Text style={[styles.airportName, { color: themeColors.heading }]}>
                    {airport.name}
                  </Text>
                  <Text style={[styles.airportDetails, { color: themeColors.subtext }]}>
                    {airport.address?.cityName}, {airport.address?.countryName}
                  </Text>
                </View>
                <Text style={[styles.airportCode, { color: themeColors.primary }]}>
                  {airport.iataCode}
                </Text>
              </TouchableOpacity>
            ))
          ) : searchText.length >= 2 ? (
            <Text style={[styles.noResults, { color: themeColors.subtext }]}>
              No airports found
            </Text>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
};

// ============================================
// MAIN SCREEN
// ============================================
export default function FlightPassengerDetailsScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const [tripType, setTripType] = useState('round-trip'); // round-trip or one-way
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
  const [travelClass, setTravelClass] = useState('ECONOMY');
  const [loading, setLoading] = useState(false);
  const [popularRoutes, setPopularRoutes] = useState([]);
  const [showOriginModal, setShowOriginModal] = useState(false);
  const [showDestinationModal, setShowDestinationModal] = useState(false);

  useEffect(() => {
    loadPopularRoutes();
    setDefaultDate();
  }, []);

  const loadPopularRoutes = async () => {
    try {
      // Use mock data for now
      const response = await mockGetPopularRoutes('LOS');
      setPopularRoutes(response.data || []);
    } catch (error) {
      console.error('Error loading popular routes:', error);
    }
  };

  const setDefaultDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDepartureDate(tomorrow.toISOString().split('T')[0]);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 8);
    setReturnDate(nextWeek.toISOString().split('T')[0]);
  };

  const handleSwapAirports = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearch = async () => {
    if (!origin || !destination) {
      Alert.alert('Required Fields', 'Please select origin and destination airports');
      return;
    }

    if (!departureDate) {
      Alert.alert('Required Fields', 'Please select departure date');
      return;
    }

    if (tripType === 'round-trip' && !returnDate) {
      Alert.alert('Required Fields', 'Please select return date');
      return;
    }

    setLoading(true);
    try {
      // Use mock search for now
      const response = await mockSearchFlights({
        originLocationCode: origin.code,
        destinationLocationCode: destination.code,
        departureDate,
        returnDate: tripType === 'round-trip' ? returnDate : undefined,
        adults: passengers.adults,
        children: passengers.children,
        infants: passengers.infants,
        travelClass,
      });

      if (response.success && response.data.length > 0) {
        navigation.navigate('FlightResult', {
          flights: response.data,
          searchParams: {
            origin,
            destination,
            departureDate,
            returnDate: tripType === 'round-trip' ? returnDate : null,
            passengers,
            travelClass,
            tripType,
          },
        });
      } else {
        Alert.alert('No Flights Found', 'No flights available for this route. Try different dates.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to search flights');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickBook = (route) => {
    setOrigin({
      code: route.origin,
      name: route.originName,
      city: route.originName,
      country: '',
    });
    setDestination({
      code: route.destination,
      name: route.destinationName,
      city: route.destinationName,
      country: '',
    });

    setTimeout(() => handleSearch(), 100);
  };

  const totalPassengers = passengers.adults + passengers.children + passengers.infants;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      <ScreenHeader
        title="Book Flights"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Trip Type Selector */}
        <View style={styles.tripTypeContainer}>
          <TouchableOpacity
            style={[
              styles.tripTypeButton,
              tripType === 'round-trip' && { backgroundColor: themeColors.primary },
              tripType !== 'round-trip' && { 
                backgroundColor: themeColors.card,
                borderWidth: 1,
                borderColor: themeColors.border
              },
            ]}
            onPress={() => setTripType('round-trip')}
          >
            <Ionicons
              name="swap-horizontal"
              size={18}
              color={tripType === 'round-trip' ? '#FFFFFF' : themeColors.subtext}
            />
            <Text
              style={[
                styles.tripTypeText,
                { color: tripType === 'round-trip' ? '#FFFFFF' : themeColors.subtext },
              ]}
            >
              Round Trip
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tripTypeButton,
              tripType === 'one-way' && { backgroundColor: themeColors.primary },
              tripType !== 'one-way' && { 
                backgroundColor: themeColors.card,
                borderWidth: 1,
                borderColor: themeColors.border
              },
            ]}
            onPress={() => setTripType('one-way')}
          >
            <Ionicons
              name="arrow-forward"
              size={18}
              color={tripType === 'one-way' ? '#FFFFFF' : themeColors.subtext}
            />
            <Text
              style={[
                styles.tripTypeText,
                { color: tripType === 'one-way' ? '#FFFFFF' : themeColors.subtext },
              ]}
            >
              One Way
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Form */}
        <View style={[styles.searchCard, { backgroundColor: themeColors.card }]}>
          {/* Origin */}
          <TouchableOpacity
            style={[styles.inputButton, { backgroundColor: themeColors.background }]}
            onPress={() => setShowOriginModal(true)}
          >
            <Ionicons name="airplane" size={20} color={themeColors.primary} />
            <View style={styles.inputContent}>
              <Text style={[styles.inputLabel, { color: themeColors.subtext }]}>
                From
              </Text>
              <Text style={[styles.inputValue, { color: themeColors.heading }]}>
                {origin ? `${origin.city} (${origin.code})` : 'Select origin'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Swap Button */}
          <TouchableOpacity
            style={[styles.swapButton, { backgroundColor: themeColors.primary }]}
            onPress={handleSwapAirports}
          >
            <Ionicons name="swap-vertical" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Destination */}
          <TouchableOpacity
            style={[styles.inputButton, { backgroundColor: themeColors.background }]}
            onPress={() => setShowDestinationModal(true)}
          >
            <Ionicons name="location" size={20} color={themeColors.primary} />
            <View style={styles.inputContent}>
              <Text style={[styles.inputLabel, { color: themeColors.subtext }]}>
                To
              </Text>
              <Text style={[styles.inputValue, { color: themeColors.heading }]}>
                {destination ? `${destination.city} (${destination.code})` : 'Select destination'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Dates */}
          <View style={styles.dateRow}>
            <View style={styles.dateInput}>
              <Text style={[styles.inputLabel, { color: themeColors.subtext }]}>
                Departure
              </Text>
              <TextInput
                style={[styles.dateText, { color: themeColors.heading }]}
                value={departureDate}
                onChangeText={setDepartureDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={themeColors.subtext}
              />
            </View>

            {tripType === 'round-trip' && (
              <View style={styles.dateInput}>
                <Text style={[styles.inputLabel, { color: themeColors.subtext }]}>
                  Return
                </Text>
                <TextInput
                  style={[styles.dateText, { color: themeColors.heading }]}
                  value={returnDate}
                  onChangeText={setReturnDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={themeColors.subtext}
                />
              </View>
            )}
          </View>

          {/* Passengers & Class */}
          <View style={styles.bottomRow}>
            <View style={styles.passengersInfo}>
              <Ionicons name="people" size={20} color={themeColors.primary} />
              <Text style={[styles.passengersText, { color: themeColors.heading }]}>
                {totalPassengers} Passenger{totalPassengers !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.classInfo}>
              <Ionicons name="briefcase" size={18} color={themeColors.primary} />
              <Text style={[styles.classText, { color: themeColors.heading }]}>
                {travelClass}
              </Text>
            </View>
          </View>

          {/* Search Button */}
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: themeColors.primary }]}
            onPress={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="#FFFFFF" />
                <Text style={styles.searchButtonText}>Search Flights</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Popular Routes */}
        {popularRoutes.length > 0 && (
          <View style={styles.popularSection}>
            <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
              Popular Routes
            </Text>
            
            {popularRoutes.map((route) => (
              <TouchableOpacity
                key={route.id}
                style={[styles.routeCard, { backgroundColor: themeColors.card }]}
                onPress={() => handleQuickBook(route)}
              >
                <View style={styles.routeLeft}>
                  <Text style={[styles.routeText, { color: themeColors.heading }]}>
                    {route.originName} → {route.destinationName}
                  </Text>
                  <Text style={[styles.routePrice, { color: themeColors.primary }]}>
                    From {formatCurrency(route.price, route.currency)}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color={themeColors.subtext} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Airport Search Modals */}
      <AirportSearchModal
        visible={showOriginModal}
        onClose={() => setShowOriginModal(false)}
        onSelect={setOrigin}
        title="Select Origin"
        themeColors={themeColors}
      />

      <AirportSearchModal
        visible={showDestinationModal}
        onClose={() => setShowDestinationModal(false)}
        onSelect={setDestination}
        title="Select Destination"
        themeColors={themeColors}
      />
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
    padding: 16,
    paddingBottom: 40,
  },

  // Trip Type
  tripTypeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  tripTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  tripTypeText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Search Card
  searchCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  inputValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  swapButton: {
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: -6,
    zIndex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateInput: {
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  passengersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passengersText: {
    fontSize: 14,
    fontWeight: '600',
  },
  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  classText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Popular Routes
  popularSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  routeLeft: {
    flex: 1,
  },
  routeText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  routePrice: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
  },
  loader: {
    marginTop: 20,
  },
  airportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  airportInfo: {
    flex: 1,
  },
  airportName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  airportDetails: {
    fontSize: 12,
    fontWeight: '500',
  },
  airportCode: {
    fontSize: 16,
    fontWeight: '700',
  },
  noResults: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});