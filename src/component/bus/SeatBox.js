import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { SEAT_COLORS } from 'CONSTANT/bookingConstants';
import { seatLabel } from 'utility/busHelpers';

// status: 'available' | 'selected' | 'booked' | 'special'
export default function SeatBox({ seat, status = 'available', onPress }) {
  const bg      = SEAT_COLORS[status];
  const isBooked = status === 'booked';
  const textColor =
    status === 'available' ? '#374151' : '#FFFFFF';

  return (
    <TouchableOpacity
      style={[ss.box, { backgroundColor: bg, borderColor: isBooked ? '#ef4444' : '#D1D5DB' }]}
      onPress={onPress}
      disabled={isBooked}
      activeOpacity={0.75}
    >
      <Text style={[ss.label, { color: textColor }]}>{seatLabel(seat)}</Text>
    </TouchableOpacity>
  );
}

// Invisible spacer for aisle / non-seat positions
export function SeatSpacer() {
  return <View style={ss.spacer} />;
}

const ss = StyleSheet.create({
  box:    { width: 44, height: 44, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label:  { fontSize: 11, fontWeight: '700' },
  spacer: { width: 44, height: 44 },
});
