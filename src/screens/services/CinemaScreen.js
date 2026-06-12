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
import { merpiGetMovies } from 'AuthFunction/paymentService';

const pad = (n) => String(n).padStart(2, '0');
const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const DATE_STRIP_DAYS = 60;
const dateStrip = Array.from({ length: DATE_STRIP_DAYS }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d;
});

// Gather every date / weekday a cinema experience is known to show on, from
// cinema_info.specific_dates and the days_with_times matrices (shared or per-location).
const collectShowingInfo = (info) => {
  const dates = new Set();
  const days = new Set();

  (info.specific_dates || []).forEach((d) => dates.add(d));

  const collectFromList = (list) => {
    (list || []).forEach((d) => {
      if (d.date) dates.add(d.date);
      if (d.day != null) days.add(d.day);
    });
  };

  collectFromList(info.days_with_times);
  (info.locations || []).forEach((loc) => collectFromList(loc.days_with_times));

  return { dates, days };
};

// Treat a movie as "showing" on a date based on its cinema_info schedule.
// Movies without any schedule info are assumed to be showing every day.
const isShowingOnDate = (item, dateStr) => {
  const info = item.cinema_info;
  if (!info) return true;

  const { dates, days } = collectShowingInfo(info);

  if (dates.size > 0) return dates.has(dateStr);

  if (days.size > 0) {
    const jsDay = new Date(`${dateStr}T00:00:00`).getDay();
    const docDay = jsDay === 0 ? 7 : jsDay;
    return days.has(docDay);
  }

  return true;
};

export default function CinemaScreen({ navigation }) {
  const dark = useThem(), tc = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [movies,    setMovies]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');
  const [selectedDate, setSelectedDate] = useState(() => toYMD(new Date()));

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError('');
    try {
      const res = await merpiGetMovies({ search: search || undefined });
      setMovies(res?.data?.experiences || []);
    } catch (e) {
      setError(e.message || 'Could not load movies.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(true); };

  const filteredMovies = movies.filter((m) => isShowingOnDate(m, selectedDate));

  const renderMovie = ({ item }) => (
    <TouchableOpacity
      style={[ss.movieCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
      onPress={() => navigation.navigate('CinemaDetail', { movieId: item.id, movie: item })}
      activeOpacity={0.8}
    >
      {item.image?.[0]?.image ? (
        <Image source={{ uri: item.image[0].image }} style={ss.poster} resizeMode="cover" />
      ) : (
        <View style={[ss.posterPlaceholder, { backgroundColor: `${tc.primary}15` }]}>
          <Ionicons name="film-outline" size={32} color={tc.primary} />
        </View>
      )}
      <View style={ss.movieInfo}>
        <Text style={[ss.movieTitle, { color: tc.heading }]} numberOfLines={2}>{item.title}</Text>
        <View style={ss.movieMeta}>
          {item.business?.name && (
            <Text style={[{ fontSize: 12, color: tc.subheading }]} numberOfLines={1}>{item.business.name}</Text>
          )}
          {item.category?.name && (
            <View style={[ss.genreChip, { backgroundColor: `${tc.primary}15` }]}>
              <Text style={[ss.genreText, { color: tc.primary }]}>{item.category.name}</Text>
            </View>
          )}
        </View>
        {item.cinema_info?.showing && (
          <View style={[ss.genreChip, { backgroundColor: `${tc.primary}15`, alignSelf: 'flex-start' }]}>
            <Text style={[ss.genreText, { color: tc.primary }]}>
              {item.cinema_info.showing === 'weekly' ? 'Weekly' : 'Daily'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[ss.container, { backgroundColor: tc.background }]}>
      <StatusBarComponent />

      <View style={[ss.header, { backgroundColor: tc.background, borderBottomColor: tc.border || '#E5E5EA', paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={tc.heading} />
        </TouchableOpacity>
        <Text style={[ss.headerTitle, { color: tc.heading }]}>Cinema</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View style={[ss.searchRow, { backgroundColor: tc.background, borderBottomColor: tc.border || '#E5E5EA' }]}>
        <View style={[ss.searchBox, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <Ionicons name="search-outline" size={18} color={tc.subtext} />
          <TextInput
            style={[ss.searchInput, { color: tc.heading }]}
            value={search} onChangeText={setSearch}
            placeholder="Search movies..." placeholderTextColor={tc.subtext}
            returnKeyType="search" onSubmitEditing={() => load()}
          />
          {search ? (
            <TouchableOpacity onPress={() => { setSearch(''); }}>
              <Ionicons name="close-circle" size={18} color={tc.subtext} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Date strip */}
      <FlatList
        data={dateStrip}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => toYMD(item)}
        extraData={selectedDate}
        contentContainerStyle={ss.dateStripContent}
        style={[ss.dateStripRow, { backgroundColor: tc.background, borderBottomColor: tc.border || '#E5E5EA' }]}
        renderItem={({ item }) => {
          const ymd = toYMD(item);
          const active = ymd === selectedDate;
          return (
            <TouchableOpacity
              style={[ss.dateStripCard, { backgroundColor: active ? tc.primary : tc.card, borderColor: active ? tc.primary : tc.border || '#E5E5EA' }]}
              onPress={() => setSelectedDate(ymd)}
              activeOpacity={0.8}
            >
              <Text style={[ss.dateStripMonth, { color: active ? '#FFF' : tc.subheading }]}>{item.toLocaleString('en-US', { month: 'short' })}</Text>
              <Text style={[ss.dateStripDay, { color: active ? '#FFF' : tc.heading }]}>{item.getDate()}</Text>
              <Text style={[ss.dateStripWeekday, { color: active ? '#FFF' : tc.subheading }]}>{item.toLocaleString('en-US', { weekday: 'short' })}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {loading ? (
        <View style={ss.centered}>
          <ActivityIndicator size="large" color={tc.primary} />
          <Text style={[{ fontSize: 14, marginTop: 12, color: tc.subheading }]}>Loading movies…</Text>
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
          data={filteredMovies}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMovie}
          numColumns={2}
          contentContainerStyle={ss.listContent}
          columnWrapperStyle={ss.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tc.primary} />}
          ListEmptyComponent={
            <View style={ss.centered}>
              <Ionicons name="film-outline" size={48} color={tc.subtext} />
              <Text style={[{ fontSize: 14, color: tc.subheading, marginTop: 12, textAlign: 'center', paddingHorizontal: 24 }]}>
                {movies.length > 0
                  ? `No movies showing on ${new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}`
                  : 'No movies found'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  container:       { flex: 1 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle:     { fontSize: 16, fontWeight: '700' },
  searchRow:       { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  searchBox:       { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput:     { flex: 1, fontSize: 14 },
  dateStripRow:    { borderBottomWidth: 1, flexGrow: 0 },
  dateStripContent:{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  dateStripCard:   { width: 64, height: 90, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  dateStripMonth:  { fontSize: 12, fontWeight: '600' },
  dateStripDay:    { fontSize: 20, fontWeight: '800' },
  dateStripWeekday:{ fontSize: 11, fontWeight: '600' },
  listContent:     { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 24 },
  columnWrapper:   { gap: 10, marginBottom: 10 },
  movieCard:       { flex: 1, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  poster:          { width: '100%', height: 180 },
  posterPlaceholder:{ width: '100%', height: 150, alignItems: 'center', justifyContent: 'center' },
  movieInfo:       { padding: 10 },
  movieTitle:      { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  genreChip:       { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 6 },
  genreText:       { fontSize: 10, fontWeight: '700' },
  movieMeta:       { flexDirection: 'row', gap: 8, marginBottom: 4 },
  ratingRow:       { flexDirection: 'row', alignItems: 'center', gap: 3 },
  moviePrice:      { fontSize: 12, fontWeight: '700' },
  centered:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  retryBtn:        { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
});
