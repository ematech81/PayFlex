import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import BookingStepIndicator from 'component/bus/BookingStepIndicator';
import { placeLabel, fmtDate } from 'utility/busHelpers';

export default function TripDetailScreen({ navigation, route: navRoute }) {
  const { route, schedule, bus, depDate, fromCity, toCity } = navRoute.params || {};
  const dark = useThem(), tc = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const origin  = placeLabel(route?.from) || fromCity?.name || '';
  const dest    = placeLabel(route?.to)   || toCity?.name   || '';
  const isLuxury = /luxury|vip|executive/i.test(route?.business?.type || route?.schedule_type || '');
  const isRandom = route?.schedule_type === 'random';
  const busName  = isRandom ? (bus?.bus_type || 'Bus') : bus?.name;
  const pricePerSeat = isRandom ? (bus?.price ?? route?.price) : route?.price;

  const InfoRow = ({ label, value, icon, highlight }) =>
    value ? (
      <View style={ss.infoRow}>
        {icon && <Ionicons name={icon} size={15} color={tc.subheading} style={{ marginRight: 8 }} />}
        <Text style={[ss.infoLabel, { color: tc.subheading }]}>{label}</Text>
        <Text style={[ss.infoValue, { color: highlight ? tc.primary : tc.heading }]}>{value}</Text>
      </View>
    ) : null;

  const Card = ({ title, icon, children }) => (
    <View style={[ss.card, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
      <View style={ss.cardHeader}>
        <Ionicons name={icon} size={16} color={tc.primary} />
        <Text style={[ss.cardTitle, { color: tc.subheading }]}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[ss.container, { backgroundColor: tc.background }]}>
      <StatusBarComponent />

      {/* Header */}
      <View style={[ss.header, { backgroundColor: tc.background, borderBottomColor: tc.border || '#E5E5EA', paddingTop: insets.top + 4 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={tc.heading} />
        </TouchableOpacity>
        <Text style={[ss.headerTitle, { color: tc.heading }]}>Trip Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <BookingStepIndicator step={2} total={5} tc={tc} />

      <ScrollView contentContainerStyle={ss.sc} showsVerticalScrollIndicator={false}>

        {/* Hero route banner */}
        <View style={[ss.heroBanner, { backgroundColor: tc.primary }]}>
          <Ionicons name="bus" size={72} color="rgba(255,255,255,0.12)" style={ss.heroIcon} />
          <Text style={ss.heroRoute} numberOfLines={1}>{origin} → {dest}</Text>
          {!!depDate && <Text style={ss.heroDate}>{fmtDate(depDate)}</Text>}
        </View>

        {/* Route Info */}
        <Card title="ROUTE INFO" icon="navigate-outline">
          <InfoRow label="From"          value={origin}                    icon="location-outline" />
          <InfoRow label="To"            value={dest}                      icon="flag-outline" />
          <InfoRow label="Date"          value={fmtDate(depDate)}          icon="calendar-outline" />
          {isRandom ? (
            <InfoRow
              label="Operating Hours"
              value={schedule?.operating_hours ? `${schedule.operating_hours.start?.slice(0, 5)} – ${schedule.operating_hours.end?.slice(0, 5)}` : null}
              icon="time-outline"
            />
          ) : (
            <>
              <InfoRow label="Departure"     value={schedule?.time?.departure}  icon="time-outline" />
              <InfoRow label="Arrival"       value={schedule?.time?.arrival}    icon="time-outline" />
            </>
          )}
          <InfoRow label="Schedule"      value={schedule?.name}             icon="list-outline" />
        </Card>

        {/* Transporter Info */}
        <Card title="OPERATOR" icon="business-outline">
          <InfoRow label="Company"   value={route?.business?.name}  icon="business-outline" />
          <InfoRow label="Type"      value={isLuxury ? 'Luxury' : 'Standard'}  icon="star-outline" />
          <InfoRow label="Bus"       value={busName}                icon="bus-outline" />
          <InfoRow label="Capacity"  value={bus?.seats ? `${bus.seats} seats` : null} icon="people-outline" />
          <InfoRow label="Terminal"  value={route?.terminal?.name}  icon="location-outline" />
          <InfoRow label="Terminal Address" value={route?.terminal?.address} icon="map-outline" />
        </Card>

        {/* Pricing */}
        <Card title="PRICING" icon="pricetag-outline">
          <View style={[ss.priceBlock, { backgroundColor: `${tc.primary}10` }]}>
            <Text style={[ss.priceLabel, { color: tc.subheading }]}>Price per seat</Text>
            <Text style={[ss.priceValue, { color: tc.primary }]}>
              {pricePerSeat != null ? formatCurrency(pricePerSeat, 'NGN') : '—'}
            </Text>
          </View>
          {route?.price_breakdown && (
            <>
              <InfoRow label="Ticket price"       value={formatCurrency(route.price_breakdown.ticket_price, 'NGN')} />
              <InfoRow label="Convenience fee"    value={formatCurrency(route.price_breakdown.convenience_fee, 'NGN')} />
              <InfoRow label="Merchant commission" value={formatCurrency(route.price_breakdown.merchant_commission, 'NGN')} />
            </>
          )}
        </Card>

        {/* Trip Meta */}
        <Card title="TRIP REFERENCE" icon="information-circle-outline">
          <InfoRow label="Route ID"   value={`#${route?.id}`}    icon="barcode-outline" />
          <InfoRow label="Route Slug" value={route?.business?.slug} icon="link-outline" />
          <InfoRow label="Schedule"   value={`#${schedule?.id}`} icon="barcode-outline" />
          <InfoRow label="Bus ID"     value={`#${isRandom ? bus?.bus_id : bus?.id}`} icon="barcode-outline" />
        </Card>

        {/* CTA */}
        <TouchableOpacity
          style={[ss.cta, { backgroundColor: tc.primary }]}
          onPress={() =>
            navigation.navigate('PassengerForm', {
              route, schedule, bus, depDate,
              pricePerSeat,
            })
          }
          activeOpacity={0.85}
        >
          <Ionicons name="people-outline" size={18} color="#FFF" />
          <Text style={ss.ctaText}>Select Passengers</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  container:   { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  sc:          { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  heroBanner:  { borderRadius: 16, padding: 20, marginBottom: 16, overflow: 'hidden' },
  heroIcon:    { position: 'absolute', right: -10, top: -8 },
  heroRoute:   { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  heroDate:    { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  card:        { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  cardTitle:   { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  infoRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0' },
  infoLabel:   { fontSize: 13, flex: 1 },
  infoValue:   { fontSize: 13, fontWeight: '600', textAlign: 'right', flex: 1 },
  priceBlock:  { borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 10 },
  priceLabel:  { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  priceValue:  { fontSize: 28, fontWeight: '900' },
  cta:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, marginTop: 4 },
  ctaText:     { color: '#FFF', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
});
