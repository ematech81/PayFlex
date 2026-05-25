import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useWallet } from '../../context/WalletContext';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import ActionModal from 'constants/ActionModal';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';

const STATUS_CHIPS = ['All', 'Draft', 'Pending', 'Paid', 'Overdue'];

const SORT_MODES = [
  { key: 'newest', label: 'Newest', icon: 'time-outline' },
  { key: 'oldest', label: 'Oldest', icon: 'time-outline' },
  { key: 'high',   label: 'High ₦',  icon: 'trending-up-outline' },
  { key: 'low',    label: 'Low ₦',   icon: 'trending-down-outline' },
];

const isOverdue = (invoice) =>
  invoice.dueDate &&
  new Date(invoice.dueDate) < new Date() &&
  invoice.status !== 'Paid';

const InvoiceTabScreen = () => {
  const { invoices = [], deleteInvoice, setInvoicePaid } = useWallet();
  const navigation = useNavigation();
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;

  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');
  const [sortIndex, setSortIndex] = useState(0);

  const currentSort = SORT_MODES[sortIndex];

  const cycleSort = () => setSortIndex((i) => (i + 1) % SORT_MODES.length);

  // ── Filtering + sorting ──────────────────────────────────────────────────
  const displayedInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    let list = invoices.filter((inv) => {
      // Status chip filter
      if (activeStatus === 'Overdue') {
        if (!isOverdue(inv)) return false;
      } else if (activeStatus !== 'All') {
        if (inv.status !== activeStatus) return false;
      }

      // Search: match customer name or any product name
      if (q) {
        const matchesCustomer = inv.customer?.name?.toLowerCase().includes(q);
        const matchesProduct  = (inv.products || []).some((p) =>
          p.name?.toLowerCase().includes(q)
        );
        const matchesTitle = inv.title?.toLowerCase().includes(q);
        if (!matchesCustomer && !matchesProduct && !matchesTitle) return false;
      }

      return true;
    });

    // Sort
    list = [...list].sort((a, b) => {
      if (currentSort.key === 'newest') {
        return new Date(b.dueDate || b.createdAt || 0) - new Date(a.dueDate || a.createdAt || 0);
      }
      if (currentSort.key === 'oldest') {
        return new Date(a.dueDate || a.createdAt || 0) - new Date(b.dueDate || b.createdAt || 0);
      }
      if (currentSort.key === 'high') return (b.total || 0) - (a.total || 0);
      if (currentSort.key === 'low')  return (a.total || 0) - (b.total || 0);
      return 0;
    });

    return list;
  }, [invoices, searchQuery, activeStatus, sortIndex]);

  // ── Navigation handlers ──────────────────────────────────────────────────
  const handleCreateNew = () => {
    navigation.navigate('InvoiceCreation', {
      invoice: {
        customer: null, title: '', dueDate: null, currency: 'NGN',
        products: [], discount: { type: 'Fixed', value: 0 },
        tax: { type: 'Fixed', value: 0 }, subtotal: 0,
        discountAmount: 0, taxAmount: 0, total: 0, status: 'Draft',
      },
    });
  };

  const handleEdit   = (invoice) => navigation.navigate('InvoiceCreation', { invoice });
  const handleViewDetails = (invoice) => navigation.navigate('InvoiceDetails', { invoice });

  const handleDelete = (invoiceId) => {
    Alert.alert('Delete Invoice', 'Are you sure you want to delete this invoice?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteInvoice(invoiceId) },
    ]);
  };

  const handleMarkAsPaid = (invoiceId) => {
    Alert.alert('Mark as Paid', 'Confirm that this invoice has been paid?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => setInvoicePaid(invoiceId) },
    ]);
  };

  const openMenu = (invoice) => {
    if (invoice) { setSelectedInvoice(invoice); setIsMenuVisible(true); }
  };

  const getMenuActions = (invoice) => {
    if (!invoice) return [];
    const actions = [];
    if (invoice.status !== 'Paid') {
      actions.push({ label: 'Edit', onPress: () => handleEdit(invoice), style: { color: themeColors.heading } });
    }
    if (invoice.status !== 'Pending') {
      actions.push({ label: 'Delete', onPress: () => handleDelete(invoice._id || invoice.id), style: { color: themeColors.destructive } });
    }
    if (invoice.status === 'Pending') {
      actions.push({ label: 'Mark as Paid', onPress: () => handleMarkAsPaid(invoice._id || invoice.id), style: { color: themeColors.heading } });
    }
    return actions;
  };

  // ── Status badge ─────────────────────────────────────────────────────────
  const getStatusBadge = (invoice) => {
    if (isOverdue(invoice)) return { label: 'Overdue', bg: '#EF4444' };
    switch (invoice.status) {
      case 'Paid':    return { label: 'Paid',    bg: '#059669' };
      case 'Pending': return { label: 'Pending', bg: '#2563EB' };
      case 'Draft':   return { label: 'Draft',   bg: '#9CA3AF' };
      default:        return { label: invoice.status, bg: '#9CA3AF' };
    }
  };

  // ── Render invoice card ──────────────────────────────────────────────────
  const renderInvoice = ({ item }) => {
    const badge = getStatusBadge(item);
    const currencySymbol = item.currency === 'USD' ? '$' : item.currency === 'EUR' ? '€' : '₦';

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: themeColors.card }]}
        onPress={() => handleViewDetails(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <Text style={[styles.cardTitle, { color: themeColors.heading }]} numberOfLines={1}>
              {item.title || item.invoiceNumber || '—'}
            </Text>
            <Text style={[styles.cardCustomer, { color: themeColors.subheading }]} numberOfLines={1}>
              {item.customer?.name || 'No customer'}
            </Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={[styles.cardAmount, { color: themeColors.heading }]}>
              {currencySymbol}{(item.total || 0).toFixed(2)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
              <Text style={styles.statusBadgeText}>{badge.label}</Text>
            </View>
          </View>
        </View>

        {item.dueDate && (
          <Text style={[styles.cardDate, { color: themeColors.subheading }]}>
            Due: {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        )}

        <TouchableOpacity style={styles.menuBtn} onPress={() => openMenu(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="more-vert" size={22} color={themeColors.subheading} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // ── Status chip ──────────────────────────────────────────────────────────
  const renderChip = (status) => {
    const active = activeStatus === status;
    const chipColors = {
      All:     active ? '#4a00e0' : null,
      Draft:   active ? '#6B7280' : null,
      Pending: active ? '#2563EB' : null,
      Paid:    active ? '#059669' : null,
      Overdue: active ? '#EF4444' : null,
    };
    const bg = chipColors[status];

    return (
      <TouchableOpacity
        key={status}
        style={[
          styles.chip,
          { borderColor: bg || themeColors.border },
          active && { backgroundColor: bg },
        ]}
        onPress={() => setActiveStatus(status)}
        activeOpacity={0.75}
      >
        <Text style={[styles.chipText, { color: active ? '#fff' : themeColors.subheading }]}>
          {status}
        </Text>
      </TouchableOpacity>
    );
  };

  const hasInvoices = invoices.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>

      {/* ── Search + Sort + Chips (only when invoices exist) ─────────── */}
      {hasInvoices && (
        <>
          <View style={[styles.searchRow, { backgroundColor: themeColors.background }]}>
            <View style={[styles.searchBox, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Ionicons name="search-outline" size={18} color={themeColors.subheading} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: themeColors.heading }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search customer or item…"
                placeholderTextColor={themeColors.subheading}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={themeColors.subheading} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.sortBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
              onPress={cycleSort}
              activeOpacity={0.8}
            >
              <Ionicons name={currentSort.icon} size={16} color="#4a00e0" />
              <Text style={styles.sortLabel}>{currentSort.label}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            style={{ flexGrow: 0 }}
          >
            {STATUS_CHIPS.map(renderChip)}
          </ScrollView>

          <Text style={[styles.resultsCount, { color: themeColors.subheading }]}>
            {displayedInvoices.length} invoice{displayedInvoices.length !== 1 ? 's' : ''}
          </Text>
        </>
      )}

      {/* ── List / Empty state ────────────────────────────────────────── */}
      {!hasInvoices ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={56} color={themeColors.subheading} style={{ marginBottom: 12, opacity: 0.5 }} />
          <Text style={[styles.emptyText, { color: themeColors.heading }]}>No invoices yet</Text>
          <Text style={[styles.emptySubText, { color: themeColors.subheading }]}>
            Tap the + button to create your first invoice
          </Text>
        </View>
      ) : displayedInvoices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color={themeColors.subheading} style={{ marginBottom: 12, opacity: 0.4 }} />
          <Text style={[styles.emptyText, { color: themeColors.heading }]}>No results found</Text>
          <Text style={[styles.emptySubText, { color: themeColors.subheading }]}>
            Try a different search or filter
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedInvoices}
          renderItem={renderInvoice}
          keyExtractor={(item) => item._id?.toString() || item.id || String(Math.random())}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── FAB ───────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: themeColors.button }]}
        onPress={handleCreateNew}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <ActionModal
        isVisible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        actions={getMenuActions(selectedInvoice)}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Search + sort ────────────────────────────────────────────────────────
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4a00e0',
  },

  // ── Chips ────────────────────────────────────────────────────────────────
  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Results count ────────────────────────────────────────────────────────
  resultsCount: {
    fontSize: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
  },

  // ── Invoice card ─────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    paddingTop: 4,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardLeft: { flex: 1, marginRight: 12 },
  cardRight: { alignItems: 'flex-end' },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardCustomer: { fontSize: 13 },
  cardAmount: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardDate: { fontSize: 12, marginTop: 2 },
  menuBtn: { position: 'absolute', top: 12, right: -4 },

  // ── Empty states ─────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyText: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  emptySubText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },

  // ── FAB ──────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
});

export default InvoiceTabScreen;
