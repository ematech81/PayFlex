import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@payflex_notifications';
const MAX_NOTIFICATIONS = 100;

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) setNotifications(JSON.parse(raw));
    }).catch(() => {});
  }, []);

  const persist = async (list) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (_) {}
  };

  const addNotification = useCallback(async ({ type = 'info', title, body, reference, serviceName, amount }) => {
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
  }, []);

  const markRead = useCallback(async (id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      persist(updated);
      return updated;
    });
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      persist(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    try { await AsyncStorage.removeItem(STORAGE_KEY); } catch (_) {}
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
