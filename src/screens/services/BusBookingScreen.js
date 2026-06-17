


import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity,
  ActivityIndicator, Alert, Platform, RefreshControl, TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { merpiGetStates, merpiGetCities, merpiGetRoutes } from 'AuthFunction/paymentService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toYMD = (d) => {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toISOString().split('T')[0];
};
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';

const placeLabel = (v) => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') {
    const city = typeof v.city === 'object' ? v.city?.name : v.city;
    return city || v.name || v.address || '';
  }
  return String(v);
};

// ─── Design Tokens ────────────────────────────────────────────────────────────
const RADIUS = { sm: 10, md: 14, lg: 20, xl: 24 };

// ─── Enhanced Bottom Sheet with search ───────────────────────────────────────
const BottomSheet = ({ visible, title, data, keyFn, labelFn, onSelect, onClose, tc }) => {
  const [query, setQuery] = useState('');
  const filtered = query
    ? data.filter(d => labelFn(d).toLowerCase().includes(query.toLowerCase()))
    : data;

  if (!visible) return null;
  return (
    <View style={bs.overlay}>
      <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
      <View style={[bs.sheet, { backgroundColor: tc.card }]}>
        {/* Handle */}
        <View style={[bs.handle, { backgroundColor: tc.border || '#DDD' }]} />

        {/* Title */}
        <Text style={[bs.title, { color: tc.heading }]}>{title}</Text>

        {/* Search */}
        <View style={[bs.searchBox, { backgroundColor: tc.background, borderColor: tc.border || '#E5E5EA' }]}>
          <Ionicons name="search-outline" size={16} color={tc.subtext} />
          <TextInput
            style={[bs.searchInput, { color: tc.heading }]}
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${title}…`}
            placeholderTextColor={tc.subtext}
            autoFocus
          />
          {!!query && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={tc.subtext} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={keyFn}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[bs.row, { borderBottomColor: tc.border || '#F0F0F0' }]}
              onPress={() => { onSelect(item); onClose(); setQuery(''); }}
              activeOpacity={0.7}
            >
              <View style={[bs.rowDot, { backgroundColor: `${tc.primary}20` }]}>
                <Ionicons name="location-outline" size={14} color={tc.primary} />
              </View>
              <Text style={[bs.rowText, { color: tc.heading }]}>{labelFn(item)}</Text>
              <Ionicons name="chevron-forward" size={16} color={tc.subtext} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={bs.empty}>
              <Ionicons name="search-outline" size={32} color={tc.subtext} />
              <Text style={[bs.emptyText, { color: tc.subheading }]}>No results for "{query}"</Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

const bs = StyleSheet.create({
  overlay:     { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end', zIndex: 1000 },
  sheet:       { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10, height: '65%' },
  handle:      { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 14 },
  title:       { fontSize: 17, fontWeight: '800', paddingHorizontal: 20, marginBottom: 14, letterSpacing: -0.3 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  rowDot:      { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  rowText:     { flex: 1, fontSize: 15, fontWeight: '500' },
  empty:       { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText:   { fontSize: 14 },
});

// ─── Route Card — Cities are the hero ─────────────────────────────────────────
const RouteCard = ({ route, tc, cardDate, onPickDate, onBook }) => {
  const isLuxury   = /luxury|vip|executive/i.test(route.business?.type || route.schedule_type || '');
  const fromCity   = placeLabel(route.from);
  const toCity     = placeLabel(route.to);
  const fromAddr   = route.from?.address || route.terminal?.name || '';
  const toAddr     = route.to?.address   || '';
  const hasPrice   = route.price != null;
  const hasDate    = !!cardDate;

  return (
    <View
      style={[rc.card, { backgroundColor: tc.card }]}
    >
      {/* ── Top strip: operator + price ── */}
      <View style={rc.topRow}>
        <View style={rc.operatorRow}>
          <View style={[rc.busIcon, { backgroundColor: isLuxury ? '#FEF3C7' : `${tc.primary}15` }]}>
            <Ionicons name="bus" size={16} color={isLuxury ? '#B45309' : tc.primary} />
          </View>
          <View>
            <Text style={[rc.operatorName, { color: tc.heading }]} numberOfLines={1}>
              {route.business?.name || 'Bus Operator'}
            </Text>
            <View style={[rc.typePill, { backgroundColor: isLuxury ? '#FEF3C7' : `${tc.primary}12` }]}>
              <Text style={[rc.typePillText, { color: isLuxury ? '#92400E' : tc.primary }]}>
                {isLuxury ? '✦ Luxury' : '● Standard'}
              </Text>
            </View>
          </View>
        </View>

        {hasPrice && (
          <View style={[rc.priceBadge, { backgroundColor: tc.primary }]}>
            <Text style={rc.priceAmount}>{formatCurrency(route.price, 'NGN')}</Text>
            <Text style={rc.priceSub}>per seat</Text>
          </View>
        )}
      </View>

      {/* ── Dashed ticket divider ── */}
      <View style={rc.dashedRow}>
        <View style={[rc.notch, rc.notchLeft, { backgroundColor: tc.background }]} />
        <View style={rc.dashedLine}>
          {Array.from({ length: 14 }).map((_, i) => (
            <View key={i} style={[rc.dash, { backgroundColor: tc.border || '#E2E8F0' }]} />
          ))}
        </View>
        <View style={[rc.notch, rc.notchRight, { backgroundColor: tc.background }]} />
      </View>

      {/* ── ROUTE: From → To  (the visual hero) ── */}
      <View style={rc.routeRow}>
        {/* FROM */}
        <View style={rc.cityBlock}>
          <View style={[rc.cityDot, { borderColor: tc.primary, backgroundColor: `${tc.primary}18` }]}>
            <View style={[rc.cityDotInner, { backgroundColor: tc.primary }]} />
          </View>
          <Text style={[rc.cityName, { color: tc.heading }]} numberOfLines={2}>
            {fromCity || '—'}
          </Text>
          {!!fromAddr && (
            <Text style={[rc.cityAddr, { color: tc.subheading }]} numberOfLines={1}>
              {fromAddr}
            </Text>
          )}
        </View>

        {/* Connector */}
        <View style={rc.connector}>
          <View style={[rc.connLine, { backgroundColor: tc.border || '#E2E8F0' }]} />
          <View style={[rc.connBus, { backgroundColor: `${tc.primary}15` }]}>
            <Ionicons name="arrow-forward" size={12} color={tc.primary} />
          </View>
          <View style={[rc.connLine, { backgroundColor: tc.border || '#E2E8F0' }]} />
        </View>

        {/* TO */}
        <View style={[rc.cityBlock, rc.cityBlockRight]}>
          <View style={[rc.cityDot, { borderColor: '#10B981', backgroundColor: '#D1FAE5' }]}>
            <View style={[rc.cityDotInner, { backgroundColor: '#10B981' }]} />
          </View>
          <Text style={[rc.cityName, { color: tc.heading }]} numberOfLines={2}>
            {toCity || '—'}
          </Text>
          {!!toAddr && (
            <Text style={[rc.cityAddr, { color: tc.subheading, textAlign: 'right' }]} numberOfLines={1}>
              {toAddr}
            </Text>
          )}
        </View>
      </View>

      {/* ── Date selector row ── */}
      <TouchableOpacity
        style={[rc.dateRow, hasDate
          ? { backgroundColor: `${tc.primary}12`, borderColor: tc.primary }
          : { backgroundColor: '#FFF8E7', borderColor: '#F59E0B', borderWidth: 1.5 }
        ]}
        onPress={onPickDate}
        activeOpacity={0.75}
      >
        <View style={[rc.dateIconBox, { backgroundColor: hasDate ? `${tc.primary}20` : '#FEF3C7' }]}>
          <Ionicons name="calendar" size={20} color={hasDate ? tc.primary : '#D97706'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[rc.dateLabel, { color: hasDate ? tc.primary : '#92400E' }]}>DEPARTURE DATE</Text>
          <Text style={[rc.dateValue, { color: hasDate ? tc.heading : '#B45309' }]}>
            {hasDate ? fmtDate(cardDate) : 'Tap here to pick a date'}
          </Text>
        </View>
        {hasDate
          ? <Ionicons name="checkmark-circle" size={22} color={tc.primary} />
          : <View style={rc.tapBadge}>
              <Text style={rc.tapBadgeText}>TAP</Text>
            </View>
        }
      </TouchableOpacity>

      {/* ── Book button ── */}
      <TouchableOpacity
        onPress={() => onBook(cardDate)}
        activeOpacity={hasDate ? 0.82 : 1}
        disabled={!hasDate}
      >
        <LinearGradient
          colors={!hasDate ? ['#9CA3AF', '#9CA3AF'] : isLuxury ? ['#92400E', '#B45309'] : [tc.primary, tc.primary + 'CC']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={rc.bookBtn}
        >
          <Ionicons name="ticket-outline" size={15} color="#FFF" />
          <Text style={rc.bookBtnText}>
            {hasDate ? `Book for ${fmtDate(cardDate)}` : 'Select a date to book'}
          </Text>
          <Ionicons name="chevron-forward" size={15} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const rc = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },

  // Top row
  topRow:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 16, paddingBottom: 0 },
  operatorRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  busIcon:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  operatorName: { fontSize: 14, fontWeight: '700', maxWidth: 160, letterSpacing: -0.2 },
  typePill:     { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginTop: 3 },
  typePillText: { fontSize: 10, fontWeight: '700' },

  // Price badge
  priceBadge:   { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  priceAmount:  { fontSize: 15, fontWeight: '900', color: '#FFF', letterSpacing: -0.3 },
  priceSub:     { fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 1 },

  // Dashed ticket divider
  dashedRow:    { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  notch:        { width: 18, height: 18, borderRadius: 9 },
  notchLeft:    { marginLeft: -9 },
  notchRight:   { marginRight: -9 },
  dashedLine:   { flex: 1, flexDirection: 'row', gap: 4, overflow: 'hidden' },
  dash:         { flex: 1, height: 1.5, borderRadius: 1 },

  // Route cities — the visual hero
  routeRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18 },
  cityBlock:     { flex: 1 },
  cityBlockRight:{ alignItems: 'flex-end' },
  cityDot:       { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  cityDotInner:  { width: 10, height: 10, borderRadius: 5 },
  cityName:      { fontSize: 20, fontWeight: '900', letterSpacing: -0.5, lineHeight: 24 },
  cityAddr:      { fontSize: 11, marginTop: 3, fontWeight: '500' },

  // Connector
  connector:    { alignItems: 'center', paddingHorizontal: 8, gap: 4, flexDirection: 'row', flex: 0.6 },
  connLine:     { flex: 1, height: 1.5, borderRadius: 1 },
  connBus:      { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  // Date row
  dateRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  dateIconBox:  { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dateLabel:    { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 3 },
  dateValue:    { fontSize: 14, fontWeight: '700' },
  tapBadge:     { backgroundColor: '#F59E0B', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  tapBadgeText: { fontSize: 10, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },

  // Book button
  bookBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  bookBtnText:  { fontSize: 14, fontWeight: '800', color: '#FFF', letterSpacing: 0.2 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BusBookingScreen({ navigation }) {
  const dark   = useThem();
  const tc     = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [states,      setStates]      = useState([]);
  const [allCities,   setAllCities]   = useState([]);
  const [allRoutes,   setAllRoutes]   = useState([]);
  const [nextPage,    setNextPage]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);
  const [loadError,   setLoadError]   = useState(null);
  const PER_PAGE = 20;

  const [filterFrom,       setFilterFrom]       = useState(null);
  const [filterTo,         setFilterTo]         = useState(null);
  const [cardDates,        setCardDates]        = useState({}); // { [routeId]: 'YYYY-MM-DD' }
  const [showPickerForId,  setShowPickerForId]  = useState(null);
  const [sheet,            setSheet]            = useState(null);

  // ── Data helpers ────────────────────────────────────────────────────────────
  const extract = (r, key) => {
    const d1 = r?.data, d2 = d1?.data;
    const container = Array.isArray(d2?.[key]) ? d2 : Array.isArray(d1?.[key]) ? d1 : r;
    return { list: Array.isArray(container?.[key]) ? container[key] : [], nextPage: container?.next_page ?? null };
  };

  const fetchAllPages = async (fetchFn, key, baseParams = {}) => {
    let all = [], page = 1;
    for (let g = 0; g < 50; g++) {
      const r = await fetchFn({ per_page: 200, page, ...baseParams });
      const { list, nextPage } = extract(r, key);
      all = all.concat(list);
      if (!nextPage || !list.length) break;
      page = Number(nextPage);
    }
    return all;
  };

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setLoadError(null);
    try {
      const [stateList, cityList, routeRes] = await Promise.all([
        fetchAllPages(merpiGetStates, 'states'),
        fetchAllPages(merpiGetCities, 'cities'),
        merpiGetRoutes({ per_page: PER_PAGE, page: 1 }),
      ]);
      setStates(stateList);
      setAllCities(cityList);
      const { list, nextPage: np } = extract(routeRes, 'routes');
      setAllRoutes(list);
      setNextPage(np);
    } catch (e) {
      setLoadError(e.message || 'Could not load routes. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextPage || loadingMore) return;
    setLoadingMore(true);
    try {
      const r = await merpiGetRoutes({ per_page: PER_PAGE, page: nextPage });
      const { list, nextPage: np } = extract(r, 'routes');
      setAllRoutes(prev => [...prev, ...list]);
      setNextPage(np);
    } catch { /* silent */ } finally { setLoadingMore(false); }
  }, [nextPage, loadingMore]);

  useEffect(() => { loadData(); }, []);
  const onRefresh = () => { setRefreshing(true); setNextPage(null); loadData(true); };

  // ── Filtering ───────────────────────────────────────────────────────────────
  const cityIdsForState = useCallback((stateObj) => {
    if (!stateObj) return null;
    return new Set(allCities.filter(c => String(c.state?.id) === String(stateObj.id)).map(c => String(c.id)));
  }, [allCities]);

  const filteredRoutes = useMemo(() => {
    const fromSet = cityIdsForState(filterFrom);
    const toSet   = cityIdsForState(filterTo);
    return allRoutes.filter(route => {
      if (fromSet && !fromSet.has(String(route.from?.city?.id ?? route.from?.id ?? ''))) return false;
      if (toSet   && !toSet.has(String(route.to?.city?.id   ?? route.to?.id   ?? ''))) return false;
      return true;
    });
  }, [allRoutes, filterFrom, filterTo, cityIdsForState]);

  const hasFilters = !!(filterFrom || filterTo);

  // ── Route selection ─────────────────────────────────────────────────────────
  const selectRoute = (route, date) => {
    if (!date) {
      Alert.alert('Pick a Date First', 'Please tap the date field on the route card to select a departure date.');
      return;
    }
    navigation.navigate('ScheduleAndBus', {
      route, depDate: date,
      fromCity: route.from?.city || { id: route.from?.id, name: placeLabel(route.from) },
      toCity:   route.to?.city   || { id: route.to?.id,   name: placeLabel(route.to) },
    });
  };

  // ── List header ─────────────────────────────────────────────────────────────
  const ListHeader = () => (
    <View>
      {/* ── Hero gradient ── */}
      <LinearGradient
        colors={['#1E3A5F', '#2563EB', '#7C3AED']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={ss.hero}
      >
        {/* Decorative circles */}
        <View style={ss.heroBubble1} />
        <View style={ss.heroBubble2} />

        <View style={ss.heroContent}>
          <View style={ss.heroBadge}>
            <Ionicons name="bus" size={14} color="#FFF" />
            <Text style={ss.heroBadgeText}>Bus Tickets</Text>
          </View>
          <Text style={ss.heroTitle}>Where are you{'\n'}travelling to?</Text>
          <Text style={ss.heroSub}>
           
            1000+ routes available across Nigeria
     
          </Text>
          {/* <Text style={ss.heroSub}>
            {filteredRoutes.length > 0
              ? `${filteredRoutes.length} routes available across Nigeria`
              : 'Explore routes across Nigeria'}
          </Text> */}
        </View>

        {/* Route summary if filters are active */}
        {hasFilters && (
          <View style={ss.heroRoute}>
            <Text style={ss.heroRouteText}>
              {filterFrom?.name || 'Any'} → {filterTo?.name || 'Any'}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* ── Filter card ── */}
      <View style={[ss.filterCard, { backgroundColor: tc.card }]}>

        {/* From / To row */}
        <View style={ss.fromToContainer}>
          {/* FROM pill */}
          <TouchableOpacity
            style={[ss.locationPill, { backgroundColor: tc.background, borderColor: filterFrom ? tc.primary : tc.border || '#E5E5EA' }]}
            onPress={() => setSheet({ title: 'Origin State', data: states, onSelect: setFilterFrom })}
            activeOpacity={0.82}
          >
            <View style={[ss.locationDot, { backgroundColor: `${tc.primary}20` }]}>
              <Ionicons name="radio-button-on" size={12} color={tc.primary} />
            </View>
            <View style={ss.locationTextWrap}>
              <Text style={[ss.locationLabel, { color: tc.subtext }]}>FROM</Text>
              <Text style={[ss.locationValue, { color: filterFrom ? tc.heading : tc.subtext }]} numberOfLines={1}>
                {filterFrom?.name || 'Select origin state'}
              </Text>
            </View>
            {filterFrom
              ? <TouchableOpacity onPress={() => setFilterFrom(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color={tc.subtext} />
                </TouchableOpacity>
              : <Ionicons name="chevron-down" size={16} color={tc.subtext} />
            }
          </TouchableOpacity>

          {/* Swap-style divider */}
          <View style={ss.swapDivider}>
            <View style={[ss.swapLine, { backgroundColor: tc.border || '#E5E5EA' }]} />
            <View style={[ss.swapCircle, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
              <Ionicons name="swap-vertical" size={14} color={tc.subtext} />
            </View>
            <View style={[ss.swapLine, { backgroundColor: tc.border || '#E5E5EA' }]} />
          </View>

          {/* TO pill */}
          <TouchableOpacity
            style={[ss.locationPill, { backgroundColor: tc.background, borderColor: filterTo ? '#10B981' : tc.border || '#E5E5EA' }]}
            onPress={() => setSheet({ title: 'Destination State', data: states, onSelect: setFilterTo })}
            activeOpacity={0.82}
          >
            <View style={[ss.locationDot, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="radio-button-on" size={12} color="#10B981" />
            </View>
            <View style={ss.locationTextWrap}>
              <Text style={[ss.locationLabel, { color: tc.subtext }]}>TO</Text>
              <Text style={[ss.locationValue, { color: filterTo ? tc.heading : tc.subtext }]} numberOfLines={1}>
                {filterTo?.name || 'Select destination state'}
              </Text>
            </View>
            {filterTo
              ? <TouchableOpacity onPress={() => setFilterTo(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color={tc.subtext} />
                </TouchableOpacity>
              : <Ionicons name="chevron-down" size={16} color={tc.subtext} />
            }
          </TouchableOpacity>
        </View>

      </View>

      {/* ── Routes count header ── */}
      {!loading && (
        <View style={ss.countRow}>
          <View>
            <Text style={[ss.countTitle, { color: tc.heading }]}>
              {hasFilters ? 'Matching Routes' : 'All Routes'}
            </Text>
            <Text style={[ss.countSub, { color: tc.subheading }]}>
              {filteredRoutes.length} {filteredRoutes.length === 1 ? 'route' : 'routes'} available
              {hasFilters ? ` · ${filterFrom?.name || 'Any'} → ${filterTo?.name || 'Any'}` : ''}
            </Text>
          </View>
          {hasFilters && (
            <TouchableOpacity
              style={[ss.clearBtn, { borderColor: tc.primary }]}
              onPress={() => { setFilterFrom(null); setFilterTo(null); }}
            >
              <Ionicons name="close" size={12} color={tc.primary} />
              <Text style={[ss.clearBtnText, { color: tc.primary }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Error box ── */}
      {loadError && (
        <TouchableOpacity style={ss.errorBox} onPress={() => loadData()}>
          <Ionicons name="warning-outline" size={18} color="#EF4444" />
          <Text style={ss.errorText}>{loadError}</Text>
          <View style={ss.retryPill}>
            <Text style={ss.retryPillText}>Retry</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  // ── Empty state ─────────────────────────────────────────────────────────────
  const ListEmpty = () => {
    if (loading) return null;
    return (
      <View style={ss.emptyBox}>
        <LinearGradient
          colors={[`${tc.primary}15`, `${tc.primary}05`]}
          style={ss.emptyIconWrap}
        >
          <Ionicons name="bus-outline" size={44} color={tc.primary} />
        </LinearGradient>
        <Text style={[ss.emptyTitle, { color: tc.heading }]}>
          {hasFilters ? 'No routes found' : 'No routes available'}
        </Text>
        <Text style={[ss.emptySub, { color: tc.subheading }]}>
          {hasFilters
            ? 'No routes match your selected states. Try a different combination.'
            : 'Pull down to refresh and check for new routes.'}
        </Text>
        {hasFilters && (
          <TouchableOpacity
            style={[ss.emptyAction, { backgroundColor: tc.primary }]}
            onPress={() => { setFilterFrom(null); setFilterTo(null); }}
          >
            <Text style={ss.emptyActionText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[ss.root, { backgroundColor: tc.background }]}>
      <StatusBarComponent />

      {/* Top bar */}
      <View style={[ss.topBar, { borderBottomColor: tc.border || '#E5E5EA', paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 4) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[ss.backBtn, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color={tc.heading} />
        </TouchableOpacity>
        <Text style={[ss.topBarTitle, { color: tc.heading }]}>Bus Booking</Text>
        <View style={ss.backBtn} />
      </View>

      {/* Body */}
      {loading ? (
        <View style={ss.loadingBox}>
          <LinearGradient colors={[`${tc.primary}20`, `${tc.primary}05`]} style={ss.loadingIconWrap}>
            <ActivityIndicator size="large" color={tc.primary} />
          </LinearGradient>
          <Text style={[ss.loadingTitle, { color: tc.heading }]}>Finding Routes</Text>
          <Text style={[ss.loadingText, { color: tc.subheading }]}>Loading available bus routes…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRoutes}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={ss.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={<ListEmpty />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tc.primary} />
          }
          renderItem={({ item }) => (
            <RouteCard
              route={item}
              tc={tc}
              cardDate={cardDates[item.id] || ''}
              onPickDate={() => setShowPickerForId(item.id)}
              onBook={(date) => selectRoute(item, date)}
            />
          )}
          ListFooterComponent={
            filteredRoutes.length > 0 ? (
              <View style={ss.footer}>
                {nextPage ? (
                  <TouchableOpacity
                    style={[ss.loadMoreBtn, { borderColor: tc.primary, opacity: loadingMore ? 0.6 : 1 }]}
                    onPress={loadMore}
                    disabled={loadingMore}
                    activeOpacity={0.8}
                  >
                    {loadingMore
                      ? <ActivityIndicator size="small" color={tc.primary} />
                      : <>
                          <Ionicons name="chevron-down-circle-outline" size={18} color={tc.primary} />
                          <Text style={[ss.loadMoreText, { color: tc.primary }]}>Load More Routes</Text>
                        </>
                    }
                  </TouchableOpacity>
                ) : (
                  <View style={ss.endRow}>
                    <View style={[ss.endLine, { backgroundColor: tc.border || '#E5E5EA' }]} />
                    <Text style={[ss.endText, { color: tc.subtext }]}>
                      All {allRoutes.length} routes loaded
                    </Text>
                    <View style={[ss.endLine, { backgroundColor: tc.border || '#E5E5EA' }]} />
                  </View>
                )}
              </View>
            ) : null
          }
        />
      )}

      {/* Per-card date picker — rendered at screen level to avoid FlatList issues */}
      {showPickerForId !== null && (
        <DateTimePicker
          value={cardDates[showPickerForId] ? new Date(cardDates[showPickerForId]) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={(_, dt) => {
            setShowPickerForId(Platform.OS === 'ios' ? showPickerForId : null);
            if (dt) setCardDates(prev => ({ ...prev, [showPickerForId]: toYMD(dt) }));
          }}
        />
      )}

      {/* Bottom sheet */}
      {sheet && (
        <BottomSheet
          visible
          title={sheet.title}
          data={sheet.data}
          keyFn={(item) => String(item.id || item.name)}
          labelFn={(item) => item.name || String(item.id)}
          onSelect={(item) => { sheet.onSelect(item); setSheet(null); }}
          onClose={() => setSheet(null)}
          tc={tc}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Screen-level Styles ─────────────────────────────────────────────────────
const ss = StyleSheet.create({
  root:         { flex: 1 },
  listContent:  { paddingHorizontal: 16, paddingBottom: 40 },

  // Top bar
  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  topBarTitle:  { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  backBtn:      { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // Loading
  loadingBox:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  loadingIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  loadingTitle:    { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  loadingText:     { fontSize: 14, textAlign: 'center' },

  // Hero
  hero: {
    borderRadius: RADIUS.xl, marginBottom: 16, marginTop: 16,
    minHeight: 160, overflow: 'hidden', padding: 24,
  },
  heroBubble1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -40 },
  heroBubble2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.06)', bottom: -30, left: 20 },
  heroContent: { flex: 1 },
  heroBadge:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
  heroBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  heroTitle:   { fontSize: 26, fontWeight: '900', color: '#FFF', letterSpacing: -0.8, lineHeight: 32, marginBottom: 6 },
  heroSub:     { fontSize: 13, color: 'rgba(255,255,255,0.80)', fontWeight: '500' },
  heroRoute:   { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  heroRouteText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

  // Filter card
  filterCard: {
    borderRadius: RADIUS.lg, padding: 16, marginBottom: 16, gap: 12,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },

  // From/To
  fromToContainer: { gap: 0 },
  locationPill:    { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 14 },
  locationDot:     { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  locationTextWrap: { flex: 1 },
  locationLabel:   { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
  locationValue:   { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },

  // Swap divider between From/To
  swapDivider: { flexDirection: 'row', alignItems: 'center', paddingLeft: 22, marginVertical: -1 },
  swapLine:    { flex: 1, height: 1 },
  swapCircle:  { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },

  // Date pill
  datePill:    { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 14 },
  dateIconWrap:{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dateTextWrap:{ flex: 1 },
  dateLabel:   { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
  dateValue:   { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },

  // Count row
  countRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  countTitle:  { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  countSub:    { fontSize: 12, marginTop: 2 },
  clearBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  clearBtnText:{ fontSize: 12, fontWeight: '700' },

  // Error
  errorBox:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FEE2E2', borderRadius: RADIUS.md, padding: 14, marginBottom: 12 },
  errorText:   { flex: 1, fontSize: 13, color: '#EF4444', lineHeight: 18 },
  retryPill:   { backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  retryPillText:{ fontSize: 11, fontWeight: '700', color: '#FFF' },

  // Empty
  emptyBox:      { paddingVertical: 48, alignItems: 'center', paddingHorizontal: 32 },
  emptyIconWrap: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle:    { fontSize: 18, fontWeight: '800', marginBottom: 8, letterSpacing: -0.3 },
  emptySub:      { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emptyAction:   { marginTop: 20, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 },
  emptyActionText:{ fontSize: 14, fontWeight: '800', color: '#FFF' },

  // Footer
  footer:       { paddingVertical: 24, alignItems: 'center' },
  loadMoreBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  loadMoreText: { fontSize: 14, fontWeight: '700' },
  endRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  endLine:      { flex: 1, height: 1 },
  endText:      { fontSize: 12, fontWeight: '500' },
});