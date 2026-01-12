// screens/SeatSelectionScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'context/ThemeContext';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { ScreenHeader } from 'component/SHARED';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import travuService from 'SERVICES/travuService';

// ============================================
// STEP INDICATOR COMPONENT
// ============================================
const StepIndicator = ({ currentStep, themeColors }) => {
  const steps = [
    { id: 1, label: 'Search', icon: 'search' },
    { id: 2, label: 'Select', icon: 'bus' },
    { id: 3, label: 'Details', icon: 'person' },
    { id: 4, label: 'Seats', icon: 'grid' },
    { id: 5, label: 'Payment', icon: 'card' },
  ];

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
// SEAT COMPONENT
// ============================================
const Seat = ({ seatNumber, status, isSelected, onPress, themeColors }) => {
  // status: 'available', 'blocked', 'selected'
  
  const getSeatStyle = () => {
    if (isSelected) {
      return {
        backgroundColor: themeColors.primary,
        borderColor: themeColors.primary,
      };
    }
    
    switch (status) {
      case 'blocked':
        return {
          backgroundColor: themeColors.border,
          borderColor: themeColors.border,
        };
      case 'available':
        return {
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
        };
      default:
        return {
          backgroundColor: themeColors.buttonBackground,
          borderColor: themeColors.border,
        };
    }
  };

  const getSeatTextColor = () => {
    if (isSelected) return '#FFFFFF';
    if (status === 'blocked') return themeColors.subtext;
    return themeColors.heading;
  };

  return (
    <TouchableOpacity
      style={[styles.seat, getSeatStyle()]}
      onPress={() => status === 'available' && onPress(seatNumber)}
      disabled={status === 'blocked'}
      activeOpacity={0.7}
    >
      <Text style={[styles.seatNumber, { color: getSeatTextColor() }]}>
        {seatNumber}
      </Text>
    </TouchableOpacity>
  );
};

// ============================================
// LEGEND COMPONENT
// ============================================
const Legend = ({ themeColors }) => (
  <View style={styles.legendContainer}>
    <View style={styles.legendItem}>
      <View style={[styles.legendSeat, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} />
      <Text style={[styles.legendText, { color: themeColors.subheading }]}>Available</Text>
    </View>
    <View style={styles.legendItem}>
      <View style={[styles.legendSeat, { backgroundColor: themeColors.primary, borderColor: themeColors.primary }]} />
      <Text style={[styles.legendText, { color: themeColors.subheading }]}>Selected</Text>
    </View>
    <View style={styles.legendItem}>
      <View style={[styles.legendSeat, { backgroundColor: themeColors.border, borderColor: themeColors.border }]} />
      <Text style={[styles.legendText, { color: themeColors.subheading }]}>Booked</Text>
    </View>
  </View>
);

// ============================================
// MAIN SCREEN
// ============================================
export default function SeatSelectionScreen({ route, navigation }) {
  const { trip, searchParams, passengers, passengerCount } = route.params;
  const { isDarkMode } = useTheme();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const [selectedSeats, setSelectedSeats] = useState([]);

  // Handle seat selection
  const handleSeatPress = (seatNumber) => {
    if (selectedSeats.includes(seatNumber)) {
      // Deselect seat
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
    } else {
      // Enforce passenger count limit
      if (selectedSeats.length >= passengerCount) {
        Alert.alert(
          'Maximum Seats', 
          `You have ${passengerCount} passenger${passengerCount !== 1 ? 's' : ''}. Please select exactly ${passengerCount} seat${passengerCount !== 1 ? 's' : ''}.`
        );
        return;
      }
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  // Calculate total fare
  const totalFare = travuService.calculateTotalFare(trip, selectedSeats);

  // Continue to passenger details
  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      Alert.alert('Select Seats', 'Please select at least one seat');
      return;
    }

    if (selectedSeats.length !== passengerCount) {
      Alert.alert(
        'Seat Count Mismatch', 
        `You have ${passengerCount} passenger${passengerCount !== 1 ? 's' : ''} but selected ${selectedSeats.length} seat${selectedSeats.length !== 1 ? 's' : ''}. Please select exactly ${passengerCount} seat${passengerCount !== 1 ? 's' : ''}.`
      );
      return;
    }

    navigation.navigate('PaymentScreen', {
      trip,
      searchParams,
      passengers,
      selectedSeats: selectedSeats.sort((a, b) => a - b), // Sort seats
      totalFare,
    });
  };

  // Organize seats based on vehicle type
  const getSeatLayout = () => {
    const totalSeats = trip.total_seats;

    // Define layouts based on total seats
    const layouts = {
      6: [ // 6-seater (1 front, 2-3 pattern)
        [1],
        [2, 3],
        [4, 5, 6],
      ],
      7: [ // 7-seater (1 front, 3-3 pattern)
        [1],
        [2, 3, 4],
        [5, 6, 7],
      ],
      14: [ // 14-seater (1 front, 3-4-4-2 pattern with aisle)
        [1],
        [2, 3, null, 4],
        [5, null, null, 7],
        [null, null, null, 8],
        [9, 10, null, 11, 12],
        [13, 14],
      ],
      15: [ // 15-seater (2-1 front, 4-4-4-4 pattern with aisle)
        [2, null, 1],
        [3, 4, null, 5],
        [6, 7, null, 8],
        [9, 10, null, 11],
        [12, 13, null, 14, 15],
      ],
      33: [ // 33-seater (driver front, 4x7 rows with aisle)
        [1, 2, null, 3, 4],
        [5, 6, null, 7, 8],
        [9, 10, null, 11, 12],
        [13, 14, null, 15, 16],
        [17, 18, null, 19, 20],
        [21, 22, null, 23, 24],
        [25, 26, null, 27, 28],
        [29, 30, null, 31, 32, 33],
      ],
      44: [ // 44-seater (driver front, 2-2 aisle pattern)
        [1, 2, null, 4, 3],
        [5, 6, null, 8, 7],
        [9, 10, null, 12, 11],
        [13, 14, null, 16, 15],
        [17, 18, null, 20, 19],
        [21, 22, null, 24, 23],
        [25, 26, null, null, null],
        [29, 30, null, 28, 27],
        [33, 34, null, 32, 31],
        [37, 38, null, 36, 35],
        [41, 42, null, 40, 39],
        [43, 44],
      ],
      52: [ // 52-seater (driver front, 2-2 aisle pattern)
        [1, 2, null, 4, 3],
        [5, 6, null, 8, 7],
        [9, 10, null, 12, 11],
        [13, 14, null, 16, 15],
        [17, 18, null, 20, 19],
        [21, 22, null, 24, 23],
        [25, 26, null, null, null],
        [29, 30, null, 28, 27],
        [33, 34, null, 32, 31],
        [37, 38, null, 36, 35],
        [41, 42, null, 40, 39],
        [45, 46, null, 44, 43],
        [49, 50, null, 48, 47],
        [51, 52],
      ],
      59: [ // 59-seater (driver front, 2-2 aisle pattern)
        [1, 2, null, 3, 4],
        [5, 6, null, 7, 8],
        [9, 10, null, 11, 12],
        [13, 14, null, 15, 16],
        [17, 18, null, 19, 20],
        [21, 22, null, 23, 24],
        [25, 26, null, 27, 28],
        [29, 30, null, null, null],
        [33, 34, null, 31, 32],
        [37, 38, null, 35, 36],
        [41, 42, null, 39, 40],
        [45, 46, null, 43, 44],
        [49, 50, null, 47, 48],
        [53, 54, null, 51, 52],
        [57, 58, 59, 55, 56],
      ],
    };

    // Return layout or create dynamic one
    if (layouts[totalSeats]) {
      return layouts[totalSeats];
    }

    // Fallback: Dynamic layout for undefined seat counts
    const rows = [];
    const seatsPerRow = 4;
    for (let i = 1; i <= totalSeats; i += seatsPerRow) {
      const row = [];
      for (let j = 0; j < seatsPerRow && i + j <= totalSeats; j++) {
        row.push(i + j);
      }
      rows.push(row);
    }
    return rows;
  };

  const seatLayout = getSeatLayout();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      <ScreenHeader
        title="Select Seats"
        onBackPress={() => navigation.goBack()}
      />

      {/* Step Indicator */}
      <StepIndicator currentStep={4} themeColors={themeColors} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Trip Info Card */}
        <View style={[styles.tripInfoCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.tripInfoRow}>
            <View style={styles.tripInfoLeft}>
              <Text style={[styles.tripLabel, { color: themeColors.subtext }]}>
                Provider
              </Text>
              <Text style={[styles.tripValue, { color: themeColors.heading }]}>
                {trip.provider.name}
              </Text>
            </View>
            <View style={styles.tripInfoRight}>
              <Text style={[styles.tripLabel, { color: themeColors.subtext }]}>
                Fare per Seat
              </Text>
              <Text style={[styles.tripValue, { color: themeColors.primary }]}>
                {formatCurrency(trip.fare, 'NGN')}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          <View style={styles.routeInfo}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: themeColors.primary }]} />
              <View style={styles.routeText}>
                <Text style={[styles.routeLabel, { color: themeColors.subtext }]}>From</Text>
                <Text style={[styles.routeTerminal, { color: themeColors.heading }]}>
                  {trip.departure_terminal}
                </Text>
              </View>
            </View>

            <View style={styles.routeArrow}>
              <Ionicons name="arrow-down" size={20} color={themeColors.primary} />
            </View>

            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: '#10B981' }]} />
              <View style={styles.routeText}>
                <Text style={[styles.routeLabel, { color: themeColors.subtext }]}>To</Text>
                <Text style={[styles.routeTerminal, { color: themeColors.heading }]}>
                  {trip.destination_terminal}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Seat Map */}
        <View style={[styles.seatMapCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.seatMapHeader}>
            <View style={[styles.driverSeat, { backgroundColor: themeColors.border }]}>
              <Ionicons name="person" size={24} color={themeColors.subtext} />
            </View>
            <Text style={[styles.seatMapTitle, { color: themeColors.subheading }]}>
              Driver
            </Text>
          </View>

          {/* Seat Grid */}
          <View style={styles.seatGrid}>
            {seatLayout.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.seatRow}>
                {row.map((seatNumber, seatIndex) => {
                  // null represents aisle/empty space
                  if (seatNumber === null) {
                    return <View key={`aisle-${rowIndex}-${seatIndex}`} style={styles.aisle} />;
                  }

                  const isAvailable = trip.available_seats.includes(seatNumber);
                  const isBlocked = trip.blocked_seats.includes(seatNumber);
                  const status = isBlocked ? 'blocked' : 'available';

                  return (
                    <Seat
                      key={seatNumber}
                      seatNumber={seatNumber}
                      status={status}
                      isSelected={selectedSeats.includes(seatNumber)}
                      onPress={handleSeatPress}
                      themeColors={themeColors}
                    />
                  );
                })}
              </View>
            ))}
          </View>

          {/* Legend */}
          <Legend themeColors={themeColors} />
        </View>

        {/* Selection Summary */}
        {selectedSeats.length > 0 && (
          <View style={[styles.summaryCard, { backgroundColor: `${themeColors.primary}15` }]}>
            <View style={styles.summaryHeader}>
              <Ionicons name="checkmark-circle" size={24} color={themeColors.primary} />
              <Text style={[styles.summaryTitle, { color: themeColors.heading }]}>
                Selected Seats
              </Text>
            </View>

            <View style={styles.selectedSeatsContainer}>
              {selectedSeats.sort((a, b) => a - b).map((seat) => (
                <View
                  key={seat}
                  style={[styles.selectedSeatBadge, { backgroundColor: themeColors.primary }]}
                >
                  <Text style={styles.selectedSeatText}>{seat}</Text>
                  <TouchableOpacity onPress={() => handleSeatPress(seat)}>
                    <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.summaryFooter}>
              <Text style={[styles.summaryLabel, { color: themeColors.subheading }]}>
                Total Amount
              </Text>
              <Text style={[styles.summaryAmount, { color: themeColors.primary }]}>
                {formatCurrency(totalFare, 'NGN')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: themeColors.card }]}>
        <View style={styles.bottomBarContent}>
          <View style={styles.bottomBarLeft}>
            <Text style={[styles.bottomBarLabel, { color: themeColors.subtext }]}>
              {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected
            </Text>
            <Text style={[styles.bottomBarAmount, { color: themeColors.heading }]}>
              {formatCurrency(totalFare, 'NGN')}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.continueButton,
              {
                backgroundColor: selectedSeats.length > 0 ? themeColors.primary : themeColors.border,
              },
            ]}
            onPress={handleContinue}
            disabled={selectedSeats.length === 0}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
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
    paddingBottom: 100,
  },

  // Step Indicator
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
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

  // Trip Info Card
  tripInfoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tripInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tripInfoLeft: {
    flex: 1,
  },
  tripInfoRight: {
    alignItems: 'flex-end',
  },
  tripLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  tripValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  routeInfo: {
    gap: 12,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeText: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  routeTerminal: {
    fontSize: 14,
    fontWeight: '700',
  },
  routeArrow: {
    marginLeft: 6,
  },

  // Seat Map
  seatMapCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  seatMapHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  driverSeat: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  seatMapTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  seatGrid: {
    gap: 12,
    marginBottom: 24,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  seat: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  aisle: {
    width: 36,
    height: 36,
  },

  // Legend
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSeat: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Summary Card
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  selectedSeatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  selectedSeatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  selectedSeatText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 35,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  bottomBarLeft: {
    flex: 1,
  },
  bottomBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  bottomBarAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});