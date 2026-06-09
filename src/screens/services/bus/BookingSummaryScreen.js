import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import BookingStepIndicator from 'component/bus/BookingStepIndicator';
import PassengerCard from 'component/bus/PassengerCard';
import EditPassengerModal from 'component/bus/EditPassengerModal';
import { merpiBuyBusTicket } from 'AuthFunction/paymentService';
import { useWallet } from 'context/WalletContext';
import { placeLabel, fmtDate, seatLabel, buildDepartureDate, to24Hour } from 'utility/busHelpers';

const genLocalRef = () => `PAY-BUS-${Date.now()}`;

export default function BookingSummaryScreen({ navigation, route: navRoute }) {
  const {
    passengerCount, passengers: initPassengers, emergencyContact: initEmergency,
    selectedSeats, totalPrice: initTotal,
    route, schedule, bus, depDate, pricePerSeat,
  } = navRoute.params || {};

  const dark = useThem(), tc = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { wallet } = useWallet();

  const [passengers, setPassengers]       = useState(initPassengers || []);
  const [emergency, setEmergency]         = useState(initEmergency || {});
  const [editIdx, setEditIdx]             = useState(null);
  const [editEmergency, setEditEmergency] = useState(false);
  const [pin, setPin]                     = useState('');
  const [busy, setBusy]                   = useState(false);
  const [localRef]                        = useState(genLocalRef);
  const [showPinSheet, setShowPinSheet]   = useState(false);

  const isRandom   = schedule?.route?.schedule_type === 'random';
  const seats      = selectedSeats || [];
  const seatCount  = isRandom ? (passengerCount || 1) : seats.length;
  const walletBal  = wallet?.user?.walletBalance || 0;
  const totalPrice = (pricePerSeat || 0) * seatCount;
  const sufficient = walletBal >= totalPrice;

  const savePassenger = (updated) => {
    setPassengers(prev => prev.map((p, i) => i === editIdx ? updated : p));
    setEditIdx(null);
  };

  const saveEmergency = () => setEditEmergency(false);

  const handlePay = async () => {
    if (pin.length !== 4) { Alert.alert('PIN required', 'Enter your 4-digit transaction PIN.'); return; }
    if (!sufficient) { Alert.alert('Insufficient balance', 'Please fund your wallet before paying.'); return; }
    setBusy(true);
    try {
      const primary      = passengers[0];
      const kinParts     = (emergency?.name || '').trim().split(/\s+/);
      const customerInfo = {
        name:         primary?.fullName || '',
        email:        primary?.email   || '',
        phone_number: primary?.phone   || '',
        ...(emergency?.name ? {
          kin: {
            first_name:   kinParts[0] || '',
            last_name:    kinParts.slice(1).join(' ') || '',
            phone_number: emergency?.phone || '',
          },
        } : {}),
      };
      const timedDepartureDate = buildDepartureDate(depDate, schedule?.time?.departure);
      // Random schedules expect plain "YYYY-MM-DD"; time is sent separately in departure_time
      const randomDepartureDate = depDate ? depDate.slice(0, 10) : timedDepartureDate.slice(0, 10);

      const payload = isRandom
        ? {
            schedule_type:    'random',
            route_id:         schedule?.route?.id || route?.id,
            bus_id:           bus?.id,
            no_of_passengers: seatCount,
            departure_time:   to24Hour(schedule?.time?.departure),
            departure_date:   randomDepartureDate,
            customer_info:    customerInfo,
            amount:           totalPrice,
          }
        : {
            schedule_type:  'timed',
            schedule_id:    schedule?.id,
            seats:          seats.map(s => s.id),
            departure_date: timedDepartureDate,
            customer_info:  customerInfo,
            amount:         totalPrice,
          };

      const res = await merpiBuyBusTicket(pin, payload);
      navigation.replace('BusTicketConfirmation', {
        reference: res.reference || localRef,
        booking:   res.booking,
        route, schedule, bus,
        seats,
        passenger: primary,
        amount:    totalPrice,
      });
    } catch (e) {
      const msg = e.message || '';
      if (msg.toLowerCase().includes('transaction pin not set') || msg.toLowerCase().includes('pin not set')) {
        setShowPinSheet(true);
      } else {
        Alert.alert('Booking Failed', msg || 'Could not complete booking. Your wallet was not charged.');
      }
    } finally {
      setBusy(false);
    }
  };

  const origin = placeLabel(route?.from);
  const dest   = placeLabel(route?.to);

  return (
    <SafeAreaView style={[ss.container, { backgroundColor: tc.background }]}>
      <StatusBarComponent />

      <View style={[ss.header, { backgroundColor: tc.background, borderBottomColor: tc.border || '#E5E5EA', paddingTop: insets.top + 4 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={tc.heading} />
        </TouchableOpacity>
        <Text style={[ss.headerTitle, { color: tc.heading }]}>Booking Summary</Text>
        <View style={{ width: 24 }} />
      </View>

      <BookingStepIndicator step={5} total={5} tc={tc} />

      <ScrollView contentContainerStyle={ss.sc} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Trip summary card */}
        <View style={[ss.card, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <SectionHeader icon="bus-outline" title="TRIP DETAILS" tc={tc} />
          <InfoRow label="Route"      value={`${origin} → ${dest}`}           tc={tc} />
          <InfoRow label="Date"       value={fmtDate(depDate)}                tc={tc} />
          <InfoRow label="Departure"  value={schedule?.time?.departure}       tc={tc} />
          <InfoRow label="Operator"   value={route?.business?.name}           tc={tc} />
          <InfoRow label="Bus"        value={bus?.name}                       tc={tc} />
          <InfoRow label="Terminal"   value={route?.terminal?.name}           tc={tc} />
          {isRandom
            ? <InfoRow label="Passengers" value={`${seatCount} passenger${seatCount !== 1 ? 's' : ''}`} tc={tc} />
            : <InfoRow label="Seats" value={seats.map(seatLabel).join(', ')} tc={tc} />
          }
          <View style={[ss.refBox, { backgroundColor: `${tc.primary}10` }]}>
            <Text style={[ss.refLabel, { color: tc.subheading }]}>Local Reference</Text>
            <Text style={[ss.refValue, { color: tc.primary }]}>{localRef}</Text>
          </View>
        </View>

        {/* Passenger cards */}
        <Text style={[ss.groupLabel, { color: tc.subheading }]}>PASSENGERS</Text>
        {passengers.map((p, i) => (
          <PassengerCard
            key={i}
            passenger={p}
            index={i}
            onEdit={() => setEditIdx(i)}
            tc={tc}
          />
        ))}

        {/* Emergency contact */}
        <TouchableOpacity
          style={[ss.card, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
          onPress={() => setEditEmergency(true)}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
              <Text style={[ss.sectionTitle, { color: tc.heading }]}>Emergency Contact</Text>
            </View>
            <Ionicons name="pencil" size={16} color={tc.primary} />
          </View>
          <View style={[ss.divider, { backgroundColor: tc.border || '#F0F0F0' }]} />
          <InfoRow label="Name"  value={emergency.name}  tc={tc} />
          <InfoRow label="Phone" value={emergency.phone} tc={tc} />
        </TouchableOpacity>

        {/* Payment summary */}
        <View style={[ss.payCard, { backgroundColor: '#3B0CB0' }]}>
          <SectionHeader icon="wallet-outline" title="PAYMENT SUMMARY" light />
          <PayRow label={`${formatCurrency(pricePerSeat, 'NGN')} × ${seatCount} seat${seatCount !== 1 ? 's' : ''}`} value={formatCurrency(totalPrice, 'NGN')} />
          <View style={ss.payDivider} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={ss.payTotalLabel}>Total</Text>
            <Text style={ss.payTotalAmt}>{formatCurrency(totalPrice, 'NGN')}</Text>
          </View>
          <View style={[ss.walletRow, { borderTopColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="wallet-outline" size={16} color={sufficient ? '#4ADE80' : '#F87171'} />
            <Text style={[ss.walletLabel, { color: sufficient ? '#4ADE80' : '#F87171' }]}>
              Wallet: {formatCurrency(walletBal, 'NGN')}
              {!sufficient && '  ⚠ Insufficient balance'}
            </Text>
          </View>
        </View>

        {/* PIN + Pay */}
        <View style={[ss.card, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <Text style={[ss.fieldLabel, { color: tc.subheading }]}>Transaction PIN</Text>
          <TextInput
            style={[ss.pinInp, { borderColor: tc.border || '#E5E5EA', color: tc.heading, backgroundColor: tc.background }]}
            value={pin}
            onChangeText={v => setPin(v.replace(/\D/g, '').slice(0, 4))}
            placeholder="• • • •"
            placeholderTextColor={tc.subtext}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
          />
        </View>

        <TouchableOpacity
          style={[ss.payBtn, { backgroundColor: tc.primary, opacity: (!sufficient || busy) ? 0.5 : 1 }]}
          onPress={handlePay}
          disabled={!sufficient || busy}
          activeOpacity={0.85}
        >
          {busy
            ? <ActivityIndicator color="#FFF" />
            : <>
                <Ionicons name="lock-closed-outline" size={18} color="#FFF" />
                <Text style={ss.payBtnText}>Confirm & Pay {formatCurrency(totalPrice, 'NGN')}</Text>
              </>
          }
        </TouchableOpacity>

      </ScrollView>

      {/* Edit passenger modal */}
      <EditPassengerModal
        visible={editIdx !== null}
        passenger={editIdx !== null ? passengers[editIdx] : {}}
        index={editIdx ?? 0}
        onSave={savePassenger}
        onClose={() => setEditIdx(null)}
        tc={tc}
      />

      {/* PIN not set sheet */}
      {showPinSheet && (
        <View style={[ss.emergencyModal, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
          <View style={[ss.emergencySheet, { backgroundColor: tc.card }]}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="lock-closed" size={36} color="#EF4444" />
            </View>
            <Text style={[ss.sectionTitle, { color: tc.heading, textAlign: 'center', marginBottom: 8 }]}>
              Transaction PIN Not Set
            </Text>
            <Text style={[{ color: tc.subheading, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 }]}>
              You need a 4-digit transaction PIN to make payments. Set one now to continue with your booking.
            </Text>
            <TouchableOpacity
              style={[ss.payBtn, { backgroundColor: tc.primary }]}
              onPress={() => {
                setShowPinSheet(false);
                navigation.navigate('SetTransactionPin', { fromScreen: 'BookingSummary' });
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color="#FFF" />
              <Text style={ss.payBtnText}>Set Transaction PIN Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ alignItems: 'center', paddingVertical: 14 }}
              onPress={() => setShowPinSheet(false)}
              activeOpacity={0.7}
            >
              <Text style={{ color: tc.subheading, fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Edit emergency modal (inline) */}
      {editEmergency && (
        <View style={[ss.emergencyModal, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[ss.emergencySheet, { backgroundColor: tc.card }]}>
            <Text style={[ss.sectionTitle, { color: tc.heading, marginBottom: 16 }]}>Edit Emergency Contact</Text>
            <TextInput
              style={[ss.pinInp, { borderColor: tc.border || '#E5E5EA', color: tc.heading, backgroundColor: tc.background, marginBottom: 12 }]}
              value={emergency.name}
              onChangeText={v => setEmergency(e => ({ ...e, name: v }))}
              placeholder="Contact Name"
              placeholderTextColor={tc.subtext}
            />
            <TextInput
              style={[ss.pinInp, { borderColor: tc.border || '#E5E5EA', color: tc.heading, backgroundColor: tc.background }]}
              value={emergency.phone}
              onChangeText={v => setEmergency(e => ({ ...e, phone: v }))}
              placeholder="Contact Phone"
              placeholderTextColor={tc.subtext}
              keyboardType="phone-pad"
            />
            <TouchableOpacity style={[ss.payBtn, { backgroundColor: tc.primary, marginTop: 16 }]} onPress={saveEmergency} activeOpacity={0.85}>
              <Text style={ss.payBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, tc, light }) {
  const color = light ? 'rgba(255,255,255,0.7)' : tc?.subheading;
  return (
    <View style={ss.sectionRow}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[ss.sectionLabel, { color }]}>{title}</Text>
    </View>
  );
}

function InfoRow({ label, value, tc }) {
  if (!value) return null;
  return (
    <View style={ss.infoRow}>
      <Text style={[ss.infoLabel, { color: tc.subheading }]}>{label}</Text>
      <Text style={[ss.infoValue, { color: tc.heading }]}>{value}</Text>
    </View>
  );
}

function PayRow({ label, value }) {
  return (
    <View style={ss.payRow}>
      <Text style={ss.payLabel}>{label}</Text>
      <Text style={ss.payValue}>{value}</Text>
    </View>
  );
}

const ss = StyleSheet.create({
  container:      { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle:    { fontSize: 16, fontWeight: '700' },
  sc:             { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  card:           { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  sectionRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionLabel:   { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  sectionTitle:   { fontSize: 15, fontWeight: '700' },
  groupLabel:     { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, color: '#888' },
  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0' },
  infoLabel:      { fontSize: 13 },
  infoValue:      { fontSize: 13, fontWeight: '600', textAlign: 'right', flex: 1 },
  divider:        { height: 1, marginVertical: 10 },
  refBox:         { borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10 },
  refLabel:       { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  refValue:       { fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  payCard:        { borderRadius: 16, padding: 18, marginBottom: 14 },
  payRow:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  payLabel:       { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  payValue:       { fontSize: 14, fontWeight: '600', color: '#FFF' },
  payDivider:     { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 10 },
  payTotalLabel:  { fontSize: 15, fontWeight: '700', color: '#FFF' },
  payTotalAmt:    { fontSize: 22, fontWeight: '900', color: '#FFF' },
  walletRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  walletLabel:    { fontSize: 13, fontWeight: '600', flex: 1 },
  fieldLabel:     { fontSize: 13, fontWeight: '600', marginBottom: 8, color: '#888' },
  pinInp:         { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 22, textAlign: 'center', letterSpacing: 8 },
  payBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14 },
  payBtnText:     { color: '#FFF', fontSize: 15, fontWeight: '700' },
  emergencyModal: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 100 },
  emergencySheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
});
