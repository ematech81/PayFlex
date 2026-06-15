import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { formatCurrency } from 'CONSTANT/formatCurrency';

const fmtDate = (ymd) =>
  ymd
    ? new Date(`${ymd}T00:00:00`).toLocaleDateString('en-NG', {
        weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

export default function HotelBookingConfirmationScreen({ navigation, route }) {
  const { reference, booking } = route.params || {};
  const dark = useThem(), tc = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const b = booking || {};

  const InfoRow = ({ label, value }) =>
    value != null && value !== '' ? (
      <View style={ss.infoRow}>
        <Text style={[ss.infoLabel, { color: tc.subheading }]}>{label}</Text>
        <Text style={[ss.infoValue, { color: tc.heading }]} numberOfLines={2}>{value}</Text>
      </View>
    ) : null;

  const nights = b.number_of_nights ?? 1;

  return (
    <SafeAreaView style={[ss.container, { backgroundColor: tc.background }]}>
      <StatusBarComponent />

      <View style={[ss.header, { backgroundColor: tc.background, borderBottomColor: tc.border || '#E5E5EA', paddingTop: insets.top + 8 }]}>
        <View style={{ width: 24 }} />
        <Text style={[ss.headerTitle, { color: tc.heading }]}>Booking Confirmed</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={ss.sc} showsVerticalScrollIndicator={false}>

        {/* Status badge */}
        <View style={[ss.statusCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <View style={[ss.statusIconWrap, { backgroundColor: '#4CAF5020' }]}>
            <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
          </View>
          <Text style={[ss.statusLabel, { color: '#4CAF50' }]}>Booking Confirmed!</Text>
          <Text style={[ss.statusSub, { color: tc.subheading }]}>
            Your hotel room has been booked successfully.
          </Text>

          {/* Reference + booking number */}
          <View style={[ss.refBox, { backgroundColor: `${tc.primary}12`, borderColor: `${tc.primary}30` }]}>
            <Text style={[ss.refLabel, { color: tc.subheading }]}>BOOKING REFERENCE</Text>
            <Text style={[ss.refValue, { color: tc.primary }]}>{reference || b.reference}</Text>
            {b.booking_number ? (
              <View style={ss.badgeRow}>
                <View style={[ss.badge, { backgroundColor: `${tc.primary}18` }]}>
                  <Text style={[ss.badgeText, { color: tc.primary }]}>Booking # {b.booking_number}</Text>
                </View>
              </View>
            ) : null}
            {b.invoice_id ? (
              <Text style={[ss.invoiceId, { color: tc.subtext }]}>Invoice #{b.invoice_id}</Text>
            ) : null}
          </View>
        </View>

        {/* Hotel & room details */}
        <View style={[ss.detailCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <View style={ss.cardHeader}>
            <Ionicons name="business-outline" size={16} color={tc.primary} />
            <Text style={[ss.cardTitle, { color: tc.subheading }]}>HOTEL DETAILS</Text>
          </View>
          <InfoRow label="Hotel"    value={b.hotel?.name} />
          <InfoRow label="Location" value={b.hotel?.location} />
          <InfoRow label="Room"     value={b.room?.room_name} />
        </View>

        {/* Stay details */}
        <View style={[ss.detailCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <View style={ss.cardHeader}>
            <Ionicons name="calendar-outline" size={16} color={tc.primary} />
            <Text style={[ss.cardTitle, { color: tc.subheading }]}>STAY DETAILS</Text>
          </View>
          <InfoRow label="Check-in"  value={fmtDate(b.checkin_date)} />
          <InfoRow label="Check-out" value={fmtDate(b.checkout_date)} />
          <InfoRow label="Duration"  value={`${nights} night${nights !== 1 ? 's' : ''}`} />
          <InfoRow label="Rooms"     value={String(b.number_of_rooms ?? '')} />
          <InfoRow label="Guests"    value={String(b.number_of_guests ?? '')} />
          {b.amount != null ? (
            <InfoRow label="Total Paid" value={formatCurrency(b.amount, 'NGN')} />
          ) : null}
        </View>

        {/* Guest details */}
        <View style={[ss.detailCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <View style={ss.cardHeader}>
            <Ionicons name="person-outline" size={16} color={tc.primary} />
            <Text style={[ss.cardTitle, { color: tc.subheading }]}>GUEST DETAILS</Text>
          </View>
          <InfoRow label="Name"  value={b.name} />
          <InfoRow label="Email" value={b.email} />
          <InfoRow label="Phone" value={b.phone_number} />
        </View>

        <TouchableOpacity
          style={[ss.receiptBtn, { borderColor: tc.primary }]}
          onPress={() => navigation.navigate('ShareReceipt', {
            reference,
            transaction: {
              reference,
              type:           'hotel_booking',
              amount:         booking?.amount,
              status:         'confirmed',
              isMerpi:        true,
              bookingDetails: booking,
            },
          })}
          activeOpacity={0.85}
        >
          <Ionicons name="download-outline" size={18} color={tc.primary} />
          <Text style={[ss.receiptBtnText, { color: tc.primary }]}>Download Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[ss.primaryBtn, { backgroundColor: tc.primary }]}
          onPress={() => navigation.navigate('MainTabs')}
          activeOpacity={0.85}
        >
          <Ionicons name="home-outline" size={18} color="#FFF" />
          <Text style={ss.primaryBtnText}>Back to Home</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  container:      { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle:    { fontSize: 16, fontWeight: '700' },
  sc:             { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  statusCard:     { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', marginBottom: 16, gap: 8 },
  statusIconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statusLabel:    { fontSize: 20, fontWeight: '800' },
  statusSub:      { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  refBox:         { borderRadius: 10, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center', marginTop: 12, width: '100%', gap: 4 },
  refLabel:       { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  refValue:       { fontSize: 20, fontWeight: '900', letterSpacing: 1.5 },
  badgeRow:       { flexDirection: 'row', marginTop: 4 },
  badge:          { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:      { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  invoiceId:      { fontSize: 12, marginTop: 2 },
  detailCard:     { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  cardTitle:      { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0' },
  infoLabel:      { fontSize: 13, flex: 1 },
  infoValue:      { fontSize: 13, fontWeight: '600', flex: 1.5, textAlign: 'right' },
  receiptBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 4, borderWidth: 1.5 },
  receiptBtnText: { fontSize: 15, fontWeight: '700' },
  primaryBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12, marginTop: 10 },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
