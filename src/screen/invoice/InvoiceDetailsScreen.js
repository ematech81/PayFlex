import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from 'context/WalletContext';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import ReceiptModal from 'component/ReceiptModal';
import AlertMessage from 'component/AlertMessage';

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A';

const fmt = (n, cur) => formatCurrency(n || 0, cur || 'NGN');

const InvoiceDetailsScreen = () => {
  const { params } = useRoute();
  const { invoice: routeInvoice } = params || {};
  const { updateInvoice, wallet } = useWallet();
  const navigation = useNavigation();
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const [localInvoice, setLocalInvoice] = useState(routeInvoice);
  const [localStatus, setLocalStatus] = useState(routeInvoice?.status || 'Processing');
  const [isBusy, setIsBusy]     = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showAlert, setShowAlert]     = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const senderName = wallet?.user?.name || wallet?.user?.username || 'PayFlex Solutions';
  const currency   = localInvoice?.currency || 'NGN';
  const invoiceNum = localInvoice?.invoiceNumber || localInvoice?.id || '—';

  const isOverdue =
    localInvoice?.dueDate &&
    new Date(localInvoice.dueDate) < new Date() &&
    localStatus !== 'Paid';

  const phase =
    localStatus === 'Processing' ? 'save'   :
    localStatus === 'Draft'      ? 'submit' :
    localStatus === 'Pending'    ? 'paid'   : 'done';

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'PayFlex',
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 8, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={themeColors.heading} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 20, marginRight: 12 }}>
          <TouchableOpacity onPress={() => setShowReceipt(true)}>
            <Ionicons name="share-outline" size={22} color={themeColors.heading} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowReceipt(true)}>
            <Ionicons name="download-outline" size={22} color={themeColors.heading} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, themeColors]);

  // ── actions ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsBusy(true);
    try {
      const saved = await updateInvoice({ ...localInvoice, status: 'Draft' });
      if (saved) setLocalInvoice(saved);
      setLocalStatus('Draft');
      setAlertMessage('Invoice saved as draft!');
      setShowAlert(true);
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSubmit = async () => {
    setIsBusy(true);
    try {
      const saved = await updateInvoice({ ...localInvoice, status: 'Pending' });
      if (saved) setLocalInvoice(saved);
      setLocalStatus('Pending');
      setShowReceipt(true);
    } catch {
      Alert.alert('Error', 'Failed to submit invoice. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleMarkAsPaid = async () => {
    Alert.alert('Mark as Paid', 'Confirm this invoice has been paid?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setIsBusy(true);
          try {
            await updateInvoice({ ...localInvoice, status: 'Paid' });
            setLocalStatus('Paid');
            setAlertMessage('Invoice marked as paid!');
            setShowAlert(true);
            setTimeout(() => navigation.popToTop(), 1500);
          } catch {
            Alert.alert('Error', 'Failed to mark as paid. Please try again.');
          } finally {
            setIsBusy(false);
          }
        },
      },
    ]);
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    if (localStatus === 'Pending' || localStatus === 'Paid') navigation.popToTop();
  };

  // ── derived display values ───────────────────────────────────────────────────

  const discountPct =
    localInvoice?.discount?.type === 'Percentage' && localInvoice?.discount?.value > 0
      ? `(${localInvoice.discount.value}%)`
      : '';
  const vatPct =
    localInvoice?.tax?.type === 'Percentage' && localInvoice?.tax?.value > 0
      ? `(${localInvoice.tax.value}%)`
      : '';

  const primaryBtn = {
    save:   { label: 'Save Invoice',   icon: 'save-outline',              bg: '#4a00e0', onPress: handleSave },
    submit: { label: 'Submit Invoice', icon: 'paper-plane-outline',       bg: '#0A1628', onPress: handleSubmit },
    paid:   { label: 'Mark as Paid',   icon: 'checkmark-circle-outline',  bg: '#059669', onPress: handleMarkAsPaid },
    done:   null,
  }[phase];

  // ── badge ────────────────────────────────────────────────────────────────────

  const renderStatusBadge = () => {
    if (isOverdue)                return <View style={[styles.badge, { backgroundColor: '#EF4444' }]}><Text style={styles.badgeText}>OVERDUE</Text></View>;
    if (localStatus === 'Paid')   return <View style={[styles.badge, { backgroundColor: '#059669' }]}><Text style={styles.badgeText}>PAID</Text></View>;
    if (localStatus === 'Pending')return <View style={[styles.badge, { backgroundColor: '#2563EB' }]}><Text style={styles.badgeText}>PENDING</Text></View>;
    if (localStatus === 'Draft')  return <View style={[styles.badge, { backgroundColor: '#9CA3AF' }]}><Text style={styles.badgeText}>DRAFT</Text></View>;
    return null;
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Purple gradient header ─────────────────────────────────── */}
        <LinearGradient
          colors={['#2D0080', '#5B2BDB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.75}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerLabel}>INVOICE IDENTIFICATION</Text>
          <Text style={styles.headerInvNum}>{invoiceNum}</Text>

          <View style={styles.datePills}>
            <View style={styles.datePill}>
              <Text style={styles.datePillLabel}>ISSUED DATE</Text>
              <Text style={styles.datePillValue}>
                {fmtDate(localInvoice?.issuedDate || new Date())}
              </Text>
            </View>
            <View style={styles.datePill}>
              <Text style={styles.datePillLabel}>DUE DATE</Text>
              <Text style={styles.datePillValue}>{fmtDate(localInvoice?.dueDate)}</Text>
            </View>
          </View>

          {renderStatusBadge()}

          <Text style={styles.amountLabel}>TOTAL AMOUNT DUE</Text>
          <Text style={styles.amountValue}>{fmt(localInvoice?.total, currency)}</Text>
        </LinearGradient>

        {/* ── Billed To ─────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.microLabel}>BILLED TO</Text>
          <Text style={styles.cardTitle}>{localInvoice?.customer?.name || '—'}</Text>
          {!!localInvoice?.customer?.email && (
            <View style={styles.iconRow}>
              <Ionicons name="mail-outline" size={14} color="#9CA3AF" style={{ marginRight: 5 }} />
              <Text style={styles.cardSub}>{localInvoice.customer.email}</Text>
            </View>
          )}
          {!!localInvoice?.customer?.phone && (
            <View style={styles.iconRow}>
              <Ionicons name="call-outline" size={14} color="#9CA3AF" style={{ marginRight: 5 }} />
              <Text style={styles.cardSub}>{localInvoice.customer.phone}</Text>
            </View>
          )}
        </View>

        {/* ── From ──────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.microLabel}>FROM</Text>
          <Text style={[styles.cardTitle, { color: '#4a00e0' }]}>{senderName}</Text>
        </View>

        {/* ── Line items ────────────────────────────────────────────── */}
        {(localInvoice?.products || []).map((item, idx) => (
          <View key={item.id || idx} style={styles.card}>
            <View style={styles.lineItemHeader}>
              <Text style={styles.lineItemName} numberOfLines={2}>{item.name}</Text>
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyBadgeText}>×{item.quantity}</Text>
              </View>
            </View>
            <View style={styles.lineItemRow}>
              <Text style={styles.lineItemLabel}>Price Each</Text>
              <Text style={styles.lineItemPrice}>{fmt(item.price, currency)}</Text>
            </View>
            <View style={styles.lineItemSubtotalRow}>
              <Text style={styles.lineItemSubtotalLabel}>Subtotal</Text>
              <Text style={styles.lineItemSubtotal}>
                {fmt(item.quantity * item.price, currency)}
              </Text>
            </View>
          </View>
        ))}

        {/* ── Payment instructions ──────────────────────────────────── */}
        {(localInvoice?.bank || localInvoice?.accountNumber) && (
          <View style={[styles.card, styles.paymentCard]}>
            <View style={styles.paymentCardHeader}>
              <Ionicons name="business-outline" size={20} color="#4a00e0" style={{ marginRight: 8 }} />
              <Text style={styles.paymentCardTitle}>Payment Instructions</Text>
            </View>
            <View style={styles.paymentField}>
              <Text style={styles.paymentFieldLabel}>BANK NAME</Text>
              <Text style={styles.paymentFieldValue}>{localInvoice.bank || '—'}</Text>
            </View>
            <View style={styles.paymentField}>
              <Text style={styles.paymentFieldLabel}>ACCOUNT NUMBER</Text>
              <View style={styles.acctRow}>
                <Text style={styles.acctNumber}>{localInvoice.accountNumber || '—'}</Text>
                {!!localInvoice.accountNumber && (
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={() => Alert.alert('Account Number', localInvoice.accountNumber)}
                  >
                    <Ionicons name="copy-outline" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            {!!localInvoice.accountName && (
              <View style={styles.paymentField}>
                <Text style={styles.paymentFieldLabel}>ACCOUNT HOLDER</Text>
                <Text style={styles.paymentFieldValue}>{localInvoice.accountName}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Summary ───────────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{fmt(localInvoice?.subtotal, currency)}</Text>
          </View>
          {localInvoice?.discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount {discountPct}</Text>
              <Text style={[styles.summaryValue, styles.discountValue]}>
                −{fmt(localInvoice.discountAmount, currency)}
              </Text>
            </View>
          )}
          {localInvoice?.taxAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>VAT {vatPct}</Text>
              <Text style={styles.summaryValue}>+{fmt(localInvoice.taxAmount, currency)}</Text>
            </View>
          )}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Due</Text>
            <Text style={styles.totalValue}>{fmt(localInvoice?.total, currency)}</Text>
          </View>
        </View>

        {/* ── CTA button ────────────────────────────────────────────── */}
        {primaryBtn && (
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: primaryBtn.bg, opacity: isBusy ? 0.7 : 1 }]}
            onPress={primaryBtn.onPress}
            disabled={isBusy}
            activeOpacity={0.85}
          >
            {isBusy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name={primaryBtn.icon} size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.ctaBtnText}>{primaryBtn.label}</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* ── Generate Receipt (for any non-Processing invoice) ─────── */}
        {(phase === 'submit' || phase === 'paid' || phase === 'done') && (
          <TouchableOpacity
            style={styles.receiptBtn}
            onPress={() => setShowReceipt(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text-outline" size={18} color="#4a00e0" style={{ marginRight: 8 }} />
            <Text style={styles.receiptBtnText}>Generate Receipt</Text>
          </TouchableOpacity>
        )}

        {/* ── Footer ────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for your business. Please contact support@payflex.com for any inquiries.
          </Text>
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink}>Terms of Service</Text>
            <Text style={styles.footerSep}>  •  </Text>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <ReceiptModal
        visible={showReceipt}
        onClose={handleReceiptClose}
        invoice={localInvoice}
        senderName={senderName}
      />

      {showAlert && (
        <AlertMessage message={alertMessage} onClose={() => setShowAlert(false)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F0F7' },
  scroll: { paddingBottom: 24 },

  // ── Header gradient ──────────────────────────────────────────────────────
  headerCard: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 36,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 14,
  },
  backBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    padding: 8,
    marginBottom: 16,
  },
  headerLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  headerInvNum: {
    color: '#fff',
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 18,
  },
  datePills: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  datePill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flex: 1,
  },
  datePillLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  datePillValue: { color: '#fff', fontSize: 13, fontWeight: '600' },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 16,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  amountLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  amountValue: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -0.5 },

  // ── Card ────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  microLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  cardTitle: { color: '#111827', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  cardSub: { color: '#6B7280', fontSize: 14 },
  iconRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },

  // ── Line items ───────────────────────────────────────────────────────────
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  lineItemName: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827', marginRight: 10 },
  qtyBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  qtyBadgeText: { color: '#6B7280', fontSize: 13, fontWeight: '700' },
  lineItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  lineItemLabel: { color: '#6B7280', fontSize: 14 },
  lineItemPrice: { color: '#111827', fontSize: 14, fontWeight: '500' },
  lineItemSubtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  lineItemSubtotalLabel: { color: '#111827', fontSize: 14, fontWeight: '700' },
  lineItemSubtotal: { color: '#111827', fontSize: 14, fontWeight: '800' },

  // ── Payment card ─────────────────────────────────────────────────────────
  paymentCard: { borderWidth: 1, borderColor: '#E5E7EB' },
  paymentCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  paymentCardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  paymentField: { marginBottom: 12 },
  paymentFieldLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  paymentFieldValue: { color: '#111827', fontSize: 15 },
  acctRow: { flexDirection: 'row', alignItems: 'center' },
  acctNumber: { color: '#4a00e0', fontSize: 20, fontWeight: '800', flex: 1 },
  copyBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginLeft: 8,
  },

  // ── Summary ──────────────────────────────────────────────────────────────
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: { color: '#6B7280', fontSize: 15 },
  summaryValue: { color: '#111827', fontSize: 15 },
  discountValue: { color: '#EF4444' },
  summaryDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 },
  totalLabel: { color: '#111827', fontSize: 17, fontWeight: '800' },
  totalValue: { color: '#111827', fontSize: 22, fontWeight: '900' },

  // ── CTA button ───────────────────────────────────────────────────────────
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    borderRadius: 14,
    paddingVertical: 18,
    marginTop: 8,
    marginBottom: 36,
  },
  ctaBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 36,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#4a00e0',
    backgroundColor: 'rgba(74,0,224,0.05)',
  },
  receiptBtnText: { color: '#4a00e0', fontSize: 16, fontWeight: '700' },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  footerText: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  footerLinks: { flexDirection: 'row', alignItems: 'center' },
  footerLink: { color: '#6B7280', fontSize: 12, fontWeight: '500' },
  footerSep: { color: '#D1D5DB', fontSize: 12 },
});

export default InvoiceDetailsScreen;
