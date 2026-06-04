import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { useWallet } from 'context/WalletContext';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { merpiGetEventDetails, merpiGetEventTickets, merpiBuyEventTickets } from 'AuthFunction/paymentService';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

export default function EventDetailScreen({ navigation, route }) {
  const { eventId, event: initialEvent } = route.params || {};
  const dark = useThem(), tc = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { wallet } = useWallet();

  const [event,   setEvent]   = useState(initialEvent || null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying,  setBuying]  = useState(false);
  const [pin,     setPin]     = useState('');
  const [showPin, setShowPin] = useState(false);
  const [quantities, setQuantities] = useState({});

  const bal = wallet?.user?.walletBalance || 0;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [evRes, tkRes] = await Promise.all([
          merpiGetEventDetails(eventId),
          merpiGetEventTickets(eventId),
        ]);
        setEvent(evRes?.data?.data || evRes?.data || initialEvent);
        const tList = tkRes?.data?.data || tkRes?.data || [];
        setTickets(tList);
        const init = {};
        tList.forEach(t => { init[t.id] = 0; });
        setQuantities(init);
      } catch (e) {
        Alert.alert('Error', e.message || 'Could not load event details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  const changeQty = (ticketId, delta) => {
    setQuantities(prev => {
      const next = (prev[ticketId] || 0) + delta;
      return { ...prev, [ticketId]: Math.max(0, next) };
    });
  };

  const totalAmount = tickets.reduce((sum, t) => sum + (t.price || 0) * (quantities[t.id] || 0), 0);
  const hasSelection = Object.values(quantities).some(q => q > 0);

  const handleBuy = async () => {
    if (!pin || pin.length !== 4) { Alert.alert('PIN required', 'Enter your 4-digit transaction PIN.'); return; }
    if (bal < totalAmount) { Alert.alert('Insufficient balance', 'Please fund your wallet.'); return; }
    setBuying(true);
    try {
      const lineItems = tickets
        .filter(t => (quantities[t.id] || 0) > 0)
        .map(t => ({ ticket_id: t.id, quantity: quantities[t.id] }));

      const res = await merpiBuyEventTickets(pin, {
        experience_id: eventId,
        tickets: lineItems,
        amount: totalAmount,
      });

      Alert.alert('Booking Confirmed!', `Reference: ${res.reference}`, [
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
        <Text style={[ss.headerTitle, { color: tc.heading }]} numberOfLines={1}>{event?.name || event?.title || 'Event'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={ss.sc} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Banner */}
        {(event?.image || event?.banner) ? (
          <Image source={{ uri: event.image || event.banner }} style={ss.banner} resizeMode="cover" />
        ) : (
          <View style={[ss.bannerPlaceholder, { backgroundColor: `${tc.primary}15` }]}>
            <Ionicons name="ticket-outline" size={48} color={tc.primary} />
          </View>
        )}

        {/* Event info */}
        <View style={[ss.infoCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <Text style={[ss.eventTitle, { color: tc.heading }]}>{event?.name || event?.title}</Text>
          {event?.date && (
            <View style={ss.metaRow}>
              <Ionicons name="calendar-outline" size={15} color={tc.primary} />
              <Text style={[ss.metaText, { color: tc.subheading }]}>{fmtDate(event.date || event.start_date)}</Text>
            </View>
          )}
          {(event?.venue || event?.location) && (
            <View style={ss.metaRow}>
              <Ionicons name="location-outline" size={15} color={tc.primary} />
              <Text style={[ss.metaText, { color: tc.subheading }]}>{event.venue || event.location}</Text>
            </View>
          )}
          {event?.description && (
            <Text style={[ss.description, { color: tc.subheading }]}>{event.description}</Text>
          )}
        </View>

        {/* Ticket types */}
        {tickets.length > 0 && (
          <>
            <Text style={[ss.sectionLabel, { color: tc.subheading }]}>SELECT TICKETS</Text>
            {tickets.map((ticket) => (
              <View key={ticket.id} style={[ss.ticketRow, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 14, fontWeight: '700', color: tc.heading }]}>{ticket.name || ticket.type}</Text>
                  {ticket.description && (
                    <Text style={[{ fontSize: 12, color: tc.subheading, marginTop: 2 }]} numberOfLines={2}>{ticket.description}</Text>
                  )}
                  <Text style={[{ fontSize: 15, fontWeight: '800', color: tc.primary, marginTop: 4 }]}>
                    {formatCurrency(ticket.price || 0, 'NGN')}
                  </Text>
                </View>
                <View style={ss.qtyRow}>
                  <TouchableOpacity style={[ss.qtyBtn, { borderColor: tc.border || '#E5E5EA' }]}
                    onPress={() => changeQty(ticket.id, -1)}>
                    <Ionicons name="remove" size={16} color={tc.heading} />
                  </TouchableOpacity>
                  <Text style={[ss.qtyText, { color: tc.heading }]}>{quantities[ticket.id] || 0}</Text>
                  <TouchableOpacity style={[ss.qtyBtn, { borderColor: tc.border || '#E5E5EA', backgroundColor: tc.primary }]}
                    onPress={() => changeQty(ticket.id, 1)}>
                    <Ionicons name="add" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Total + PIN + Buy */}
        {hasSelection && (
          <>
            <View style={ss.payCard}>
              <Text style={ss.payTitle}>Order Summary</Text>
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
                <Text style={[ss.walletBal, { color: bal < totalAmount ? '#FFB3B3' : '#7FFFB3' }]}>
                  {formatCurrency(bal, 'NGN')}
                </Text>
              </View>
            </View>

            {bal >= totalAmount && (
              <View style={[ss.pinCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
                <Text style={[{ fontSize: 13, fontWeight: '600', color: tc.heading, marginBottom: 8 }]}>Transaction PIN</Text>
                <View style={[ss.pinInput, { backgroundColor: tc.background, borderColor: tc.border || '#E5E5EA' }]}>
                  <Text style={[ss.pinDots, { color: tc.heading }]}>{pin ? '•'.repeat(pin.length) : '••••'}</Text>
                  <TouchableOpacity onPress={() => setShowPin(v => !v)}>
                    <Ionicons name={showPin ? 'eye-off-outline' : 'eye-outline'} size={18} color={tc.subtext} />
                  </TouchableOpacity>
                </View>
                <View style={ss.numPad}>
                  {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
                    <TouchableOpacity key={i} style={[ss.numKey, { backgroundColor: k ? tc.card : 'transparent', borderColor: tc.border || '#E5E5EA' }]}
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
              </View>
            )}

            {bal < totalAmount && (
              <View style={[ss.warnBox, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="warning-outline" size={16} color="#EF4444" />
                <Text style={{ fontSize: 13, color: '#EF4444', flex: 1 }}>Insufficient balance. Please fund your wallet.</Text>
              </View>
            )}

            <TouchableOpacity
              style={[ss.primaryBtn, { backgroundColor: tc.primary, opacity: (buying || bal < totalAmount || pin.length !== 4) ? 0.5 : 1 }]}
              onPress={handleBuy}
              disabled={buying || bal < totalAmount || pin.length !== 4}
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
  container:       { flex: 1 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle:     { fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  sc:              { paddingBottom: 40 },
  centered:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  banner:          { width: '100%', height: 200 },
  bannerPlaceholder:{ width: '100%', height: 160, alignItems: 'center', justifyContent: 'center' },
  infoCard:        { margin: 16, borderRadius: 14, borderWidth: 1, padding: 16 },
  eventTitle:      { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  metaRow:         { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  metaText:        { fontSize: 13 },
  description:     { fontSize: 13, lineHeight: 20, marginTop: 12 },
  sectionLabel:    { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, paddingHorizontal: 16, marginBottom: 8 },
  ticketRow:       { marginHorizontal: 16, marginBottom: 10, borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center' },
  qtyRow:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn:          { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyText:         { fontSize: 16, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  payCard:         { marginHorizontal: 16, borderRadius: 14, backgroundColor: '#3B0CB0', padding: 20, marginBottom: 12 },
  payTitle:        { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 10 },
  payRow:          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  payLabel:        { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  payVal:          { fontSize: 13, fontWeight: '600', color: '#FFF' },
  payTotal:        { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 8, marginTop: 4 },
  payTotalLabel:   { fontSize: 15, fontWeight: '700', color: '#FFF' },
  payTotalAmt:     { fontSize: 20, fontWeight: '900', color: '#FFF' },
  walletRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  walletLabel:     { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  walletBal:       { fontSize: 14, fontWeight: '700' },
  pinCard:         { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  pinInput:        { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  pinDots:         { fontSize: 22, letterSpacing: 8 },
  numPad:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  numKey:          { width: '30%', paddingVertical: 14, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  numKeyText:      { fontSize: 18, fontWeight: '600' },
  warnBox:         { marginHorizontal: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 10, marginBottom: 12 },
  primaryBtn:      { marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12, marginTop: 4 },
  primaryBtnText:  { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
