import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
  ActivityIndicator, Alert, FlatList, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import {
  merpiGetStates, merpiGetCities, merpiGetRoutes,
} from 'AuthFunction/paymentService';

const STEPS = ['Search', 'Select'];

const toYMD = (d) => {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toISOString().split('T')[0];
};
// MERPI schedules endpoint expects 'DD-MM-YYYY' (e.g. '25-08-2024')
const toDMY = (ymd) => {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-');
  return `${d}-${m}-${y}`;
};
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

// MERPI route endpoints can come back as strings or objects like
// { address, city: { id, name } } — always reduce to a displayable string.
const placeLabel = (v) => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') {
    const city = typeof v.city === 'object' ? v.city?.name : v.city;
    return city || v.name || v.address || '';
  }
  return String(v);
};

// Seat cells have no seat_number — derive an airline-style code from row/column (1A, 2C, …)
const seatLabel = (seat) => `${seat.row}${String.fromCharCode(64 + seat.column)}`;

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

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
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

  // Step 2 — route cards (operator/price/terminal)
  const [routes, setRoutes] = useState([]);

  // Load states + all cities on mount (cities API returns full list, no server-side filter)
  useEffect(() => {
    const extract = (r, key) => {
      // Backend wraps: { success, data: <merpi_body> }
      // Merpi body: { data: { <key>: [...], next_page, ... } }  OR  { <key>: [...] }
      const d1 = r?.data;          // backend's data field = merpi response body
      const d2 = d1?.data;         // merpi's nested data field
      const container = Array.isArray(d2?.[key]) ? d2 : Array.isArray(d1?.[key]) ? d1 : r;
      return {
        list:     Array.isArray(container?.[key]) ? container[key] : [],
        nextPage: container?.next_page ?? null,
      };
    };

    // States and cities are both paginated — a single page only covers a handful
    // of entries, so walk every page and accumulate until next_page is null.
    const fetchAllPages = async (fetchFn, key) => {
      let all = [];
      let page = 1;
      for (let guard = 0; guard < 50; guard++) {
        const r = await fetchFn({ per_page: 200, page });
        const { list, nextPage } = extract(r, key);
        all = all.concat(list);
        if (!nextPage || !list.length) break;
        page = Number(nextPage);
      }
      return all;
    };

    Promise.all([
      fetchAllPages(merpiGetStates, 'states'),
      fetchAllPages(merpiGetCities, 'cities'),
    ])
      .then(([stateList, cityList]) => {
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
        from_city_id: fromCity.id,
        to_city_id:   toCity.id,
      });
      const list = extractList(r, 'routes', 'data');
      if (!list.length) {
        Alert.alert('No routes found', 'No available routes for the selected cities.');
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

  const selectRoute = (route) => {
    navigation.navigate('ScheduleAndBus', { route, depDate, fromCity, toCity });
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

      {/* Hero banner */}
      <LinearGradient
        colors={['#2D1B69', '#6D28D9', '#DB7093']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={ss.hero}
      >
        <Ionicons name="bus" size={84} color="rgba(255,255,255,0.16)" style={ss.heroIcon} />
        <Text style={ss.heroTitle}>Find Your Route</Text>
        <Text style={ss.heroSub}>Secure your seats with PayFlex speed</Text>
      </LinearGradient>

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

  const renderStep2 = () => {
    const originLabel = placeLabel(routes[0]?.from) || fromCity?.name || '';
    const destLabel   = placeLabel(routes[0]?.to)   || toCity?.name   || '';

    return (
    <ScrollView contentContainerStyle={ss.sc}>
      {/* Trip header */}
      <Text style={[ss.rideRoute, { color: tc.subheading }]} numberOfLines={1}>
        {originLabel.toUpperCase()} TO {destLabel.toUpperCase()}
      </Text>
      <Text style={[ss.rideTitle, { color: tc.heading }]}>Available Rides</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {!!depDate && (
          <View style={[ss.pill, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="calendar-outline" size={13} color="#16A34A" />
            <Text style={[ss.pillText, { color: '#16A34A' }]}>{fmtDate(depDate)}</Text>
          </View>
        )}
        <View style={[ss.pill, { backgroundColor: tc.card, borderWidth: 1, borderColor: tc.border || '#E5E5EA' }]}>
          <Ionicons name="people-outline" size={13} color={tc.subheading} />
          <Text style={[ss.pillText, { color: tc.subheading }]}>1 Passenger</Text>
        </View>
      </View>

      {/* Routes — each is a business's ride offering: price, terminal & company included */}
      {routes.map((route) => {
        const badgeIsLuxury = /luxury|vip|executive/i.test(route.business?.type || route.schedule_type || '');
        return (
          <TouchableOpacity key={route.id}
            style={[ss.rideCard, { backgroundColor: tc.card, borderColor: tc.border || '#EFEFF4' }]}
            onPress={() => selectRoute(route)} activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={[ss.rideIconBox, { backgroundColor: `${tc.primary}12` }]}>
                <Ionicons name="bus" size={22} color={tc.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[ss.rideOperator, { color: tc.heading }]} numberOfLines={1}>{route.business?.name || 'Bus Operator'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <View style={[ss.typeBadge, { backgroundColor: badgeIsLuxury ? '#FCE7DC' : '#DCFCE7' }]}>
                    <Text style={[ss.typeBadgeText, { color: badgeIsLuxury ? '#C2410C' : '#15803D' }]}>
                      {badgeIsLuxury ? 'Luxury' : 'Standard'}
                    </Text>
                  </View>
                  {route.terminal?.name && (
                    <Text style={[{ fontSize: 12, color: tc.subheading }]} numberOfLines={1}>
                      <Ionicons name="location-outline" size={11} /> {route.terminal.name}
                    </Text>
                  )}
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[ss.ridePrice, { color: tc.primary }]}>
                  {route.price != null ? formatCurrency(route.price, 'NGN') : ''}
                </Text>
                <Text style={[ss.ridePriceSub, { color: tc.subtext }]}>per seat</Text>
              </View>
            </View>

            <View style={[ss.rideDivider, { backgroundColor: tc.border || '#F0F0F0' }]} />

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={[ss.rideCity, { color: tc.heading }]} numberOfLines={1}>{placeLabel(route.from)}</Text>
                <Text style={[ss.rideAddr, { color: tc.subheading }]} numberOfLines={1}>{route.from?.address || ''}</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={tc.subtext} style={{ marginHorizontal: 8 }} />
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={[ss.rideCity, { color: tc.heading }]} numberOfLines={1}>{placeLabel(route.to)}</Text>
                <Text style={[ss.rideAddr, { color: tc.subheading, textAlign: 'right' }]} numberOfLines={1}>{route.to?.address || ''}</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Special offer banner */}
      <View style={ss.offerCard}>
        <Text style={ss.offerLabel}>SPECIAL OFFER</Text>
        <Text style={ss.offerTitle}>Get 10% Off with PayFlex</Text>
        <Text style={ss.offerSub}>Book this ride and pay via PayFlex wallet to instantly save 10%.</Text>
        <Ionicons name="ticket-outline" size={64} color="rgba(255,255,255,0.15)" style={ss.offerIcon} />
      </View>

    </ScrollView>
  );
  };

  const stepContent = step === 1 ? renderStep1() : renderStep2();

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
  primaryBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12, marginTop: 8 },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  overlay:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 1000 },
  sheet:        { borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '60%', paddingTop: 8 },
  sheetList:    { flex: 1 },
  sheetHandle:  { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  sheetTitle:   { fontSize: 16, fontWeight: '700', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0' },
  sheetRow:     { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth },

  // Hero banner (Step 1)
  hero:         { borderRadius: 18, padding: 20, marginBottom: 16, minHeight: 140, justifyContent: 'flex-end', overflow: 'hidden' },
  heroIcon:     { position: 'absolute', right: -10, top: -10 },
  heroTitle:    { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  heroSub:      { fontSize: 13, color: 'rgba(255,255,255,0.85)' },

  // Route ("Select Bus") step
  rideRoute:    { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  rideTitle:    { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  pill:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  pillText:     { fontSize: 12, fontWeight: '600' },
  rideCard:     { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 14 },
  rideIconBox:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rideOperator: { fontSize: 15, fontWeight: '700' },
  typeBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText:{ fontSize: 11, fontWeight: '700' },
  ridePrice:    { fontSize: 17, fontWeight: '800' },
  ridePriceSub: { fontSize: 11, marginTop: 1 },
  rideDivider:  { height: 1, marginVertical: 12 },
  rideCity:     { fontSize: 14, fontWeight: '700' },
  rideAddr:     { fontSize: 12, marginTop: 2 },
  offerCard:    { borderRadius: 16, backgroundColor: '#7C3AED', padding: 18, marginTop: 4, marginBottom: 12, overflow: 'hidden' },
  offerLabel:   { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  offerTitle:   { fontSize: 17, fontWeight: '800', color: '#FFF', marginBottom: 6 },
  offerSub:     { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 19, maxWidth: '80%' },
  offerIcon:    { position: 'absolute', right: -8, bottom: -10 },
});
