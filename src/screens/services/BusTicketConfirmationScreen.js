import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { merpiGetTransaction } from 'AuthFunction/paymentService';

export default function BusTicketConfirmationScreen({ navigation, route }) {
  const { reference, booking, route: tripRoute, bus, schedule, seats, passenger, amount } = route.params || {};
  const dark = useThem(), tc = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState(booking?.status || 'confirmed');

  const checkStatus = async () => {
    if (!reference) return;
    setRefreshing(true);
    try {
      const res = await merpiGetTransaction(reference);
      const s = res?.merpiData?.status || res?.local?.status;
      if (s) setStatus(s);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not refresh booking status.');
    } finally {
      setRefreshing(false);
    }
  };

  const statusColor = status === 'confirmed' ? '#4CAF50' : status === 'failed' ? '#EF4444' : '#FF9800';
  const statusIcon  = status === 'confirmed' ? 'checkmark-circle' : status === 'failed' ? 'close-circle' : 'time-outline';

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
        <TouchableOpacity onPress={() => navigation.navigate('MainTabs')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={tc.heading} />
        </TouchableOpacity>
        <Text style={[ss.headerTitle, { color: tc.heading }]}>Booking Confirmed</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={ss.sc} showsVerticalScrollIndicator={false}>

        {/* Status badge */}
        <View style={[ss.statusCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <View style={[ss.statusIconWrap, { backgroundColor: `${statusColor}20` }]}>
            <Ionicons name={statusIcon} size={40} color={statusColor} />
          </View>
          <Text style={[ss.statusLabel, { color: statusColor }]}>
            {status === 'confirmed' ? 'Booking Confirmed!' : status === 'failed' ? 'Booking Failed' : 'Pending'}
          </Text>
          <Text style={[ss.statusSub, { color: tc.subheading }]}>
            {status === 'confirmed'
              ? 'Your ticket has been booked successfully.'
              : 'Your booking is being processed.'}
          </Text>

          {/* Reference number */}
          <View style={[ss.refBox, { backgroundColor: `${tc.primary}12`, borderColor: `${tc.primary}30` }]}>
            <Text style={[ss.refLabel, { color: tc.subheading }]}>Booking Reference</Text>
            <Text style={[ss.refValue, { color: tc.primary }]}>{reference}</Text>
          </View>
        </View>

        {/* Trip details */}
        <View style={[ss.detailCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <View style={ss.detailCardHeader}>
            <Ionicons name="bus-outline" size={16} color={tc.primary} />
            <Text style={[ss.detailCardTitle, { color: tc.subheading }]}>TRIP DETAILS</Text>
          </View>
          <InfoRow label="Route"      value={tripRoute ? `${tripRoute.from_city || tripRoute.from} → ${tripRoute.to_city || tripRoute.to}` : null} />
          <InfoRow label="Bus"        value={bus?.company_name || bus?.name} />
          <InfoRow label="Departure"  value={schedule?.departure_time} />
          <InfoRow label="Seats"      value={seats?.map(s => s.seat_number || s.number).join(', ')} />
          <InfoRow label="Passenger"  value={passenger?.fullName} />
          <InfoRow label="Phone"      value={passenger?.phone} />
          <InfoRow label="Amount"     value={amount ? formatCurrency(amount, 'NGN') : null} />
        </View>

        {/* Check status button */}
        <TouchableOpacity
          style={[ss.outlineBtn, { borderColor: tc.primary, opacity: refreshing ? 0.7 : 1 }]}
          onPress={checkStatus} disabled={refreshing} activeOpacity={0.8}
        >
          {refreshing
            ? <ActivityIndicator color={tc.primary} size="small" />
            : <><Ionicons name="refresh-outline" size={16} color={tc.primary} />
               <Text style={[ss.outlineBtnText, { color: tc.primary }]}>Check Booking Status</Text></>
          }
        </TouchableOpacity>

        {/* Back to home */}
        <TouchableOpacity
          style={[ss.primaryBtn, { backgroundColor: tc.primary }]}
          onPress={() => navigation.navigate('MainTabs')} activeOpacity={0.85}
        >
          <Ionicons name="home-outline" size={18} color="#FFF" />
          <Text style={ss.primaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  container:       { flex: 1 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle:     { fontSize: 16, fontWeight: '700' },
  sc:              { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  statusCard:      { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', marginBottom: 16, gap: 8 },
  statusIconWrap:  { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statusLabel:     { fontSize: 20, fontWeight: '800' },
  statusSub:       { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  refBox:          { borderRadius: 10, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center', marginTop: 12, width: '100%' },
  refLabel:        { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  refValue:        { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  detailCard:      { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  detailCardHeader:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  detailCardTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  infoRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0' },
  infoLabel:       { fontSize: 13, flex: 1 },
  infoValue:       { fontSize: 13, fontWeight: '600', flex: 1.5, textAlign: 'right' },
  outlineBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, marginBottom: 12 },
  outlineBtnText:  { fontSize: 14, fontWeight: '600' },
  primaryBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12 },
  primaryBtnText:  { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
