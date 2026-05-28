import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import flightService from 'AuthFunction/transport/flightServices';
import { getFlightSummary } from 'utility/FlightDataHelper';
import { StatusBarComponent } from 'component/StatusBar';



const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FlightSeatSelectionScreen = ({ route, navigation }) => {
  const { flight, passengers } = route.params;

  const [seatmap, setSeatmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState({});
  const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0);

  useEffect(() => {
    loadSeatmap();
  }, []);

  const loadSeatmap = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ✅ FIX: Ensure flight has travelerPricings (Amadeus requirement)
      const flightWithTravelers = {
        ...flight,
        type: flight.type || 'flight-offer',
        id: flight.id || `FLIGHT_${Date.now()}`,
        source: flight.source || 'GDS',
        instantTicketingRequired: flight.instantTicketingRequired ?? false,
        nonHomogeneous: flight.nonHomogeneous ?? false,
        oneWay: flight.oneWay ?? (flight.itineraries?.length === 1),
        lastTicketingDate: flight.lastTicketingDate || (() => {
          const date = new Date();
          date.setDate(date.getDate() + 7);
          return date.toISOString().split('T')[0];
        })(),
        travelerPricings: flight.travelerPricings || passengers.map((passenger, index) => ({
          travelerId: String(index + 1),
          fareOption: "STANDARD",
          travelerType: (passenger.age && passenger.age < 12) ? "CHILD" : "ADULT",
          price: {
            currency: flight.price?.currency || "NGN",
            total: String((parseFloat(flight.price?.total || 0) / passengers.length).toFixed(2)),
            base: String((parseFloat(flight.price?.base || 0) / passengers.length).toFixed(2))
          },
          fareDetailsBySegment: flight.itineraries?.[0]?.segments?.map((segment, segIndex) => ({
            segmentId: String(segIndex + 1),
            cabin: segment.cabin || "ECONOMY",
            fareBasis: segment.fareBasis || "Y",
            class: segment.bookingClass || "Y",
            includedCheckedBags: { quantity: 1 }
          })) || []
        }))
      };
      
      console.log('📤 Requesting seatmap...');
      
      const response = await flightService.getFlightSeatmap(flightWithTravelers);
      
      if (response.data && response.data.length > 0) {
        const seatmapData = response.data[0];
        console.log('✅ Seatmap loaded:', {
          seats: seatmapData.decks?.[0]?.seats?.length || 0,
          deckConfig: seatmapData.decks?.[0]?.deckConfiguration,
        });
        setSeatmap(seatmapData);
      } else {
        setError('No seatmap available for this flight');
      }
    } catch (err) {
      console.error('❌ Seatmap error:', err);
      console.error('❌ Error response:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Failed to load seat map');
    } finally {
      setLoading(false);
    }
  };

  const getSeatStatus = (seat) => {
    const pricing = seat.travelerPricing?.[0];
    if (!pricing) return 'blocked';
    return pricing.seatAvailabilityStatus?.toLowerCase() || 'blocked';
  };

  const getSeatPrice = (seat) => {
    const pricing = seat.travelerPricing?.[0];
    return pricing?.price?.total || null;
  };

  const isSeatWindow = (seat) => {
    return seat.characteristicsCodes?.includes('W');
  };

  const isSeatAisle = (seat) => {
    return seat.characteristicsCodes?.includes('A');
  };

  const handleSeatPress = (seat) => {
    const status = getSeatStatus(seat);
    
    if (status !== 'available') {
      Alert.alert(
        'Seat Unavailable',
        status === 'blocked' 
          ? 'This seat is not available for your booking'
          : 'This seat is already occupied',
        [{ text: 'OK' }]
      );
      return;
    }

    const currentPassenger = passengers[currentPassengerIndex];
    
    // Check if seat already selected
    const alreadySelected = Object.values(selectedSeats).includes(seat.number);
    if (alreadySelected) {
      Alert.alert('Seat Taken', 'Another passenger has selected this seat');
      return;
    }

    // Assign seat
    const newSelectedSeats = { ...selectedSeats, [currentPassenger.id]: seat.number };
    setSelectedSeats(newSelectedSeats);

    // Move to next passenger
    if (currentPassengerIndex < passengers.length - 1) {
      setCurrentPassengerIndex(currentPassengerIndex + 1);
    }
  };

  const handleContinue = () => {
    const allSelected = passengers.every(p => selectedSeats[p.id]);
    
    if (!allSelected) {
      Alert.alert(
        'Incomplete Selection',
        'Please select seats for all passengers or skip',
        [{ text: 'OK' }]
      );
      return;
    }

    // Create safe flight summary inline
    const flightSummary = {
      origin: flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || 'DEP',
      destination: flight.itineraries?.[0]?.segments?.[flight.itineraries?.[0]?.segments?.length - 1]?.arrival?.iataCode || 'ARR',
      departureDate: flight.itineraries?.[0]?.segments?.[0]?.departure?.at || '',
      price: parseFloat(flight.price?.total || 0),
      currency: flight.price?.currency || 'NGN',
      airline: flight.validatingAirlineCodes?.[0] || '',
    };

    navigation.navigate('PaymentScreen', {
      flight: flightSummary,
      rawFlight: flight,
      passengers,
      selectedSeats,
    });
  };

  const handleSkipSeats = () => {
    // Create safe flight summary inline
    const flightSummary = {
      origin: flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || 'DEP',
      destination: flight.itineraries?.[0]?.segments?.[flight.itineraries?.[0]?.segments?.length - 1]?.arrival?.iataCode || 'ARR',
      departureDate: flight.itineraries?.[0]?.segments?.[0]?.departure?.at || '',
      price: parseFloat(flight.price?.total || 0),
      currency: flight.price?.currency || 'NGN',
      airline: flight.validatingAirlineCodes?.[0] || '',
    };

    navigation.navigate('PaymentScreen', {
      flight: flightSummary,
      rawFlight: flight,
      passengers,
      selectedSeats: {},
    });
  };

  /**
   * Detects aisle positions based on missing y-coordinates
   * Uses intelligent gap detection for different aircraft types
   */
  const detectAisles = (seats, width) => {
    const yPositions = [...new Set(seats.map(s => s.coordinates.y))].sort((a, b) => a - b);
    
    if (yPositions.length === 0) return [];
    
    const aisles = [];
    const minY = Math.min(...yPositions);
    const maxY = Math.max(...yPositions);
    
    // Find gaps in y-coordinates (these are aisles)
    for (let y = minY; y <= maxY; y++) {
      if (!yPositions.includes(y)) {
        aisles.push(y);
      }
    }
    
    return aisles;
  };

  /**
   * Get column letter based on y-coordinate
   * Skips 'I' as per aviation standard
   */
  const getColumnLabel = (y) => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M'];
    return letters[y] || String(y);
  };

  const renderSeatmap = () => {
    if (!seatmap || !seatmap.decks || seatmap.decks.length === 0) {
      return null;
    }

    const deck = seatmap.decks[0];
    const deckConfig = deck.deckConfiguration;
    const seats = deck.seats || [];

    if (seats.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="airplane" size={48} color="#9E9E9E" />
          <Text style={styles.emptyText}>No seats available</Text>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkipSeats}>
            <Text style={styles.skipButtonText}>Continue Without Seats</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const gridWidth = deckConfig.width;

    // Organize seats by row (x-coordinate)
    const seatsByRow = {};
    seats.forEach(seat => {
      const x = seat.coordinates.x;
      if (!seatsByRow[x]) seatsByRow[x] = [];
      seatsByRow[x].push(seat);
    });

    // Get all row numbers
    const allRows = Object.keys(seatsByRow).map(Number).sort((a, b) => a - b);

    // Get all unique y-coordinates to build column headers
    const allYPositions = [...new Set(seats.map(s => s.coordinates.y))].sort((a, b) => a - b);

    // ============================================
    // IMPROVED SEAT SIZE CALCULATION
    // ============================================
    // Calculate based on actual number of columns (not gridWidth)
    const actualColumns = allYPositions.length;
    
    // More generous sizing - minimum 32px, maximum 45px
    const calculatedSize = (SCREEN_WIDTH - 70) / (actualColumns + 1);
    const SEAT_SIZE = Math.max(32, Math.min(45, calculatedSize));
    const AISLE_WIDTH = SEAT_SIZE * 0.7;
    
    // Dynamic font sizes based on seat size
    const SEAT_NUMBER_FONT = Math.max(9, Math.min(12, SEAT_SIZE * 0.28));
    const PRICE_FONT = Math.max(7, Math.min(9, SEAT_SIZE * 0.22));

    // ============================================
    // RENDER SEAT FUNCTION (with dynamic sizing)
    // ============================================
    const renderSeat = (seat) => {
      const status = getSeatStatus(seat);
      const isSelected = Object.values(selectedSeats).includes(seat.number);
      const price = getSeatPrice(seat);
      const isWindow = isSeatWindow(seat);
      const isAisle = isSeatAisle(seat);

      let backgroundColor = '#E0E0E0';
      let borderColor = '#9E9E9E';

      if (status === 'available') {
        backgroundColor = isSelected ? '#2196F3' : '#4CAF50';
        borderColor = isSelected ? '#1976D2' : '#388E3C';
      } else if (status === 'occupied') {
        backgroundColor = '#F44336';
        borderColor = '#C62828';
      }

      return (
        <TouchableOpacity
          key={seat.number}
          style={[styles.seat, { backgroundColor, borderColor }]}
          onPress={() => handleSeatPress(seat)}
          disabled={status !== 'available' || isSelected}
        >
          <Text style={[styles.seatNumber, { fontSize: SEAT_NUMBER_FONT }]}>{seat.number}</Text>
          {isWindow && <View style={styles.windowIcon} />}
          {isAisle && <Text style={[styles.aisleIcon, { fontSize: SEAT_NUMBER_FONT - 2 }]}>A</Text>}
          {price && <Text style={[styles.priceTag, { fontSize: PRICE_FONT }]}>€{price}</Text>}
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.seatmapContainer}>
        {/* Cockpit */}
        <View style={styles.cockpit}>
          <Ionicons name="airplane" size={32} color="#FFF" />
        </View>

        {/* Column Labels */}
        <View style={[styles.columnLabels, { paddingLeft: 40 }]}>
          {allYPositions.map((y) => (
            <View key={y} style={{ width: SEAT_SIZE, alignItems: 'center' }}>
              <Text style={styles.columnLabel}>{getColumnLabel(y)}</Text>
            </View>
          ))}
        </View>

        {/* Rows */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {allRows.map(x => {
            const rowSeats = seatsByRow[x] || [];
            const rowNumber = rowSeats[0]?.number?.match(/^\d+/)?.[0] || x;
            
            // Detect aisles for this row
            const aisles = detectAisles(rowSeats, gridWidth);

            // Build columns array
            const columns = [];
            allYPositions.forEach(y => {
              const seat = rowSeats.find(s => s.coordinates.y === y);
              
              if (seat) {
                columns.push({ type: 'seat', data: seat, y });
              } else if (aisles.includes(y)) {
                columns.push({ type: 'aisle', y });
              } else {
                columns.push({ type: 'empty', y });
              }
            });

            return (
              <View key={x} style={styles.row}>
                {/* Row Number */}
                <Text style={styles.rowNumber}>{rowNumber}</Text>

                {/* Seats */}
                <View style={styles.rowContent}>
                  {columns.map((col, index) => {
                    if (col.type === 'aisle') {
                      return <View key={`${x}-${col.y}`} style={[styles.aisle, { width: AISLE_WIDTH }]} />;
                    }
                    
                    if (col.type === 'empty') {
                      return <View key={`${x}-${col.y}`} style={[styles.emptySeat, { width: SEAT_SIZE }]} />;
                    }

                    return (
                      <View key={`${x}-${col.y}`} style={{ width: SEAT_SIZE }}>
                        {renderSeat(col.data)}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}

          {/* Rear Galley/Lavatory */}
          <View style={styles.rearFacilities}>
            <Ionicons name="restaurant" size={20} color="#757575" />
            <Text style={styles.facilityLabel}>Galley / Lavatory</Text>
          </View>
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={styles.loadingText}>Loading seat map...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSeatmap}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkipSeats}>
          <Text style={styles.skipButtonText}>Continue Without Seats</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentPassenger = passengers[currentPassengerIndex];
  const allSeatsSelected = passengers.every(p => selectedSeats[p.id]);

  return (
    <View style={styles.container}>
      <StatusBarComponent />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Your Seats</Text>
        <Text style={styles.headerSubtitle}>
          {flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || flight.departure?.iataCode || 'DEP'} → {flight.itineraries?.[0]?.segments?.[0]?.arrival?.iataCode || flight.arrival?.iataCode || 'ARR'}
        </Text>
      </View>

      {/* Current Passenger */}
      <View style={styles.passengerIndicator}>
        <Text style={styles.passengerText}>
          Selecting for: {currentPassenger?.firstName} {currentPassenger?.lastName}
        </Text>
        <Text style={styles.progressText}>
          {currentPassengerIndex + 1} / {passengers.length}
        </Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#2196F3' }]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#F44336' }]} />
          <Text style={styles.legendText}>Occupied</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#E0E0E0' }]} />
          <Text style={styles.legendText}>Blocked</Text>
        </View>
      </View>

      {/* Seatmap */}
      {renderSeatmap()}

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.selectedSeatsContainer}>
          <Text style={styles.selectedSeatsTitle}>Selected:</Text>
          {passengers.map(passenger => (
            <Text key={passenger.id} style={styles.selectedSeatItem}>
              {passenger.firstName}: {selectedSeats[passenger.id] || '-'}
            </Text>
          ))}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.skipButtonBottom} onPress={handleSkipSeats}>
            <Text style={styles.skipButtonBottomText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.continueButton, !allSeatsSelected && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!allSeatsSelected}
          >
            <Text style={styles.continueButtonText}>
              Continue {allSeatsSelected ? '✓' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1E88E5',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#1E88E5',
    padding: 16,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 4,
  },
  passengerIndicator: {
    backgroundColor: '#FFF',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  passengerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressText: {
    fontSize: 14,
    color: '#757575',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#757575',
  },
  seatmapContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  cockpit: {
    backgroundColor: '#1565C0',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  columnLabels: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  columnLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#757575',
  },
  scrollView: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  rowNumber: {
    width: 32,
    fontSize: 11,
    fontWeight: '600',
    color: '#757575',
    textAlign: 'center',
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  seat: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 1,
  },
  seatNumber: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFF',
  },
  windowIcon: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: '#FFF',
    borderRadius: 2,
  },
  aisleIcon: {
    position: 'absolute',
    top: 1,
    right: 2,
    fontSize: 7,
    color: '#FFF',
  },
  priceTag: {
    position: 'absolute',
    bottom: 1,
    fontSize: 7,
    color: '#FFF',
    fontWeight: 'bold',
  },
  emptySeat: {
    aspectRatio: 1,
    marginHorizontal: 1,
  },
  aisle: {
    height: 38,
  },
  rearFacilities: {
    backgroundColor: '#E0E0E0',
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  facilityLabel: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  bottomBar: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 16,
  },
  selectedSeatsContainer: {
    marginBottom: 12,
  },
  selectedSeatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectedSeatItem: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButtonBottom: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
  },
  skipButtonBottomText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
  },
  skipButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
  },
  skipButtonText: {
    color: '#757575',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  continueButton: {
    flex: 2,
    paddingVertical: 14,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#C8E6C9',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default FlightSeatSelectionScreen;