import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Alert, Image, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { useWallet } from 'context/WalletContext';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import {
  merpiGetCinemaDetails, merpiGetCinemaDates,
  merpiGetCinemaTickets, merpiBuyCinemaTickets,
} from 'AuthFunction/paymentService';
import PaymentSummaryModal from 'component/PaymentSummaryModal';

const fmtDate = (ymd) =>
  ymd ? new Date(`${ymd}T00:00:00`).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }) : '';

// Resolve which `times[]` apply for a given location + date, based on the
// cinema's shared_times / per_day_times configuration (daily & weekly only).
function resolveShowtimes(cinemaInfo, locationId, dateStr) {
  if (!cinemaInfo) return [];
  const { shared_times, per_day_times, showing, times, days_with_times, locations } = cinemaInfo;
  const loc = (locations || []).find((l) => l.id === locationId);
  const timesSrc      = shared_times ? (times || []) : (loc?.times || []);
  const daysWithTimes = shared_times ? (days_with_times || []) : (loc?.days_with_times || []);

  if (!per_day_times) return timesSrc;

  if (showing === 'daily') {
    return daysWithTimes.find((d) => d.date === dateStr)?.times || [];
  }

  // weekly: dateStr -> JS day (0=Sun..6=Sat) -> doc's day (1=Mon..7=Sun)
  const jsDay = new Date(`${dateStr}T00:00:00`).getDay();
  const docDay = jsDay === 0 ? 7 : jsDay;
  return daysWithTimes.find((d) => d.day === docDay)?.times || [];
}

const monthName = (date) => date.toLocaleString('en-US', { month: 'long' });

export default function CinemaDetailScreen({ navigation, route }) {
  const { movieId, movie: initialMovie } = route.params || {};
  const dark = useThem(), tc = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { wallet } = useWallet();

  const [movie,          setMovie]          = useState(initialMovie || null);
  const [loading,        setLoading]        = useState(true);
  const [buying,         setBuying]         = useState(false);
  const [pin,            setPin]            = useState('');

  const [locationId,     setLocationId]     = useState(null);
  const [displayMonth,   setDisplayMonth]   = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [availDates,     setAvailDates]     = useState([]);
  const [datesLoading,   setDatesLoading]   = useState(false);
  const [datesError,     setDatesError]     = useState('');
  const [attendanceDate, setAttendanceDate] = useState('');

  const [showtimes,      setShowtimes]      = useState([]);
  const [timeId,         setTimeId]         = useState(null);

  const [tickets,        setTickets]        = useState([]);
  const [quantities,     setQuantities]     = useState({});
  const [showPayModal,   setShowPayModal]   = useState(false);

  const bal = wallet?.user?.walletBalance || 0;
  const totalAmount = tickets.reduce((sum, t) => sum + (t.price || 0) * (quantities[t.id] || 0), 0);
  const hasSelection = Object.values(quantities).some((q) => q > 0);

  const cinemaInfo = movie?.cinema_info;
  const locations  = cinemaInfo?.locations || [];

  // Load movie details
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await merpiGetCinemaDetails(movieId);
        const data = res?.data || initialMovie;
        setMovie(data);

        const locs = data?.cinema_info?.locations || [];
        if (locs.length === 1) {
          setLocationId(locs[0].id);
        } else if (locs.length > 1) {
          const hq = locs.find((l) => l.is_headquarters);
          setLocationId((hq || locs[0]).id);
        }
      } catch (e) {
        Alert.alert('Error', e.message || 'Could not load movie details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [movieId]);

  // Load available dates whenever the displayed month or location changes
  const loadDates = useCallback(async () => {
    setDatesLoading(true);
    setDatesError('');
    try {
      const res = await merpiGetCinemaDates(movieId, monthName(displayMonth));
      setAvailDates(res?.data || []);
    } catch (e) {
      setAvailDates([]);
      setDatesError(e.message || 'Could not load available dates.');
    } finally {
      setDatesLoading(false);
    }
  }, [movieId, displayMonth]);

  useEffect(() => {
    if (locationId == null && locations.length > 0) return;
    loadDates();
  }, [loadDates, locationId, locations.length]);

  const selectLocation = (id) => {
    if (id === locationId) return;
    setLocationId(id);
    setAttendanceDate('');
    setShowtimes([]);
    setTimeId(null);
    setTickets([]);
    setQuantities({});
  };

  const selectDate = (dateStr) => {
    setAttendanceDate(dateStr);
    setTimeId(null);
    setTickets([]);
    setQuantities({});
    const times = resolveShowtimes(cinemaInfo, locationId, dateStr);
    setShowtimes(times);
  };

  const selectTime = async (selectedTimeId) => {
    setTimeId(selectedTimeId);
    try {
      const res = await merpiGetCinemaTickets(movieId, locationId);
      const list = res?.data?.tickets || [];
      setTickets(list);
      const init = {};
      list.forEach((t) => { init[t.id] = 0; });
      setQuantities(init);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not load ticket types.');
    }
  };

  const changeQty = (ticketId, delta) => {
    setQuantities((prev) => ({ ...prev, [ticketId]: Math.max(0, (prev[ticketId] || 0) + delta) }));
  };

  const changeMonth = (delta) => {
    setDisplayMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
    setAttendanceDate('');
    setShowtimes([]);
    setTimeId(null);
    setTickets([]);
    setQuantities({});
  };

  const handleBuy = async () => {
    if (!attendanceDate) { Alert.alert('Date required', 'Please select your attendance date.'); return; }
    if (!timeId)         { Alert.alert('Showtime required', 'Please select a showtime.'); return; }
    if (!hasSelection)   { Alert.alert('No tickets', 'Please select at least one ticket.'); return; }
    if (pin.length !== 4){ Alert.alert('PIN required', 'Enter your 4-digit transaction PIN.'); return; }
    if (bal < totalAmount){ Alert.alert('Insufficient balance', 'Please fund your wallet.'); return; }

    setBuying(true);
    try {
      const lineItems = tickets
        .filter((t) => (quantities[t.id] || 0) > 0)
        .map((t) => ({ id: t.id, count: quantities[t.id] }));

      const res = await merpiBuyCinemaTickets(pin, {
        experience_id:      movieId,
        cinema_location_id: locationId,
        attendance_date:    attendanceDate,
        time_id:            timeId,
        tickets:            lineItems,
        amount:             totalAmount,
      });

      Alert.alert('Booking Confirmed!', `Reference: ${res.reference}\nEnjoy the movie!`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Purchase Failed', e.message || 'Could not complete purchase.');
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[ss.container, { backgroundColor: tc.background }]}>
        <StatusBarComponent />
        <View style={ss.centered}><ActivityIndicator size="large" color={tc.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[ss.container, { backgroundColor: tc.background }]}>
      <StatusBarComponent />

      <View style={[ss.header, { backgroundColor: tc.background, borderBottomColor: tc.border || '#E5E5EA', paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={tc.heading} />
        </TouchableOpacity>
        <Text style={[ss.headerTitle, { color: tc.heading }]} numberOfLines={1}>{movie?.title || 'Movie'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={ss.sc} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Poster */}
        {movie?.image?.[0]?.image ? (
          <Image source={{ uri: movie.image[0].image }} style={ss.poster} resizeMode="cover" />
        ) : (
          <View style={[ss.posterPlaceholder, { backgroundColor: `${tc.primary}15` }]}>
            <Ionicons name="film-outline" size={48} color={tc.primary} />
          </View>
        )}

        {/* Movie info */}
        <View style={[ss.infoCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <Text style={[ss.movieTitle, { color: tc.heading }]}>{movie?.title}</Text>
          <View style={ss.badgeRow}>
            {movie?.business?.name && <View style={[ss.badge, { backgroundColor: '#F3F4F6' }]}><Text style={[ss.badgeText, { color: '#374151' }]}>{movie.business.name}</Text></View>}
            {movie?.category?.name && <View style={[ss.badge, { backgroundColor: `${tc.primary}15` }]}><Text style={[ss.badgeText, { color: tc.primary }]}>{movie.category.name}</Text></View>}
            {cinemaInfo?.showing && (
              <View style={[ss.badge, { backgroundColor: `${tc.primary}15` }]}>
                <Text style={[ss.badgeText, { color: tc.primary }]}>{cinemaInfo.showing === 'weekly' ? 'Weekly' : 'Daily'}</Text>
              </View>
            )}
          </View>
          {movie?.description && <Text style={[ss.synopsis, { color: tc.subheading }]}>{movie.description}</Text>}
        </View>

        {/* Location selection */}
        {locations.length > 1 && (
          <>
            <Text style={[ss.sectionLabel, { color: tc.subheading }]}>SELECT LOCATION</Text>
            <FlatList
              data={locations}
              horizontal showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 12 }}
              renderItem={({ item }) => {
                const active = locationId === item.id;
                return (
                  <TouchableOpacity
                    style={[ss.dateChip, { backgroundColor: active ? tc.primary : tc.card, borderColor: active ? tc.primary : tc.border || '#E5E5EA' }]}
                    onPress={() => selectLocation(item.id)} activeOpacity={0.8}
                  >
                    <Text style={[ss.dateChipText, { color: active ? '#FFF' : tc.heading }]}>
                      {item.name}{item.is_headquarters ? ' (HQ)' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </>
        )}

        {/* Date selection */}
        <View style={ss.monthRow}>
          <Text style={[ss.sectionLabel, { color: tc.subheading, marginBottom: 0 }]}>SELECT DATE</Text>
          <View style={ss.monthNav}>
            <TouchableOpacity onPress={() => changeMonth(-1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={18} color={tc.heading} />
            </TouchableOpacity>
            <Text style={[ss.monthLabel, { color: tc.heading }]}>{monthName(displayMonth)}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-forward" size={18} color={tc.heading} />
            </TouchableOpacity>
          </View>
        </View>

        {datesLoading ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <ActivityIndicator color={tc.primary} />
          </View>
        ) : availDates.length > 0 ? (
          <FlatList
            data={availDates}
            horizontal showsHorizontalScrollIndicator={false}
            keyExtractor={(item, i) => String(item || i)}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 12 }}
            renderItem={({ item }) => {
              const active = attendanceDate === item;
              return (
                <TouchableOpacity
                  style={[ss.dateChip, { backgroundColor: active ? tc.primary : tc.card, borderColor: active ? tc.primary : tc.border || '#E5E5EA' }]}
                  onPress={() => selectDate(item)} activeOpacity={0.8}
                >
                  <Text style={[ss.dateChipText, { color: active ? '#FFF' : tc.heading }]}>{fmtDate(item)}</Text>
                </TouchableOpacity>
              );
            }}
          />
        ) : datesError ? (
          <Text style={[{ fontSize: 13, color: '#EF4444', paddingHorizontal: 16, marginBottom: 12 }]}>{datesError}</Text>
        ) : (
          <Text style={[{ fontSize: 13, color: tc.subtext, paddingHorizontal: 16, marginBottom: 12 }]}>No showings available this month.</Text>
        )}

        {/* Showtime selection */}
        {attendanceDate && (
          <>
            <Text style={[ss.sectionLabel, { color: tc.subheading }]}>SELECT SHOWTIME</Text>
            {showtimes.length > 0 ? (
              <FlatList
                data={showtimes}
                horizontal showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 12 }}
                renderItem={({ item }) => {
                  const active = timeId === item.id;
                  return (
                    <TouchableOpacity
                      style={[ss.dateChip, { backgroundColor: active ? tc.primary : tc.card, borderColor: active ? tc.primary : tc.border || '#E5E5EA' }]}
                      onPress={() => selectTime(item.id)} activeOpacity={0.8}
                    >
                      <Text style={[ss.dateChipText, { color: active ? '#FFF' : tc.heading }]}>{item.start} – {item.end}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            ) : (
              <Text style={[{ fontSize: 13, color: tc.subtext, paddingHorizontal: 16, marginBottom: 12 }]}>No showtimes available for this date.</Text>
            )}
          </>
        )}

        {/* Ticket types */}
        {tickets.length > 0 && (
          <>
            <Text style={[ss.sectionLabel, { color: tc.subheading }]}>SELECT TICKETS</Text>
            {tickets.map((ticket) => (
              <View key={ticket.id} style={[ss.ticketRow, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 14, fontWeight: '700', color: tc.heading }]}>{ticket.title}</Text>
                  {ticket.price_breakdown?.convenience_fee > 0 && (
                    <Text style={[{ fontSize: 11, color: tc.subheading, marginTop: 2 }]}>
                      Includes {formatCurrency(ticket.price_breakdown.convenience_fee, 'NGN')} convenience fee
                    </Text>
                  )}
                  <Text style={[{ fontSize: 15, fontWeight: '800', color: tc.primary, marginTop: 4 }]}>{formatCurrency(ticket.price || 0, 'NGN')}</Text>
                </View>
                <View style={ss.qtyRow}>
                  <TouchableOpacity style={[ss.qtyBtn, { borderColor: tc.border || '#E5E5EA' }]} onPress={() => changeQty(ticket.id, -1)}>
                    <Ionicons name="remove" size={16} color={tc.heading} />
                  </TouchableOpacity>
                  <Text style={[ss.qtyText, { color: tc.heading }]}>{quantities[ticket.id] || 0}</Text>
                  <TouchableOpacity style={[ss.qtyBtn, { backgroundColor: tc.primary, borderColor: tc.primary }]} onPress={() => changeQty(ticket.id, 1)}>
                    <Ionicons name="add" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Review & pay */}
        {hasSelection && (
          <TouchableOpacity
            style={[ss.primaryBtn, { backgroundColor: tc.primary,
              opacity: (!attendanceDate || !timeId) ? 0.5 : 1 }]}
            onPress={() => setShowPayModal(true)}
            disabled={!attendanceDate || !timeId}
            activeOpacity={0.85}
          >
            <Text style={ss.primaryBtnText}>Review & Pay — {formatCurrency(totalAmount, 'NGN')}</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        )}
      </ScrollView>

      <PaymentSummaryModal
        visible={showPayModal}
        onClose={() => setShowPayModal(false)}
        tc={tc}
        title="Order Summary"
        rows={[
          ...(attendanceDate ? [{ label: 'Date', value: fmtDate(attendanceDate) }] : []),
          ...tickets.filter((t) => (quantities[t.id] || 0) > 0).map((t) => ({
            label: `${t.title} × ${quantities[t.id]}`,
            value: formatCurrency((t.price || 0) * quantities[t.id], 'NGN'),
          })),
        ]}
        totalAmount={totalAmount}
        walletBalance={bal}
        pin={pin}
        onPinChange={setPin}
        onConfirm={handleBuy}
        confirmLabel={`Buy Tickets — ${formatCurrency(totalAmount, 'NGN')}`}
        loading={buying}
      />
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  container:        { flex: 1 },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle:      { fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  sc:               { paddingBottom: 40 },
  centered:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  poster:           { width: '100%', height: 220 },
  posterPlaceholder:{ width: '100%', height: 180, alignItems: 'center', justifyContent: 'center' },
  infoCard:         { margin: 16, borderRadius: 14, borderWidth: 1, padding: 16 },
  movieTitle:       { fontSize: 20, fontWeight: '800', marginBottom: 10 },
  badgeRow:         { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
  badge:            { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeText:        { fontSize: 11, fontWeight: '700' },
  synopsis:         { fontSize: 13, lineHeight: 20, marginTop: 8 },
  sectionLabel:     { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, paddingHorizontal: 16, marginBottom: 8, marginTop: 4 },
  monthRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 },
  monthNav:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  monthLabel:       { fontSize: 13, fontWeight: '700', minWidth: 70, textAlign: 'center' },
  dateChip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  dateChipText:     { fontSize: 13, fontWeight: '600' },
  ticketRow:        { marginHorizontal: 16, marginBottom: 10, borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center' },
  qtyRow:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn:           { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyText:          { fontSize: 16, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  primaryBtn:       { marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12, marginTop: 4 },
  primaryBtnText:   { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
