// screens/PaymentScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'context/ThemeContext';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { ScreenHeader, PinModal, } from 'component/SHARED';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import bookingService from 'AuthFunction/bookingService';

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
// PIN MODAL COMPONENT
// ============================================

// ============================================
// MAIN SCREEN
// ============================================
export default function PaymentScreen({ route, navigation }) {
  const { trip, searchParams, passengers, selectedSeats, totalFare } = route.params;
  const { isDarkMode } = useTheme();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const [showPinModal, setShowPinModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pinError, setPinError] = useState(null);

  // Handle payment
  const handlePayment = () => {
    setPinError(null);
    setShowPinModal(true);
  };

  // Process booking
  const processBooking = async (pin) => {
    setLoading(true);
    setPinError(null);

    try {
      console.log('🎫 Processing booking...');

      // Prepare booking data
      const bookingData = {
        tripDetails: {
          provider: {
            name: trip.provider.name,
            shortName: trip.provider.short_name,
            logo: trip.provider.logo,
          },
          tripId: trip.trip_id,
          tripNo: trip.trip_no,
          origin: trip.origin_name,
          destination: trip.destination_name,
          departureTerminal: trip.departure_terminal,
          destinationTerminal: trip.destination_terminal,
          departureAddress: trip.departure_address,
          destinationAddress: trip.destination_address,
          departureDate: trip.trip_date,
          departureTime: trip.departure_time.split(' ')[1], // Extract time only
          vehicle: trip.vehicle,
          boardingAt: trip.boarding_at,
          orderId: trip.order_id,
        },
        passengers: passengers.map((passenger, index) => ({
          seatNumber: selectedSeats[index],
          title: passenger.title,
          fullName: passenger.fullName,
          age: parseInt(passenger.age),
          gender: passenger.gender,
          phone: passenger.phone,
          email: passenger.email || '',
          nextOfKin: passenger.nextOfKin,
          nextOfKinPhone: passenger.nextOfKinPhone,
        })),
        payment: {
          amount: totalFare,
          farePerSeat: trip.fare,
          method: 'wallet',
        },
        pin,
      };

      // Create booking
      const response = await bookingService.createBooking(bookingData);

      if (response.success) {
        setShowPinModal(false);
        setLoading(false);

        // Navigate to receipt
        navigation.replace('Receipt', {
          bookingId: response.data.bookingId,
          bookingReference: response.data.bookingReference,
        });
      }
    } catch (error) {
      setLoading(false);
      console.error('Booking error:', error);
      
      // Show error in PIN modal instead of alert
      setPinError(error.message || 'Unable to process payment. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      <ScreenHeader
        title="Payment"
        onBackPress={() => navigation.goBack()}
      />

      {/* Step Indicator */}
      <StepIndicator currentStep={5} themeColors={themeColors} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Payment Summary */}
        <View style={[styles.summaryCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
            Payment Summary
          </Text>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>
              Route
            </Text>
            <Text style={[styles.summaryValue, { color: themeColors.heading }]}>
              {trip.origin_name} → {trip.destination_name}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>
              Provider
            </Text>
            <Text style={[styles.summaryValue, { color: themeColors.heading }]}>
              {trip.provider.name}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>
              Departure Date
            </Text>
            <Text style={[styles.summaryValue, { color: themeColors.heading }]}>
              {new Date(trip.trip_date).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>
              Departure Time
            </Text>
            <Text style={[styles.summaryValue, { color: themeColors.heading }]}>
              {trip.departure_time.split(' ')[1]}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>
              Passengers
            </Text>
            <Text style={[styles.summaryValue, { color: themeColors.heading }]}>
              {passengers.length}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>
              Selected Seats
            </Text>
            <Text style={[styles.summaryValue, { color: themeColors.heading }]}>
              {selectedSeats.join(', ')}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: themeColors.subtext }]}>
              Fare per Seat
            </Text>
            <Text style={[styles.summaryValue, { color: themeColors.heading }]}>
              {formatCurrency(trip.fare, 'NGN')}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: themeColors.heading }]}>
              Total Amount
            </Text>
            <Text style={[styles.totalValue, { color: themeColors.primary }]}>
              {formatCurrency(totalFare, 'NGN')}
            </Text>
          </View>
        </View>

        {/* Passenger List */}
        <View style={[styles.passengersCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
            Passenger Details
          </Text>

          {passengers.map((passenger, index) => (
            <View
              key={index}
              style={[
                styles.passengerItem,
                index !== passengers.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: themeColors.border,
                },
              ]}
            >
              <View style={styles.passengerHeader}>
                <View style={[styles.seatBadge, { backgroundColor: `${themeColors.primary}20` }]}>
                  <Text style={[styles.seatBadgeText, { color: themeColors.primary }]}>
                    Seat {selectedSeats[index]}
                  </Text>
                </View>
              </View>
              <Text style={[styles.passengerName, { color: themeColors.heading }]}>
                {passenger.title} {passenger.fullName}
              </Text>
              <Text style={[styles.passengerInfo, { color: themeColors.subtext }]}>
                {passenger.age} years • {passenger.gender} • {passenger.phone}
              </Text>
            </View>
          ))}
        </View>

        {/* Payment Method */}
        <View style={[styles.paymentCard, { backgroundColor: themeColors.card }]}>
          <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
            Payment Method
          </Text>

          <View style={[styles.methodItem, { backgroundColor: `${themeColors.primary}15` }]}>
            <View style={[styles.methodIcon, { backgroundColor: themeColors.primary }]}>
              <Ionicons name="wallet" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.methodInfo}>
              <Text style={[styles.methodTitle, { color: themeColors.heading }]}>
                PayFlex Wallet
              </Text>
              <Text style={[styles.methodSubtitle, { color: themeColors.subtext }]}>
                Payment will be deducted from your wallet
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color={themeColors.primary} />
          </View>
        </View>

        {/* Important Notice */}
        <View style={[styles.noticeCard, { backgroundColor: `${themeColors.primary}10` }]}>
          <Ionicons name="information-circle" size={20} color={themeColors.primary} />
          <Text style={[styles.noticeText, { color: themeColors.subheading }]}>
            Please ensure all passenger details are correct. Cancellations must be made at least 2 hours before departure for 80% refund.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: themeColors.card }]}>
        <View style={styles.bottomBarContent}>
          <View style={styles.bottomBarLeft}>
            <Text style={[styles.bottomBarLabel, { color: themeColors.subtext }]}>
              Total Payment
            </Text>
            <Text style={[styles.bottomBarAmount, { color: themeColors.heading }]}>
              {formatCurrency(totalFare, 'NGN')}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.payButton, { backgroundColor: themeColors.primary }]}
            onPress={handlePayment}
          >
            <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
            <Text style={styles.payButtonText}>Pay Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* PIN Modal */}
      {/* PIN Modal */}
      <PinModal
        visible={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPinError(null);
        }}
        onSubmit={processBooking}
        loading={loading}
        error={pinError}
        title="Enter Transaction PIN"
        subtitle="Enter your 4-digit PIN to confirm payment"
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
    paddingBottom: 120,
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

  // Cards
  summaryCard: {
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
  passengersCard: {
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
  paymentCard: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },

  // Passengers
  passengerItem: {
    paddingVertical: 12,
  },
  passengerHeader: {
    marginBottom: 8,
  },
  seatBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  seatBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  passengerName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  passengerInfo: {
    fontSize: 12,
  },

  // Payment Method
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  methodSubtitle: {
    fontSize: 12,
  },

  // Notice
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
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
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  payButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
