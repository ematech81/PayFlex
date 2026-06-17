

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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { merpiGetEvents, merpiGetCategories } from 'AuthFunction/paymentService';
import { formatCurrency } from 'CONSTANT/formatCurrency';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-NG', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : '';

const fmtDateShort = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return {
    day:   d.toLocaleDateString('en-NG', { day: '2-digit' }),
    month: d.toLocaleDateString('en-NG', { month: 'short' }).toUpperCase(),
    year:  d.getFullYear(),
  };
};

// ─── Category emoji map ───────────────────────────────────────────────────────
const CAT_EMOJI = {
  music: '🎵', concert: '🎤', sports: '⚽', food: '🍔', art: '🎨',
  tech: '💻', comedy: '😂', festival: '🎪', fashion: '👗', business: '💼',
  all: '✨', default: '🎟️',
};
const catEmoji = (name = '') => {
  const key = name.toLowerCase();
  return Object.entries(CAT_EMOJI).find(([k]) => key.includes(k))?.[1] ?? CAT_EMOJI.default;
};

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ item, tc, onPress }) {
  const imageUri = item.image?.[0]?.image || item.images?.[0]?.image_url;
  const addr     = item.address || {};
  const venue    = [addr.town, addr.city].filter(Boolean).join(', ') || addr.street || '';
  const dateParts = fmtDateShort(item.start_date);
  const hasImage  = !!imageUri;

  return (
    <TouchableOpacity
      style={[ec.card, { backgroundColor: tc.card }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* ── Poster ── */}
      <View style={ec.posterWrap}>
        {hasImage ? (
          <Image source={{ uri: imageUri }} style={ec.poster} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[`${tc.primary}40`, `${tc.primary}10`]}
            style={ec.posterPlaceholder}
          >
            <Ionicons name="ticket-outline" size={44} color={tc.primary} />
          </LinearGradient>
        )}

        {/* Gradient fade over image bottom */}
        {hasImage && (
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.72)']}
            style={ec.posterGradient}
          />
        )}

        {/* Date badge — top left */}
        {dateParts && (
          <View style={ec.dateBadge}>
            <Text style={ec.dateBadgeDay}>{dateParts.day}</Text>
            <Text style={ec.dateBadgeMon}>{dateParts.month}</Text>
          </View>
        )}

        {/* Category chip — top right */}
        {item.category?.name && (
          <View style={ec.catOverlay}>
            <Text style={ec.catOverlayText}>
              {catEmoji(item.category.name)} {item.category.name}
            </Text>
          </View>
        )}

        {/* Price tag — bottom right over gradient */}
        {item.min_price ? (
          <View style={ec.priceTag}>
            <Text style={ec.priceTagText}>
              From {formatCurrency(item.min_price, 'NGN')}
            </Text>
          </View>
        ) : (
          <View style={[ec.priceTag, ec.priceTagFree]}>
            <Text style={ec.priceTagTextFree}>Free Entry</Text>
          </View>
        )}
      </View>

      {/* ── Body ── */}
      <View style={ec.body}>
        <Text style={[ec.title, { color: tc.heading }]} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={ec.metaCol}>
          {item.start_date && (
            <View style={ec.metaRow}>
              <View style={[ec.metaIconWrap, { backgroundColor: `${tc.primary}15` }]}>
                <Ionicons name="calendar-outline" size={13} color={tc.primary} />
              </View>
              <Text style={[ec.metaText, { color: tc.subheading }]}>
                {fmtDate(item.start_date)}
                {item.end_date && item.end_date !== item.start_date
                  ? ` – ${fmtDate(item.end_date)}`
                  : ''}
              </Text>
            </View>
          )}

          {venue ? (
            <View style={ec.metaRow}>
              <View style={[ec.metaIconWrap, { backgroundColor: '#FEE2E220' }]}>
                <Ionicons name="location-outline" size={13} color="#EF4444" />
              </View>
              <Text style={[ec.metaText, { color: tc.subheading }]} numberOfLines={1}>
                {venue}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Footer: See tickets CTA */}
        <View style={[ec.footer, { borderTopColor: tc.border || '#F0F0F0' }]}>
          <Text style={[ec.footerSub, { color: tc.subtext }]}>
            {item.business?.name || 'Event Organiser'}
          </Text>
          <View style={[ec.ticketBtn, { backgroundColor: `${tc.primary}15` }]}>
            <Ionicons name="ticket-outline" size={13} color={tc.primary} />
            <Text style={[ec.ticketBtnText, { color: tc.primary }]}>Get Tickets</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const ec = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.09, shadowRadius: 14 },
      android: { elevation: 5 },
    }),
  },

  // Poster
  posterWrap:        { position: 'relative' },
  poster:            { width: '100%', height: 200 },
  posterPlaceholder: { width: '100%', height: 160, alignItems: 'center', justifyContent: 'center' },
  posterGradient:    { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },

  // Date badge
  dateBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: '#FFF',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
    alignItems: 'center', minWidth: 44,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  dateBadgeDay: { fontSize: 17, fontWeight: '900', color: '#0F172A', lineHeight: 20 },
  dateBadgeMon: { fontSize: 9,  fontWeight: '800', color: '#64748B', letterSpacing: 0.5 },

  // Category overlay
  catOverlay: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  catOverlayText: { fontSize: 11, fontWeight: '700', color: '#FFF' },

  // Price tag
  priceTag: {
    position: 'absolute', bottom: 10, right: 12,
    backgroundColor: '#2563EB',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  priceTagFree:     { backgroundColor: '#10B981' },
  priceTagText:     { fontSize: 11, fontWeight: '800', color: '#FFF' },
  priceTagTextFree: { fontSize: 11, fontWeight: '800', color: '#FFF' },

  // Body
  body:    { padding: 16 },
  title:   { fontSize: 16, fontWeight: '800', letterSpacing: -0.3, lineHeight: 22, marginBottom: 12 },
  metaCol: { gap: 7, marginBottom: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaIconWrap: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  metaText: { fontSize: 12, fontWeight: '500', flex: 1 },

  // Footer
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  footerSub:   { fontSize: 11, fontWeight: '500', flex: 1 },
  ticketBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  ticketBtnText:{ fontSize: 12, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EventsScreen({ navigation }) {
  const dark   = useThem();
  const tc     = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [events,         setEvents]         = useState([]);
  const [categories,     setCategories]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [error,          setError]          = useState('');
  const [search,         setSearch]         = useState('');
  const [searchFocused,  setSearchFocused]  = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  // ── Data loading ────────────────────────────────────────────────────────────
  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError('');
    try {
      const evRes    = await merpiGetEvents({ category_id: activeCategory || undefined, search: search || undefined });
      const merpiData = evRes?.data;
      const eventList = Array.isArray(merpiData?.experiences)
        ? merpiData.experiences
        : Array.isArray(merpiData) ? merpiData : [];

      const now = new Date();
      setEvents(
        eventList.filter((e) => {
          const endStr = e.end_date || e.endDate;
          if (!endStr) return true;
          const d2 = new Date(endStr);
          return isNaN(d2.getTime()) || d2 >= now;
        }),
      );
    } catch (e) {
      setError(e.message || 'Could not load events.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }

    merpiGetCategories()
      .then((catRes) => {
        const catRaw = catRes?.data?.data;
        setCategories(Array.isArray(catRaw) ? catRaw : (catRaw?.data || []));
      })
      .catch(() => {});
  }, [activeCategory, search]);

  useEffect(() => { load(); }, [activeCategory]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  // ── Hero list header ────────────────────────────────────────────────────────
  const ListHeader = () => (
    <View>
      {/* ── Hero gradient ── */}
      <LinearGradient
        colors={['#7C3AED', '#2563EB', '#0EA5E9']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={ss.hero}
      >
        {/* Decorative orbs */}
        <View style={ss.orb1} />
        <View style={ss.orb2} />
        <View style={ss.orb3} />

        <View style={ss.heroTop}>
          <View style={ss.heroBadge}>
            <Ionicons name="sparkles" size={13} color="#FFF" />
            <Text style={ss.heroBadgeText}>Live Events Near You</Text>
          </View>
        </View>

        <Text style={ss.heroTitle}>Discover{'\n'}Amazing Events</Text>
        <Text style={ss.heroSub}>
          {events.length > 0
            ? `${events.length} upcoming ${events.length === 1 ? 'event' : 'events'} available`
            : 'Find concerts, festivals, sports & more'}
        </Text>

        {/* Inline stat row */}
        <View style={ss.heroStats}>
          <View style={ss.heroStat}>
            <Ionicons name="ticket-outline" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={ss.heroStatText}>Buy Tickets</Text>
          </View>
          <View style={ss.heroStatDot} />
          <View style={ss.heroStat}>
            <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={ss.heroStatText}>Across Nigeria</Text>
          </View>
          <View style={ss.heroStatDot} />
          <View style={ss.heroStat}>
            <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={ss.heroStatText}>All Categories</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Search bar ── */}
      <View style={[ss.searchWrap, { backgroundColor: tc.card, borderColor: searchFocused ? tc.primary : tc.border || '#E5E5EA' }]}>
        <Ionicons name="search-outline" size={18} color={searchFocused ? tc.primary : tc.subtext} />
        <TextInput
          style={[ss.searchInput, { color: tc.heading }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search events, artists, venues…"
          placeholderTextColor={tc.subtext}
          returnKeyType="search"
          onSubmitEditing={() => load()}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={tc.subtext} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Category pills ── */}
      {categories.length > 0 && (
        <View style={ss.catSection}>
          <FlatList
            data={[{ id: null, name: 'All' }, ...categories]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item.id ?? 'all')}
            contentContainerStyle={ss.catList}
            renderItem={({ item }) => {
              const active = activeCategory === item.id;
              return (
                <TouchableOpacity
                  style={[
                    ss.catPill,
                    { backgroundColor: active ? tc.primary : tc.card, borderColor: active ? tc.primary : tc.border || '#E5E5EA' },
                  ]}
                  onPress={() => setActiveCategory(item.id)}
                  activeOpacity={0.82}
                >
                  <Text style={ss.catPillEmoji}>{catEmoji(item.name)}</Text>
                  <Text style={[ss.catPillText, { color: active ? '#FFF' : tc.heading }]}>
                    {item.name}
                  </Text>
                  {active && <View style={ss.catActiveDot} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* ── Section label ── */}
      {!loading && events.length > 0 && (
        <View style={ss.sectionRow}>
          <Text style={[ss.sectionTitle, { color: tc.heading }]}>
            {activeCategory
              ? categories.find(c => c.id === activeCategory)?.name ?? 'Events'
              : 'Upcoming Events'}
          </Text>
          <View style={[ss.countPill, { backgroundColor: `${tc.primary}15` }]}>
            <Text style={[ss.countPillText, { color: tc.primary }]}>{events.length}</Text>
          </View>
        </View>
      )}

      {/* ── Error ── */}
      {!!error && (
        <TouchableOpacity style={ss.errorBox} onPress={() => load()}>
          <Ionicons name="warning-outline" size={18} color="#EF4444" />
          <Text style={ss.errorText}>{error}</Text>
          <View style={ss.retryPill}>
            <Text style={ss.retryPillText}>Retry</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[ss.root, { backgroundColor: tc.background }]}>
        <StatusBarComponent />
        <TopBar tc={tc} insets={insets} navigation={navigation} />
        <View style={ss.loadingBox}>
          <LinearGradient
            colors={[`${tc.primary}20`, `${tc.primary}05`]}
            style={ss.loadingIconWrap}
          >
            <ActivityIndicator size="large" color={tc.primary} />
          </LinearGradient>
          <Text style={[ss.loadingTitle, { color: tc.heading }]}>Finding Events</Text>
          <Text style={[ss.loadingText, { color: tc.subheading }]}>
            Discovering events near you…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[ss.root, { backgroundColor: tc.background }]}>
      <StatusBarComponent />
      <TopBar tc={tc} insets={insets} navigation={navigation} />

      <FlatList
        data={events}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={ss.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={<ListHeader />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tc.primary} />
        }
        renderItem={({ item }) => (
          <EventCard
            item={item}
            tc={tc}
            onPress={() => navigation.navigate('EventDetail', { eventId: item.id, event: item })}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={ss.emptyBox}>
              <LinearGradient
                colors={[`${tc.primary}20`, `${tc.primary}05`]}
                style={ss.emptyIconWrap}
              >
                <Ionicons name="ticket-outline" size={44} color={tc.primary} />
              </LinearGradient>
              <Text style={[ss.emptyTitle, { color: tc.heading }]}>No Events Found</Text>
              <Text style={[ss.emptySub, { color: tc.subheading }]}>
                {activeCategory
                  ? 'No events in this category. Try a different one.'
                  : 'No upcoming events. Pull down to refresh.'}
              </Text>
              {activeCategory && (
                <TouchableOpacity
                  style={[ss.emptyAction, { backgroundColor: tc.primary }]}
                  onPress={() => setActiveCategory(null)}
                >
                  <Text style={ss.emptyActionText}>See All Events</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
        ListFooterComponent={
          events.length > 0 ? (
            <View style={ss.footer}>
              <View style={[ss.footerLine, { backgroundColor: tc.border || '#E5E5EA' }]} />
              <Text style={[ss.footerText, { color: tc.subtext }]}>
                All {events.length} events loaded
              </Text>
              <View style={[ss.footerLine, { backgroundColor: tc.border || '#E5E5EA' }]} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
function TopBar({ tc, insets, navigation }) {
  return (
    <View
      style={[
        ss.topBar,
        {
          paddingTop:        insets.top + (Platform.OS === 'android' ? 10 : 4),
          borderBottomColor: tc.border || '#E5E5EA',
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[ss.backBtn, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-back" size={20} color={tc.heading} />
      </TouchableOpacity>
      <Text style={[ss.topBarTitle, { color: tc.heading }]}>Events</Text>
      <View style={ss.backBtn} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  root:        { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  backBtn: {
    width: 38, height: 38, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  // Loading
  loadingBox:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  loadingTitle:    { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  loadingText:     { fontSize: 14, textAlign: 'center' },

  // Hero
  hero: {
    borderRadius: 24, padding: 24, marginTop: 16, marginBottom: 16,
    minHeight: 190, overflow: 'hidden',
  },
  orb1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.08)', top: -50, right: -30 },
  orb2: { position: 'absolute', width: 100, height: 100, borderRadius: 50,  backgroundColor: 'rgba(255,255,255,0.06)', bottom: -20, left: 10 },
  orb3: { position: 'absolute', width: 60,  height: 60,  borderRadius: 30,  backgroundColor: 'rgba(255,255,255,0.07)', top: 20, right: 60 },

  heroTop:       { marginBottom: 12 },
  heroBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.22)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  heroBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  heroTitle:     { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: -0.8, lineHeight: 34, marginBottom: 8 },
  heroSub:       { fontSize: 13, color: 'rgba(255,255,255,0.82)', fontWeight: '500', marginBottom: 16 },

  heroStats:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroStat:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroStatText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.90)' },
  heroStatDot:  { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)' },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 16,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  searchInput: { flex: 1, fontSize: 14 },

  // Categories
  catSection: { marginBottom: 20 },
  catList:    { paddingHorizontal: 0, gap: 8 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 22, borderWidth: 1.5,
  },
  catPillEmoji:  { fontSize: 14 },
  catPillText:   { fontSize: 13, fontWeight: '700' },
  catActiveDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.7)' },

  // Section row
  sectionRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionTitle:  { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, flex: 1 },
  countPill:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  countPillText: { fontSize: 12, fontWeight: '700' },

  // Error
  errorBox:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FEE2E2', borderRadius: 14, padding: 14, marginBottom: 16 },
  errorText:     { flex: 1, fontSize: 13, color: '#EF4444', lineHeight: 18 },
  retryPill:     { backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  retryPillText: { fontSize: 11, fontWeight: '700', color: '#FFF' },

  // Empty state
  emptyBox:      { paddingVertical: 48, alignItems: 'center', paddingHorizontal: 32 },
  emptyIconWrap: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle:    { fontSize: 18, fontWeight: '800', marginBottom: 8, letterSpacing: -0.3 },
  emptySub:      { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emptyAction:   { marginTop: 20, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 },
  emptyActionText:{ fontSize: 14, fontWeight: '800', color: '#FFF' },

  // Footer
  footer:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 24, paddingHorizontal: 16 },
  footerLine: { flex: 1, height: 1 },
  footerText: { fontSize: 12, fontWeight: '500' },
});