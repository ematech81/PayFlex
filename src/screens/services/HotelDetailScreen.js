import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, Image, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { useWallet } from 'context/WalletContext';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { merpiGetHotelRooms, merpiBookHotelRoom } from 'AuthFunction/paymentService';

const pad   = (n) => String(n).padStart(2, '0');
const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtDate = (ymd) =>
  ymd ? new Date(`${ymd}T00:00:00`).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }) : '';

const DATE_STRIP_DAYS = 60;
const dateStrip = Array.from({ length: DATE_STRIP_DAYS }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d;
});

const addDays = (ymd, n) => {
  const d = new Date(`${ymd}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toYMD(d);
};

export default function HotelDetailScreen({ navigation, route }) {
  const { hotelId, hotel: initialHotel } = route.params || {};
  const dark = useThem(), tc = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { wallet } = useWallet();

  const hotel = initialHotel || {};
  const location = [hotel.city, hotel.state].filter(Boolean).join(', ') || hotel.location;

  const [rooms,        setRooms]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [buying,       setBuying]       = useState(false);
  const [pin,          setPin]          = useState('');

  const [checkinDate,  setCheckinDate]  = useState(() => toYMD(new Date()));
  const [nights,       setNights]       = useState(1);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [numberOfGuests, setNumberOfGuests] = useState(1);

  const bal = wallet?.user?.walletBalance || 0;
  const checkoutDate = addDays(checkinDate, nights);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await merpiGetHotelRooms(hotelId);
        setRooms(res?.data?.rooms || []);
      } catch (e) {
        setError(e.message || 'Could not load rooms.');
      } finally {
        setLoading(false);
      }
    })();
  }, [hotelId]);

  const maxGuests = selectedRoom ? (selectedRoom.max_occupancy || 1) * numberOfRooms : 1;

  useEffect(() => {
    if (numberOfGuests > maxGuests) setNumberOfGuests(maxGuests);
  }, [maxGuests]);

  const selectRoom = (room) => {
    if (room.is_available === false) return;
    setSelectedRoom(room);
    setNumberOfRooms(1);
    setNumberOfGuests(1);
  };

  const totalAmount = useMemo(() => {
    if (!selectedRoom) return 0;
    return (selectedRoom.price || 0) * nights * numberOfRooms;
  }, [selectedRoom, nights, numberOfRooms]);

  const handleBuy = async () => {
    if (!selectedRoom)     { Alert.alert('Room required', 'Please select a room.'); return; }
    if (pin.length !== 4)  { Alert.alert('PIN required', 'Enter your 4-digit transaction PIN.'); return; }
    if (bal < totalAmount) { Alert.alert('Insufficient balance', 'Please fund your wallet.'); return; }

    setBuying(true);
    try {
      const res = await merpiBookHotelRoom(pin, {
        room_id:           selectedRoom.id,
        number_of_guests:  numberOfGuests,
        number_of_rooms:   numberOfRooms,
        checkin_date:      checkinDate,
        checkout_date:     checkoutDate,
        amount:            totalAmount,
      });

      const booking = res?.booking || {};
      Alert.alert(
        'Booking Confirmed!',
        `Reference: ${res.reference || booking.reference || ''}\n${booking.booking_number ? `Booking #: ${booking.booking_number}\n` : ''}Enjoy your stay!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Booking Failed', e.message || 'Could not complete booking.');
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
        <Text style={[ss.headerTitle, { color: tc.heading }]} numberOfLines={1}>{hotel?.name || 'Hotel'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={ss.sc} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Photo */}
        {hotel?.images?.[0]?.image_url ? (
          <Image source={{ uri: hotel.images[0].image_url }} style={ss.photo} resizeMode="cover" />
        ) : (
          <View style={[ss.photoPlaceholder, { backgroundColor: `${tc.primary}15` }]}>
            <Ionicons name="bed-outline" size={48} color={tc.primary} />
          </View>
        )}

        {/* Hotel info */}
        <View style={[ss.infoCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <Text style={[ss.hotelName, { color: tc.heading }]}>{hotel?.name}</Text>
          <View style={ss.badgeRow}>
            {hotel?.property_type && (
              <View style={[ss.badge, { backgroundColor: `${tc.primary}15` }]}>
                <Text style={[ss.badgeText, { color: tc.primary, textTransform: 'capitalize' }]}>{hotel.property_type}</Text>
              </View>
            )}
            {!!location && (
              <View style={[ss.badge, { backgroundColor: '#F3F4F6' }]}>
                <Text style={[ss.badgeText, { color: '#374151' }]}>{location}</Text>
              </View>
            )}
          </View>
          {hotel?.description && <Text style={[ss.synopsis, { color: tc.subheading }]}>{hotel.description}</Text>}

          {(hotel?.check_in_time || hotel?.check_out_time) && (
            <View style={ss.timesRow}>
              {hotel?.check_in_time && (
                <Text style={[ss.timeText, { color: tc.subheading }]}>Check-in: {hotel.check_in_time}</Text>
              )}
              {hotel?.check_out_time && (
                <Text style={[ss.timeText, { color: tc.subheading }]}>Check-out: {hotel.check_out_time}</Text>
              )}
            </View>
          )}

          {(hotel?.amenities || []).length > 0 && (
            <View style={ss.amenityRow}>
              {hotel.amenities.map((a, i) => (
                <View key={i} style={[ss.amenityChip, { backgroundColor: `${tc.primary}15` }]}>
                  <Text style={[ss.amenityText, { color: tc.primary }]}>{a}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Check-in date */}
        <Text style={[ss.sectionLabel, { color: tc.subheading }]}>CHECK-IN DATE</Text>
        <FlatList
          data={dateStrip}
          horizontal showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => toYMD(item)}
          extraData={checkinDate}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 12 }}
          renderItem={({ item }) => {
            const ymd = toYMD(item);
            const active = ymd === checkinDate;
            return (
              <TouchableOpacity
                style={[ss.dateChip, { backgroundColor: active ? tc.primary : tc.card, borderColor: active ? tc.primary : tc.border || '#E5E5EA' }]}
                onPress={() => setCheckinDate(ymd)} activeOpacity={0.8}
              >
                <Text style={[ss.dateChipText, { color: active ? '#FFF' : tc.heading }]}>{fmtDate(ymd)}</Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Nights stepper */}
        <View style={[ss.stepperRow, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <Text style={[ss.stepperLabel, { color: tc.heading }]}>Nights</Text>
          <View style={ss.qtyRow}>
            <TouchableOpacity style={[ss.qtyBtn, { borderColor: tc.border || '#E5E5EA' }]} onPress={() => setNights((n) => Math.max(1, n - 1))}>
              <Ionicons name="remove" size={16} color={tc.heading} />
            </TouchableOpacity>
            <Text style={[ss.qtyText, { color: tc.heading }]}>{nights}</Text>
            <TouchableOpacity style={[ss.qtyBtn, { backgroundColor: tc.primary, borderColor: tc.primary }]} onPress={() => setNights((n) => n + 1)}>
              <Ionicons name="add" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[ss.checkoutHint, { color: tc.subtext }]}>Check-out: {fmtDate(checkoutDate)}</Text>

        {/* Rooms */}
        <Text style={[ss.sectionLabel, { color: tc.subheading, marginTop: 12 }]}>SELECT ROOM</Text>
        {rooms.length === 0 && !error && (
          <Text style={[{ fontSize: 13, color: tc.subtext, paddingHorizontal: 16, marginBottom: 12 }]}>No rooms available.</Text>
        )}
        {!!error && (
          <Text style={[{ fontSize: 13, color: '#EF4444', paddingHorizontal: 16, marginBottom: 12 }]}>{error}</Text>
        )}
        {rooms.map((room) => {
          const active = selectedRoom?.id === room.id;
          const unavailable = room.is_available === false;
          return (
            <TouchableOpacity
              key={room.id}
              style={[
                ss.roomCard,
                { backgroundColor: tc.card, borderColor: active ? tc.primary : tc.border || '#E5E5EA', opacity: unavailable ? 0.5 : 1 },
              ]}
              onPress={() => selectRoom(room)}
              activeOpacity={0.85}
              disabled={unavailable}
            >
              {room.images?.[0]?.image_url ? (
                <Image source={{ uri: room.images[0].image_url }} style={ss.roomImage} resizeMode="cover" />
              ) : (
                <View style={[ss.roomImagePlaceholder, { backgroundColor: `${tc.primary}15` }]}>
                  <Ionicons name="bed-outline" size={28} color={tc.primary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[ss.roomName, { color: tc.heading }]} numberOfLines={1}>{room.room_name}</Text>
                {!!room.description && (
                  <Text style={[ss.roomDesc, { color: tc.subheading }]} numberOfLines={2}>{room.description}</Text>
                )}
                {room.price_breakdown?.convenience_fee > 0 && (
                  <Text style={[ss.roomFee, { color: tc.subheading }]}>
                    Includes {formatCurrency(room.price_breakdown.convenience_fee, 'NGN')} convenience fee
                  </Text>
                )}
                <View style={ss.roomMetaRow}>
                  <Text style={[ss.roomPrice, { color: tc.primary }]}>{formatCurrency(room.price || 0, 'NGN')}/night</Text>
                  {room.max_occupancy && (
                    <Text style={[ss.roomOcc, { color: tc.subtext }]}>· up to {room.max_occupancy} guests</Text>
                  )}
                </View>
                {unavailable && <Text style={ss.unavailableText}>Unavailable</Text>}
              </View>
              {active && <Ionicons name="checkmark-circle" size={22} color={tc.primary} />}
            </TouchableOpacity>
          );
        })}

        {/* Rooms / guests steppers + summary */}
        {selectedRoom && (
          <>
            <View style={[ss.stepperRow, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
              <Text style={[ss.stepperLabel, { color: tc.heading }]}>Number of Rooms</Text>
              <View style={ss.qtyRow}>
                <TouchableOpacity style={[ss.qtyBtn, { borderColor: tc.border || '#E5E5EA' }]} onPress={() => setNumberOfRooms((n) => Math.max(1, n - 1))}>
                  <Ionicons name="remove" size={16} color={tc.heading} />
                </TouchableOpacity>
                <Text style={[ss.qtyText, { color: tc.heading }]}>{numberOfRooms}</Text>
                <TouchableOpacity style={[ss.qtyBtn, { backgroundColor: tc.primary, borderColor: tc.primary }]} onPress={() => setNumberOfRooms((n) => n + 1)}>
                  <Ionicons name="add" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[ss.stepperRow, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
              <Text style={[ss.stepperLabel, { color: tc.heading }]}>Number of Guests</Text>
              <View style={ss.qtyRow}>
                <TouchableOpacity style={[ss.qtyBtn, { borderColor: tc.border || '#E5E5EA' }]} onPress={() => setNumberOfGuests((n) => Math.max(1, n - 1))}>
                  <Ionicons name="remove" size={16} color={tc.heading} />
                </TouchableOpacity>
                <Text style={[ss.qtyText, { color: tc.heading }]}>{numberOfGuests}</Text>
                <TouchableOpacity style={[ss.qtyBtn, { backgroundColor: tc.primary, borderColor: tc.primary }]} onPress={() => setNumberOfGuests((n) => Math.min(maxGuests, n + 1))}>
                  <Ionicons name="add" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Payment + PIN */}
            <View style={ss.payCard}>
              <Text style={ss.payTitle}>Order Summary</Text>
              <View style={ss.payRow}>
                <Text style={ss.payLabel}>Check-in</Text>
                <Text style={ss.payVal}>{fmtDate(checkinDate)}</Text>
              </View>
              <View style={ss.payRow}>
                <Text style={ss.payLabel}>Check-out</Text>
                <Text style={ss.payVal}>{fmtDate(checkoutDate)}</Text>
              </View>
              <View style={ss.payRow}>
                <Text style={ss.payLabel}>{selectedRoom.room_name} × {numberOfRooms} room(s) × {nights} night(s)</Text>
                <Text style={ss.payVal}>{formatCurrency(totalAmount, 'NGN')}</Text>
              </View>
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
                        if (k === '⌫') setPin((p) => p.slice(0, -1));
                        else if (pin.length < 4) setPin((p) => p + k);
                      }}
                      disabled={!k}
                    >
                      <Text style={[ss.numKeyText, { color: tc.heading }]}>{k}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={[ss.pinDots, { borderColor: tc.border || '#E5E5EA' }]}>
                  {[0,1,2,3].map((i) => (
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
                opacity: (buying || bal < totalAmount || pin.length !== 4) ? 0.5 : 1 }]}
              onPress={handleBuy}
              disabled={buying || bal < totalAmount || pin.length !== 4}
              activeOpacity={0.85}
            >
              {buying ? <ActivityIndicator color="#FFF" /> : (
                <><Text style={ss.primaryBtnText}>Book Now — {formatCurrency(totalAmount, 'NGN')}</Text>
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
  photo:            { width: '100%', height: 220 },
  photoPlaceholder: { width: '100%', height: 180, alignItems: 'center', justifyContent: 'center' },
  infoCard:         { margin: 16, borderRadius: 14, borderWidth: 1, padding: 16 },
  hotelName:        { fontSize: 20, fontWeight: '800', marginBottom: 10 },
  badgeRow:         { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
  badge:            { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeText:        { fontSize: 11, fontWeight: '700' },
  synopsis:         { fontSize: 13, lineHeight: 20, marginTop: 8 },
  timesRow:         { flexDirection: 'row', gap: 16, marginTop: 10 },
  timeText:         { fontSize: 12, fontWeight: '600' },
  amenityRow:       { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 10 },
  amenityChip:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  amenityText:      { fontSize: 10, fontWeight: '700' },
  sectionLabel:     { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, paddingHorizontal: 16, marginBottom: 8, marginTop: 4 },
  dateChip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  dateChipText:     { fontSize: 13, fontWeight: '600' },
  checkoutHint:     { fontSize: 12, paddingHorizontal: 16, marginBottom: 8 },
  stepperRow:       { marginHorizontal: 16, marginBottom: 10, borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepperLabel:     { fontSize: 14, fontWeight: '700' },
  qtyRow:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn:           { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyText:          { fontSize: 16, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  roomCard:         { marginHorizontal: 16, marginBottom: 10, borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  roomImage:        { width: 64, height: 64, borderRadius: 10 },
  roomImagePlaceholder: { width: 64, height: 64, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  roomName:         { fontSize: 14, fontWeight: '700' },
  roomDesc:         { fontSize: 12, marginTop: 2 },
  roomFee:          { fontSize: 11, marginTop: 2 },
  roomMetaRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  roomPrice:        { fontSize: 14, fontWeight: '800' },
  roomOcc:          { fontSize: 11 },
  unavailableText:  { fontSize: 11, fontWeight: '700', color: '#EF4444', marginTop: 4 },
  payCard:          { marginHorizontal: 16, borderRadius: 14, backgroundColor: '#3B0CB0', padding: 20, marginBottom: 12, marginTop: 8 },
  payTitle:         { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 10 },
  payRow:           { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  payLabel:         { fontSize: 13, color: 'rgba(255,255,255,0.8)', flexShrink: 1, paddingRight: 8 },
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
