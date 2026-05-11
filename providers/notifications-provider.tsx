import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { apiFetch } from '@/lib/api';
import { NotificationItem } from '@/types/models';
import { useAuth } from '@/providers/auth-provider';

type NotificationsContextValue = {
  notifications: NotificationItem[];
  loading: boolean;
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function areNotificationsSame(previous: NotificationItem[], next: NotificationItem[]) {
  if (previous.length !== next.length) {
    return false;
  }

  return previous.every((item, index) => {
    const nextItem = next[index];
    return (
      nextItem &&
      item.id === nextItem.id &&
      item.message === nextItem.message &&
      item.createdAt === nextItem.createdAt &&
      item.readAt === nextItem.readAt
    );
  });
}

export function NotificationsProvider({ children }: PropsWithChildren) {
  const { user, ready } = useAuth();
  const isRefreshingRef = useRef(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const applyResponse = useCallback((response: { notifications: NotificationItem[] }) => {
    setNotifications((previous) =>
      areNotificationsSame(previous, response.notifications) ? previous : response.notifications
    );
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!ready || !user || isRefreshingRef.current) {
      return;
    }

    try {
      isRefreshingRef.current = true;
      const response = await apiFetch<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications');
      applyResponse(response);
    } finally {
      isRefreshingRef.current = false;
      setLoading(false);
    }
  }, [applyResponse, ready, user]);

  const markAllRead = useCallback(async () => {
    if (!ready || !user) {
      return;
    }

    const response = await apiFetch<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications/read', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    applyResponse(response);
  }, [applyResponse, ready, user]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    refreshNotifications().catch(() => {
      setNotifications([]);
      setLoading(false);
    });

    const refreshInterval = setInterval(() => {
      if (AppState.currentState === 'active') {
        refreshNotifications().catch(() => undefined);
      }
    }, 3000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [ready, refreshNotifications, user]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications]
  );

  return (
    <NotificationsContext.Provider value={{ notifications, loading, unreadCount, refreshNotifications, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const value = useContext(NotificationsContext);

  if (!value) {
    throw new Error('useNotifications must be used inside NotificationsProvider');
  }

  return value;
}
