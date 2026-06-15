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
import PaymentSummaryModal from 'component/PaymentSummaryModal';

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
  const [quantities, setQuantities] = useState({});
  const [showPayModal, setShowPayModal] = useState(false);

  const bal = wallet?.user?.walletBalance || 0;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [evRes, tkRes] = await Promise.all([
          merpiGetEventDetails(eventId),
          merpiGetEventTickets(eventId),
        ]);
        // Backend returns { success, data: <event object> } for detail
        setEvent(evRes?.data?.data || evRes?.data || initialEvent);
        // Tickets: may be a paginated wrapper or direct array
        const tkRaw = tkRes?.data?.data;
        const tList = Array.isArray(tkRaw) ? tkRaw : (tkRaw?.data || []);
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
        .map(t => ({ id: t.id, count: quantities[t.id] }));

      const res = await merpiBuyEventTickets(pin, {
        experience_id: eventId,
        tickets: lineItems,
        amount: totalAmount,
      });

      const loc = event?.location;
      const venueStr = typeof loc === 'object'
        ? [loc.street, loc.town, loc.city].filter(Boolean).join(', ')
        : loc || event?.address || event?.venue;

      navigation.replace('EventTicketConfirmation', {
        reference:  res.reference,
        booking:    res.booking,
        eventName:  event?.title || event?.name,
        eventDate:  event?.start_date || event?.date,
        eventVenue: venueStr,
        amount:     totalAmount,
      });
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
        <Text style={[ss.headerTitle, { color: tc.heading }]} numberOfLines={1}>{event?.title || event?.name || 'Event'}</Text>
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
          <Text style={[ss.eventTitle, { color: tc.heading }]}>{event?.title || event?.name}</Text>
          {(event?.start_date || event?.date) && (
            <View style={ss.metaRow}>
              <Ionicons name="calendar-outline" size={15} color={tc.primary} />
              <Text style={[ss.metaText, { color: tc.subheading }]}>{fmtDate(event.start_date || event.date)}</Text>
            </View>
          )}
          {(() => {
            const loc = event?.location;
            const venue = typeof loc === 'object'
              ? [loc.street, loc.town, loc.city].filter(Boolean).join(', ')
              : loc || event?.address || event?.venue;
            return venue ? (
              <View style={ss.metaRow}>
                <Ionicons name="location-outline" size={15} color={tc.primary} />
                <Text style={[ss.metaText, { color: tc.subheading }]}>{venue}</Text>
              </View>
            ) : null;
          })()}
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

        {/* Review & pay */}
        {hasSelection && (
          <TouchableOpacity
            style={[ss.primaryBtn, { backgroundColor: tc.primary }]}
            onPress={() => setShowPayModal(true)}
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
        rows={tickets.filter(t => (quantities[t.id] || 0) > 0).map(t => ({
          label: `${t.name} × ${quantities[t.id]}`,
          value: formatCurrency((t.price || 0) * quantities[t.id], 'NGN'),
        }))}
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
  primaryBtn:      { marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12, marginTop: 4 },
  primaryBtnText:  { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
