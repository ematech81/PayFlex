import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import BookingStepIndicator from 'component/bus/BookingStepIndicator';
import { merpiGetSchedulePackages } from 'AuthFunction/paymentService';
import { extractList, placeLabel, fmtDate } from 'utility/busHelpers';

export default function ScheduleAndBusScreen({ navigation, route: navRoute }) {
  const { route, depDate, fromCity, toCity } = navRoute.params || {};
  const dark = useThem(), tc = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const isRandom = route?.schedule_type === 'random';

  const [schedules, setSchedules]               = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [buses, setBuses]                       = useState([]);
  const [selectedBus, setSelectedBus]           = useState(null);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [scheduleError, setScheduleError]       = useState(null);

  const origin = placeLabel(route?.from) || fromCity?.name || '';
  const dest   = placeLabel(route?.to)   || toCity?.name   || '';

  useEffect(() => {
    const load = async () => {
      try {
        // v1 /schedules returns null time/window for many schedules — the
        // packages endpoint is the only source of populated time/operating_hours
        // and embeds the bus (with available_seats) right on each entry.
        const r = await merpiGetSchedulePackages({
          route_id:       route.id,
          departure_date: depDate ? depDate.slice(0, 10) : undefined,
        });
        // Stamp each schedule with a unique _idx because MERPI test/live data
        // frequently returns duplicate id values across schedule entries.
        const list = extractList(r, 'schedules', 'data').map((s, i) => ({ ...s, _idx: i }));
        if (isRandom) {
          const pkg = list.find(s => s.route?.id === route.id) || list[0] || null;
          setSelectedSchedule(pkg);
          setBuses(pkg?.buses || []);
        } else {
          setSchedules(list);
        }
      } catch (e) {
        setScheduleError(e.message || 'Could not load schedules.');
      } finally {
        setLoadingSchedules(false);
      }
    };
    load();
  }, []);

  const selectSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setSelectedBus(schedule.bus ? { ...schedule.bus, _busIdx: schedule._idx } : null);
  };

  const proceed = () => {
    navigation.navigate('TripDetail', {
      route,
      schedule: selectedSchedule,
      bus: selectedBus,
      depDate,
      fromCity,
      toCity,
    });
  };

  const canContinue = isRandom ? !!selectedBus : !!(selectedSchedule && selectedBus);

  return (
    <SafeAreaView style={[ss.container, { backgroundColor: tc.background }]}>
      <StatusBarComponent />

      <View style={[ss.header, { backgroundColor: tc.background, borderBottomColor: tc.border || '#E5E5EA', paddingTop: insets.top + 4 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={tc.heading} />
        </TouchableOpacity>
        <Text style={[ss.headerTitle, { color: tc.heading }]}>Choose Trip</Text>
        <View style={{ width: 24 }} />
      </View>

      <BookingStepIndicator step={2} total={5} tc={tc} />

      <ScrollView contentContainerStyle={ss.sc} showsVerticalScrollIndicator={false}>

        {/* Route summary strip */}
        <View style={[ss.routeStrip, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <View style={[ss.routeIconBox, { backgroundColor: `${tc.primary}14` }]}>
            <Ionicons name="bus" size={18} color={tc.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[ss.routeOp, { color: tc.heading }]} numberOfLines={1}>
              {route?.business?.name || 'Bus Operator'}
            </Text>
            <Text style={[ss.routeCities, { color: tc.subheading }]} numberOfLines={1}>
              {origin} → {dest}
            </Text>
          </View>
          {route?.price != null && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[ss.routePrice, { color: tc.primary }]}>{formatCurrency(route.price, 'NGN')}</Text>
              <Text style={[ss.routePriceSub, { color: tc.subtext }]}>per seat</Text>
            </View>
          )}
        </View>

        {/* ── SECTION 1: Departure time (timed schedules only) ── */}
        {isRandom ? (
          <>
            <View style={ss.sectionHeader}>
              <Ionicons name="time-outline" size={16} color={tc.primary} />
              <Text style={[ss.sectionTitle, { color: tc.heading }]}>Operating Hours</Text>
            </View>
            {loadingSchedules ? (
              <ActivityIndicator color={tc.primary} size="large" style={{ marginVertical: 28 }} />
            ) : scheduleError ? (
              <StatusCard icon="warning-outline" color="#EF4444" bg="#FEF2F2" border="#FCA5A5" message={scheduleError} />
            ) : !selectedSchedule ? (
              <StatusCard icon="information-circle-outline" color={tc.subheading} bg={tc.card} border={tc.border || '#E5E5EA'} message="No schedules available for this date." />
            ) : (
              <View style={[ss.routeStrip, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
                <View style={[ss.routeIconBox, { backgroundColor: `${tc.primary}14` }]}>
                  <Ionicons name="time" size={18} color={tc.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[ss.routeOp, { color: tc.heading }]}>
                    {selectedSchedule.operating_hours?.start || '—'} – {selectedSchedule.operating_hours?.end || '—'}
                  </Text>
                  <Text style={[ss.routeCities, { color: tc.subheading }]}>
                    Buses depart within this window — choose your preferred time on the next step
                  </Text>
                </View>
              </View>
            )}
          </>
        ) : (
          <>
        <View style={ss.sectionHeader}>
          <Ionicons name="time-outline" size={16} color={tc.primary} />
          <Text style={[ss.sectionTitle, { color: tc.heading }]}>Choose Departure Time</Text>
        </View>

        {loadingSchedules ? (
          <ActivityIndicator color={tc.primary} size="large" style={{ marginVertical: 28 }} />
        ) : scheduleError ? (
          <StatusCard icon="warning-outline" color="#EF4444" bg="#FEF2F2" border="#FCA5A5" message={scheduleError} />
        ) : schedules.length === 0 ? (
          <StatusCard icon="information-circle-outline" color={tc.subheading} bg={tc.card} border={tc.border || '#E5E5EA'} message="No schedules available for this date." />
        ) : (
          schedules.map((sch, idx) => {
            const sel = selectedSchedule?._idx === sch._idx;
            return (
              <TouchableOpacity
                key={`${sch.id}-${idx}`}
                style={[ss.scheduleCard, {
                  backgroundColor: sel ? `${tc.primary}10` : tc.card,
                  borderColor: sel ? tc.primary : tc.border || '#E5E5EA',
                }]}
                onPress={() => selectSchedule(sch)}
                activeOpacity={0.8}
              >
                <View style={ss.scheduleTop}>
                  <View style={ss.timeBlock}>
                    <Text style={[ss.timeLarge, { color: tc.heading }]}>{sch.time?.departure || 'TBC'}</Text>
                    <Text style={[ss.timeLabel, { color: tc.subheading }]}>Departure</Text>
                  </View>
                  <View style={ss.timeArrow}>
                    <View style={[ss.timeLine, { backgroundColor: tc.border || '#E5E5EA' }]} />
                    <Ionicons name="arrow-forward" size={13} color={tc.subtext} />
                  </View>
                  <View style={[ss.timeBlock, { alignItems: 'flex-end' }]}>
                    <Text style={[ss.timeLarge, { color: tc.heading }]}>{sch.time?.arrival || '—'}</Text>
                    <Text style={[ss.timeLabel, { color: tc.subheading }]}>Arrival</Text>
                  </View>
                  {sel && (
                    <Ionicons name="checkmark-circle" size={22} color={tc.primary} style={{ marginLeft: 10 }} />
                  )}
                </View>

                <View style={ss.scheduleBottom}>
                  {/* Operator row */}
                  <View style={ss.operatorRow}>
                    <OperatorAvatar uri={sch.business?.photo} primaryColor={tc.primary} />
                    <Text style={[ss.operatorName, { color: tc.subheading }]} numberOfLines={1}>
                      {sch.business?.name || 'Operator'}
                    </Text>
                    {!!sch.name && (
                      <Text style={[ss.scheduleName, { color: tc.subtext }]}>· {sch.name}</Text>
                    )}
                  </View>
                  <View style={ss.scheduleBottom2Row}>
                    {!!sch.bus?.name && (
                      <View style={[ss.busBadge, { backgroundColor: `${tc.primary}12` }]}>
                        <Ionicons name="bus-outline" size={11} color={tc.primary} />
                        <Text style={[ss.busBadgeText, { color: tc.primary }]} numberOfLines={1}>
                          {sch.bus.name}{sch.bus.seats ? ` · ${sch.bus.seats} seats` : ''}
                        </Text>
                      </View>
                    )}
                    {!!depDate && (
                      <View style={ss.datePill}>
                        <Ionicons name="calendar-outline" size={11} color="#16A34A" />
                        <Text style={ss.datePillText}>{fmtDate(depDate)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
          </>
        )}

        {/* ── SECTION 2: Buses (random schedules only — timed bundles its bus per departure time) ── */}
        {isRandom && (
          <>
            <View style={[ss.sectionHeader, { marginTop: 10 }]}>
              <Ionicons name="bus-outline" size={16} color={tc.primary} />
              <Text style={[ss.sectionTitle, { color: tc.heading }]}>Choose Your Bus</Text>
            </View>

            {loadingSchedules ? (
              <ActivityIndicator color={tc.primary} size="large" style={{ marginVertical: 28 }} />
            ) : buses.length === 0 ? (
              <StatusCard icon="information-circle-outline" color={tc.subheading} bg={tc.card} border={tc.border || '#E5E5EA'} message="No buses available for this schedule." />
            ) : (
              buses.map((bus, idx) => {
                const busKey  = isRandom ? bus.bus_id : bus.id;
                const sel     = selectedBus?._busIdx === idx;
                const imageUri = bus.image || bus.image_url || bus.photo
                  || selectedSchedule?.business?.photo || null;
                const busName = isRandom ? (bus.bus_type || 'Bus') : bus.name;
                const priceVal = isRandom ? bus.price : route?.price;
                return (
                  <TouchableOpacity
                    key={`${busKey ?? 'bus'}-${idx}`}
                    style={[ss.busCard, {
                      backgroundColor: sel ? `${tc.primary}10` : tc.card,
                      borderColor: sel ? tc.primary : tc.border || '#E5E5EA',
                    }]}
                    onPress={() => setSelectedBus({ ...bus, _busIdx: idx })}
                    activeOpacity={0.8}
                  >
                    <BusImage uri={imageUri} primaryColor={tc.primary} />

                    <View style={ss.busInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[ss.busName, { color: tc.heading }]} numberOfLines={1}>{busName}</Text>
                        {sel && <Ionicons name="checkmark-circle" size={20} color={tc.primary} />}
                      </View>

                      <View style={ss.busMeta}>
                        {isRandom ? (
                          <View style={[ss.busBadge, { backgroundColor: `${tc.primary}12` }]}>
                            <Ionicons name="time-outline" size={11} color={tc.primary} />
                            <Text style={[ss.busBadgeText, { color: tc.primary }]}>
                              {bus.start_time?.slice(0, 5)} – {bus.end_time?.slice(0, 5)}
                            </Text>
                          </View>
                        ) : (
                          <View style={[ss.busBadge, { backgroundColor: `${tc.primary}12` }]}>
                            <Ionicons name="people-outline" size={11} color={tc.primary} />
                            <Text style={[ss.busBadgeText, { color: tc.primary }]}>{bus.seats} seats</Text>
                          </View>
                        )}
                        {priceVal != null && (
                          <Text style={[ss.busPrice, { color: tc.primary }]}>
                            {formatCurrency(priceVal, 'NGN')} / seat
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Fixed bottom bar */}
      <View style={[ss.bottomBar, { backgroundColor: tc.card, borderTopColor: tc.border || '#E5E5EA' }]}>
        <View style={{ flex: 1, marginRight: 12 }}>
          {canContinue ? (
            <Text style={[ss.selInfo, { color: tc.heading }]} numberOfLines={1}>
              {isRandom
                ? `${selectedBus.bus_type || 'Bus'} · ${selectedBus.start_time?.slice(0, 5)}–${selectedBus.end_time?.slice(0, 5)}`
                : `${selectedSchedule.time?.departure} · ${selectedBus.name}`}
            </Text>
          ) : (
            <Text style={[ss.selHint, { color: tc.subtext }]}>
              {isRandom
                ? 'Select a bus to continue'
                : (!selectedSchedule ? 'Select a departure time' : 'Select a bus to continue')}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[ss.cta, { backgroundColor: tc.primary, opacity: canContinue ? 1 : 0.4 }]}
          onPress={proceed}
          disabled={!canContinue}
          activeOpacity={0.85}
        >
          <Text style={ss.ctaText}>Continue</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function BusImage({ uri, primaryColor }) {
  return (
    <View style={[ss.busImagePlaceholder, { backgroundColor: `${primaryColor}22`, overflow: 'hidden' }]}>
      <Ionicons name="bus" size={44} color={primaryColor} style={{ opacity: 0.5 }} />
      {!!uri && (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      )}
    </View>
  );
}

function OperatorAvatar({ uri, primaryColor }) {
  return (
    <View style={[ss.operatorAvatarPlaceholder, { backgroundColor: `${primaryColor}22`, overflow: 'hidden' }]}>
      <Ionicons name="business-outline" size={12} color={primaryColor} />
      {!!uri && (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      )}
    </View>
  );
}

function StatusCard({ icon, color, bg, border, message }) {
  return (
    <View style={[sc.card, { backgroundColor: bg, borderColor: border }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[sc.text, { color }]}>{message}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  text: { fontSize: 13, flex: 1 },
});

const ss = StyleSheet.create({
  container:          { flex: 1 },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle:        { fontSize: 16, fontWeight: '700' },
  sc:                 { paddingHorizontal: 16, paddingTop: 12 },

  routeStrip:         { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 20 },
  routeIconBox:       { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  routeOp:            { fontSize: 14, fontWeight: '700' },
  routeCities:        { fontSize: 12, marginTop: 2 },
  routePrice:         { fontSize: 16, fontWeight: '800' },
  routePriceSub:      { fontSize: 11, marginTop: 1 },

  sectionHeader:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle:       { fontSize: 15, fontWeight: '700' },

  scheduleCard:       { borderRadius: 14, borderWidth: 1.5, padding: 16, marginBottom: 12 },
  scheduleTop:        { flexDirection: 'row', alignItems: 'center' },
  timeBlock:          { flex: 1 },
  timeLarge:          { fontSize: 22, fontWeight: '800' },
  timeLabel:          { fontSize: 11, marginTop: 2 },
  timeArrow:          { alignItems: 'center', paddingHorizontal: 8 },
  timeLine:           { width: 24, height: 1, marginBottom: 4 },
  scheduleBottom:     { marginTop: 10, gap: 6 },
  scheduleBottom2Row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  operatorRow:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  operatorAvatar:     { width: 20, height: 20, borderRadius: 10 },
  operatorAvatarPlaceholder: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  operatorName:       { fontSize: 12, fontWeight: '600', flex: 1 },
  scheduleName:       { fontSize: 12 },
  datePill:           { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  datePillText:       { fontSize: 11, fontWeight: '600', color: '#16A34A' },

  busCard:            { borderRadius: 14, borderWidth: 1.5, overflow: 'hidden', marginBottom: 12 },
  busImage:           { width: '100%', height: 130 },
  busImagePlaceholder:{ width: '100%', height: 130, alignItems: 'center', justifyContent: 'center' },
  busInfo:            { padding: 14 },
  busName:            { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  busMeta:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  busBadge:           { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  busBadgeText:       { fontSize: 12, fontWeight: '600' },
  busPrice:           { fontSize: 14, fontWeight: '700' },

  bottomBar:          { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 28, borderTopWidth: 1 },
  selInfo:            { fontSize: 13, fontWeight: '600' },
  selHint:            { fontSize: 13 },
  cta:                { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 12 },
  ctaText:            { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
