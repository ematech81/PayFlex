import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { merpiGetHotels } from 'AuthFunction/paymentService';

// ─── Hotel card ───────────────────────────────────────────────────────────────
function HotelCard({ item, tc, onPress }) {
  const location = [item.city, item.state].filter(Boolean).join(', ') || item.location;
  const amenities = (item.amenities || []).slice(0, 2);

  return (
    <TouchableOpacity
      style={[ss.hotelCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {item.images?.[0]?.image_url ? (
        <Image source={{ uri: item.images[0].image_url }} style={ss.photo} resizeMode="cover" />
      ) : (
        <View style={[ss.photoPlaceholder, { backgroundColor: `${tc.primary}18` }]}>
          <Ionicons name="bed-outline" size={36} color={tc.primary} />
        </View>
      )}

      {item.property_type && (
        <View style={[ss.typeBadge, { backgroundColor: tc.primary }]}>
          <Text style={ss.typeBadgeText}>{item.property_type}</Text>
        </View>
      )}

      <View style={ss.hotelInfo}>
        <Text style={[ss.hotelName, { color: tc.heading }]} numberOfLines={2}>
          {item.name}
        </Text>

        {!!location && (
          <View style={ss.locationRow}>
            <Ionicons name="location-outline" size={12} color={tc.subheading} />
            <Text style={[ss.locationText, { color: tc.subheading }]} numberOfLines={1}>
              {location}
            </Text>
          </View>
        )}

        {amenities.length > 0 && (
          <View style={ss.amenityRow}>
            {amenities.map((a, i) => (
              <View key={i} style={[ss.amenityChip, { backgroundColor: `${tc.primary}15` }]}>
                <Text style={[ss.amenityText, { color: tc.primary }]} numberOfLines={1}>{a}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HotelsScreen({ navigation }) {
  const dark   = useThem();
  const tc     = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [hotels,     setHotels]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError('');
    try {
      const res = await merpiGetHotels({ search: search || undefined });
      setHotels(res?.data?.hotels || []);
    } catch (e) {
      setError(e.message || 'Could not load hotels.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(true); };

  return (
    <SafeAreaView style={[ss.root, { backgroundColor: tc.background }]}>
      <StatusBarComponent />

      {/* ── HEADER ── */}
      <View
        style={[
          ss.header,
          {
            paddingTop:        insets.top + (Platform.OS === 'android' ? 10 : 4),
            backgroundColor:   tc.background,
            borderBottomColor: tc.border || '#E5E5EA',
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[ss.iconBtn, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
        >
          <Ionicons name="arrow-back" size={20} color={tc.heading} />
        </TouchableOpacity>

        <Text style={[ss.headerTitle, { color: tc.heading }]}>Hotels & Stays</Text>

        <View style={ss.iconBtn} />
      </View>

      {/* ── SEARCH ── */}
      <View style={[ss.searchRow, { backgroundColor: tc.background }]}>
        <View style={[ss.searchBox, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <Ionicons name="search-outline" size={17} color={tc.subtext} />
          <TextInput
            style={[ss.searchInput, { color: tc.heading }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search hotels, apartments, resorts…"
            placeholderTextColor={tc.subtext}
            returnKeyType="search"
            onSubmitEditing={() => load()}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={17} color={tc.subtext} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── BODY ── */}
      {loading ? (
        <View style={ss.centered}>
          <ActivityIndicator size="large" color={tc.primary} />
          <Text style={[ss.centeredText, { color: tc.subheading }]}>Loading stays…</Text>
        </View>

      ) : error ? (
        <View style={ss.centered}>
          <Ionicons name="alert-circle-outline" size={44} color="#EF4444" />
          <Text style={[ss.centeredText, { color: '#EF4444', textAlign: 'center' }]}>{error}</Text>
          <TouchableOpacity
            style={[ss.retryBtn, { backgroundColor: tc.primary }]}
            onPress={() => load()}
          >
            <Text style={ss.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>

      ) : (
        <FlatList
          data={hotels}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={ss.listContent}
          columnWrapperStyle={ss.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tc.primary} />
          }
          renderItem={({ item }) => (
            <HotelCard
              item={item}
              tc={tc}
              onPress={() => navigation.navigate('HotelDetail', { hotelId: item.id, hotel: item })}
            />
          )}
          ListEmptyComponent={
            <View style={ss.emptyWrap}>
              <Ionicons name="bed-outline" size={52} color={tc.subtext} />
              <Text style={[ss.emptyTitle, { color: tc.heading }]}>No Stays Found</Text>
              <Text style={[ss.emptySub, { color: tc.subheading }]}>
                Try a different search or pull down to refresh.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingBottom:     12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  iconBtn: {
    width:        38,
    height:       38,
    borderRadius: 11,
    borderWidth:  1,
    alignItems:   'center',
    justifyContent: 'center',
  },

  searchRow: { paddingHorizontal: 16, paddingVertical: 10 },
  searchBox: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    borderWidth:    1,
    borderRadius:   12,
    paddingHorizontal: 12,
    paddingVertical:   10,
  },
  searchInput: { flex: 1, fontSize: 14 },

  listContent:   { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 32 },
  columnWrapper: { gap: 10, marginBottom: 10 },

  hotelCard: {
    flex:         1,
    borderRadius: 14,
    borderWidth:  1,
    overflow:     'hidden',
    ...Platform.select({
      ios: {
        shadowColor:   '#000',
        shadowOffset:  { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius:  6,
      },
      android: { elevation: 2 },
    }),
  },
  photo: { width: '100%', height: 130 },
  photoPlaceholder: {
    width:          '100%',
    height:         110,
    alignItems:     'center',
    justifyContent: 'center',
  },

  typeBadge: {
    position:         'absolute',
    top:              10,
    right:            10,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:     20,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 0.3, textTransform: 'capitalize' },

  hotelInfo: { padding: 10, gap: 4 },
  hotelName: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 11, fontWeight: '500', flex: 1 },
  amenityRow: { flexDirection: 'row', gap: 6, marginTop: 2, flexWrap: 'wrap' },
  amenityChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  amenityText: { fontSize: 10, fontWeight: '700' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  centeredText: { fontSize: 14, marginTop: 12 },
  retryBtn:  { marginTop: 18, paddingHorizontal: 28, paddingVertical: 11, borderRadius: 12 },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '800', marginTop: 16, marginBottom: 6 },
  emptySub:   { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
