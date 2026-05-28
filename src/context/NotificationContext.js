import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWallet } from 'context/WalletContext';

const MAX_NOTIFICATIONS = 100;

// Per-user key — each account gets its own isolated notification list
const storageKey = (userId) => `@payflex_notifications_${userId}`;

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { wallet } = useWallet();
  const userId = wallet?.user?.id || wallet?.user?._id || null;

  const [notifications, setNotifications] = useState([]);
  const currentUserIdRef = useRef(null);

  // Reload notifications whenever the logged-in user changes
  useEffect(() => {
    if (userId === currentUserIdRef.current) return;

    // Clear in-memory notifications immediately so the previous user's
    // notifications are never visible to the new user even for a split second
    setNotifications([]);
    currentUserIdRef.current = userId;

    if (!userId) return;

    AsyncStorage.getItem(storageKey(userId)).then(raw => {
      if (raw) setNotifications(JSON.parse(raw));
    }).catch(() => {});
  }, [userId]);

  const persist = useCallback(async (list) => {
    if (!currentUserIdRef.current) return;
    try {
      await AsyncStorage.setItem(storageKey(currentUserIdRef.current), JSON.stringify(list));
    } catch (_) {}
  }, []);

  const addNotification = useCallback(async ({ type = 'info', title, body, reference, serviceName, amount }) => {
    if (!currentUserIdRef.current) return;

    const notification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      title,
      body,
      reference: reference || null,
      serviceName: serviceName || null,
      amount: amount || null,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, MAX_NOTIFICATIONS);
      persist(updated);
      return updated;
    });
  }, [persist]);

  const markRead = useCallback(async (id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      persist(updated);
      return updated;
    });
  }, [persist]);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      persist(updated);
      return updated;
    });
  }, [persist]);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    if (currentUserIdRef.current) {
      try { await AsyncStorage.removeItem(storageKey(currentUserIdRef.current)); } catch (_) {}
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markRead, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
