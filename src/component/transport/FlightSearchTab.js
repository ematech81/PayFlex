// components/transport/FlightSearchTab.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { mockGetPopularRoutes } from 'SERVICES/mockFlightData';
import flightServices from 'AuthFunction/transport/flightServices';
// import flightServices from 'AuthFunction/transport/flightServices';


// ============================================
// AIRPORT SEARCH MODAL
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
      const response = await flightServices.searchAirports(searchText, {
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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColors.heading }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={themeColors.subtext} />
            </TouchableOpacity>
          </View>

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
    </Modal>
  );
};

// ============================================
// MAIN FLIGHT SEARCH TAB COMPONENT
// ============================================
export default function FlightSearchTab({ navigation, themeColors }) {
  const [tripType, setTripType] = useState('round-trip');
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
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

    setLoading(true);
    try {
      // Use real flight service (not mock)
      const response = await flightServices.searchFlights({
        originLocationCode: origin.code,
        destinationLocationCode: destination.code,
        departureDate,
        returnDate: tripType === 'round-trip' ? returnDate : undefined,
        adults: passengers.adults,
        children: passengers.children,
        infants: passengers.infants,
        currencyCode: 'NGN', // Nigerian Naira
        maxResults: 50,
      });

      if (response.success && response.data.length > 0) {
        navigation.navigate('FlightResults', {
          flights: response.data,
          searchParams: {
            origin,
            destination,
            departureDate,
            returnDate: tripType === 'round-trip' ? returnDate : null,
            passengers,
            tripType,
          },
        });
      } else {
        Alert.alert('No Flights Found', 'No flights available for this route. Please try different dates or destinations.');
      }
    } catch (error) {
      console.error('Flight search error:', error);
      Alert.alert(
        'Search Error',
        error.message || 'Failed to search flights. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW (direct search)
const handleQuickBook = async (route) => {
  const quickOrigin = {
    code: route.origin,
    name: route.originName,
    city: route.originName,
    country: '',
  };
  
  const quickDestination = {
    code: route.destination,
    name: route.destinationName,
    city: route.destinationName,
    country: '',
  };

  // Set state for UI display
  setOrigin(quickOrigin);
  setDestination(quickDestination);

  // Search immediately with local variables (no race condition)
  setLoading(true);
  try {
    const response = await flightServices.searchFlights({
      originLocationCode: quickOrigin.code,
      destinationLocationCode: quickDestination.code,
      departureDate,
      returnDate: tripType === 'round-trip' ? returnDate : undefined,
      adults: passengers.adults,
      children: passengers.children,
      infants: passengers.infants,
      currencyCode: 'NGN',
      maxResults: 50,
    });

    if (response.success && response.data.length > 0) {
      navigation.navigate('FlightResults', {
        flights: response.data,
        searchParams: {
          origin: quickOrigin,
          destination: quickDestination,
          departureDate,
          returnDate: tripType === 'round-trip' ? returnDate : null,
          passengers,
          tripType,
        },
      });
    } else {
      Alert.alert('No Flights Found', 'No flights available for this route.');
    }
  } catch (error) {
    console.error('Quick book error:', error);
    Alert.alert(
      'Search Error',
      error.message || 'Failed to search flights. Please try again.'
    );
  } finally {
    setLoading(false);
  }
};

  const totalPassengers = passengers.adults + passengers.children + passengers.infants;

  return (
    <View style={styles.container}>
      {/* Trip Type Selector */}
      <View style={styles.tripTypeContainer}>
        <TouchableOpacity
          style={[
            styles.tripTypeButton,
            tripType === 'round-trip' && { backgroundColor: themeColors.primary },
            tripType !== 'round-trip' && {
              backgroundColor: themeColors.card,
              borderWidth: 1,
              borderColor: themeColors.border,
            },
          ]}
          onPress={() => setTripType('round-trip')}
        >
          <Ionicons
            name="swap-horizontal"
            size={16}
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
              borderColor: themeColors.border,
            },
          ]}
          onPress={() => setTripType('one-way')}
        >
          <Ionicons
            name="arrow-forward"
            size={16}
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
          <Ionicons name="swap-vertical" size={18} color="#FFFFFF" />
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

        {/* Passengers */}
        <View style={styles.passengersRow}>
          <Ionicons name="people" size={20} color={themeColors.primary} />
          <Text style={[styles.passengersText, { color: themeColors.heading }]}>
            {totalPassengers} Passenger{totalPassengers !== 1 ? 's' : ''}
          </Text>
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
              <Ionicons name="search" size={18} color="#FFFFFF" />
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

      {/* Modals */}
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
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tripTypeText: {
    fontSize: 13,
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
    marginBottom: 20,
  },
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    gap: 10,
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
    fontSize: 14,
    fontWeight: '700',
  },
  swapButton: {
    alignSelf: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: -5,
    zIndex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateInput: {
    flex: 1,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 6,
  },
  passengersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  passengersText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  searchButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Popular Routes
  popularSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  routeLeft: {
    flex: 1,
  },
  routeText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  routePrice: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '75%',
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
    fontSize: 18,
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
    fontSize: 14,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  airportInfo: {
    flex: 1,
  },
  airportName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  airportDetails: {
    fontSize: 11,
    fontWeight: '500',
  },
  airportCode: {
    fontSize: 15,
    fontWeight: '700',
  },
  noResults: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 13,
  },
});