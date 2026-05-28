import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { useNotifications } from 'context/NotificationContext';
import { formatCurrency } from 'CONSTANT/formatCurrency';

// ─── Notification type config ────────────────────────────────────────────────
const TYPE_CONFIG = {
  success:  { icon: 'checkmark-circle',    color: '#4CAF50', bg: '#4CAF5015' },
  failed:   { icon: 'close-circle',        color: '#FF6B6B', bg: '#FF6B6B15' },
  topup:    { icon: 'wallet',              color: '#3498DB', bg: '#3498DB15' },
  referral: { icon: 'gift',               color: '#FFA500', bg: '#FFA50015' },
  info:     { icon: 'information-circle',  color: '#8B5CF6', bg: '#8B5CF615' },
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

function NotificationItem({ item, themeColors, onPress }) {
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
  return (
    <TouchableOpacity
      style={[
        styles.item,
        { backgroundColor: themeColors.card },
        !item.read && { borderLeftWidth: 3, borderLeftColor: cfg.color },
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconCircle, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon} size={22} color={cfg.color} />
      </View>
      <View style={styles.itemBody}>
        <View style={styles.itemTop}>
          <Text style={[styles.itemTitle, { color: themeColors.heading }, !item.read && styles.unread]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.itemTime, { color: themeColors.subtext }]}>{timeAgo(item.timestamp)}</Text>
        </View>
        <Text style={[styles.itemBody2, { color: themeColors.subheading }]} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
      {!item.read && <View style={[styles.unreadDot, { backgroundColor: cfg.color }]} />}
    </TouchableOpacity>
  );
}

export default function NotificationsInboxScreen({ navigation }) {
  const isDarkMode = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();

  const handlePress = useCallback((item) => {
    markRead(item.id);
    if (item.reference) {
      navigation.navigate('TransactionDetails', { reference: item.reference });
    }
  }, [markRead, navigation]);

  const handleClearAll = () => {
    Alert.alert('Clear all notifications', 'This will delete your entire notification history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear all', style: 'destructive', onPress: clearAll },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBarComponent />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border || '#E0E0E0', paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={themeColors.heading} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: themeColors.heading }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={[styles.headerBadge, { backgroundColor: themeColors.primary }]}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.headerBtn}>
              <Text style={[styles.headerBtnText, { color: themeColors.primary }]}>Mark all read</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.headerBtn}>
              <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <NotificationItem item={item} themeColors={themeColors} onPress={handlePress} />
        )}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="notifications-off-outline" size={56} color={themeColors.subtext} />
            <Text style={[styles.emptyTitle, { color: themeColors.heading }]}>No notifications yet</Text>
            <Text style={[styles.emptyBody, { color: themeColors.subheading }]}>
              Notifications for your transactions and account activity will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  headerBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerBtn: { padding: 2 },
  headerBtnText: { fontSize: 13, fontWeight: '600' },
  listContent: { paddingVertical: 8 },
  emptyContainer: { flex: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  itemBody: { flex: 1 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemTitle: { fontSize: 14, fontWeight: '500', flex: 1, marginRight: 8 },
  unread: { fontWeight: '700' },
  itemTime: { fontSize: 11, flexShrink: 0 },
  itemBody2: { fontSize: 13, lineHeight: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyBody: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
