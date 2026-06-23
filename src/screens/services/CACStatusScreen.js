import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Linking, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { cacGetRegistrationStatus, cacDownloadCertificate, cacDownloadStatusReport } from 'AuthFunction/paymentService';

const POLL_INTERVAL = 30000;

// 'queried' is terminal only when there's NO querySubmittedAt (action needed).
// After query response submitted, we stop polling and wait for webhook.
const TERMINAL_STATUSES = ['approved', 'queried', 'failed'];

const STATUS_CONFIG = {
  pending:          { label: 'Pending',                     color: '#9CA3AF', icon: 'time-outline',              pulse: false },
  processing:       { label: 'Processing',                  color: '#3B82F6', icon: 'sync-outline',               pulse: true  },
  approved:         { label: 'Approved',                    color: '#22C55E', icon: 'checkmark-circle',           pulse: false },
  queried:          { label: 'Queried — Action Needed',     color: '#F97316', icon: 'alert-circle',               pulse: false },
  query_submitted:  { label: 'Response Submitted',          color: '#0EA5E9', icon: 'checkmark-done-outline',     pulse: false },
  failed:           { label: 'Failed',                      color: '#EF4444', icon: 'close-circle',               pulse: false },
};

const QUERY_REASON_LABELS = {
  proposedOption1:          'Preferred Business Name',
  proposedOption2:          'Alternative Business Name',
  lineOfBusiness:           'Line of Business',
  businessCommencementDate: 'Commencement Date',
  proprietorFirstname:      'First Name',
  proprietorOthername:      'Other Name / Middle Name',
  proprietorSurname:        'Surname',
  proprietorGender:         'Gender',
  proprietorDob:            'Date of Birth',
  proprietorNationality:    'Nationality',
  proprietorPhonenumber:    'Phone Number',
  proprietorEmail:          'Email Address',
  proprietorStreetNumber:   'Street Number',
  proprietorNumber:         'Street Number',
  proprietorServiceAddress: 'Residential Address',
  proprietorCity:           'City / Town',
  proprietorState:          'State',
  proprietorLga:            'LGA',
  proprietorPostcode:       'Postcode',
  companyEmail:             'Company Email',
  companyStreetNumber:      'Company Street Number',
  companyAddress:           'Company Address',
  companyCity:              'Company City',
  companyState:             'Company State',
  passport:                 'Passport Photograph',
  meansOfId:                'Means of Identification',
  signature:                'Proprietor Signature',
  supportingDoc:            'Supporting Document',
  proprietorProofOfAddress: 'Proprietor Proof of Address',
  businessProofOfAddress:   'Business Proof of Address',
};

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : null;

export default function CACStatusScreen({ navigation, route }) {
  const { transactionRef, businessName } = route.params || {};
  const dark = useThem(), tc = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [data,          setData]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [certLoading,   setCertLoading]   = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [error,         setError]         = useState('');
  const pollRef   = useRef(null);
  const statusRef = useRef(null);
  const pulse     = useRef(new Animated.Value(1)).current;

  const fetchStatus = useCallback(async (quiet = false) => {
    if (!transactionRef) return;
    if (!quiet) setLoading(true);
    try {
      const res = await cacGetRegistrationStatus(transactionRef);
      if (res?.success) {
        const reg = res.registration || res.data || res;
        setData(reg);
        // Use 'query_submitted' as synthetic key when querySubmittedAt is set
        statusRef.current = reg?.querySubmittedAt ? 'query_submitted' : reg?.status;
        setError('');
      } else {
        setError(res?.message || 'Could not fetch status');
      }
    } catch (e) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [transactionRef]);

  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(() => {
      if (statusRef.current && TERMINAL_STATUSES.includes(statusRef.current)) {
        clearInterval(pollRef.current);
        return;
      }
      fetchStatus(true);
    }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    if (data?.status === 'processing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [data?.status]);

  const handleDownloadCert = async () => {
    setCertLoading(true);
    try {
      const { fileUri } = await cacDownloadCertificate(transactionRef);
      try {
        const Sharing = await import('expo-sharing');
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf', dialogTitle: 'CAC Certificate' });
        } else {
          await Linking.openURL(fileUri);
        }
      } catch {
        await Linking.openURL(fileUri);
      }
    } catch (e) {
      alert(e.message || 'Could not download certificate');
    } finally {
      setCertLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    setReportLoading(true);
    try {
      const { fileUri } = await cacDownloadStatusReport(transactionRef);
      try {
        const Sharing = await import('expo-sharing');
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf', dialogTitle: 'CAC Status Report' });
        } else {
          await Linking.openURL(fileUri);
        }
      } catch {
        await Linking.openURL(fileUri);
      }
    } catch (e) {
      alert(e.message || 'Could not download status report');
    } finally {
      setReportLoading(false);
    }
  };

  // Derive display state — treat querySubmittedAt as a synthetic 'query_submitted' status
  const rawStatus      = data?.status || 'pending';
  const querySubmitted = rawStatus === 'queried' && !!data?.querySubmittedAt;
  const displayStatus  = querySubmitted ? 'query_submitted' : rawStatus;
  const cfg            = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.pending;
  const isApproved     = rawStatus === 'approved';
  const isQueried      = rawStatus === 'queried' && !querySubmitted;
  const queries        = Array.isArray(data?.queries) ? data.queries : [];

  const InfoRow = ({ label, value }) => value ? (
    <View style={[s.infoRow, { borderBottomColor: tc.border || '#F0F0F0' }]}>
      <Text style={[s.infoLabel, { color: tc.subheading }]}>{label}</Text>
      <Text style={[s.infoValue, { color: tc.heading }]} numberOfLines={2}>{value}</Text>
    </View>
  ) : null;

  return (
    <SafeAreaView style={[s.container, { backgroundColor: tc.background }]}>
      <StatusBarComponent />

      <View style={[s.header, { backgroundColor: tc.background, borderBottomColor: tc.border || '#E5E5EA', paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={tc.heading} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: tc.heading }]}>Registration Status</Text>
        <TouchableOpacity onPress={() => fetchStatus()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="refresh-outline" size={22} color={tc.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>

        {/* ── Status badge ────────────────────────────────────────────── */}
        <View style={[s.statusCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
          <Animated.View style={[s.statusIconWrap, { backgroundColor: `${cfg.color}20`, opacity: cfg.pulse ? pulse : 1 }]}>
            <Ionicons name={cfg.icon} size={36} color={cfg.color} />
          </Animated.View>
          <Text style={[s.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
          <Text style={[s.statusSub, { color: tc.subheading }]}>
            {displayStatus === 'pending'         && 'Your application has been received and is awaiting review.'}
            {displayStatus === 'processing'      && 'Your application is currently being processed by CAC.'}
            {displayStatus === 'approved'        && 'Congratulations! Your business name has been registered.'}
            {displayStatus === 'queried'         && 'CAC has flagged one or more items on your application. See details below and correct them.'}
            {displayStatus === 'query_submitted' && 'Your correction has been submitted to CAC for review. This typically takes 1–3 business days.'}
            {displayStatus === 'failed'          && 'Your application could not be processed. Please contact support.'}
          </Text>
        </View>

        {/* ── Query response submitted — awaiting review card ─────────── */}
        {querySubmitted && (
          <View style={[s.submittedCard, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
            <View style={s.submittedHeader}>
              <Ionicons name="checkmark-done-circle" size={20} color="#0284C7" />
              <Text style={s.submittedHeaderText}>Correction Submitted</Text>
            </View>

            {queries.length > 0 && (
              <View style={s.submittedFields}>
                <Text style={s.submittedFieldsLabel}>Fields you corrected:</Text>
                {queries.map((q, i) => {
                  const fieldKey = q.reason || q.field;
                  return (
                    <Text key={i} style={s.submittedFieldItem}>
                      • {QUERY_REASON_LABELS[fieldKey] || fieldKey || 'Unknown field'}
                    </Text>
                  );
                })}
              </View>
            )}

            {!!data.querySubmittedAt && (
              <Text style={s.submittedTs}>Submitted {fmtDate(data.querySubmittedAt)}</Text>
            )}

            <Text style={s.submittedNote}>
              CAC will review your correction and either approve the registration or raise a new query. You will be notified by email.
            </Text>
          </View>
        )}

        {/* ── Query details — action needed ────────────────────────────── */}
        {isQueried && queries.length > 0 && (
          <View style={s.queryCard}>
            <View style={s.queryHeader}>
              <Ionicons name="alert-circle" size={20} color="#F97316" />
              <Text style={s.queryHeaderText}>What CAC Queried</Text>
            </View>

            {queries.map((q, i) => {
              const fieldKey = q.reason || q.field;
              const label    = QUERY_REASON_LABELS[fieldKey] || fieldKey || 'Unknown field';
              const comment  = q.comment || q.message || q.description || '';
              return (
                <View key={i} style={[s.queryItem, i < queries.length - 1 && s.queryItemBorder]}>
                  <View style={s.queryItemDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.queryItemField}>{label}</Text>
                    {!!comment && <Text style={s.queryItemComment}>{comment}</Text>}
                  </View>
                </View>
              );
            })}

            <View style={s.queryCTAWrap}>
              <TouchableOpacity
                style={s.fixBtn}
                onPress={() => navigation.navigate('CACScreen', {
                  resubmitRef:   transactionRef,
                  initialData:   data?.registrationData,
                  queriedFields: queries.map(q => q.reason || q.field || q.comment).filter(Boolean),
                })}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={18} color="#FFF" />
                <Text style={s.fixBtnText}>Fix & Resubmit</Text>
              </TouchableOpacity>
              <Text style={s.queryNote}>No additional charge — your original payment covers the resubmission.</Text>
            </View>
          </View>
        )}

        {/* ── Application details ──────────────────────────────────────── */}
        {data && (
          <View style={[s.detailCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
            <Text style={[s.sectionTitle, { color: tc.subheading }]}>APPLICATION DETAILS</Text>
            <InfoRow label="Business Name"   value={businessName || data.registrationData?.proposedOption1} />
            <InfoRow label="Transaction Ref" value={transactionRef} />
            <InfoRow label="RC Number"       value={data.rcNumber} />
            <InfoRow label="TIN"             value={data.tin} />
            <InfoRow label="Submitted"       value={fmtDate(data.createdAt)} />
            <InfoRow label="Last Updated"    value={fmtDate(data.updatedAt)} />
          </View>
        )}

        {/* ── Certificate / download — approved only ───────────────────── */}
        {isApproved && (
          <View style={[s.actionsCard, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}>
            <Text style={[s.sectionTitle, { color: tc.subheading }]}>NEXT STEPS</Text>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: tc.primary, opacity: certLoading ? 0.7 : 1 }]}
              onPress={handleDownloadCert} disabled={certLoading} activeOpacity={0.85}
            >
              {certLoading ? <ActivityIndicator color="#FFF" /> : (
                <><Ionicons name="document-text-outline" size={20} color="#FFF" /><Text style={s.actionBtnText}>Download Certificate</Text></>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: '#0F766E', opacity: reportLoading ? 0.7 : 1 }]}
              onPress={handleDownloadReport} disabled={reportLoading} activeOpacity={0.85}
            >
              {reportLoading ? <ActivityIndicator color="#FFF" /> : (
                <><Ionicons name="bar-chart-outline" size={20} color="#FFF" /><Text style={s.actionBtnText}>Download Status Report</Text></>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Loading / error */}
        {loading && !data && (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={tc.primary} />
            <Text style={[s.loadingText, { color: tc.subheading }]}>Fetching status…</Text>
          </View>
        )}
        {!!error && (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* Polling notice — only for non-terminal, non-querySubmitted states */}
        {!TERMINAL_STATUSES.includes(rawStatus) && !querySubmitted && (
          <View style={[s.pollingNote, { backgroundColor: `${tc.primary}10` }]}>
            <Ionicons name="sync-outline" size={14} color={tc.primary} />
            <Text style={[s.pollingText, { color: tc.subheading }]}>Status updates automatically every 30 seconds.</Text>
          </View>
        )}

        {/* Bottom CTAs */}
        <View style={s.ctaRow}>
          <TouchableOpacity
            style={[s.ctaBtn, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
            onPress={() => navigation.navigate('CACHub')} activeOpacity={0.8}
          >
            <Ionicons name="list-outline" size={18} color={tc.primary} />
            <Text style={[s.ctaBtnText, { color: tc.primary }]}>My Applications</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.ctaBtn, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA' }]}
            onPress={() => navigation.navigate('MainTabs')} activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={18} color={tc.primary} />
            <Text style={[s.ctaBtnText, { color: tc.primary }]}>Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle:{ fontSize: 17, fontWeight: '700' },
  scroll:    { paddingHorizontal: 16, paddingTop: 20 },

  statusCard:    { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', marginBottom: 16, gap: 10 },
  statusIconWrap:{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  statusLabel:   { fontSize: 20, fontWeight: '800' },
  statusSub:     { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  /* Response submitted card */
  submittedCard:       { borderRadius: 14, borderWidth: 1.5, padding: 16, marginBottom: 14, gap: 10 },
  submittedHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submittedHeaderText: { fontSize: 14, fontWeight: '700', color: '#0284C7' },
  submittedFields:     { gap: 4 },
  submittedFieldsLabel:{ fontSize: 12, color: '#0369A1', fontWeight: '600' },
  submittedFieldItem:  { fontSize: 12, color: '#0369A1', lineHeight: 20 },
  submittedTs:         { fontSize: 11, color: '#0369A1', fontWeight: '500' },
  submittedNote:       { fontSize: 12, color: '#075985', lineHeight: 18 },

  /* Query card */
  queryCard:       { borderRadius: 14, borderWidth: 1.5, borderColor: '#FDBA74', backgroundColor: '#FFF7ED', padding: 16, marginBottom: 14 },
  queryHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  queryHeaderText: { fontSize: 14, fontWeight: '700', color: '#C2410C' },
  queryItem:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  queryItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#FED7AA' },
  queryItemDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F97316', marginTop: 5, flexShrink: 0 },
  queryItemField:  { fontSize: 13, fontWeight: '700', color: '#1C1C1E' },
  queryItemComment:{ fontSize: 12, color: '#7C2D12', lineHeight: 18, marginTop: 2 },
  queryCTAWrap:    { marginTop: 12, borderTopWidth: 1, borderTopColor: '#FED7AA', paddingTop: 12, gap: 8 },
  fixBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F97316', paddingVertical: 13, borderRadius: 10 },
  fixBtnText:      { color: '#FFF', fontSize: 14, fontWeight: '700' },
  queryNote:       { fontSize: 11, color: '#9A3412', textAlign: 'center', lineHeight: 16 },

  detailCard:   { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12 },
  infoRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  infoLabel:    { fontSize: 13, flex: 1 },
  infoValue:    { fontSize: 13, fontWeight: '600', flex: 1.5, textAlign: 'right' },

  actionsCard:  { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, marginBottom: 10 },
  actionBtnText:{ color: '#FFF', fontSize: 15, fontWeight: '700' },

  centered:    { paddingVertical: 40, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  errorBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEE2E2', padding: 12, borderRadius: 10, marginBottom: 16 },
  errorText:   { fontSize: 13, color: '#EF4444', flex: 1 },
  pollingNote: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginBottom: 20 },
  pollingText: { fontSize: 12, flex: 1 },

  ctaRow:    { flexDirection: 'row', gap: 10, marginTop: 4 },
  ctaBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 10, borderWidth: 1 },
  ctaBtnText:{ fontSize: 13, fontWeight: '600' },
});
