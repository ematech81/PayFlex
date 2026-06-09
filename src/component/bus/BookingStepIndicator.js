import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// step: current step number (1-based), total: total steps
// labels: optional array of step label strings
const LABELS = ['Search', 'Trip Details', 'Passengers', 'Seats', 'Summary'];

export default function BookingStepIndicator({ step, total = 5, tc }) {
  const pct = (step / total) * 100;
  return (
    <View style={ss.wrap}>
      <View style={ss.topRow}>
        <Text style={[ss.stepText, { color: tc.primary }]}>Step {step} of {total}</Text>
        <Text style={[ss.stepName, { color: tc.subheading }]}>{LABELS[step - 1] || ''}</Text>
      </View>
      <View style={[ss.track, { backgroundColor: tc.border || '#E5E5EA' }]}>
        <View style={[ss.fill, { width: `${pct}%`, backgroundColor: tc.primary }]} />
      </View>
      <View style={ss.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              ss.dot,
              {
                backgroundColor:
                  i + 1 <= step ? tc.primary : tc.border || '#E5E5EA',
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const ss = StyleSheet.create({
  wrap:     { paddingHorizontal: 16, paddingVertical: 10 },
  topRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  stepText: { fontSize: 13, fontWeight: '700' },
  stepName: { fontSize: 13 },
  track:    { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill:     { height: 4, borderRadius: 2 },
  dots:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 2 },
  dot:      { width: 8, height: 8, borderRadius: 4 },
});
