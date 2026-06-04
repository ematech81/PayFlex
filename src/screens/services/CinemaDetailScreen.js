import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Alert, Image, FlatList,
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
  merpiGetCinemaDetails, merpiGetCinemaDates,
  merpiGetCinemaTickets, merpiBuyCinemaTickets,
} from 'AuthFunction/paymentService';

const toYMD = (d) => (typeof d === 'string' ? d : d.toISOString().split('T')[0]);
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';

export default function CinemaDetailScreen({ navigation, route }) {
  const { movieId, movie: initialMovie } = route.params || {};
  const dark = useThem(), tc = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { wallet } = useWallet();

  const [movie,          setMovie]          = useState(initialMovie || null);
  const [availDates,     setAvailDates]     = useState([]);
  const [tickets,        setTickets]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [buying,         setBuying]         = useState(false);
  const [pin,            setPin]            = useState('');
  const [quantities,     setQuantities]     = useState({});
  const [attendanceDate, setAttendanceDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const bal = wallet?.user?.walletBalance || 0;
  const totalAmount = tickets.reduce((sum, t) => sum + (t.price || 0) * (quantities[t.id] || 0), 0);
  const hasSelection = Object.values(quantities).some(q => q > 0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [mvRes, dtRes] = await Promise.all([
          merpiGetCinemaDetails(movieId),
          merpiGetCinemaDates(movieId),
        ]);
        setMovie(mvRes?.data?.data || mvRes?.data || initialMovie);
        setAvailDates(dtRes?.data?.data || dtRes?.data || []);
      } catch (e) {
        Alert.alert('Error', e.message || 'Could not load movie details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [movieId]);

  const loadTickets = async (date) => {
    try {
      const res = await merpiGetCinemaTickets(movieId);
      const list = res?.data?.data || res?.data || [];
      setTickets(list);
      const init = {};
      list.forEach(t => { init[t.id] = 0; });
      setQuantities(init);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not load ticket types.');
    }
  };

  const selectDate = (date) => {
    const d = typeof date === 'string' ? date : toYMD(date);
    setAttendanceDate(d);
    setShowDatePicker(false);
    loadTickets(d);
  };

  const changeQty = (ticketId, delta) => {
    setQuantities(prev => ({ ...prev, [ticketId]: Math.max(0, (prev[ticketId] || 0) + delta) }));
  };

  const handleBuy = async () => {
    if (!attendanceDate) { Alert.alert('Date required', 'Please select your attendance date.'); return; }
    if (!hasSelection)   { Alert.alert('No tickets', 'Please select at least one ticket.'); return; }
    if (pin.length !== 4){ Alert.alert('PIN required', 'Enter your 4-digit transaction PIN.'); return; }
    if (bal < totalAmount){ Alert.alert('Insufficient balance', 'Please fund your wallet.'); return; }

    setBuying(true);
    try {
      const lineItems = tickets
        .filter(t => (quantities[t.id] || 0) > 0)
        .map(t => ({ ticket_id: t.id, quantity: quantities[t.id] }));

      const res = await merpiBuyCinemaTickets(pin, {
        cinema_id:       movieId,
        attendance_date: attendanceDate,
        tickets:         lineItems,
        amount:          totalAmount,
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
        <Text style={[ss.headerTitle, { color: tc.heading }]} numberOfLines={1}>{movie?.title || movie?.name || 'Movie'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={ss.sc} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Poster */}
        {(movie?.poster || movie?.image) ? (
          <Image source={{ uri: movie.poster || movie.image }} style={ss.poster} resizeMode="cover" />
        ) : (
          <View style={[ss.posterPlaceholder, { backgroundColor: `${tc.primary}15` }]}>
            <Ionicons name="film-outline" size={48} color={tc.primary} />
          </View>
        )}

        {/* Movie info */}
        <View style={[ss.infoCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <Text style={[ss.movieTitle, { color: tc.heading }]}>{movie?.title || movie?.name}</Text>
          <View style={ss.badgeRow}>
            {movie?.genre && <View style={[ss.badge, { backgroundColor: `${tc.primary}15` }]}><Text style={[ss.badgeText, { color: tc.primary }]}>{movie.genre}</Text></View>}
            {movie?.rating && (
              <View style={[ss.badge, { backgroundColor: '#FFF8E1', flexDirection: 'row', gap: 3 }]}>
                <Ionicons name="star" size={11} color="#F59E0B" />
                <Text style={[ss.badgeText, { color: '#92400E' }]}>{movie.rating}</Text>
              </View>
            )}
            {movie?.duration && <View style={[ss.badge, { backgroundColor: '#F3F4F6' }]}><Text style={[ss.badgeText, { color: '#374151' }]}>{movie.duration}</Text></View>}
          </View>
          {movie?.synopsis && <Text style={[ss.synopsis, { color: tc.subheading }]}>{movie.synopsis}</Text>}
        </View>

        {/* Date selection */}
        <Text style={[ss.sectionLabel, { color: tc.subheading }]}>SELECT ATTENDANCE DATE</Text>

        {/* Available dates as chips */}
        {availDates.length > 0 ? (
          <FlatList
            data={availDates}
            horizontal showsHorizontalScrollIndicator={false}
            keyExtractor={(item, i) => String(item?.date || item || i)}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 12 }}
            renderItem={({ item }) => {
              const dateStr = item?.date || item;
              const active  = attendanceDate === dateStr;
              return (
                <TouchableOpacity
                  style={[ss.dateChip, { backgroundColor: active ? tc.primary : tc.card, borderColor: active ? tc.primary : tc.border || '#E5E5EA' }]}
                  onPress={() => selectDate(dateStr)} activeOpacity={0.8}
                >
                  <Text style={[ss.dateChipText, { color: active ? '#FFF' : tc.heading }]}>{fmtDate(dateStr)}</Text>
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          <TouchableOpacity
            style={[ss.datePickerBtn, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', marginHorizontal: 16, marginBottom: 12 }]}
            onPress={() => setShowDatePicker(true)} activeOpacity={0.8}
          >
            <Text style={[{ flex: 1, fontSize: 15 }, { color: attendanceDate ? tc.heading : tc.subtext }]}>
              {attendanceDate ? fmtDate(attendanceDate) : 'Select attendance date'}
            </Text>
            <Ionicons name="calendar-outline" size={18} color={tc.subtext} />
          </TouchableOpacity>
        )}

        {showDatePicker && (
          <DateTimePicker
            value={attendanceDate ? new Date(attendanceDate) : new Date()}
            mode="date" display="default" minimumDate={new Date()}
            onChange={(_, dt) => { if (dt) selectDate(dt); else setShowDatePicker(false); }}
          />
        )}

        {/* Validation warning */}
        {hasSelection && !attendanceDate && (
          <View style={[ss.warnBox, { backgroundColor: '#FEF3C7', marginHorizontal: 16 }]}>
            <Ionicons name="alert-circle-outline" size={16} color="#F59E0B" />
            <Text style={{ fontSize: 13, color: '#92400E', flex: 1 }}>Please select your attendance date before purchasing.</Text>
          </View>
        )}

        {/* Ticket types */}
        {tickets.length > 0 && (
          <>
            <Text style={[ss.sectionLabel, { color: tc.subheading }]}>SELECT TICKETS</Text>
            {tickets.map((ticket) => (
              <View key={ticket.id} style={[ss.ticketRow, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 14, fontWeight: '700', color: tc.heading }]}>{ticket.name || ticket.type}</Text>
                  {ticket.description && <Text style={[{ fontSize: 12, color: tc.subheading, marginTop: 2 }]} numberOfLines={2}>{ticket.description}</Text>}
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

        {/* Payment + PIN */}
        {hasSelection && (
          <>
            <View style={ss.payCard}>
              <Text style={ss.payTitle}>Order Summary</Text>
              {attendanceDate && (
                <View style={ss.payRow}>
                  <Text style={ss.payLabel}>Date</Text>
                  <Text style={ss.payVal}>{fmtDate(attendanceDate)}</Text>
                </View>
              )}
              {tickets.filter(t => (quantities[t.id] || 0) > 0).map(t => (
                <View key={t.id} style={ss.payRow}>
                  <Text style={ss.payLabel}>{t.name} × {quantities[t.id]}</Text>
                  <Text style={ss.payVal}>{formatCurrency((t.price || 0) * quantities[t.id], 'NGN')}</Text>
                </View>
              ))}
              <View style={[ss.payRow, ss.payTotal]}>
                <Text style={ss.payTotalLabel}>Total</Text>
                <Text style={ss.payTotalAmt}>{formatCurrency(totalAmount, 'NGN')}</Text>
              </View>
              <View style={ss.walletRow}>
                <Ionicons name="wallet-outline" size={15} color="#FFF" />
                <Text style={ss.walletLabel}>Wallet Balance</Text>
                <Text style={[ss.walletBal, { color: bal < totalAmount ? '#FFB3B3' : '#7FFFB3' }]}>{formatCurrency(bal, 'NGN')}</Text>
              </View>
            </View>

            {bal >= totalAmount && (
              <View style={[ss.pinCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
                <Text style={[{ fontSize: 13, fontWeight: '600', color: tc.heading, marginBottom: 8 }]}>Transaction PIN</Text>
                <View style={ss.numPad}>
                  {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
                    <TouchableOpacity key={i}
                      style={[ss.numKey, { backgroundColor: k ? tc.background : 'transparent', borderColor: tc.border || '#E5E5EA' }]}
                      onPress={() => {
                        if (!k) return;
                        if (k === '⌫') setPin(p => p.slice(0, -1));
                        else if (pin.length < 4) setPin(p => p + k);
                      }}
                      disabled={!k}
                    >
                      <Text style={[ss.numKeyText, { color: tc.heading }]}>{k}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={[ss.pinDots, { borderColor: tc.border || '#E5E5EA' }]}>
                  {[0,1,2,3].map(i => (
                    <View key={i} style={[ss.pinDot, { backgroundColor: i < pin.length ? tc.primary : tc.border || '#E5E5EA' }]} />
                  ))}
                </View>
              </View>
            )}

            {bal < totalAmount && (
              <View style={[ss.warnBox, { backgroundColor: '#FEE2E2', marginHorizontal: 16 }]}>
                <Ionicons name="warning-outline" size={16} color="#EF4444" />
                <Text style={{ fontSize: 13, color: '#EF4444', flex: 1 }}>Insufficient balance. Please fund your wallet.</Text>
              </View>
            )}

            <TouchableOpacity
              style={[ss.primaryBtn, { backgroundColor: tc.primary,
                opacity: (buying || bal < totalAmount || pin.length !== 4 || !attendanceDate) ? 0.5 : 1 }]}
              onPress={handleBuy}
              disabled={buying || bal < totalAmount || pin.length !== 4 || !attendanceDate}
              activeOpacity={0.85}
            >
              {buying ? <ActivityIndicator color="#FFF" /> : (
                <><Text style={ss.primaryBtnText}>Buy Tickets — {formatCurrency(totalAmount, 'NGN')}</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" /></>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
  dateChip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  dateChipText:     { fontSize: 13, fontWeight: '600' },
  datePickerBtn:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13 },
  ticketRow:        { marginHorizontal: 16, marginBottom: 10, borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center' },
  qtyRow:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn:           { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyText:          { fontSize: 16, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  payCard:          { marginHorizontal: 16, borderRadius: 14, backgroundColor: '#3B0CB0', padding: 20, marginBottom: 12, marginTop: 8 },
  payTitle:         { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 10 },
  payRow:           { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  payLabel:         { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  payVal:           { fontSize: 13, fontWeight: '600', color: '#FFF' },
  payTotal:         { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 8, marginTop: 4 },
  payTotalLabel:    { fontSize: 15, fontWeight: '700', color: '#FFF' },
  payTotalAmt:      { fontSize: 20, fontWeight: '900', color: '#FFF' },
  walletRow:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  walletLabel:      { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  walletBal:        { fontSize: 14, fontWeight: '700' },
  pinCard:          { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  numPad:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  numKey:           { width: '30%', paddingVertical: 14, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  numKeyText:       { fontSize: 18, fontWeight: '600' },
  pinDots:          { flexDirection: 'row', justifyContent: 'center', gap: 12, borderTopWidth: 1, paddingTop: 12 },
  pinDot:           { width: 14, height: 14, borderRadius: 7 },
  warnBox:          { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 10, marginBottom: 12 },
  primaryBtn:       { marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12, marginTop: 4 },
  primaryBtnText:   { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
