import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { apiFetch } from '@/lib/api';
import { ChatRoomSummary } from '@/types/models';
import { useAuth } from '@/providers/auth-provider';

type ChatRoomsContextValue = {
  rooms: ChatRoomSummary[];
  loading: boolean;
  unreadCount: number;
  refreshRooms: () => Promise<void>;
};

const ChatRoomsContext = createContext<ChatRoomsContextValue | null>(null);

function areRoomsSame(previous: ChatRoomSummary[], next: ChatRoomSummary[]) {
  if (previous.length !== next.length) {
    return false;
  }

  return previous.every((room, index) => {
    const nextRoom = next[index];

    return (
      nextRoom &&
      room.id === nextRoom.id &&
      room.lastMessage === nextRoom.lastMessage &&
      room.lastMessageAt === nextRoom.lastMessageAt &&
      room.unreadCount === nextRoom.unreadCount
    );
  });
}

export function ChatRoomsProvider({ children }: PropsWithChildren) {
  const { user, ready } = useAuth();
  const isRefreshingRef = useRef(false);
  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshRooms = useCallback(async () => {
    if (!ready || !user || isRefreshingRef.current) {
      return;
    }

    try {
      isRefreshingRef.current = true;
      const response = await apiFetch<{ rooms: ChatRoomSummary[] }>('/chats');
      setRooms((previousRooms) => (areRoomsSame(previousRooms, response.rooms) ? previousRooms : response.rooms));
    } finally {
      isRefreshingRef.current = false;
      setLoading(false);
    }
  }, [ready, user]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!user) {
      setRooms([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    refreshRooms().catch(() => {
      setRooms([]);
      setLoading(false);
    });

    const refreshInterval = setInterval(() => {
      if (AppState.currentState === 'active') {
        refreshRooms().catch(() => undefined);
      }
    }, 3000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [ready, refreshRooms, user]);

  const unreadCount = useMemo(() => rooms.reduce((total, room) => total + room.unreadCount, 0), [rooms]);

  return (
    <ChatRoomsContext.Provider value={{ rooms, loading, unreadCount, refreshRooms }}>
      {children}
    </ChatRoomsContext.Provider>
  );
}

export function useChatRooms() {
  const value = useContext(ChatRoomsContext);

  if (!value) {
    throw new Error('useChatRooms must be used inside ChatRoomsProvider');
  }

  return value;
}
