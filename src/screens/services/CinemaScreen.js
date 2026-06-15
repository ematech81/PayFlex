// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View, Text, StyleSheet, FlatList, SafeAreaView,
//   TouchableOpacity, ActivityIndicator, TextInput, Image, RefreshControl,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useThem } from 'constants/useTheme';
// import { colors } from 'constants/colors';
// import { StatusBarComponent } from 'component/StatusBar';
// import { merpiGetMovies } from 'AuthFunction/paymentService';

// const pad = (n) => String(n).padStart(2, '0');
// const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// const DATE_STRIP_DAYS = 60;
// const dateStrip = Array.from({ length: DATE_STRIP_DAYS }, (_, i) => {
//   const d = new Date();
//   d.setDate(d.getDate() + i);
//   return d;
// });

// // Gather every date / weekday a cinema experience is known to show on, from
// // cinema_info.specific_dates and the days_with_times matrices (shared or per-location).
// const collectShowingInfo = (info) => {
//   const dates = new Set();
//   const days = new Set();

//   (info.specific_dates || []).forEach((d) => dates.add(d));

//   const collectFromList = (list) => {
//     (list || []).forEach((d) => {
//       if (d.date) dates.add(d.date);
//       if (d.day != null) days.add(d.day);
//     });
//   };

//   collectFromList(info.days_with_times);
//   (info.locations || []).forEach((loc) => collectFromList(loc.days_with_times));

//   return { dates, days };
// };

// // Treat a movie as "showing" on a date based on its cinema_info schedule.
// // Movies without any schedule info are assumed to be showing every day.
// const isShowingOnDate = (item, dateStr) => {
//   const info = item.cinema_info;
//   if (!info) return true;

//   const { dates, days } = collectShowingInfo(info);

//   if (dates.size > 0) return dates.has(dateStr);

//   if (days.size > 0) {
//     const jsDay = new Date(`${dateStr}T00:00:00`).getDay();
//     const docDay = jsDay === 0 ? 7 : jsDay;
//     return days.has(docDay);
//   }

//   return true;
// };

// export default function CinemaScreen({ navigation }) {
//   const dark = useThem(), tc = dark ? colors.dark : colors.light;
//   const insets = useSafeAreaInsets();

//   const [movies,    setMovies]    = useState([]);
//   const [loading,   setLoading]   = useState(true);
//   const [refreshing,setRefreshing]= useState(false);
//   const [error,     setError]     = useState('');
//   const [search,    setSearch]    = useState('');
//   const [selectedDate, setSelectedDate] = useState(() => toYMD(new Date()));

//   const load = useCallback(async (quiet = false) => {
//     if (!quiet) setLoading(true);
//     setError('');
//     try {
//       const res = await merpiGetMovies({ search: search || undefined });
//       setMovies(res?.data?.experiences || []);
//     } catch (e) {
//       setError(e.message || 'Could not load movies.');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, [search]);

//   useEffect(() => { load(); }, []);
//   const onRefresh = () => { setRefreshing(true); load(true); };

//   const filteredMovies = movies.filter((m) => isShowingOnDate(m, selectedDate));

//   const renderMovie = ({ item }) => (
//     <TouchableOpacity
//       style={[ss.movieCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
//       onPress={() => navigation.navigate('CinemaDetail', { movieId: item.id, movie: item })}
//       activeOpacity={0.8}
//     >
//       {item.image?.[0]?.image ? (
//         <Image source={{ uri: item.image[0].image }} style={ss.poster} resizeMode="cover" />
//       ) : (
//         <View style={[ss.posterPlaceholder, { backgroundColor: `${tc.primary}15` }]}>
//           <Ionicons name="film-outline" size={32} color={tc.primary} />
//         </View>
//       )}
//       <View style={ss.movieInfo}>
//         <Text style={[ss.movieTitle, { color: tc.heading }]} numberOfLines={2}>{item.title}</Text>
//         <View style={ss.movieMeta}>
//           {item.business?.name && (
//             <Text style={[{ fontSize: 12, color: tc.subheading }]} numberOfLines={1}>{item.business.name}</Text>
//           )}
//           {item.category?.name && (
//             <View style={[ss.genreChip, { backgroundColor: `${tc.primary}15` }]}>
//               <Text style={[ss.genreText, { color: tc.primary }]}>{item.category.name}</Text>
//             </View>
//           )}
//         </View>
//         {item.cinema_info?.showing && (
//           <View style={[ss.genreChip, { backgroundColor: `${tc.primary}15`, alignSelf: 'flex-start' }]}>
//             <Text style={[ss.genreText, { color: tc.primary }]}>
//               {item.cinema_info.showing === 'weekly' ? 'Weekly' : 'Daily'}
//             </Text>
//           </View>
//         )}
//       </View>
//     </TouchableOpacity>
//   );

//   return (
//     <SafeAreaView style={[ss.container, { backgroundColor: tc.background }]}>
//       <StatusBarComponent />

//       <View style={[ss.header, { backgroundColor: tc.background, borderBottomColor: tc.border || '#E5E5EA', paddingTop: insets.top + 8 }]}>
//         <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
//           <Ionicons name="arrow-back" size={24} color={tc.heading} />
//         </TouchableOpacity>
//         <Text style={[ss.headerTitle, { color: tc.heading }]}>Cinema</Text>
//         <View style={{ width: 24 }} />
//       </View>

//       {/* Search */}
//       <View style={[ss.searchRow, { backgroundColor: tc.background, borderBottomColor: tc.border || '#E5E5EA' }]}>
//         <View style={[ss.searchBox, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
//           <Ionicons name="search-outline" size={18} color={tc.subtext} />
//           <TextInput
//             style={[ss.searchInput, { color: tc.heading }]}
//             value={search} onChangeText={setSearch}
//             placeholder="Search movies..." placeholderTextColor={tc.subtext}
//             returnKeyType="search" onSubmitEditing={() => load()}
//           />
//           {search ? (
//             <TouchableOpacity onPress={() => { setSearch(''); }}>
//               <Ionicons name="close-circle" size={18} color={tc.subtext} />
//             </TouchableOpacity>
//           ) : null}
//         </View>
//       </View>

//       {/* Date strip */}
//       <FlatList
//         data={dateStrip}
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         keyExtractor={(item) => toYMD(item)}
//         extraData={selectedDate}
//         contentContainerStyle={ss.dateStripContent}
//         style={[ss.dateStripRow, { backgroundColor: tc.background, borderBottomColor: tc.border || '#E5E5EA' }]}
//         renderItem={({ item }) => {
//           const ymd = toYMD(item);
//           const active = ymd === selectedDate;
//           return (
//             <TouchableOpacity
//               style={[ss.dateStripCard, { backgroundColor: active ? tc.primary : tc.card, borderColor: active ? tc.primary : tc.border || '#E5E5EA' }]}
//               onPress={() => setSelectedDate(ymd)}
//               activeOpacity={0.8}
//             >
//               <Text style={[ss.dateStripMonth, { color: active ? '#FFF' : tc.subheading }]}>{item.toLocaleString('en-US', { month: 'short' })}</Text>
//               <Text style={[ss.dateStripDay, { color: active ? '#FFF' : tc.heading }]}>{item.getDate()}</Text>
//               <Text style={[ss.dateStripWeekday, { color: active ? '#FFF' : tc.subheading }]}>{item.toLocaleString('en-US', { weekday: 'short' })}</Text>
//             </TouchableOpacity>
//           );
//         }}
//       />

//       {loading ? (
//         <View style={ss.centered}>
//           <ActivityIndicator size="large" color={tc.primary} />
//           <Text style={[{ fontSize: 14, marginTop: 12, color: tc.subheading }]}>Loading movies…</Text>
//         </View>
//       ) : error ? (
//         <View style={ss.centered}>
//           <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
//           <Text style={[{ fontSize: 14, color: '#EF4444', marginTop: 8, textAlign: 'center' }]}>{error}</Text>
//           <TouchableOpacity style={[ss.retryBtn, { backgroundColor: tc.primary }]} onPress={() => load()}>
//             <Text style={{ color: '#FFF', fontWeight: '700' }}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <FlatList
//           data={filteredMovies}
//           keyExtractor={(item) => String(item.id)}
//           renderItem={renderMovie}
//           numColumns={2}
//           contentContainerStyle={ss.listContent}
//           columnWrapperStyle={ss.columnWrapper}
//           showsVerticalScrollIndicator={false}
//           refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tc.primary} />}
//           ListEmptyComponent={
//             <View style={ss.centered}>
//               <Ionicons name="film-outline" size={48} color={tc.subtext} />
//               <Text style={[{ fontSize: 14, color: tc.subheading, marginTop: 12, textAlign: 'center', paddingHorizontal: 24 }]}>
//                 {movies.length > 0
//                   ? `No movies showing on ${new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}`
//                   : 'No movies found'}
//               </Text>
//             </View>
//           }
//         />
//       )}
//     </SafeAreaView>
//   );
// }

// const ss = StyleSheet.create({
//   container:       { flex: 1 },
//   header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
//   headerTitle:     { fontSize: 16, fontWeight: '700' },
//   searchRow:       { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
//   searchBox:       { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
//   searchInput:     { flex: 1, fontSize: 14 },
//   dateStripRow:    { height: 110, borderBottomWidth: 1, flexGrow: 0 },
//   dateStripContent:{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
//   dateStripCard:   { width: 64, height: 90, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
//   dateStripMonth:  { fontSize: 12, fontWeight: '600' },
//   dateStripDay:    { fontSize: 20, fontWeight: '800' },
//   dateStripWeekday:{ fontSize: 11, fontWeight: '600' },
//   listContent:     { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 24 },
//   columnWrapper:   { gap: 10, marginBottom: 10 },
//   movieCard:       { flex: 1, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
//   poster:          { width: '100%', height: 180 },
//   posterPlaceholder:{ width: '100%', height: 150, alignItems: 'center', justifyContent: 'center' },
//   movieInfo:       { padding: 10 },
//   movieTitle:      { fontSize: 13, fontWeight: '700', marginBottom: 6 },
//   genreChip:       { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 6 },
//   genreText:       { fontSize: 10, fontWeight: '700' },
//   movieMeta:       { flexDirection: 'row', gap: 8, marginBottom: 4 },
//   ratingRow:       { flexDirection: 'row', alignItems: 'center', gap: 3 },
//   moviePrice:      { fontSize: 12, fontWeight: '700' },
//   centered:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
//   retryBtn:        { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
// });



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
import { merpiGetMovies } from 'AuthFunction/paymentService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pad    = (n) => String(n).padStart(2, '0');
const toYMD  = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const DATE_STRIP_DAYS = 60;
const dateStrip = Array.from({ length: DATE_STRIP_DAYS }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d;
});

const collectShowingInfo = (info) => {
  const dates = new Set();
  const days  = new Set();
  (info.specific_dates || []).forEach((d) => dates.add(d));
  const collectFromList = (list) => {
    (list || []).forEach((d) => {
      if (d.date)    dates.add(d.date);
      if (d.day != null) days.add(d.day);
    });
  };
  collectFromList(info.days_with_times);
  (info.locations || []).forEach((loc) => collectFromList(loc.days_with_times));
  return { dates, days };
};

const isShowingOnDate = (item, dateStr) => {
  const info = item.cinema_info;
  if (!info) return true;
  const { dates, days } = collectShowingInfo(info);
  if (dates.size > 0) return dates.has(dateStr);
  if (days.size > 0) {
    const jsDay  = new Date(`${dateStr}T00:00:00`).getDay();
    const docDay = jsDay === 0 ? 7 : jsDay;
    return days.has(docDay);
  }
  return true;
};

// ─── Date strip item ──────────────────────────────────────────────────────────
function DateCard({ item, active, primary, card, border, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        ss.dateCard,
        {
          backgroundColor: active ? primary : card,
          borderColor:     active ? primary : border,
          // lift the active card slightly
          transform: [{ translateY: active ? -3 : 0 }],
          ...Platform.select({
            ios: active ? {
              shadowColor:   primary,
              shadowOffset:  { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius:  8,
            } : {},
            android: { elevation: active ? 5 : 0 },
          }),
        },
      ]}
    >
      <Text style={[ss.dateMonth, { color: active ? 'rgba(255,255,255,0.85)' : border }]}>
        {item.toLocaleString('en-US', { month: 'short' }).toUpperCase()}
      </Text>
      <Text style={[ss.dateDay, { color: active ? '#FFF' : undefined }]}>
        {item.getDate()}
      </Text>
      <Text style={[ss.dateWeekday, { color: active ? 'rgba(255,255,255,0.85)' : border }]}>
        {item.toLocaleString('en-US', { weekday: 'short' })}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Movie card ───────────────────────────────────────────────────────────────
function MovieCard({ item, tc, onPress }) {
  const showingLabel =
    item.cinema_info?.showing === 'weekly' ? 'Weekly'
    : item.cinema_info?.showing === 'daily' ? 'Daily'
    : null;

  return (
    <TouchableOpacity
      style={[ss.movieCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* Poster */}
      {item.image?.[0]?.image ? (
        <Image source={{ uri: item.image[0].image }} style={ss.poster} resizeMode="cover" />
      ) : (
        <View style={[ss.posterPlaceholder, { backgroundColor: `${tc.primary}18` }]}>
          <Ionicons name="film-outline" size={36} color={tc.primary} />
        </View>
      )}

      {/* Schedule badge — top-right corner over the poster */}
      {showingLabel && (
        <View style={[ss.schedBadge, { backgroundColor: tc.primary }]}>
          <Text style={ss.schedBadgeText}>{showingLabel}</Text>
        </View>
      )}

      {/* Info */}
      <View style={ss.movieInfo}>
        <Text style={[ss.movieTitle, { color: tc.heading }]} numberOfLines={2}>
          {item.title}
        </Text>

        {item.business?.name && (
          <Text style={[ss.venueName, { color: tc.subheading }]} numberOfLines={1}>
            {item.business.name}
          </Text>
        )}

        {item.category?.name && (
          <View style={[ss.genreChip, { backgroundColor: `${tc.primary}15` }]}>
            <Text style={[ss.genreText, { color: tc.primary }]}>{item.category.name}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CinemaScreen({ navigation }) {
  const dark   = useThem();
  const tc     = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [movies,       setMovies]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState('');
  const [search,       setSearch]       = useState('');
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

  const onRefresh      = () => { setRefreshing(true); load(true); };
  const filteredMovies = movies.filter((m) => isShowingOnDate(m, selectedDate));

  const selectedDateLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-NG', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  // ── Render ────────────────────────────────────────────────────────────────────
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

        <Text style={[ss.headerTitle, { color: tc.heading }]}>Cinema</Text>

        {/* placeholder to keep title centred */}
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
            placeholder="Search movies…"
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

      {/* ── DATE STRIP ──
          Key fix: NO fixed height. Use paddingVertical so the strip
          sizes itself to its content and never overlaps the list below.
      ── */}
      <View style={[ss.dateStripWrapper, { backgroundColor: tc.background, borderBottomColor: tc.border || '#E5E5EA' }]}>
        <FlatList
          data={dateStrip}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => toYMD(item)}
          extraData={selectedDate}
          contentContainerStyle={ss.dateStripContent}
          renderItem={({ item }) => (
            <DateCard
              item={item}
              active={toYMD(item) === selectedDate}
              primary={tc.primary}
              card={tc.card}
              border={tc.border || '#E5E5EA'}
              onPress={() => setSelectedDate(toYMD(item))}
            />
          )}
        />
      </View>

      {/* ── BODY ── */}
      {loading ? (
        <View style={ss.centered}>
          <ActivityIndicator size="large" color={tc.primary} />
          <Text style={[ss.centeredText, { color: tc.subheading }]}>Loading movies…</Text>
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
          data={filteredMovies}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={ss.listContent}
          columnWrapperStyle={ss.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tc.primary} />
          }
          // ── "Now Showing" section header ──
          ListHeaderComponent={
            <View style={ss.listHeader}>
              <Text style={[ss.listHeaderTitle, { color: tc.heading }]}>Now Showing</Text>
              <View style={[ss.countBadge, { backgroundColor: `${tc.primary}18` }]}>
                <Text style={[ss.countBadgeText, { color: tc.primary }]}>
                  {filteredMovies.length} {filteredMovies.length === 1 ? 'film' : 'films'}
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <MovieCard
              item={item}
              tc={tc}
              onPress={() => navigation.navigate('CinemaDetail', { movieId: item.id, movie: item })}
            />
          )}
          ListEmptyComponent={
            <View style={ss.emptyWrap}>
              <Ionicons name="film-outline" size={52} color={tc.subtext} />
              <Text style={[ss.emptyTitle, { color: tc.heading }]}>No Films Today</Text>
              <Text style={[ss.emptySub, { color: tc.subheading }]}>
                {movies.length > 0
                  ? `No movies showing on ${selectedDateLabel}`
                  : 'No movies found. Pull down to refresh.'}
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

  // Header
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

  // Search
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

  // ── Date strip — the critical fix ──
  // No fixed height. paddingVertical gives breathing room above & below cards.
  dateStripWrapper: {
    borderBottomWidth: 1,
    paddingVertical:   12,         // ← breathing room; strip sizes to card content
  },
  dateStripContent: {
    paddingHorizontal: 14,
    gap:               8,
    alignItems:        'center',   // vertically centre cards inside the strip
  },
  dateCard: {
    width:          60,
    paddingVertical: 10,
    borderRadius:   14,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            2,
  },
  dateMonth:   { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  dateDay:     { fontSize: 22, fontWeight: '900', lineHeight: 28 },
  dateWeekday: { fontSize: 10, fontWeight: '600' },

  // Movies list
  listContent:   { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 32 },
  columnWrapper: { gap: 10, marginBottom: 10 },

  // "Now Showing" list header
  listHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            10,
    paddingBottom:  12,
    paddingTop:      4,
  },
  listHeaderTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  countBadge:      { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  countBadgeText:  { fontSize: 12, fontWeight: '700' },

  // Movie card
  movieCard: {
    flex:         1,
    borderRadius: 14,
    borderWidth:  1,
    overflow:     'hidden',
    // soft shadow
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
  poster: { width: '100%', height: 190 },
  posterPlaceholder: {
    width:          '100%',
    height:         160,
    alignItems:     'center',
    justifyContent: 'center',
  },

  // Schedule badge overlaid on poster
  schedBadge: {
    position:         'absolute',
    top:              10,
    right:            10,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:     20,
  },
  schedBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },

  // Movie text info
  movieInfo: { padding: 10, gap: 4 },
  movieTitle: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  venueName:  { fontSize: 11, fontWeight: '500' },
  genreChip:  { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 2 },
  genreText:  { fontSize: 10, fontWeight: '700' },

  // States
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  centeredText: { fontSize: 14, marginTop: 12 },
  retryBtn:  { marginTop: 18, paddingHorizontal: 28, paddingVertical: 11, borderRadius: 12 },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '800', marginTop: 16, marginBottom: 6 },
  emptySub:   { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});