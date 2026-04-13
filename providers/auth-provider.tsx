import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { apiFetch, initializeSessionToken, setSessionToken } from '@/lib/api';
import { AppStats, AuthResponse, AuthSessionResponse, UserSummary } from '@/types/models';

type LoginPayload = {
  username: string;
  password: string;
  keepLoggedIn: boolean;
};

type RegisterPayload = {
  email: string;
  username: string;
  password: string;
  nickname: string;
  department?: string;
  studentYear?: number;
  profileImageUrl?: string;
};

type AuthContextValue = {
  user: UserSummary | null;
  stats: AppStats | null;
  ready: boolean;
  refreshSession: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  applyProfile: (user: UserSummary) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [ready, setReady] = useState(false);

  async function refreshSession() {
    const payload = await apiFetch<AuthSessionResponse>('/auth/session');
    setUser(payload.user);
    setStats(payload.stats ?? null);

    if (payload.token) {
      setSessionToken(payload.token, true);
    }
  }

  async function login(payload: LoginPayload) {
    const response = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setSessionToken(response.token, payload.keepLoggedIn);
    setUser(response.user);
    await refreshSession();
  }

  async function register(payload: RegisterPayload) {
    const response = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setSessionToken(response.token, true);
    setUser(response.user);
    await refreshSession();
  }

  async function logout() {
    await apiFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    setSessionToken(null, false);
    setUser(null);
    setStats(null);
  }

  useEffect(() => {
    initializeSessionToken();

    refreshSession()
      .catch(() => {
        setSessionToken(null, false);
        setUser(null);
        setStats(null);
      })
      .finally(() => {
        setReady(true);
      });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        stats,
        ready,
        refreshSession,
        login,
        register,
        logout,
        applyProfile: setUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
}
