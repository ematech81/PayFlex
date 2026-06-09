import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { placeLabel, fmtDate } from 'utility/busHelpers';

export default function TripSummaryBar({ route, depDate, pricePerSeat, tc }) {
  const origin = placeLabel(route?.from);
  const dest   = placeLabel(route?.to);
  return (
    <View style={[ss.bar, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
      <View style={ss.routeRow}>
        <Text style={[ss.city, { color: tc.heading }]} numberOfLines={1}>{origin}</Text>
        <Ionicons name="arrow-forward" size={14} color={tc.subheading} style={{ marginHorizontal: 6 }} />
        <Text style={[ss.city, { color: tc.heading }]} numberOfLines={1}>{dest}</Text>
      </View>
      <View style={ss.metaRow}>
        {!!depDate && (
          <View style={ss.chip}>
            <Ionicons name="calendar-outline" size={12} color={tc.subheading} />
            <Text style={[ss.chipText, { color: tc.subheading }]}>{fmtDate(depDate)}</Text>
          </View>
        )}
        {pricePerSeat != null && (
          <View style={ss.chip}>
            <Ionicons name="pricetag-outline" size={12} color={tc.primary} />
            <Text style={[ss.chipText, { color: tc.primary }]}>
              {formatCurrency(pricePerSeat, 'NGN')} / seat
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const ss = StyleSheet.create({
  bar:      { borderRadius: 12, borderWidth: 1, padding: 12, marginHorizontal: 16, marginBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  city:     { fontSize: 14, fontWeight: '700', flex: 1 },
  metaRow:  { flexDirection: 'row', gap: 10 },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipText: { fontSize: 12, fontWeight: '500' },
});
