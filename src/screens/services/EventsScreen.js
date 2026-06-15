import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView,
  TouchableOpacity, ActivityIndicator, TextInput, Image, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { merpiGetEvents, merpiGetCategories } from 'AuthFunction/paymentService';
import { formatCurrency } from 'CONSTANT/formatCurrency';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export default function EventsScreen({ navigation }) {
  const dark = useThem(), tc = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [events,     setEvents]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError('');
    try {
      const evRes = await merpiGetEvents({
        category_id: activeCategory || undefined,
        search:      search || undefined,
      });
      // Backend strips the MERPI envelope and sends data.data.
      // MERPI may return a flat array OR a paginated {data:[...], next_page, count}.
      // Also handles camelCase (endDate) vs snake_case (end_date) variants.
      const d = evRes?.data?.data;
      const eventList = Array.isArray(d)
        ? d
        : Array.isArray(d?.experiences)
          ? d.experiences
          : Array.isArray(d?.data)
            ? d.data
            : [];
      console.log('[EventsScreen] eventList length:', eventList.length, 'sample:', JSON.stringify(eventList[0])?.slice(0, 150));
      const now = new Date();
      setEvents(eventList.filter((e) => {
        const endStr = e.end_date || e.endDate;
        if (!endStr) return true;
        const d2 = new Date(endStr);
        return isNaN(d2.getTime()) || d2 >= now;
      }));
    } catch (e) {
      setError(e.message || 'Could not load events.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }

    // Categories are non-critical — load separately so a 404 never blocks events
    merpiGetCategories()
      .then((catRes) => {
        const catRaw = catRes?.data?.data;
        setCategories(Array.isArray(catRaw) ? catRaw : (catRaw?.data || []));
      })
      .catch(() => {});
  }, [activeCategory, search]);

  useEffect(() => { load(); }, [activeCategory]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const renderEvent = ({ item }) => (
    <TouchableOpacity
      style={[ss.eventCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
      onPress={() => navigation.navigate('EventDetail', { eventId: item.id, event: item })}
      activeOpacity={0.8}
    >
      {item.images?.[0] || item.image || item.banner ? (
        <Image
          source={{ uri: item.images?.[0] || item.image || item.banner }}
          style={ss.eventImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[ss.eventImagePlaceholder, { backgroundColor: `${tc.primary}20` }]}>
          <Ionicons name="ticket-outline" size={32} color={tc.primary} />
        </View>
      )}
      <View style={ss.eventBody}>
        <Text style={[ss.eventTitle, { color: tc.heading }]} numberOfLines={2}>{item.title || item.name}</Text>
        <View style={ss.eventMeta}>
          <Ionicons name="calendar-outline" size={13} color={tc.subheading} />
          <Text style={[ss.eventMetaText, { color: tc.subheading }]}>{fmtDate(item.start_date || item.date)}</Text>
        </View>
        {(() => {
          const loc = item.location;
          const venue = typeof loc === 'object'
            ? [loc.town, loc.city].filter(Boolean).join(', ')
            : loc || item.address || item.venue;
          return venue ? (
            <View style={ss.eventMeta}>
              <Ionicons name="location-outline" size={13} color={tc.subheading} />
              <Text style={[ss.eventMetaText, { color: tc.subheading }]} numberOfLines={1}>{venue}</Text>
            </View>
          ) : null;
        })()}
        <View style={ss.eventFooter}>
          {(item.category?.name || item.category) && (
            <View style={[ss.catChip, { backgroundColor: `${tc.primary}15` }]}>
              <Text style={[ss.catChipText, { color: tc.primary }]}>
                {item.category?.name || item.category}
              </Text>
            </View>
          )}
          <Text style={[ss.eventPrice, { color: tc.primary }]}>
            {item.min_price ? `From ${formatCurrency(item.min_price, 'NGN')}` : 'Free'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[ss.container, { backgroundColor: tc.background }]}>
      <StatusBarComponent />

      <View style={[ss.header, { backgroundColor: tc.background, borderBottomColor: tc.border || '#E5E5EA', paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={tc.heading} />
        </TouchableOpacity>
        <Text style={[ss.headerTitle, { color: tc.heading }]}>Events</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search bar */}
      <View style={[ss.searchRow, { backgroundColor: tc.background, borderBottomColor: tc.border || '#E5E5EA' }]}>
        <View style={[ss.searchBox, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <Ionicons name="search-outline" size={18} color={tc.subtext} />
          <TextInput
            style={[ss.searchInput, { color: tc.heading }]}
            value={search} onChangeText={setSearch}
            placeholder="Search events..." placeholderTextColor={tc.subtext}
            returnKeyType="search" onSubmitEditing={() => load()}
          />
          {search ? (
            <TouchableOpacity onPress={() => { setSearch(''); }}>
              <Ionicons name="close-circle" size={18} color={tc.subtext} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category filter */}
      {categories.length > 0 && (
        <View style={[ss.catRow, { borderBottomColor: tc.border || '#E5E5EA' }]}>
          <FlatList
            data={[{ id: null, name: 'All' }, ...categories]}
            horizontal showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item.id ?? 'all')}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            renderItem={({ item }) => {
              const active = activeCategory === item.id;
              return (
                <TouchableOpacity
                  style={[ss.catBtn, { backgroundColor: active ? tc.primary : tc.card, borderColor: active ? tc.primary : tc.border || '#E5E5EA' }]}
                  onPress={() => setActiveCategory(item.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[ss.catBtnText, { color: active ? '#FFF' : tc.heading }]}>{item.name}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {loading ? (
        <View style={ss.centered}>
          <ActivityIndicator size="large" color={tc.primary} />
          <Text style={[{ fontSize: 14, marginTop: 12, color: tc.subheading }]}>Loading events…</Text>
        </View>
      ) : error ? (
        <View style={ss.centered}>
          <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
          <Text style={[{ fontSize: 14, color: '#EF4444', marginTop: 8, textAlign: 'center' }]}>{error}</Text>
          <TouchableOpacity style={[ss.retryBtn, { backgroundColor: tc.primary }]} onPress={() => load()}>
            <Text style={{ color: '#FFF', fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderEvent}
          contentContainerStyle={ss.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tc.primary} />}
          ListEmptyComponent={
            <View style={ss.centered}>
              <Ionicons name="ticket-outline" size={48} color={tc.subtext} />
              <Text style={[{ fontSize: 14, color: tc.subheading, marginTop: 12 }]}>No events found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  container:            { flex: 1 },
  header:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle:          { fontSize: 16, fontWeight: '700' },
  searchRow:            { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  searchBox:            { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput:          { flex: 1, fontSize: 14 },
  catRow:               { paddingVertical: 10, borderBottomWidth: 1 },
  catBtn:               { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  catBtnText:           { fontSize: 13, fontWeight: '600' },
  listContent:          { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  eventCard:            { borderRadius: 14, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  eventImage:           { width: '100%', height: 160 },
  eventImagePlaceholder:{ width: '100%', height: 140, alignItems: 'center', justifyContent: 'center' },
  eventBody:            { padding: 14 },
  eventTitle:           { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  eventMeta:            { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  eventMetaText:        { fontSize: 12 },
  eventFooter:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  catChip:              { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  catChipText:          { fontSize: 11, fontWeight: '700' },
  eventPrice:           { fontSize: 14, fontWeight: '800' },
  centered:             { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  retryBtn:             { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
});
