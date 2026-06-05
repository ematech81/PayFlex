import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, FlatList, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { useWallet } from 'context/WalletContext';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import {
  merpiGetStates, merpiGetCities, merpiGetRoutes,
  merpiGetBuses, merpiGetSchedules, merpiGetSeats,
  merpiBuyBusTicket,
} from 'AuthFunction/paymentService';

const STEPS = ['Search', 'Select', 'Seats', 'Passenger', 'Review'];

const toYMD = (d) => {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toISOString().split('T')[0];
};
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

// ─── Small reusable atoms ─────────────────────────────────────────────────────

const FieldLabel = ({ text, tc }) => (
  <Text style={[ss.fieldLabel, { color: tc.heading }]}>{text}</Text>
);

const SelectDropdown = ({ value, placeholder, onPress, tc }) => (
  <TouchableOpacity
    style={[ss.inp, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', flexDirection: 'row', alignItems: 'center' }]}
    onPress={onPress} activeOpacity={0.8}
  >
    <Text style={[{ flex: 1, fontSize: 15 }, { color: value ? tc.heading : tc.subtext }]} numberOfLines={1}>
      {value || placeholder}
    </Text>
    <Ionicons name="chevron-down" size={18} color={tc.subtext} />
  </TouchableOpacity>
);

const BottomSheet = ({ visible, title, data, keyFn, labelFn, onSelect, onClose, tc }) => {
  if (!visible) return null;
  return (
    <View style={ss.overlay}>
      {/* dim backdrop — tap to close */}
      <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
      {/* sheet panel */}
      <View style={[ss.sheet, { backgroundColor: tc.card }]}>
        <View style={[ss.sheetHandle, { backgroundColor: tc.border || '#E5E5EA' }]} />
        <Text style={[ss.sheetTitle, { color: tc.heading }]}>{title}</Text>
        <FlatList
          data={data}
          keyExtractor={keyFn}
          style={ss.sheetList}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[ss.sheetRow, { borderBottomColor: tc.border || '#F0F0F0' }]}
              onPress={() => { onSelect(item); onClose(); }}
              activeOpacity={0.7}
            >
              <Text style={[{ fontSize: 15, color: tc.heading }]}>{labelFn(item)}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={[{ fontSize: 14, color: tc.subtext }]}>No items found</Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BusBookingScreen({ navigation }) {
  const dark = useThem(), tc = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { wallet } = useWallet();

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [pin, setPin]   = useState('');
  const [loadError, setLoadError] = useState(null);

  // Step 1 — search
  const [states,    setStates]    = useState([]);
  const [allCities, setAllCities] = useState([]); // full list — filter client-side by state
  const [fromState, setFromState] = useState(null);
  const [fromCity,  setFromCity]  = useState(null);
  const [toState,   setToState]   = useState(null);
  const [toCity,    setToCity]    = useState(null);
  const [depDate, setDepDate]         = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Sheet
  const [sheet, setSheet] = useState(null); // { key, title, data, onSelect }

  // Step 2 — route & bus
  const [routes,    setRoutes]    = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [buses,     setBuses]     = useState([]);
  const [selectedBus, setSelectedBus]     = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Step 3 — seats
  const [seats,        setSeats]        = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Step 4 — passenger
  const [passenger, setPassenger] = useState({
    fullName: '', phone: '', email: '', nokName: '', nokPhone: '',
  });

  const bal = wallet?.user?.walletBalance || 0;

  const totalPrice = selectedSeats.reduce((sum, s) => sum + (s.price || 0), 0) ||
    (selectedBus?.price || 0) * Math.max(selectedSeats.length, 1);

  // Load states + all cities on mount (cities API returns full list, no server-side filter)
  useEffect(() => {
    const extract = (r, key) => {
      // Backend wraps: { success, data: <merpi_body> }
      // Merpi body: { data: { <key>: [...] } }  OR  { <key>: [...] }
      const d1 = r?.data;          // backend's data field = merpi response body
      const d2 = d1?.data;         // merpi's nested data field
      return (
        (Array.isArray(d2?.[key]) && d2[key]) ||
        (Array.isArray(d1?.[key]) && d1[key]) ||
        (Array.isArray(r?.[key])  && r[key])  ||
        []
      );
    };
    Promise.all([merpiGetStates(), merpiGetCities({ per_page: 200 })])
      .then(([sr, cr]) => {
        console.log('[MERPI] states response:', JSON.stringify(sr)?.slice(0, 300));
        console.log('[MERPI] cities response:', JSON.stringify(cr)?.slice(0, 200));
        const stateList = extract(sr, 'states');
        const cityList  = extract(cr, 'cities');
        console.log('[MERPI] states count:', stateList.length, '| cities count:', cityList.length);
        setStates(stateList);
        setAllCities(cityList);
        if (!stateList.length) setLoadError('Could not load states. Tap to retry.');
      })
      .catch((e) => {
        console.error('[MERPI] load failed:', e.message);
        setLoadError('Failed to load locations: ' + (e.message || 'Network error'));
      });
  }, []);

  // Client-side filter: cities whose state.id matches selected state
  const citiesForState = useCallback((stateObj) => {
    if (!stateObj) return [];
    return allCities.filter(c => String(c.state?.id) === String(stateObj.id));
  }, [allCities]);

  // Extract list from nested MERPI response: { data: { data: { <key>: [...] } } }
  const extractList = (r, ...keys) => {
    const payload = r?.data?.data || r?.data || {};
    for (const k of keys) {
      if (Array.isArray(payload[k])) return payload[k];
      if (Array.isArray(payload?.data?.[k])) return payload.data[k];
    }
    // fallback: if payload itself is an array
    return Array.isArray(payload) ? payload : [];
  };

  const searchRoutes = async () => {
    if (!fromCity || !toCity || !depDate) {
      Alert.alert('Missing fields', 'Please fill in origin, destination and departure date.');
      return;
    }
    setBusy(true);
    try {
      const r = await merpiGetRoutes({
        from: fromCity.id || fromCity.name,
        to:   toCity.id   || toCity.name,
        departure_date: depDate,
      });
      const list = extractList(r, 'routes', 'data');
      if (!list.length) {
        Alert.alert('No routes found', 'No available routes for the selected cities and date.');
        return;
      }
      setRoutes(list);
      setStep(2);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not search routes.');
    } finally {
      setBusy(false);
    }
  };

  const selectRoute = async (route) => {
    setSelectedRoute(route);
    setBusy(true);
    try {
      const r = await merpiGetBuses({ route_id: route.id });
      setBuses(extractList(r, 'buses', 'data'));
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not load buses.');
    } finally {
      setBusy(false);
    }
  };

  const selectBus = async (bus) => {
    setSelectedBus(bus);
    setBusy(true);
    try {
      const r = await merpiGetSchedules({ route_id: selectedRoute?.id, departure_date: depDate });
      setSchedules(extractList(r, 'schedules', 'data'));
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not load schedules.');
    } finally {
      setBusy(false);
    }
  };

  const selectSchedule = async (schedule) => {
    setSelectedSchedule(schedule);
    setBusy(true);
    try {
      const r = await merpiGetSeats({ bus_id: selectedBus?.id, schedule_id: schedule.id });
      setSeats(extractList(r, 'seats', 'data'));
      setStep(3);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not load seats.');
    } finally {
      setBusy(false);
    }
  };

  const toggleSeat = (seat) => {
    if (seat.status === 'booked') return;
    setSelectedSeats(prev =>
      prev.find(s => s.id === seat.id)
        ? prev.filter(s => s.id !== seat.id)
        : [...prev, seat]
    );
  };

  const handlePay = async () => {
    if (pin.length !== 4) { Alert.alert('PIN required', 'Enter your 4-digit transaction PIN.'); return; }
    if (bal < totalPrice) { Alert.alert('Insufficient balance', 'Please fund your wallet.'); return; }
    setBusy(true);
    try {
      const res = await merpiBuyBusTicket(pin, {
        route_id:    selectedRoute?.id,
        bus_id:      selectedBus?.id,
        schedule_id: selectedSchedule?.id,
        seat_ids:    selectedSeats.map(s => s.id),
        amount:      totalPrice,
        passenger_name:      passenger.fullName,
        passenger_phone:     passenger.phone,
        passenger_email:     passenger.email,
        next_of_kin_name:    passenger.nokName,
        next_of_kin_phone:   passenger.nokPhone,
        departure_date:      depDate,
      });
      navigation.replace('BusTicketConfirmation', {
        reference:  res.reference,
        booking:    res.booking,
        route:      selectedRoute,
        bus:        selectedBus,
        schedule:   selectedSchedule,
        seats:      selectedSeats,
        passenger,
        amount:     totalPrice,
      });
    } catch (e) {
      Alert.alert('Booking Failed', e.message || 'Could not complete booking.');
    } finally {
      setBusy(false);
    }
  };

  // ── Step renderers ──────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <ScrollView contentContainerStyle={ss.sc} keyboardShouldPersistTaps="handled">
      {loadError && (
        <TouchableOpacity
          style={{ backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}
          onPress={() => { setLoadError(null); }}
        >
          <Ionicons name="warning-outline" size={16} color="#EF4444" />
          <Text style={{ color: '#EF4444', fontSize: 13, flex: 1 }}>{loadError}</Text>
        </TouchableOpacity>
      )}
      <View style={[ss.card, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
        <View style={ss.cardHeader}>
          <Ionicons name="bus-outline" size={20} color={tc.primary} />
          <Text style={[ss.cardTitle, { color: tc.heading }]}>Where are you travelling?</Text>
        </View>

        <Text style={[ss.sectionHead, { color: tc.subheading }]}>FROM</Text>
        <FieldLabel text="State" tc={tc} />
        <SelectDropdown
          value={fromState?.name} placeholder="Select origin state" tc={tc}
          onPress={() => setSheet({ key: 'fromState', title: 'Origin State', data: states,
            onSelect: (s) => { setFromState(s); setFromCity(null); } })}
        />
        <FieldLabel text="City" tc={tc} />
        <SelectDropdown
          value={fromCity?.name} placeholder="Select origin city" tc={tc}
          onPress={() => fromState
            ? setSheet({ key: 'fromCity', title: 'Origin City', data: citiesForState(fromState),
                onSelect: setFromCity })
            : Alert.alert('Select state first', 'Please select your origin state first.')}
        />

        <View style={[ss.divider, { backgroundColor: tc.border || '#F0F0F0' }]} />

        <Text style={[ss.sectionHead, { color: tc.subheading }]}>TO</Text>
        <FieldLabel text="State" tc={tc} />
        <SelectDropdown
          value={toState?.name} placeholder="Select destination state" tc={tc}
          onPress={() => setSheet({ key: 'toState', title: 'Destination State', data: states,
            onSelect: (s) => { setToState(s); setToCity(null); } })}
        />
        <FieldLabel text="City" tc={tc} />
        <SelectDropdown
          value={toCity?.name} placeholder="Select destination city" tc={tc}
          onPress={() => toState
            ? setSheet({ key: 'toCity', title: 'Destination City', data: citiesForState(toState),
                onSelect: setToCity })
            : Alert.alert('Select state first', 'Please select your destination state first.')}
        />

        <View style={[ss.divider, { backgroundColor: tc.border || '#F0F0F0' }]} />

        <FieldLabel text="Departure Date" tc={tc} />
        <TouchableOpacity
          style={[ss.inp, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', flexDirection: 'row', alignItems: 'center' }]}
          onPress={() => setShowDatePicker(true)} activeOpacity={0.8}
        >
          <Text style={[{ flex: 1, fontSize: 15 }, { color: depDate ? tc.heading : tc.subtext }]}>
            {depDate ? fmtDate(depDate) : 'Select departure date'}
          </Text>
          <Ionicons name="calendar-outline" size={18} color={tc.subtext} />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={depDate ? new Date(depDate) : new Date()}
            mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={(_, dt) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (dt) setDepDate(toYMD(dt));
            }}
          />
        )}
      </View>

      <TouchableOpacity
        style={[ss.primaryBtn, { backgroundColor: tc.primary, opacity: busy ? 0.7 : 1 }]}
        onPress={searchRoutes} disabled={busy} activeOpacity={0.85}
      >
        {busy
          ? <ActivityIndicator color="#FFF" />
          : <><Ionicons name="search-outline" size={18} color="#FFF" /><Text style={ss.primaryBtnText}>Search Buses</Text></>
        }
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView contentContainerStyle={ss.sc}>
      {/* Routes */}
      <Text style={[ss.sectionLabel, { color: tc.subheading }]}>AVAILABLE ROUTES</Text>
      {routes.map((route) => (
        <TouchableOpacity key={route.id}
          style={[ss.card, { backgroundColor: selectedRoute?.id === route.id ? `${tc.primary}12` : tc.card,
            borderColor: selectedRoute?.id === route.id ? tc.primary : tc.border || '#E5E5EA' }]}
          onPress={() => selectRoute(route)} activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="navigate-outline" size={18} color={tc.primary} />
            <Text style={[{ flex: 1, fontSize: 14, fontWeight: '600', color: tc.heading }]}>
              {route.from_city || route.from} → {route.to_city || route.to}
            </Text>
            {selectedRoute?.id === route.id && <Ionicons name="checkmark-circle" size={20} color={tc.primary} />}
          </View>
          {route.distance && <Text style={[{ fontSize: 12, color: tc.subheading, marginTop: 4 }]}>{route.distance}</Text>}
        </TouchableOpacity>
      ))}

      {/* Buses */}
      {buses.length > 0 && (
        <>
          <Text style={[ss.sectionLabel, { color: tc.subheading, marginTop: 8 }]}>SELECT BUS</Text>
          {buses.map((bus) => (
            <TouchableOpacity key={bus.id}
              style={[ss.card, { backgroundColor: selectedBus?.id === bus.id ? `${tc.primary}12` : tc.card,
                borderColor: selectedBus?.id === bus.id ? tc.primary : tc.border || '#E5E5EA' }]}
              onPress={() => selectBus(bus)} activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 14, fontWeight: '700', color: tc.heading }]}>{bus.company_name || bus.name}</Text>
                  <Text style={[{ fontSize: 12, color: tc.subheading, marginTop: 2 }]}>{bus.bus_type || bus.type}</Text>
                  {bus.departure_time && <Text style={[{ fontSize: 12, color: tc.primary, marginTop: 2 }]}>Departs: {bus.departure_time}</Text>}
                </View>
                <Text style={[{ fontSize: 16, fontWeight: '800', color: tc.primary }]}>
                  {bus.price ? formatCurrency(bus.price, 'NGN') : ''}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Schedules */}
      {schedules.length > 0 && (
        <>
          <Text style={[ss.sectionLabel, { color: tc.subheading, marginTop: 8 }]}>SELECT SCHEDULE</Text>
          {schedules.map((sch) => (
            <TouchableOpacity key={sch.id}
              style={[ss.card, { backgroundColor: selectedSchedule?.id === sch.id ? `${tc.primary}12` : tc.card,
                borderColor: selectedSchedule?.id === sch.id ? tc.primary : tc.border || '#E5E5EA' }]}
              onPress={() => selectSchedule(sch)} activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="time-outline" size={16} color={tc.primary} style={{ marginRight: 8 }} />
                <Text style={[{ flex: 1, fontSize: 14, color: tc.heading }]}>
                  {sch.departure_time} {sch.arrival_time ? `→ ${sch.arrival_time}` : ''}
                </Text>
                <Text style={[{ fontSize: 13, color: tc.subheading }]}>
                  {sch.available_seats} seats left
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}

      {busy && <ActivityIndicator color={tc.primary} style={{ marginVertical: 20 }} />}
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView contentContainerStyle={ss.sc}>
      <View style={[ss.infoCard, { backgroundColor: `${tc.primary}10` }]}>
        <Ionicons name="information-circle-outline" size={14} color={tc.primary} />
        <Text style={[{ fontSize: 12, color: tc.primary, flex: 1 }]}>
          Tap available seats to select them. Green = available, Red = booked, Blue = selected.
        </Text>
      </View>
      <View style={ss.seatGrid}>
        {seats.map((seat) => {
          const isSelected = selectedSeats.find(s => s.id === seat.id);
          const isBooked   = seat.status === 'booked';
          return (
            <TouchableOpacity
              key={seat.id}
              style={[ss.seatCell, {
                backgroundColor: isBooked ? '#EF4444' : isSelected ? tc.primary : '#4CAF50',
                opacity: isBooked ? 0.5 : 1,
              }]}
              onPress={() => toggleSeat(seat)}
              disabled={isBooked}
              activeOpacity={0.7}
            >
              <Text style={[ss.seatLabel, { color: '#FFF' }]}>{seat.seat_number || seat.number}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedSeats.length > 0 && (
        <View style={[ss.card, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <Text style={[{ fontSize: 13, fontWeight: '700', color: tc.heading, marginBottom: 6 }]}>
            Selected: {selectedSeats.map(s => s.seat_number || s.number).join(', ')}
          </Text>
          <Text style={[{ fontSize: 16, fontWeight: '800', color: tc.primary }]}>
            Total: {formatCurrency(totalPrice, 'NGN')}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[ss.primaryBtn, { backgroundColor: tc.primary, opacity: selectedSeats.length === 0 ? 0.5 : 1 }]}
        onPress={() => selectedSeats.length > 0 ? setStep(4) : Alert.alert('Select seats', 'Please select at least one seat.')}
        activeOpacity={0.85}
      >
        <Text style={ss.primaryBtnText}>Continue to Passenger Details</Text>
        <Ionicons name="chevron-forward" size={18} color="#FFF" />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep4 = () => {
    const fields = [
      { key: 'fullName',  label: 'Full Name',         placeholder: 'e.g. John Doe' },
      { key: 'phone',     label: 'Phone Number',      placeholder: '080XXXXXXXX', keyboard: 'phone-pad' },
      { key: 'email',     label: 'Email Address',     placeholder: 'john@example.com', keyboard: 'email-address' },
      { key: 'nokName',   label: 'Next of Kin Name',  placeholder: 'Emergency contact name' },
      { key: 'nokPhone',  label: 'Next of Kin Phone', placeholder: '080XXXXXXXX', keyboard: 'phone-pad' },
    ];
    return (
      <ScrollView contentContainerStyle={ss.sc} keyboardShouldPersistTaps="handled">
        <View style={[ss.card, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <View style={ss.cardHeader}>
            <Ionicons name="person-outline" size={20} color={tc.primary} />
            <Text style={[ss.cardTitle, { color: tc.heading }]}>Passenger Details</Text>
          </View>
          {fields.map(f => (
            <View key={f.key} style={{ marginBottom: 14 }}>
              <FieldLabel text={f.label} tc={tc} />
              <TextInput
                style={[ss.inp, { backgroundColor: tc.background, color: tc.heading, borderColor: tc.border || '#E5E5EA' }]}
                value={passenger[f.key]} placeholder={f.placeholder} placeholderTextColor={tc.subtext}
                keyboardType={f.keyboard || 'default'}
                autoCapitalize={f.keyboard === 'email-address' ? 'none' : 'words'}
                onChangeText={v => setPassenger(p => ({ ...p, [f.key]: v }))}
              />
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={[ss.primaryBtn, { backgroundColor: tc.primary,
            opacity: !passenger.fullName || !passenger.phone || !passenger.email ? 0.5 : 1 }]}
          onPress={() => {
            if (!passenger.fullName || !passenger.phone || !passenger.email) {
              Alert.alert('Missing fields', 'Please fill in Full Name, Phone and Email.');
              return;
            }
            setStep(5);
          }}
          activeOpacity={0.85}
        >
          <Text style={ss.primaryBtnText}>Review & Pay</Text>
          <Ionicons name="chevron-forward" size={18} color="#FFF" />
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderStep5 = () => (
    <ScrollView contentContainerStyle={ss.sc} keyboardShouldPersistTaps="handled">
      {/* Trip summary */}
      {[
        { title: 'Trip Details', icon: 'bus-outline', rows: [
          ['Route',     `${selectedRoute?.from_city || selectedRoute?.from} → ${selectedRoute?.to_city || selectedRoute?.to}`],
          ['Bus',       selectedBus?.company_name || selectedBus?.name],
          ['Departure', `${depDate ? fmtDate(depDate) : ''} ${selectedSchedule?.departure_time || ''}`],
          ['Seats',     selectedSeats.map(s => s.seat_number || s.number).join(', ')],
        ]},
        { title: 'Passenger', icon: 'person-outline', rows: [
          ['Name',          passenger.fullName],
          ['Phone',         passenger.phone],
          ['Email',         passenger.email],
          ['Next of Kin',   passenger.nokName],
          ['NOK Phone',     passenger.nokPhone],
        ]},
      ].map(sec => (
        <View key={sec.title} style={[ss.card, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <View style={ss.cardHeader}>
            <Ionicons name={sec.icon} size={18} color={tc.primary} />
            <Text style={[ss.cardTitle, { color: tc.heading }]}>{sec.title}</Text>
          </View>
          {sec.rows.filter(([, v]) => v).map(([l, v]) => (
            <View key={l} style={ss.reviewRow}>
              <Text style={[ss.reviewLabel, { color: tc.subheading }]}>{l}</Text>
              <Text style={[ss.reviewValue, { color: tc.heading }]}>{v}</Text>
            </View>
          ))}
        </View>
      ))}

      {/* Payment */}
      <View style={ss.payCard}>
        <Text style={ss.payTitle}>Payment Summary</Text>
        <View style={ss.payRow}><Text style={ss.payLabel}>Ticket Price</Text><Text style={ss.payVal}>{formatCurrency(totalPrice, 'NGN')}</Text></View>
        <View style={[ss.payRow, ss.payTotalRow]}>
          <Text style={ss.payTotalLabel}>Total</Text><Text style={ss.payTotalAmt}>{formatCurrency(totalPrice, 'NGN')}</Text>
        </View>
        <View style={ss.walletRow}>
          <Ionicons name="wallet-outline" size={16} color="#FFF" />
          <Text style={ss.walletLabel}>Wallet Balance</Text>
          <Text style={[ss.walletBal, { color: bal < totalPrice ? '#FFB3B3' : '#7FFFB3' }]}>{formatCurrency(bal, 'NGN')}</Text>
        </View>
      </View>

      {bal < totalPrice && (
        <View style={[ss.warnBox, { backgroundColor: '#FEE2E2' }]}>
          <Ionicons name="warning-outline" size={16} color="#EF4444" />
          <Text style={{ fontSize: 13, color: '#EF4444', flex: 1 }}>Insufficient balance. Please fund your wallet.</Text>
        </View>
      )}

      {bal >= totalPrice && (
        <View style={[ss.card, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <FieldLabel text="Transaction PIN" tc={tc} />
          <TextInput
            style={[ss.inp, { backgroundColor: tc.background, color: tc.heading, borderColor: tc.border || '#E5E5EA',
              letterSpacing: 10, textAlign: 'center', fontSize: 18 }]}
            value={pin} onChangeText={setPin} placeholder="••••"
            placeholderTextColor={tc.subtext} keyboardType="number-pad" secureTextEntry maxLength={4}
          />
        </View>
      )}

      <TouchableOpacity
        style={[ss.primaryBtn, { backgroundColor: tc.primary, opacity: (busy || bal < totalPrice || pin.length !== 4) ? 0.5 : 1 }]}
        onPress={handlePay} disabled={busy || bal < totalPrice || pin.length !== 4} activeOpacity={0.85}
      >
        {busy ? <ActivityIndicator color="#FFF" /> : (
          <><Text style={ss.primaryBtnText}>Pay {formatCurrency(totalPrice, 'NGN')}</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" /></>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const stepContent = step === 1 ? renderStep1()
    : step === 2 ? renderStep2()
    : step === 3 ? renderStep3()
    : step === 4 ? renderStep4()
    : renderStep5();

  return (
    <SafeAreaView style={[ss.container, { backgroundColor: tc.background }]}>
      <StatusBarComponent />

      <View style={[ss.header, { backgroundColor: tc.background, borderBottomColor: tc.border || '#E5E5EA', paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(s => s - 1) : navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={tc.heading} />
        </TouchableOpacity>
        <Text style={[ss.headerTitle, { color: tc.heading }]}>Bus Tickets</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Step indicator */}
      <View style={[ss.stepRow, { backgroundColor: tc.background }]}>
        <Text style={[ss.stepText, { color: tc.primary }]}>Step {step} of 5</Text>
        <Text style={[ss.stepName, { color: tc.subheading }]}>{STEPS[step - 1]}</Text>
      </View>
      <View style={[ss.progressBar, { backgroundColor: tc.border || '#E5E5EA' }]}>
        <View style={[ss.progressFill, { backgroundColor: tc.primary, width: `${(step / 5) * 100}%` }]} />
      </View>

      <View key={step} style={{ flex: 1 }}>{stepContent}</View>

      {/* Bottom sheet */}
      {sheet && (
        <BottomSheet
          visible={!!sheet}
          title={sheet.title}
          data={sheet.data}
          keyFn={(item) => String(item.id || item.name)}
          labelFn={(item) => item.name || item.city_name || String(item.id)}
          onSelect={(item) => { sheet.onSelect(item); setSheet(null); }}
          onClose={() => setSheet(null)}
          tc={tc}
        />
      )}
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle:  { fontSize: 16, fontWeight: '700' },
  stepRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  stepText:     { fontSize: 13, fontWeight: '700' },
  stepName:     { fontSize: 13 },
  progressBar:  { height: 4, marginHorizontal: 16, borderRadius: 2, marginBottom: 4 },
  progressFill: { height: 4, borderRadius: 2 },
  sc:           { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  card:         { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle:    { fontSize: 15, fontWeight: '700' },
  sectionHead:  { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  fieldLabel:   { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  inp:          { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, marginBottom: 4 },
  divider:      { height: 1, marginVertical: 12 },
  infoCard:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, marginBottom: 12 },
  seatGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 },
  seatCell:     { width: 48, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  seatLabel:    { fontSize: 12, fontWeight: '700' },
  reviewRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewLabel:  { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  reviewValue:  { fontSize: 13, fontWeight: '500', flex: 1, textAlign: 'right' },
  payCard:      { borderRadius: 14, backgroundColor: '#3B0CB0', padding: 20, marginBottom: 12 },
  payTitle:     { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 12 },
  payRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  payLabel:     { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  payVal:       { fontSize: 14, fontWeight: '600', color: '#FFF' },
  payTotalRow:  { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 8, marginTop: 4 },
  payTotalLabel:{ fontSize: 15, fontWeight: '700', color: '#FFF' },
  payTotalAmt:  { fontSize: 20, fontWeight: '900', color: '#FFF' },
  walletRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  walletLabel:  { flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  walletBal:    { fontSize: 14, fontWeight: '700' },
  warnBox:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 10, marginBottom: 12 },
  primaryBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12, marginTop: 8 },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  overlay:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 1000 },
  sheet:        { borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '60%', paddingTop: 8 },
  sheetList:    { flex: 1 },
  sheetHandle:  { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  sheetTitle:   { fontSize: 16, fontWeight: '700', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0' },
  sheetRow:     { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth },
});
