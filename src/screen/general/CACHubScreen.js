import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { cacGetHistory } from 'AuthFunction/paymentService';

const CARDS = [
  {
    key:         'bn',
    screen:      'CACScreen',
    icon:        'person-outline',
    badge:       'SOLE PROPRIETORSHIP',
    title:       'Business Name\nRegistration',
    description: 'Register a sole-proprietorship or partnership trading name with the Corporate Affairs Commission. Ideal for individuals and small businesses operating under a trading name.',
    features:    ['Individual / Partnership', 'Approval in 24–72 hrs', 'Certificate issued by CAC'],
    color:       '#7C3AED',
  },
  {
    key:         'llc',
    screen:      'CACLLCScreen',
    icon:        'business-outline',
    badge:       'LIMITED LIABILITY',
    title:       'Company\nRegistration (LLC)',
    description: 'Incorporate a Limited Liability Company — Private or Public. Your personal assets are protected and the company exists as a separate legal entity in Nigeria.',
    features:    ['Separate legal entity', 'Shareholder protection', 'Private or Public company'],
    color:       '#0F766E',
    comingSoon:  true,
  },
];

const STATUS_BADGE = {
  pending:    { label: 'Pending',    color: '#9CA3AF' },
  processing: { label: 'Processing', color: '#3B82F6' },
  approved:   { label: 'Approved',   color: '#22C55E' },
  queried:          { label: 'Queried',             color: '#F97316' },
  query_submitted:  { label: 'Response Sent',       color: '#0EA5E9' },
  failed:           { label: 'Failed',              color: '#EF4444' },
};

export default function CACHubScreen({ navigation }) {
  const dark   = useThem();
  const tc     = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [registrations, setRegistrations] = useState([]);
  const [histLoading,   setHistLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await cacGetHistory();
        if (res?.success && Array.isArray(res.registrations)) {
          setRegistrations(res.registrations);
        }
      } catch {
        // non-critical — just hide the section
      } finally {
        setHistLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: tc.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8, backgroundColor: tc.primary }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>CAC Registration</Text>
          <Text style={s.headerSub}>Corporate Affairs Commission</Text>
        </View>
        <View style={s.headerIcon}>
          <Ionicons name="ribbon-outline" size={22} color="#FFFFFF" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={[s.introBox, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <Ionicons name="information-circle-outline" size={20} color={tc.primary} />
          <Text style={[s.introText, { color: tc.subheading }]}>
            Choose a registration type below. Each type has its own requirements, fees, and processing timeline. Read the description carefully before proceeding.
          </Text>
        </View>

        {/* My Applications — shown when history is available */}
        {(histLoading || registrations.length > 0) && (
          <View style={[s.myAppsCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
            <View style={s.myAppsHeader}>
              <Ionicons name="layers-outline" size={18} color={tc.primary} />
              <Text style={[s.myAppsTitle, { color: tc.heading }]}>My Applications</Text>
            </View>

            {histLoading ? (
              <View style={s.histLoader}>
                <ActivityIndicator size="small" color={tc.primary} />
                <Text style={[s.histLoadingText, { color: tc.subtext }]}>Loading…</Text>
              </View>
            ) : (
              registrations.slice(0, 5).map((reg, idx) => {
                const displayStatus = reg.status === 'queried' && reg.querySubmittedAt ? 'query_submitted' : reg.status;
                const stCfg = STATUS_BADGE[displayStatus] || STATUS_BADGE.pending;
                const name  = reg.registrationData?.proposedOption1 || reg.proposedName || 'Unnamed Application';
                const date  = reg.createdAt
                  ? new Date(reg.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '';
                const isLast = idx === Math.min(registrations.length, 5) - 1;
                return (
                  <TouchableOpacity
                    key={reg.transactionRef || idx}
                    style={[s.appRow, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: tc.border || '#F0F0F0' }]}
                    onPress={() => navigation.navigate('CACStatus', { transactionRef: reg.transactionRef, businessName: name })}
                    activeOpacity={0.7}
                  >
                    <View style={[s.statusDot, { backgroundColor: stCfg.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.appName, { color: tc.heading }]} numberOfLines={1}>{name}</Text>
                      {!!date && <Text style={[s.appDate, { color: tc.subtext }]}>{date}</Text>}
                    </View>
                    <View style={[s.statusPill, { backgroundColor: `${stCfg.color}20` }]}>
                      <Text style={[s.statusPillText, { color: stCfg.color }]}>{stCfg.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={tc.subtext} />
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Registration type cards */}
        {CARDS.map((card) => (
          <View key={card.key} style={[s.card, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
            <View style={[s.cardHeader, { backgroundColor: card.comingSoon ? '#6B7280' : card.color }]}>
              <View style={s.cardHeaderInner}>
                <View style={s.cardIconWrap}>
                  <Ionicons name={card.icon} size={28} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.badgeRow}>
                    <View style={s.badgeWrap}>
                      <Text style={s.badgeText}>{card.badge}</Text>
                    </View>
                    {card.comingSoon && (
                      <View style={s.soonBadge}>
                        <Text style={s.soonBadgeText}>SOON</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.cardTitle}>{card.title}</Text>
                </View>
              </View>
              <View style={s.cardGlow} pointerEvents="none" />
            </View>

            <View style={s.cardBody}>
              <Text style={[s.cardDesc, { color: tc.subheading }]}>{card.description}</Text>

              {card.comingSoon && (
                <View style={[s.comingSoonNote, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B40' }]}>
                  <Ionicons name="time-outline" size={16} color="#F59E0B" />
                  <Text style={[s.comingSoonText, { color: '#F59E0B' }]}>
                    We are finalising LLC registration. It will be available soon.
                  </Text>
                </View>
              )}

              <View style={s.featureList}>
                {card.features.map((f, i) => (
                  <View key={i} style={s.featureRow}>
                    <View style={[s.featureDot, { backgroundColor: card.comingSoon ? '#9CA3AF' : card.color }]} />
                    <Text style={[s.featureText, { color: card.comingSoon ? tc.subtext : tc.heading }]}>{f}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[s.startBtn, { backgroundColor: card.comingSoon ? '#D1D5DB' : card.color }]}
                onPress={() => !card.comingSoon && navigation.navigate(card.screen)}
                activeOpacity={card.comingSoon ? 1 : 0.85}
                disabled={!!card.comingSoon}
              >
                <Ionicons
                  name={card.comingSoon ? 'time-outline' : 'arrow-forward'}
                  size={16}
                  color={card.comingSoon ? '#9CA3AF' : '#FFFFFF'}
                />
                <Text style={[s.startBtnText, card.comingSoon && { color: '#9CA3AF' }]}>
                  {card.comingSoon ? 'Coming Soon' : 'Start Registration'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Disclaimer */}
        <View style={[s.disclaimer, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={tc.primary} />
          <Text style={[s.disclaimerText, { color: tc.subtext }]}>
            All registrations are processed through the Corporate Affairs Commission (CAC) via our licensed VAS partner. Fees are non-refundable once submitted to CAC.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  backBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub:      { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  headerIcon:     { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },

  scroll:         { padding: 16, gap: 16 },

  introBox:       { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'flex-start' },
  introText:      { fontSize: 13, lineHeight: 20, flex: 1 },

  /* My Applications */
  myAppsCard:     { borderRadius: 14, borderWidth: 1, padding: 16 },
  myAppsHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  myAppsTitle:    { fontSize: 15, fontWeight: '700' },
  histLoader:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  histLoadingText:{ fontSize: 13 },
  appRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  statusDot:      { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  appName:        { fontSize: 13, fontWeight: '600' },
  appDate:        { fontSize: 11, marginTop: 1 },
  statusPill:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusPillText: { fontSize: 10, fontWeight: '700' },

  /* Registration cards */
  card:           { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  cardHeader:     { padding: 20, overflow: 'hidden' },
  cardHeaderInner:{ flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardGlow:       { position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)' },
  cardIconWrap:   { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  badgeRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  badgeWrap:      { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText:      { fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  soonBadge:      { backgroundColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  soonBadgeText:  { fontSize: 10, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  comingSoonNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  comingSoonText: { flex: 1, fontSize: 12.5, lineHeight: 18, fontWeight: '500' },
  cardTitle:      { fontSize: 18, fontWeight: '800', color: '#FFFFFF', lineHeight: 24 },

  cardBody:       { padding: 18, gap: 14 },
  cardDesc:       { fontSize: 13.5, lineHeight: 21 },

  featureList:    { gap: 8 },
  featureRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureDot:     { width: 7, height: 7, borderRadius: 4 },
  featureText:    { fontSize: 13, fontWeight: '500' },

  startBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  startBtnText:   { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },

  disclaimer:     { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'flex-start' },
  disclaimerText: { fontSize: 11.5, lineHeight: 18, flex: 1 },
});
