import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PassengerCard({ passenger, index, onEdit, tc }) {
  const label = index === 0 ? 'Primary Passenger' : `Passenger ${index + 1}`;
  return (
    <TouchableOpacity
      style={[ss.card, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
      onPress={onEdit}
      activeOpacity={0.8}
    >
      <View style={ss.header}>
        <View style={[ss.avatar, { backgroundColor: `${tc.primary}18` }]}>
          <Ionicons name="person" size={18} color={tc.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[ss.labelText, { color: tc.subheading }]}>{label}</Text>
          <Text style={[ss.name, { color: tc.heading }]}>
            {passenger.title ? `${passenger.title} ` : ''}{passenger.fullName || '—'}
          </Text>
        </View>
        <Ionicons name="pencil" size={16} color={tc.primary} />
      </View>

      <View style={[ss.divider, { backgroundColor: tc.border || '#F0F0F0' }]} />

      <View style={ss.grid}>
        {!!passenger.age && <InfoChip icon="calendar" label="Age" value={passenger.age} tc={tc} />}
        {!!passenger.gender && <InfoChip icon="male-female" label="Gender" value={passenger.gender} tc={tc} />}
        {!!passenger.phone && <InfoChip icon="call" label="Phone" value={passenger.phone} tc={tc} />}
        {!!passenger.email && <InfoChip icon="mail" label="Email" value={passenger.email} tc={tc} />}
      </View>
    </TouchableOpacity>
  );
}

function InfoChip({ icon, label, value, tc }) {
  return (
    <View style={ss.chip}>
      <Ionicons name={`${icon}-outline`} size={12} color={tc.subheading} />
      <Text style={[ss.chipLabel, { color: tc.subheading }]}>{label}: </Text>
      <Text style={[ss.chipValue, { color: tc.heading }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const ss = StyleSheet.create({
  card:       { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  header:     { flexDirection: 'row', alignItems: 'center' },
  avatar:     { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  labelText:  { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  name:       { fontSize: 15, fontWeight: '700' },
  divider:    { height: 1, marginVertical: 10 },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 3 },
  chipLabel:  { fontSize: 12 },
  chipValue:  { fontSize: 12, fontWeight: '600', maxWidth: 120 },
});
