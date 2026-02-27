import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import flightServices from 'AuthFunction/transport/flightServices';


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
      const response = await flightServices.getFlightSeatmap(flight);
      
      console.log('🔍 Full API Response:', JSON.stringify(response, null, 2));
      
      if (response.data && response.data.length > 0) {
        const seatmapData = response.data[0];
        console.log('✅ Seatmap loaded:', {
          seats: seatmapData.decks?.[0]?.seats?.length || 0,
          deckConfig: seatmapData.decks?.[0]?.deckConfiguration,
          facilities: seatmapData.decks?.[0]?.facilities?.length || 0
        });
        setSeatmap(seatmapData);
      } else {
        setError('No seatmap available for this flight');
      }
    } catch (err) {
      console.error('❌ Seatmap error:', err);
      setError('Failed to load seat map');
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
          ? 'This seat is not available for selection'
          : 'This seat is already occupied',
        [{ text: 'OK' }]
      );
      return;
    }

    const currentPassenger = passengers[currentPassengerIndex];
    
    // Check if seat already selected by another passenger
    const alreadySelected = Object.values(selectedSeats).includes(seat.number);
    if (alreadySelected) {
      Alert.alert('Seat Already Selected', 'This seat is already chosen by another passenger');
      return;
    }

    // Assign seat to current passenger
    const newSelectedSeats = { ...selectedSeats, [currentPassenger.id]: seat.number };
    setSelectedSeats(newSelectedSeats);

    // Move to next passenger if not last
    if (currentPassengerIndex < passengers.length - 1) {
      setCurrentPassengerIndex(currentPassengerIndex + 1);
    }
  };

  const handleContinue = () => {
    const allSelected = passengers.every(p => selectedSeats[p.id]);
    
    if (!allSelected) {
      Alert.alert(
        'Incomplete Selection',
        'Please select seats for all passengers or skip seat selection',
        [{ text: 'OK' }]
      );
      return;
    }

    navigation.navigate('PaymentScreen', {
      flight,
      passengers,
      selectedSeats,
    });
  };

  const handleSkipSeats = () => {
    navigation.navigate('Payment', {
      flight,
      passengers,
      selectedSeats: {},
    });
  };

  const renderSeat = (seat, gridWidth) => {
    const status = getSeatStatus(seat);
    const isSelected = Object.values(selectedSeats).includes(seat.number);
    const price = getSeatPrice(seat);
    const isWindow = isSeatWindow(seat);
    const isAisle = isSeatAisle(seat);

    let backgroundColor = '#E0E0E0'; // Blocked/default
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
        style={[
          styles.seat,
          { backgroundColor, borderColor }
        ]}
        onPress={() => handleSeatPress(seat)}
        disabled={status !== 'available' || isSelected}
      >
        <Text style={styles.seatNumber}>{seat.number}</Text>
        {isWindow && <Ionicons name="square-outline" size={10} color="#FFF" style={styles.icon} />}
        {isAisle && <Text style={styles.aisleIcon}>A</Text>}
        {price && <Text style={styles.priceTag}>€{price}</Text>}
      </TouchableOpacity>
    );
  };

  const renderFacility = (facility) => {
    const icons = {
      'LA': 'water',
      'G': 'restaurant',
      'CL': 'file-tray',
      'SO': 'cube'
    };

    return (
      <View key={`${facility.code}-${facility.coordinates.x}-${facility.coordinates.y}`} style={styles.facility}>
        <Ionicons name={icons[facility.code] || 'square'} size={16} color="#757575" />
      </View>
    );
  };

  const renderSeatmap = () => {
    if (!seatmap || !seatmap.decks || seatmap.decks.length === 0) {
      return null;
    }

    const deck = seatmap.decks[0];
    const deckConfig = deck.deckConfiguration;
    const seats = deck.seats || [];
    const facilities = deck.facilities || [];

    if (seats.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="airplane" size={48} color="#9E9E9E" />
          <Text style={styles.emptyText}>No seats available for this flight</Text>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkipSeats}>
            <Text style={styles.skipButtonText}>Continue Without Seats</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Build grid structure using coordinates
    const gridWidth = deckConfig.width;
    const gridLength = deckConfig.length;

    // Organize seats by x coordinate (rows)
    const seatsByRow = {};
    seats.forEach(seat => {
      const x = seat.coordinates.x;
      if (!seatsByRow[x]) seatsByRow[x] = [];
      seatsByRow[x].push(seat);
    });

    // Organize facilities by x coordinate
    const facilitiesByRow = {};
    facilities.forEach(facility => {
      const x = facility.coordinates.x;
      if (!facilitiesByRow[x]) facilitiesByRow[x] = [];
      facilitiesByRow[x].push(facility);
    });

    // Get all x coordinates (rows)
    const allX = [...new Set([
      ...Object.keys(seatsByRow).map(Number),
      ...Object.keys(facilitiesByRow).map(Number)
    ])].sort((a, b) => a - b);

    // Determine column labels based on width
    const getColumnLabels = (width) => {
      const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'];
      return labels.slice(0, width);
    };

    const columnLabels = getColumnLabels(gridWidth);

    return (
      <View style={styles.seatmapContainer}>
        {/* Cockpit */}
        <View style={styles.cockpit}>
          <Ionicons name="airplane" size={32} color="#FFF" />
        </View>

        {/* Column Labels */}
        <View style={styles.columnLabels}>
          {columnLabels.map((label, index) => (
            <Text key={index} style={styles.columnLabel}>{label}</Text>
          ))}
        </View>

        {/* Rows */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {allX.map(x => {
            const rowSeats = seatsByRow[x] || [];
            const rowFacilities = facilitiesByRow[x] || [];
            const rowNumber = rowSeats[0]?.number?.match(/^\d+/)?.[0] || x;

            // Create array for all columns
            const columns = Array(gridWidth).fill(null);

            // Place seats in their y positions
            rowSeats.forEach(seat => {
              columns[seat.coordinates.y] = seat;
            });

            // Place facilities
            rowFacilities.forEach(facility => {
              columns[facility.coordinates.y] = { type: 'facility', data: facility };
            });

            // Detect aisle (missing y values in the middle)
            const occupiedYs = [...rowSeats.map(s => s.coordinates.y)];
            const minY = Math.min(...occupiedYs);
            const maxY = Math.max(...occupiedYs);
            const aisleY = [];
            for (let y = minY + 1; y < maxY; y++) {
              if (!occupiedYs.includes(y)) {
                aisleY.push(y);
              }
            }

            return (
              <View key={x} style={styles.row}>
                {/* Row number */}
                <Text style={styles.rowNumber}>{rowNumber}</Text>

                {/* Seats/Facilities */}
                <View style={styles.rowContent}>
                  {columns.map((item, y) => {
                    // Check if this is an aisle position
                    if (aisleY.includes(y)) {
                      return <View key={y} style={styles.aisle} />;
                    }

                    if (!item) {
                      return <View key={y} style={styles.emptySeat} />;
                    }

                    if (item.type === 'facility') {
                      return renderFacility(item.data);
                    }

                    return renderSeat(item, gridWidth);
                  })}
                </View>
              </View>
            );
          })}

          {/* Galley/Lavatory at rear */}
          <View style={styles.rearFacilities}>
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Your Seats</Text>
        <Text style={styles.headerSubtitle}>
          {flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || flight.departure?.iataCode || 'DEP'} → {flight.itineraries?.[0]?.segments?.[0]?.arrival?.iataCode || flight.arrival?.iataCode || 'ARR'}
        </Text>
      </View>

      {/* Current Passenger Indicator */}
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

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {/* Selected Seats Summary */}
        <View style={styles.selectedSeatsContainer}>
          <Text style={styles.selectedSeatsTitle}>Selected Seats:</Text>
          {passengers.map(passenger => (
            <Text key={passenger.id} style={styles.selectedSeatItem}>
              {passenger.firstName}: {selectedSeats[passenger.id] || 'None'}
            </Text>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.skipButtonBottom}
            onPress={handleSkipSeats}
          >
            <Text style={styles.skipButtonBottomText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.continueButton,
              !allSeatsSelected && styles.continueButtonDisabled
            ]}
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
    fontSize: 14,
    color: '#FFF',
    marginTop: 4,
  },
  passengerIndicator: {
    backgroundColor: '#FFF',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  passengerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
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
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 40,
  },
  columnLabel: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
  },
  scrollView: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  rowNumber: {
    width: 32,
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
    textAlign: 'center',
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  seat: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  seatNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  icon: {
    position: 'absolute',
    top: 2,
    left: 2,
  },
  aisleIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 8,
    color: '#FFF',
  },
  priceTag: {
    position: 'absolute',
    bottom: 1,
    fontSize: 8,
    color: '#FFF',
    fontWeight: 'bold',
  },
  emptySeat: {
    width: 36,
    height: 36,
    marginHorizontal: 2,
  },
  aisle: {
    width: 20,
    height: 36,
  },
  facility: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  rearFacilities: {
    backgroundColor: '#E0E0E0',
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  facilityLabel: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
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
    textAlign: 'center',
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
    color: '#212121',
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