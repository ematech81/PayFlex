import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
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
import PaymentSummaryModal from 'component/PaymentSummaryModal';
import { placeLabel, fmtDate, seatLabel, buildDepartureDate, timeToMinutes, minutesToHHMM } from 'utility/busHelpers';

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
  const [showPayModal, setShowPayModal]   = useState(false);

  const isRandom   = (route?.schedule_type || schedule?.route?.schedule_type) === 'random';
  const seats      = selectedSeats || [];
  const seatCount  = isRandom ? (passengerCount || 1) : seats.length;
  const walletBal  = wallet?.user?.walletBalance || 0;
  const totalPrice = (pricePerSeat || 0) * seatCount;
  const sufficient = walletBal >= totalPrice;

  // Random schedules operate within a daily window (e.g. 06:45–21:45) — the
  // user must pick a departure time inside it, not the bus's display time.
  // The window is per-bus (schedule.buses[].start_time/end_time from the
  // packages endpoint), with operating_hours as a schedule-level fallback.
  const windowStartMin = isRandom ? timeToMinutes(bus?.start_time || schedule?.operating_hours?.start) : null;
  const windowEndMin   = isRandom ? timeToMinutes(bus?.end_time   || schedule?.operating_hours?.end)   : null;

  const defaultRandomMinutes = () => {
    if (windowStartMin == null) return 0;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (windowEndMin != null && nowMin >= windowStartMin && nowMin <= windowEndMin) return nowMin;
    return windowStartMin;
  };

  const [randomMinutes, setRandomMinutes] = useState(defaultRandomMinutes);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const onRandomTimeChange = (_, selectedDate) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (!selectedDate) return;
    const mins = selectedDate.getHours() * 60 + selectedDate.getMinutes();
    if (windowStartMin != null && windowEndMin != null && (mins < windowStartMin || mins > windowEndMin)) {
      Alert.alert(
        'Outside operating hours',
        `Please select a time between ${minutesToHHMM(windowStartMin)} and ${minutesToHHMM(windowEndMin)}.`
      );
      return;
    }
    setRandomMinutes(mins);
  };

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
            last_name:    kinParts.length > 1 ? kinParts.slice(1).join(' ') : kinParts[0] || '',
            phone_number: emergency?.phone || '',
            email:        emergency?.email || '',
            gender:       (emergency?.gender || '').toLowerCase(),
            relationship: (emergency?.relationship || '').toLowerCase(),
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
            bus_id:           bus?.bus_id,
            no_of_passengers: seatCount,
            departure_time:   minutesToHHMM(randomMinutes),
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
          {isRandom ? null : (
            <InfoRow label="Departure" value={schedule?.time?.departure} tc={tc} />
          )}
          <InfoRow label="Operator"   value={route?.business?.name}           tc={tc} />
          <InfoRow label="Bus"        value={isRandom ? (bus?.bus_type || 'Bus') : bus?.name} tc={tc} />
          <InfoRow label="Terminal"   value={route?.terminal?.name}           tc={tc} />
          {isRandom
            ? <InfoRow label="Passengers" value={`${seatCount} passenger${seatCount !== 1 ? 's' : ''}`} tc={tc} />
            : <InfoRow label="Seats" value={seats.map(seatLabel).join(', ')} tc={tc} />
          }

          {isRandom && (
            <>
              <Text style={[ss.fieldLabel, { color: tc.subheading, marginTop: 12 }]}>
                Preferred Departure Time
              </Text>
              <TouchableOpacity
                style={[ss.timeInp, { borderColor: tc.border || '#E5E5EA', backgroundColor: tc.background, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 15, color: tc.heading, fontWeight: '600' }}>
                  {minutesToHHMM(randomMinutes)}
                </Text>
                <Ionicons name="time-outline" size={18} color={tc.subtext} />
              </TouchableOpacity>
              {windowStartMin != null && windowEndMin != null && (
                <Text style={[ss.hintText, { color: tc.subtext }]}>
                  This bus operates between {minutesToHHMM(windowStartMin)} and {minutesToHHMM(windowEndMin)}.
                </Text>
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={(() => { const d = new Date(); d.setHours(Math.floor(randomMinutes / 60), randomMinutes % 60, 0, 0); return d; })()}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onRandomTimeChange}
                />
              )}
            </>
          )}
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
          <InfoRow label="Name"         value={emergency.name}         tc={tc} />
          <InfoRow label="Phone"        value={emergency.phone}        tc={tc} />
          <InfoRow label="Email"        value={emergency.email}        tc={tc} />
          <InfoRow label="Gender"       value={emergency.gender}       tc={tc} />
          <InfoRow label="Relationship" value={emergency.relationship} tc={tc} />
        </TouchableOpacity>

        {/* Review & pay */}
        <TouchableOpacity
          style={[ss.payBtn, { backgroundColor: tc.primary }]}
          onPress={() => {
            if (isRandom) {
              if (windowStartMin == null || windowEndMin == null) {
                Alert.alert('Cannot Book', 'Operating hours are not available for this bus. Please go back and select a different bus.');
                return;
              }
              const todayStr = new Date().toISOString().slice(0, 10);
              if (depDate?.slice(0, 10) === todayStr) {
                const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
                if (nowMin > windowEndMin) {
                  Alert.alert(
                    'Booking Window Closed',
                    `Today's operating window has ended (${minutesToHHMM(windowStartMin)}–${minutesToHHMM(windowEndMin)}). Please go back and select tomorrow or a later departure date.`,
                  );
                  return;
                }
              }
              if (randomMinutes < windowStartMin || randomMinutes > windowEndMin) {
                Alert.alert('Invalid departure time',
                  `Please pick a time between ${minutesToHHMM(windowStartMin)} and ${minutesToHHMM(windowEndMin)}.`);
                return;
              }
            }
            setShowPayModal(true);
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="lock-closed-outline" size={18} color="#FFF" />
          <Text style={ss.payBtnText}>Review & Pay {formatCurrency(totalPrice, 'NGN')}</Text>
        </TouchableOpacity>

      </ScrollView>

      <PaymentSummaryModal
        visible={showPayModal}
        onClose={() => setShowPayModal(false)}
        tc={tc}
        title="Payment Summary"
        rows={[{
          label: `${formatCurrency(pricePerSeat, 'NGN')} × ${seatCount} seat${seatCount !== 1 ? 's' : ''}`,
          value: formatCurrency(totalPrice, 'NGN'),
        }]}
        totalAmount={totalPrice}
        walletBalance={walletBal}
        pin={pin}
        onPinChange={setPin}
        onConfirm={handlePay}
        confirmLabel={`Confirm & Pay ${formatCurrency(totalPrice, 'NGN')}`}
        loading={busy}
      />

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
              style={[ss.pinInp, { borderColor: tc.border || '#E5E5EA', color: tc.heading, backgroundColor: tc.background, marginBottom: 12 }]}
              value={emergency.phone}
              onChangeText={v => setEmergency(e => ({ ...e, phone: v }))}
              placeholder="Contact Phone"
              placeholderTextColor={tc.subtext}
              keyboardType="phone-pad"
            />
            <TextInput
              style={[ss.pinInp, { borderColor: tc.border || '#E5E5EA', color: tc.heading, backgroundColor: tc.background, marginBottom: 12 }]}
              value={emergency.email}
              onChangeText={v => setEmergency(e => ({ ...e, email: v }))}
              placeholder="Contact Email"
              placeholderTextColor={tc.subtext}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {['Male', 'Female'].map(g => {
                const sel = emergency.gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[
                      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10 },
                      { borderColor: sel ? tc.primary : tc.border || '#E5E5EA', backgroundColor: sel ? `${tc.primary}18` : tc.background },
                    ]}
                    onPress={() => setEmergency(e => ({ ...e, gender: g }))}
                  >
                    <Ionicons name={g === 'Male' ? 'male' : 'female'} size={14} color={sel ? tc.primary : tc.subheading} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: sel ? tc.primary : tc.subheading }}>{g}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {['Parent', 'Spouse', 'Sibling', 'Child', 'Friend', 'Other'].map(r => {
                const sel = emergency.relationship === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[
                      { borderWidth: 1.5, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
                      { borderColor: sel ? tc.primary : tc.border || '#E5E5EA', backgroundColor: sel ? `${tc.primary}18` : tc.background },
                    ]}
                    onPress={() => setEmergency(e => ({ ...e, relationship: r }))}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: sel ? tc.primary : tc.subheading }}>{r}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
  fieldLabel:     { fontSize: 13, fontWeight: '600', marginBottom: 8, color: '#888' },
  pinInp:         { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 22, textAlign: 'center', letterSpacing: 8 },
  timeInp:        { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13 },
  hintText:       { fontSize: 12, marginTop: 6 },
  payBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14 },
  payBtnText:     { color: '#FFF', fontSize: 15, fontWeight: '700' },
  emergencyModal: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 100 },
  emergencySheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
});
