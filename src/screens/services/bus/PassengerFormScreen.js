import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { MAX_PASSENGERS_PER_BOOKING, PASSENGER_TITLES } from 'CONSTANT/bookingConstants';
import BookingStepIndicator from 'component/bus/BookingStepIndicator';
import TripSummaryBar from 'component/bus/TripSummaryBar';

const emptyPassenger = () => ({ title: '', fullName: '', age: '', email: '', phone: '', gender: '' });

export default function PassengerFormScreen({ navigation, route: navRoute }) {
  const { route, schedule, bus, depDate, pricePerSeat } = navRoute.params || {};
  const dark = useThem(), tc = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [count, setCount] = useState(1);
  const [passengers, setPassengers] = useState([emptyPassenger()]);
  const [emergency, setEmergency] = useState({ name: '', phone: '' });
  const [agreed, setAgreed] = useState(false);
  const [showTnC, setShowTnC] = useState(false);
  const [errors, setErrors] = useState({});

  const totalPrice = (pricePerSeat || 0) * count;

  const updateCount = (n) => {
    setCount(n);
    setPassengers(prev => {
      const next = [...prev];
      while (next.length < n) next.push(emptyPassenger());
      return next.slice(0, n);
    });
  };

  const updatePassenger = (idx, key, val) => {
    setPassengers(prev => prev.map((p, i) => i === idx ? { ...p, [key]: val } : p));
    setErrors(prev => { const e = { ...prev }; delete e[`p${idx}_${key}`]; return e; });
  };

  const updateEmergency = (key, val) => {
    setEmergency(prev => ({ ...prev, [key]: val }));
    setErrors(prev => { const e = { ...prev }; delete e[`em_${key}`]; return e; });
  };

  const validate = () => {
    const e = {};
    passengers.forEach((p, i) => {
      const isPrimary = i === 0;
      if (!p.fullName?.trim()) e[`p${i}_fullName`] = 'Required';
      if (!p.age) e[`p${i}_age`] = 'Required';
      else if (isPrimary && Number(p.age) < 18) e[`p${i}_age`] = 'Must be 18+';
      if (isPrimary && !p.email?.trim()) e[`p${i}_email`] = 'Required';
      if (isPrimary && !p.phone?.trim()) e[`p${i}_phone`] = 'Required';
    });
    if (!emergency.name?.trim()) e.em_name = 'Required';
    if (!emergency.phone?.trim()) e.em_phone = 'Required';
    if (!agreed) e.agreed = 'You must agree to the Terms & Conditions';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const proceed = () => {
    if (!validate()) {
      Alert.alert('Incomplete form', 'Please fix the errors and try again.');
      return;
    }
    navigation.navigate('BusSeatSelection', {
      passengerCount: count,
      passengers,
      emergencyContact: emergency,
      route, schedule, bus, depDate, pricePerSeat,
    });
  };

  return (
    <SafeAreaView style={[ss.container, { backgroundColor: tc.background }]}>
      <StatusBarComponent />

      <View style={[ss.header, { backgroundColor: tc.background, borderBottomColor: tc.border || '#E5E5EA', paddingTop: insets.top + 4 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={tc.heading} />
        </TouchableOpacity>
        <Text style={[ss.headerTitle, { color: tc.heading }]}>Passenger Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <BookingStepIndicator step={3} total={5} tc={tc} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={ss.sc} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <TripSummaryBar route={route} depDate={depDate} pricePerSeat={pricePerSeat} tc={tc} />

          {/* Passenger count */}
          <View style={[ss.card, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
            <Text style={[ss.sectionTitle, { color: tc.heading }]}>How many passengers?</Text>
            <View style={ss.countRow}>
              {Array.from({ length: MAX_PASSENGERS_PER_BOOKING }).map((_, i) => {
                const n = i + 1;
                const sel = count === n;
                return (
                  <TouchableOpacity
                    key={n}
                    style={[ss.countBtn, { backgroundColor: sel ? tc.primary : tc.background, borderColor: sel ? tc.primary : tc.border || '#E5E5EA' }]}
                    onPress={() => updateCount(n)}
                    activeOpacity={0.8}
                  >
                    <Text style={[ss.countBtnText, { color: sel ? '#FFF' : tc.heading }]}>{n}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={[ss.totalRow, { backgroundColor: `${tc.primary}10`, borderRadius: 10, padding: 12, marginTop: 8 }]}>
              <Text style={[{ fontSize: 13, color: tc.subheading }]}>Total</Text>
              <Text style={[{ fontSize: 18, fontWeight: '800', color: tc.primary }]}>
                {formatCurrency(totalPrice, 'NGN')}
              </Text>
            </View>
          </View>

          {/* Per-passenger forms */}
          {passengers.map((p, idx) => (
            <PassengerForm
              key={idx}
              index={idx}
              passenger={p}
              errors={errors}
              onChange={updatePassenger}
              tc={tc}
            />
          ))}

          {/* Emergency contact */}
          <View style={[ss.card, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
            <View style={ss.cardHeader}>
              <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
              <Text style={[ss.sectionTitle, { color: tc.heading, marginLeft: 6 }]}>Emergency Contact</Text>
              <Text style={[{ fontSize: 11, color: '#EF4444', marginLeft: 4 }]}>(required)</Text>
            </View>
            <FieldInput
              label="Contact Name"
              value={emergency.name}
              onChange={v => updateEmergency('name', v)}
              error={errors.em_name}
              required
              tc={tc}
            />
            <FieldInput
              label="Contact Phone"
              value={emergency.phone}
              onChange={v => updateEmergency('phone', v)}
              error={errors.em_phone}
              keyboardType="phone-pad"
              required
              tc={tc}
            />
          </View>

          {/* T&C */}
          <View style={[ss.card, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
            <TouchableOpacity style={ss.checkRow} onPress={() => setAgreed(a => !a)} activeOpacity={0.8}>
              <View style={[ss.checkbox, { borderColor: agreed ? tc.primary : tc.border || '#E5E5EA', backgroundColor: agreed ? tc.primary : 'transparent' }]}>
                {agreed && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </View>
              <Text style={[ss.checkText, { color: tc.heading }]}>
                I agree to the{' '}
                <Text style={{ color: tc.primary, textDecorationLine: 'underline' }} onPress={() => setShowTnC(true)}>
                  Terms & Conditions
                </Text>
                {' '}and booking policy
              </Text>
            </TouchableOpacity>
            {!!errors.agreed && <Text style={ss.errText}>{errors.agreed}</Text>}
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[ss.cta, { backgroundColor: tc.primary, opacity: agreed ? 1 : 0.5 }]}
            onPress={proceed}
            activeOpacity={0.85}
          >
            <Ionicons name="seat-outline" size={18} color="#FFF" />
            <Text style={ss.ctaText}>Select Seats</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* T&C Modal */}
      <Modal visible={showTnC} transparent animationType="slide" onRequestClose={() => setShowTnC(false)}>
        <View style={ss.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowTnC(false)} />
          <View style={[ss.modalSheet, { backgroundColor: tc.card }]}>
            <View style={[ss.modalHandle, { backgroundColor: tc.border || '#E5E5EA' }]} />
            <Text style={[ss.modalTitle, { color: tc.heading }]}>Terms & Conditions</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <Text style={[ss.tncText, { color: tc.subheading }]}>
                {`1. Tickets are non-refundable once purchased.\n\n2. Passengers must arrive at the terminal at least 30 minutes before scheduled departure.\n\n3. Valid government-issued ID is required at boarding.\n\n4. PayFlex is not responsible for delays caused by third-party operators.\n\n5. Seat selection is subject to availability at time of booking.\n\n6. In the event of a missed departure, no refund or rescheduling is guaranteed.\n\n7. Passengers travelling with items exceeding standard luggage allowance may incur additional charges.\n\n8. PayFlex reserves the right to cancel or modify bookings in exceptional circumstances with appropriate notice.`}
              </Text>
            </ScrollView>
            <TouchableOpacity style={[ss.cta, { backgroundColor: tc.primary, marginHorizontal: 0, marginTop: 16 }]} onPress={() => { setAgreed(true); setShowTnC(false); }} activeOpacity={0.85}>
              <Text style={ss.ctaText}>I Agree</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function PassengerForm({ index, passenger, errors, onChange, tc }) {
  const isPrimary = index === 0;
  const label = isPrimary ? 'Primary Passenger' : `Passenger ${index + 1}`;

  return (
    <View style={[ss.card, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
      <View style={ss.cardHeader}>
        <View style={[ss.pAvatar, { backgroundColor: `${tc.primary}18` }]}>
          <Text style={[{ fontSize: 13, fontWeight: '700', color: tc.primary }]}>{index + 1}</Text>
        </View>
        <Text style={[ss.sectionTitle, { color: tc.heading, marginLeft: 8 }]}>{label}</Text>
      </View>

      {/* Title */}
      <Text style={[ss.fieldLabel, { color: tc.subheading }]}>Title</Text>
      <View style={ss.titleRow}>
        {PASSENGER_TITLES.map(t => {
          const sel = passenger.title === t;
          return (
            <TouchableOpacity
              key={t}
              style={[ss.titleBtn, { borderColor: sel ? tc.primary : tc.border || '#E5E5EA', backgroundColor: sel ? `${tc.primary}18` : tc.background }]}
              onPress={() => onChange(index, 'title', t)}
            >
              <Text style={[ss.titleBtnText, { color: sel ? tc.primary : tc.subheading }]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FieldInput
        label="Full Name"
        value={passenger.fullName}
        onChange={v => onChange(index, 'fullName', v)}
        error={errors[`p${index}_fullName`]}
        required
        tc={tc}
      />
      <FieldInput
        label="Age"
        value={passenger.age}
        onChange={v => onChange(index, 'age', v)}
        error={errors[`p${index}_age`]}
        keyboardType="numeric"
        required
        tc={tc}
      />

      {/* Gender */}
      <Text style={[ss.fieldLabel, { color: tc.subheading }]}>Gender</Text>
      <View style={ss.genderRow}>
        {['Male', 'Female'].map(g => {
          const sel = passenger.gender === g;
          return (
            <TouchableOpacity
              key={g}
              style={[ss.genderBtn, { borderColor: sel ? tc.primary : tc.border || '#E5E5EA', backgroundColor: sel ? `${tc.primary}18` : tc.background }]}
              onPress={() => onChange(index, 'gender', g)}
            >
              <Ionicons name={g === 'Male' ? 'male' : 'female'} size={14} color={sel ? tc.primary : tc.subheading} />
              <Text style={[ss.genderText, { color: sel ? tc.primary : tc.subheading }]}>{g}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FieldInput
        label="Email Address"
        value={passenger.email}
        onChange={v => onChange(index, 'email', v)}
        error={errors[`p${index}_email`]}
        keyboardType="email-address"
        required={isPrimary}
        tc={tc}
      />
      <FieldInput
        label="Phone Number"
        value={passenger.phone}
        onChange={v => onChange(index, 'phone', v)}
        error={errors[`p${index}_phone`]}
        keyboardType="phone-pad"
        required={isPrimary}
        tc={tc}
      />
    </View>
  );
}

function FieldInput({ label, value, onChange, error, keyboardType = 'default', required, tc }) {
  return (
    <View style={ss.fieldWrap}>
      <Text style={[ss.fieldLabel, { color: tc.subheading }]}>{label}{required ? ' *' : ''}</Text>
      <TextInput
        style={[ss.inp, { backgroundColor: tc.background, borderColor: error ? '#EF4444' : tc.border || '#E5E5EA', color: tc.heading }]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholder={label}
        placeholderTextColor={tc.subtext}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
      />
      {!!error && <Text style={ss.errText}>{error}</Text>}
    </View>
  );
}

const ss = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle:  { fontSize: 16, fontWeight: '700' },
  sc:           { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  card:         { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  pAvatar:      { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  countRow:     { flexDirection: 'row', gap: 10 },
  countBtn:     { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
  countBtnText: { fontSize: 18, fontWeight: '800' },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldWrap:    { marginBottom: 12 },
  fieldLabel:   { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  inp:          { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14 },
  errText:      { color: '#EF4444', fontSize: 12, marginTop: 4 },
  titleRow:     { flexDirection: 'row', gap: 6, marginBottom: 12 },
  titleBtn:     { flex: 1, borderWidth: 1.5, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  titleBtnText: { fontSize: 12, fontWeight: '600' },
  genderRow:    { flexDirection: 'row', gap: 10, marginBottom: 12 },
  genderBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10 },
  genderText:   { fontSize: 14, fontWeight: '600' },
  checkRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox:     { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkText:    { flex: 1, fontSize: 13, lineHeight: 20 },
  cta:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, marginTop: 4 },
  ctaText:      { color: '#FFF', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet:   { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  modalHandle:  { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle:   { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  tncText:      { fontSize: 14, lineHeight: 22 },
});
