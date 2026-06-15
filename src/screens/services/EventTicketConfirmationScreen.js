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

const fmtDate = (iso) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-NG', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

export default function EventTicketConfirmationScreen({ navigation, route }) {
  const {
    reference, booking,
    eventName, eventDate, eventVenue, amount,
  } = route.params || {};

  const dark = useThem(), tc = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const InfoRow = ({ label, value }) =>
    value ? (
      <View style={ss.infoRow}>
        <Text style={[ss.infoLabel, { color: tc.subheading }]}>{label}</Text>
        <Text style={[ss.infoValue, { color: tc.heading }]} numberOfLines={2}>{value}</Text>
      </View>
    ) : null;

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
            Your event ticket has been booked successfully.
          </Text>

          <View style={[ss.refBox, { backgroundColor: `${tc.primary}12`, borderColor: `${tc.primary}30` }]}>
            <Text style={[ss.refLabel, { color: tc.subheading }]}>BOOKING REFERENCE</Text>
            <Text style={[ss.refValue, { color: tc.primary }]}>{reference}</Text>
            {booking?.invoice_id ? (
              <Text style={[ss.invoiceId, { color: tc.subtext }]}>Invoice #{booking.invoice_id}</Text>
            ) : null}
          </View>
        </View>

        {/* Event details */}
        <View style={[ss.detailCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <View style={ss.cardHeader}>
            <Ionicons name="calendar-outline" size={16} color={tc.primary} />
            <Text style={[ss.cardTitle, { color: tc.subheading }]}>EVENT DETAILS</Text>
          </View>
          <InfoRow label="Event"    value={eventName} />
          <InfoRow label="Date"     value={fmtDate(eventDate)} />
          <InfoRow label="Venue"    value={eventVenue} />
          {amount ? <InfoRow label="Amount Paid" value={formatCurrency(amount, 'NGN')} /> : null}
        </View>

        {/* Guest details */}
        <View style={[ss.detailCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <View style={ss.cardHeader}>
            <Ionicons name="person-outline" size={16} color={tc.primary} />
            <Text style={[ss.cardTitle, { color: tc.subheading }]}>GUEST DETAILS</Text>
          </View>
          <InfoRow label="Name"   value={booking?.name} />
          <InfoRow label="Email"  value={booking?.email} />
          <InfoRow label="Phone"  value={booking?.phone_number} />
        </View>

        {/* Tickets */}
        {booking?.tickets?.length > 0 && (
          <View style={[ss.detailCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
            <View style={ss.cardHeader}>
              <Ionicons name="ticket-outline" size={16} color={tc.primary} />
              <Text style={[ss.cardTitle, { color: tc.subheading }]}>TICKETS</Text>
            </View>
            {booking.tickets.map((t, i) => (
              <View key={t.id || i} style={ss.ticketRow}>
                <Text style={[ss.ticketTitle, { color: tc.heading }]}>
                  {t.title || t.name || 'Ticket'}
                  {t.quantity && t.quantity > 1 ? ` × ${t.quantity}` : ''}
                </Text>
                {t.price != null && (
                  <Text style={[ss.ticketPrice, { color: tc.primary }]}>
                    {formatCurrency(t.price, 'NGN')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

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
  invoiceId:      { fontSize: 12, marginTop: 2 },
  detailCard:     { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  cardTitle:      { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0' },
  infoLabel:      { fontSize: 13, flex: 1 },
  infoValue:      { fontSize: 13, fontWeight: '600', flex: 1.5, textAlign: 'right' },
  ticketRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0' },
  ticketTitle:    { fontSize: 14, fontWeight: '600', flex: 1 },
  ticketPrice:    { fontSize: 14, fontWeight: '700' },
  primaryBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12, marginTop: 4 },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
