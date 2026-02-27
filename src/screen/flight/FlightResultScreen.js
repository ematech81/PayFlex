// screens/FlightResultsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { useTheme } from 'context/ThemeContext';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { ScreenHeader } from 'component/SHARED';
// import flightService from 'AuthFunction/flightService';
import { airlines } from 'SERVICES/mockFlightData';
import FlightStepIndicator from 'component/transport/FlightStepsIndicators';


// ============================================
// FLIGHT CARD COMPONENT
// ============================================
const FlightCard = ({ flight, onSelect, themeColors }) => {
  const outboundSegment = flight.itineraries[0].segments[0];
  const lastOutboundSegment = flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1];
  const isRoundTrip = flight.itineraries.length > 1;
  const stops = flight.itineraries[0].segments.length - 1;

  const airline = airlines[outboundSegment.carrierCode] || {
    name: outboundSegment.carrierCode,
    logo: null,
  };

  // Parse duration (PT6H45M -> 6h 45m)
  const parseDuration = (duration) => {
    const matches = duration.match(/PT(\d+H)?(\d+M)?/);
    if (!matches) return duration;
    const hours = matches[1] ? matches[1] : '';
    const minutes = matches[2] ? matches[2] : '';
    return `${hours}${hours && minutes ? ' ' : ''}${minutes}`.toLowerCase();
  };

  // Format time (2024-12-25T23:30:00 -> 23:30)
  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <TouchableOpacity
      style={[styles.flightCard, { backgroundColor: themeColors.card }]}
      onPress={() => onSelect(flight)}
      activeOpacity={0.7}
    >
      {/* Airline Header */}
      <View style={styles.airlineHeader}>
        {airline.logo ? (
          <Image source={{ uri: airline.logo }} style={styles.airlineLogo} />
        ) : (
          <View style={[styles.airlineLogoPlaceholder, { backgroundColor: themeColors.primary }]}>
            <Ionicons name="airplane" size={20} color="#FFFFFF" />
          </View>
        )}
        <View style={styles.airlineInfo}>
          <Text style={[styles.airlineName, { color: themeColors.heading }]}>
            {airline.name}
          </Text>
          <Text style={[styles.flightNumber, { color: themeColors.subtext }]}>
            {outboundSegment.carrierCode} {outboundSegment.number}
          </Text>
        </View>
        {stops > 0 && (
          <View style={[styles.stopsBadge, { backgroundColor: `${themeColors.primary}20` }]}>
            <Text style={[styles.stopsText, { color: themeColors.primary }]}>
              {stops} {stops === 1 ? 'Stop' : 'Stops'}
            </Text>
          </View>
        )}
      </View>

      {/* Flight Details */}
      <View style={styles.flightDetails}>
        {/* Departure */}
        <View style={styles.timeSection}>
          <Text style={[styles.time, { color: themeColors.heading }]}>
            {formatTime(outboundSegment.departure.at)}
          </Text>
          <Text style={[styles.airport, { color: themeColors.subtext }]}>
            {outboundSegment.departure.iataCode}
          </Text>
        </View>

        {/* Duration & Route */}
        <View style={styles.routeSection}>
          <Text style={[styles.duration, { color: themeColors.subtext }]}>
            {parseDuration(flight.itineraries[0].duration)}
          </Text>
          <View style={styles.routeLine}>
            <View style={[styles.routeDot, { backgroundColor: themeColors.primary }]} />
            <View style={[styles.routePath, { backgroundColor: themeColors.border }]} />
            {stops > 0 && (
              <View style={[styles.stopDot, { 
                backgroundColor: themeColors.background,
                borderColor: themeColors.primary 
              }]} />
            )}
            <View style={[styles.routeDot, { backgroundColor: '#10B981' }]} />
          </View>
          <Text style={[styles.routeType, { color: themeColors.subtext }]}>
            {stops === 0 ? 'Direct' : `${stops} Stop${stops > 1 ? 's' : ''}`}
          </Text>
        </View>

        {/* Arrival */}
        <View style={styles.timeSection}>
          <Text style={[styles.time, { color: themeColors.heading }]}>
            {formatTime(lastOutboundSegment.arrival.at)}
          </Text>
          <Text style={[styles.airport, { color: themeColors.subtext }]}>
            {lastOutboundSegment.arrival.iataCode}
          </Text>
        </View>
      </View>

      {/* Price & Baggage */}
      <View style={styles.footer}>
        <View style={styles.baggageInfo}>
          <Ionicons name="briefcase-outline" size={16} color={themeColors.subtext} />
          <Text style={[styles.baggageText, { color: themeColors.subtext }]}>
            {flight.travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags?.weight || 23}kg baggage
          </Text>
        </View>
        <View style={styles.priceSection}>
          <Text style={[styles.price, { color: themeColors.primary }]}>
            {formatCurrency(flight.price.grandTotal, flight.price.currency)}
          </Text>
          <Text style={[styles.perPerson, { color: themeColors.subtext }]}>
            per person
          </Text>
        </View>
      </View>

      {/* Round Trip Indicator */}
      {isRoundTrip && (
        <View style={[styles.roundTripBadge, { backgroundColor: `${themeColors.primary}15` }]}>
          <Ionicons name="swap-horizontal" size={14} color={themeColors.primary} />
          <Text style={[styles.roundTripText, { color: themeColors.primary }]}>
            Includes return flight
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ============================================
// MAIN SCREEN
// ============================================
export default function FlightResultsScreen({ route, navigation }) {
  const { flights, searchParams } = route.params;
  const { isDarkMode } = useTheme();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const [sortBy, setSortBy] = useState('price'); // price, duration, departure
  const [filterStops, setFilterStops] = useState('all'); // all, direct, 1-stop

  // Sort flights
  const sortedFlights = [...flights].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return parseInt(a.price.grandTotal) - parseInt(b.price.grandTotal);
      case 'duration':
        return parseDurationToMinutes(a.itineraries[0].duration) - 
               parseDurationToMinutes(b.itineraries[0].duration);
      case 'departure':
        return new Date(a.itineraries[0].segments[0].departure.at) - 
               new Date(b.itineraries[0].segments[0].departure.at);
      default:
        return 0;
    }
  });

  // Filter flights
  const filteredFlights = sortedFlights.filter(flight => {
    const stops = flight.itineraries[0].segments.length - 1;
    if (filterStops === 'direct') return stops === 0;
    if (filterStops === '1-stop') return stops === 1;
    return true;
  });

  const parseDurationToMinutes = (duration) => {
    const matches = duration.match(/PT(\d+H)?(\d+M)?/);
    if (!matches) return 0;
    const hours = matches[1] ? parseInt(matches[1]) : 0;
    const minutes = matches[2] ? parseInt(matches[2]) : 0;
    return hours * 60 + minutes;
  };

  const handleSelectFlight = (flight) => {
    navigation.navigate('PassengerDetails', {
      bookingType: 'flight',  // ← Set type
      flight,
      searchParams,
    });
  };



  const totalPassengers = searchParams.passengers.adults + 
                          searchParams.passengers.children + 
                          searchParams.passengers.infants;


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      <ScreenHeader
        title="Available Flights"
        onBackPress={() => navigation.goBack()}
      />

<FlightStepIndicator currentStep={2} themeColors={themeColors} />

      {/* Search Summary */}
      <View style={[styles.summaryCard, { backgroundColor: themeColors.card }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>Route</Text>
            <Text style={[styles.summaryValue, { color: themeColors.heading }]}>
              {searchParams.origin.code} → {searchParams.destination.code}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>Date</Text>
            <Text style={[styles.summaryValue, { color: themeColors.heading }]}>
              {new Date(searchParams.departureDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>Travelers</Text>
            <Text style={[styles.summaryValue, { color: themeColors.heading }]}>
              {totalPassengers}
            </Text>
          </View>
        </View>
      </View>

      {/* Sort & Filter */}
      <View style={styles.controlsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.controlsContent}
        >
          {/* Sort Options */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              sortBy === 'price' && { backgroundColor: themeColors.primary },
              sortBy !== 'price' && { 
                backgroundColor: themeColors.card,
                borderWidth: 1,
                borderColor: themeColors.border
              },
            ]}
            onPress={() => setSortBy('price')}
          >
            <Ionicons 
              name="cash-outline" 
              size={16} 
              color={sortBy === 'price' ? '#FFFFFF' : themeColors.subtext} 
            />
            <Text style={[
              styles.controlText,
              { color: sortBy === 'price' ? '#FFFFFF' : themeColors.subtext }
            ]}>
              Cheapest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              sortBy === 'duration' && { backgroundColor: themeColors.primary },
              sortBy !== 'duration' && { 
                backgroundColor: themeColors.card,
                borderWidth: 1,
                borderColor: themeColors.border
              },
            ]}
            onPress={() => setSortBy('duration')}
          >
            <Ionicons 
              name="time-outline" 
              size={16} 
              color={sortBy === 'duration' ? '#FFFFFF' : themeColors.subtext} 
            />
            <Text style={[
              styles.controlText,
              { color: sortBy === 'duration' ? '#FFFFFF' : themeColors.subtext }
            ]}>
              Fastest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              sortBy === 'departure' && { backgroundColor: themeColors.primary },
              sortBy !== 'departure' && { 
                backgroundColor: themeColors.card,
                borderWidth: 1,
                borderColor: themeColors.border
              },
            ]}
            onPress={() => setSortBy('departure')}
          >
            <Ionicons 
              name="calendar-outline" 
              size={16} 
              color={sortBy === 'departure' ? '#FFFFFF' : themeColors.subtext} 
            />
            <Text style={[
              styles.controlText,
              { color: sortBy === 'departure' ? '#FFFFFF' : themeColors.subtext }
            ]}>
              Earliest
            </Text>
          </TouchableOpacity>

          {/* Filter Options */}
          <View style={styles.divider} />

          <TouchableOpacity
            style={[
              styles.controlButton,
              filterStops === 'all' && { backgroundColor: themeColors.primary },
              filterStops !== 'all' && { 
                backgroundColor: themeColors.card,
                borderWidth: 1,
                borderColor: themeColors.border
              },
            ]}
            onPress={() => setFilterStops('all')}
          >
            <Text style={[
              styles.controlText,
              { color: filterStops === 'all' ? '#FFFFFF' : themeColors.subtext }
            ]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              filterStops === 'direct' && { backgroundColor: themeColors.primary },
              filterStops !== 'direct' && { 
                backgroundColor: themeColors.card,
                borderWidth: 1,
                borderColor: themeColors.border
              },
            ]}
            onPress={() => setFilterStops('direct')}
          >
            <Text style={[
              styles.controlText,
              { color: filterStops === 'direct' ? '#FFFFFF' : themeColors.subtext }
            ]}>
              Direct
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              filterStops === '1-stop' && { backgroundColor: themeColors.primary },
              filterStops !== '1-stop' && { 
                backgroundColor: themeColors.card,
                borderWidth: 1,
                borderColor: themeColors.border
              },
            ]}
            onPress={() => setFilterStops('1-stop')}
          >
            <Text style={[
              styles.controlText,
              { color: filterStops === '1-stop' ? '#FFFFFF' : themeColors.subtext }
            ]}>
              1 Stop
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: themeColors.heading }]}>
          {filteredFlights.length} flight{filteredFlights.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Flight List */}
      <ScrollView
        style={styles.flightList}
        contentContainerStyle={styles.flightListContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredFlights.length > 0 ? (
          filteredFlights.map((flight, index) => (
            <FlightCard
              key={flight.id + index}
              flight={flight}
              onSelect={handleSelectFlight}
              themeColors={themeColors}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="airplane-outline" size={64} color={themeColors.subtext} />
            <Text style={[styles.emptyText, { color: themeColors.subtext }]}>
              No flights match your filters
            </Text>
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: themeColors.primary }]}
              onPress={() => setFilterStops('all')}
            >
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>
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

  // Summary
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Controls
  controlsContainer: {
    marginBottom: 12,
  },
  controlsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  controlText: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#00000020',
    marginHorizontal: 8,
  },

  // Results Header
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Flight List
  flightList: {
    flex: 1,
  },
  flightListContent: {
    padding: 16,
    paddingTop: 8,
  },

  // Flight Card
  flightCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  airlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  airlineLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  airlineLogoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  airlineInfo: {
    flex: 1,
  },
  airlineName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  flightNumber: {
    fontSize: 11,
    fontWeight: '600',
  },
  stopsBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  stopsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  flightDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeSection: {
    flex: 1,
  },
  time: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  airport: {
    fontSize: 12,
    fontWeight: '600',
  },
  routeSection: {
    flex: 2,
    alignItems: 'center',
  },
  duration: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routePath: {
    flex: 1,
    height: 2,
  },
  stopDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  routeType: {
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  baggageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  baggageText: {
    fontSize: 12,
    fontWeight: '500',
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  perPerson: {
    fontSize: 11,
    fontWeight: '500',
  },
  roundTripBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginTop: 12,
    gap: 6,
  },
  roundTripText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});