// screens/ReceiptScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'context/ThemeContext';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import bookingService from 'AuthFunction/bookingService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// ============================================
// MAIN SCREEN
// ============================================
export default function ReceiptScreen({ route, navigation }) {
  const { bookingId, bookingReference } = route.params;
  const { isDarkMode } = useTheme();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadBooking();
  }, []);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getBooking(bookingId);
      if (response.success) {
        setBooking(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load booking details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      // Generate receipt text content
      const receiptContent = generateReceiptText(booking);
      
      // Create file path
      const fileUri = FileSystem.documentDirectory + `booking_${booking.bookingReference}.txt`;
      
      // Write to file
      await FileSystem.writeAsStringAsync(fileUri, receiptContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      // Share file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', 'Receipt saved successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to download receipt');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      const message = `
PayFlex Transport Booking

Booking Reference: ${booking.bookingReference}
Route: ${booking.tripDetails.route}
Date: ${new Date(booking.tripDetails.departureDate).toLocaleDateString()}
Time: ${booking.tripDetails.departureTime}
Passengers: ${booking.passengers.length}
Total: ${formatCurrency(booking.payment.amount, 'NGN')}

Status: ${booking.status.toUpperCase()}
      `.trim();

      await Share.share({ message });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    });
  };

  const handleViewBookings = () => {
    navigation.replace('BookingHistory');
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={[styles.loadingText, { color: themeColors.subtext }]}>
          Loading receipt...
        </Text>
      </View>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={[styles.successIcon, { backgroundColor: `#10B98120` }]}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          </View>
          <Text style={[styles.successTitle, { color: themeColors.heading }]}>
            Booking Confirmed!
          </Text>
          <Text style={[styles.successSubtitle, { color: themeColors.subtext }]}>
            Your transport booking has been successfully confirmed
          </Text>
        </View>

        {/* Receipt Card */}
        <View style={[styles.receiptCard, { backgroundColor: themeColors.card }]}>
          {/* Booking Reference */}
          <View style={[styles.referenceSection, { backgroundColor: `${themeColors.primary}15` }]}>
            <Text style={[styles.referenceLabel, { color: themeColors.subtext }]}>
              Booking Reference
            </Text>
            <Text style={[styles.referenceValue, { color: themeColors.primary }]}>
              {booking.bookingReference}
            </Text>
            <Text style={[styles.referenceNote, { color: themeColors.subtext }]}>
              Present this reference at the terminal
            </Text>
          </View>

          {/* Trip Details */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
              Trip Details
            </Text>
            
            <View style={styles.detailRow}>
              <Ionicons name="business" size={20} color={themeColors.subtext} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: themeColors.subtext }]}>Provider</Text>
                <Text style={[styles.detailValue, { color: themeColors.heading }]}>
                  {booking.tripDetails.provider.name}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="navigate" size={20} color={themeColors.subtext} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: themeColors.subtext }]}>Route</Text>
                <Text style={[styles.detailValue, { color: themeColors.heading }]}>
                  {booking.tripDetails.route}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={20} color={themeColors.subtext} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: themeColors.subtext }]}>Date</Text>
                <Text style={[styles.detailValue, { color: themeColors.heading }]}>
                  {new Date(booking.tripDetails.departureDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="time" size={20} color={themeColors.subtext} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: themeColors.subtext }]}>
                  Departure Time
                </Text>
                <Text style={[styles.detailValue, { color: themeColors.heading }]}>
                  {booking.tripDetails.departureTime}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="location" size={20} color={themeColors.subtext} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: themeColors.subtext }]}>
                  Departure Terminal
                </Text>
                <Text style={[styles.detailValue, { color: themeColors.heading }]}>
                  {booking.tripDetails.departureTerminal}
                </Text>
                {booking.tripDetails.departureAddress && (
                  <Text style={[styles.detailAddress, { color: themeColors.subtext }]}>
                    {booking.tripDetails.departureAddress}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="flag" size={20} color={themeColors.subtext} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: themeColors.subtext }]}>
                  Destination Terminal
                </Text>
                <Text style={[styles.detailValue, { color: themeColors.heading }]}>
                  {booking.tripDetails.destinationTerminal}
                </Text>
                {booking.tripDetails.destinationAddress && (
                  <Text style={[styles.detailAddress, { color: themeColors.subtext }]}>
                    {booking.tripDetails.destinationAddress}
                  </Text>
                )}
              </View>
            </View>

            {booking.tripDetails.vehicle && (
              <View style={styles.detailRow}>
                <Ionicons name="bus" size={20} color={themeColors.subtext} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: themeColors.subtext }]}>
                    Vehicle Type
                  </Text>
                  <Text style={[styles.detailValue, { color: themeColors.heading }]}>
                    {booking.tripDetails.vehicle}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          {/* Passengers */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
              Passenger Information
            </Text>

            {booking.passengers.map((passenger, index) => (
              <View
                key={index}
                style={[
                  styles.passengerCard,
                  { backgroundColor: themeColors.background },
                ]}
              >
                <View style={styles.passengerHeader}>
                  <View style={[styles.seatBadge, { backgroundColor: `${themeColors.primary}20` }]}>
                    <Ionicons name="person" size={16} color={themeColors.primary} />
                    <Text style={[styles.seatText, { color: themeColors.primary }]}>
                      Seat {passenger.seatNumber}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.passengerName, { color: themeColors.heading }]}>
                  {passenger.title} {passenger.fullName}
                </Text>
                <Text style={[styles.passengerInfo, { color: themeColors.subtext }]}>
                  {passenger.age} years • {passenger.gender}
                </Text>
                <Text style={[styles.passengerInfo, { color: themeColors.subtext }]}>
                  {passenger.phone}
                </Text>
                <View style={styles.emergencyContact}>
                  <Ionicons name="call" size={14} color={themeColors.subtext} />
                  <Text style={[styles.emergencyText, { color: themeColors.subtext }]}>
                    Emergency: {passenger.nextOfKin} ({passenger.nextOfKinPhone})
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

          {/* Payment Summary */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
              Payment Summary
            </Text>

            <View style={styles.paymentRow}>
              <Text style={[styles.paymentLabel, { color: themeColors.subtext }]}>
                Fare per Seat
              </Text>
              <Text style={[styles.paymentValue, { color: themeColors.heading }]}>
                {formatCurrency(booking.payment.farePerSeat, 'NGN')}
              </Text>
            </View>

            <View style={styles.paymentRow}>
              <Text style={[styles.paymentLabel, { color: themeColors.subtext }]}>
                Number of Seats
              </Text>
              <Text style={[styles.paymentValue, { color: themeColors.heading }]}>
                {booking.payment.totalSeats}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

            <View style={styles.paymentRow}>
              <Text style={[styles.totalLabel, { color: themeColors.heading }]}>
                Total Paid
              </Text>
              <Text style={[styles.totalValue, { color: themeColors.primary }]}>
                {formatCurrency(booking.payment.amount, 'NGN')}
              </Text>
            </View>

            <View style={styles.paymentRow}>
              <Text style={[styles.paymentLabel, { color: themeColors.subtext }]}>
                Payment Method
              </Text>
              <Text style={[styles.paymentValue, { color: themeColors.heading }]}>
                PayFlex Wallet
              </Text>
            </View>

            <View style={styles.paymentRow}>
              <Text style={[styles.paymentLabel, { color: themeColors.subtext }]}>
                Payment Date
              </Text>
              <Text style={[styles.paymentValue, { color: themeColors.heading }]}>
                {new Date(booking.payment.paidAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={[styles.statusText, { color: '#10B981' }]}>
              {booking.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Important Notes */}
        <View style={[styles.notesCard, { backgroundColor: themeColors.card }]}>
          <View style={styles.noteHeader}>
            <Ionicons name="information-circle" size={20} color={themeColors.primary} />
            <Text style={[styles.noteTitle, { color: themeColors.heading }]}>
              Important Information
            </Text>
          </View>

          <Text style={[styles.noteText, { color: themeColors.subtext }]}>
            • Please arrive at the terminal at least 30 minutes before departure
          </Text>
          <Text style={[styles.noteText, { color: themeColors.subtext }]}>
            • Present your booking reference at the check-in counter
          </Text>
          <Text style={[styles.noteText, { color: themeColors.subtext }]}>
            • Carry a valid ID for verification
          </Text>
          <Text style={[styles.noteText, { color: themeColors.subtext }]}>
            • Cancellations must be made 2+ hours before departure
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: themeColors.card }]}
            onPress={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator size="small" color={themeColors.primary} />
            ) : (
              <>
                <Ionicons name="download" size={20} color={themeColors.primary} />
                <Text style={[styles.actionButtonText, { color: themeColors.primary }]}>
                  Download
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: themeColors.card }]}
            onPress={handleShare}
          >
            <Ionicons name="share-social" size={20} color={themeColors.primary} />
            <Text style={[styles.actionButtonText, { color: themeColors.primary }]}>
              Share
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: themeColors.primary }]}
          onPress={handleGoHome}
        >
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: themeColors.border }]}
          onPress={handleViewBookings}
        >
          <Text style={[styles.secondaryButtonText, { color: themeColors.heading }]}>
            View All Bookings
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateReceiptText(booking) {
  return `
═══════════════════════════════════════════
          PAYFLEX TRANSPORT BOOKING
═══════════════════════════════════════════

Booking Reference: ${booking.bookingReference}
Status: ${booking.status.toUpperCase()}

───────────────────────────────────────────
TRIP DETAILS
───────────────────────────────────────────

Provider: ${booking.tripDetails.provider.name}
Route: ${booking.tripDetails.route}
Date: ${new Date(booking.tripDetails.departureDate).toLocaleDateString()}
Time: ${booking.tripDetails.departureTime}

Departure: ${booking.tripDetails.departureTerminal}
${booking.tripDetails.departureAddress || ''}

Destination: ${booking.tripDetails.destinationTerminal}
${booking.tripDetails.destinationAddress || ''}

Vehicle: ${booking.tripDetails.vehicle || 'N/A'}

───────────────────────────────────────────
PASSENGER INFORMATION
───────────────────────────────────────────

${booking.passengers.map((p, i) => `
Passenger ${i + 1} - Seat ${p.seatNumber}
Name: ${p.title} ${p.fullName}
Age: ${p.age} years
Gender: ${p.gender}
Phone: ${p.phone}
Emergency: ${p.nextOfKin} (${p.nextOfKinPhone})
`).join('\n')}

───────────────────────────────────────────
PAYMENT SUMMARY
───────────────────────────────────────────

Fare per Seat: ${formatCurrency(booking.payment.farePerSeat, 'NGN')}
Number of Seats: ${booking.payment.totalSeats}
Total Paid: ${formatCurrency(booking.payment.amount, 'NGN')}
Payment Method: PayFlex Wallet
Payment Date: ${new Date(booking.payment.paidAt).toLocaleDateString()}

═══════════════════════════════════════════
           Thank you for using PayFlex
═══════════════════════════════════════════
  `.trim();
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // Success Header
  successHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },

  // Receipt Card
  receiptCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Reference Section
  referenceSection: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  referenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  referenceValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  referenceNote: {
    fontSize: 11,
    textAlign: 'center',
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },

  // Detail Rows
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  detailAddress: {
    fontSize: 12,
    marginTop: 4,
  },

  // Passengers
  passengerCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  passengerHeader: {
    marginBottom: 8,
  },
  seatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  seatText: {
    fontSize: 12,
    fontWeight: '700',
  },
  passengerName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  passengerInfo: {
    fontSize: 13,
    marginBottom: 2,
  },
  emergencyContact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  emergencyText: {
    fontSize: 11,
  },

  // Payment
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  paymentValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Notes
  notesCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  noteText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});