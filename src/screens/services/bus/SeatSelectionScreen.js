import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { SEAT_COLORS } from 'CONSTANT/bookingConstants';
import BookingStepIndicator from 'component/bus/BookingStepIndicator';
import TripSummaryBar from 'component/bus/TripSummaryBar';
import { merpiGetSeats } from 'AuthFunction/paymentService';
import { seatLabel, extractList } from 'utility/busHelpers';

export default function SeatSelectionScreen({ navigation, route: navRoute }) {
  const {
    passengerCount, passengers, emergencyContact,
    route, schedule, bus, depDate, pricePerSeat,
  } = navRoute.params || {};

  const dark = useThem(), tc = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [seatGrid, setSeatGrid] = useState([]);   // 2D array from API
  const [selected, setSelected] = useState([]);   // flat array of selected seat objects
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await merpiGetSeats(schedule?.id, bus?.id, depDate);
        const raw = r?.data?.data?.seats || r?.data?.seats || extractList(r, 'seats', 'data');
        // raw may already be 2D or flat — normalise to 2D
        const grid = Array.isArray(raw?.[0]) ? raw : [raw];
        setSeatGrid(grid);
      } catch (e) {
        setError(e.message || 'Could not load seat map. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getSeatStatus = (seat) => {
    if (!seat.available) return 'booked';
    if (selected.find(s => s.id === seat.id)) return 'selected';
    return 'available';
  };

  const toggleSeat = (seat) => {
    if (!seat.available) return;
    const isSelected = selected.find(s => s.id === seat.id);
    if (isSelected) {
      setSelected(prev => prev.filter(s => s.id !== seat.id));
    } else {
      if (selected.length >= passengerCount) {
        Alert.alert('Seat limit reached', `You can only select ${passengerCount} seat${passengerCount > 1 ? 's' : ''} for this booking.`);
        return;
      }
      setSelected(prev => [...prev, seat]);
    }
  };

  const proceed = () => {
    if (selected.length < passengerCount) {
      Alert.alert('More seats needed', `Please select ${passengerCount - selected.length} more seat(s) to continue.`);
      return;
    }
    navigation.navigate('BookingSummary', {
      passengerCount,
      passengers,
      emergencyContact,
      selectedSeats: selected,
      totalPrice: pricePerSeat * selected.length,
      route, schedule, bus, depDate, pricePerSeat,
    });
  };

  const totalPrice = pricePerSeat * selected.length;

  return (
    <SafeAreaView style={[ss.container, { backgroundColor: tc.background }]}>
      <StatusBarComponent />

      <View style={[ss.header, { backgroundColor: tc.background, borderBottomColor: tc.border || '#E5E5EA', paddingTop: insets.top + 4 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={tc.heading} />
        </TouchableOpacity>
        <Text style={[ss.headerTitle, { color: tc.heading }]}>Select Seats</Text>
        <View style={{ width: 24 }} />
      </View>

      <BookingStepIndicator step={4} total={5} tc={tc} />

      <ScrollView contentContainerStyle={ss.sc} showsVerticalScrollIndicator={false}>
        <TripSummaryBar route={route} depDate={depDate} pricePerSeat={pricePerSeat} tc={tc} />

        {/* Legend */}
        <View style={[ss.legend, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          {[
            { status: 'available', label: 'Available' },
            { status: 'selected',  label: 'Selected' },
            { status: 'booked',    label: 'Taken' },
          ].map(({ status, label }) => (
            <View key={status} style={ss.legendItem}>
              <View style={[ss.legendDot, { backgroundColor: SEAT_COLORS[status], borderColor: status === 'available' ? '#D1D5DB' : SEAT_COLORS[status] }]} />
              <Text style={[ss.legendText, { color: tc.subheading }]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Passenger count info */}
        <View style={[ss.infoBar, { backgroundColor: `${tc.primary}12` }]}>
          <Ionicons name="information-circle-outline" size={15} color={tc.primary} />
          <Text style={[ss.infoText, { color: tc.primary }]}>
            Select exactly {passengerCount} seat{passengerCount > 1 ? 's' : ''} — one per passenger
          </Text>
        </View>

        {/* Seat map */}
        {loading ? (
          <ActivityIndicator color={tc.primary} size="large" style={{ marginVertical: 40 }} />
        ) : error ? (
          <View style={[ss.errCard, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
            <Ionicons name="warning-outline" size={18} color="#EF4444" />
            <Text style={[ss.errText, { color: '#EF4444' }]}>{error}</Text>
          </View>
        ) : (
          <View style={[ss.busWrap, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
            {/* Driver indicator */}
            <View style={[ss.driverRow, { borderBottomColor: tc.border || '#E5E5EA' }]}>
              <Ionicons name="car-outline" size={20} color={tc.subheading} />
              <Text style={[ss.driverLabel, { color: tc.subheading }]}>Driver</Text>
            </View>

            {seatGrid.map((row, rowIdx) => (
              <View key={rowIdx} style={ss.seatRow}>
                {row.map((cell, colIdx) => {
                  if (!cell.seat) {
                    // Aisle spacer
                    return <View key={colIdx} style={ss.aisle} />;
                  }
                  const status = getSeatStatus(cell);
                  const bg = SEAT_COLORS[status];
                  const isBooked = status === 'booked';
                  const textColor = status === 'available' ? '#374151' : '#FFF';
                  return (
                    <TouchableOpacity
                      key={cell.id}
                      style={[ss.seatBox, { backgroundColor: bg, borderColor: isBooked ? '#EF4444' : '#D1D5DB' }]}
                      onPress={() => toggleSeat(cell)}
                      disabled={isBooked}
                      activeOpacity={0.75}
                    >
                      <Text style={[ss.seatBoxLabel, { color: textColor }]}>{seatLabel(cell)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom bar */}
      <View style={[ss.bottomBar, { backgroundColor: tc.card, borderTopColor: tc.border || '#E5E5EA' }]}>
        <View>
          <Text style={[ss.seatsCount, { color: tc.subheading }]}>
            {selected.length} of {passengerCount} seat{passengerCount > 1 ? 's' : ''} selected
          </Text>
          <Text style={[ss.totalPrice, { color: tc.primary }]}>{formatCurrency(totalPrice, 'NGN')}</Text>
        </View>
        <TouchableOpacity
          style={[ss.cta, { backgroundColor: tc.primary, opacity: selected.length === passengerCount ? 1 : 0.45 }]}
          onPress={proceed}
          activeOpacity={0.85}
        >
          <Text style={ss.ctaText}>Continue</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  container:   { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  sc:          { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120 },
  legend:      { flexDirection: 'row', justifyContent: 'space-around', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:   { width: 16, height: 16, borderRadius: 4, borderWidth: 1 },
  legendText:  { fontSize: 12, fontWeight: '500' },
  infoBar:     { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, marginBottom: 14 },
  infoText:    { fontSize: 13, fontWeight: '500', flex: 1 },
  busWrap:     { borderRadius: 16, borderWidth: 1, padding: 16 },
  driverRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12, marginBottom: 12, borderBottomWidth: 1 },
  driverLabel: { fontSize: 13, fontWeight: '600' },
  seatRow:     { flexDirection: 'row', gap: 8, marginBottom: 8, justifyContent: 'center' },
  aisle:       { width: 44, height: 44 },
  seatBox:     { width: 44, height: 44, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  seatBoxLabel:{ fontSize: 11, fontWeight: '700' },
  errCard:     { flexDirection: 'row', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, marginVertical: 16 },
  errText:     { fontSize: 13, flex: 1 },
  bottomBar:   { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, paddingBottom: 28 },
  seatsCount:  { fontSize: 12, marginBottom: 2 },
  totalPrice:  { fontSize: 18, fontWeight: '800' },
  cta:         { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  ctaText:     { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
