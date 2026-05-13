import Constants from 'expo-constants';
import { Platform } from 'react-native';

const STORAGE_KEY = 'horang-market-token';
let sessionToken: string | null = null;

function getWebStorage() {
  if (Platform.OS !== 'web') {
    return null;
  }

  return globalThis.localStorage ?? null;
}

function resolveHost() {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost ?? '';

  if (hostUri) {
    const host = hostUri.split(':')[0];

    if (Platform.OS === 'web' && host === 'localhost') {
      return '127.0.0.1';
    }

    return host;
  }

  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  if (Platform.OS === 'web') {
    return '127.0.0.1';
  }

  return '127.0.0.1';
}

export const apiBaseUrl = `http://${resolveHost()}:4000/api`;

export function initializeSessionToken() {
  if (sessionToken) {
    return sessionToken;
  }

  const storage = getWebStorage();
  sessionToken = storage?.getItem(STORAGE_KEY) ?? null;
  return sessionToken;
}

export function setSessionToken(token: string | null, persist = false) {
  sessionToken = token;

  const storage = getWebStorage();
  if (!storage) {
    return;
  }

  if (token && persist) {
    storage.setItem(STORAGE_KEY, token);
  } else {
    storage.removeItem(STORAGE_KEY);
  }
}

export function getSessionToken() {
  return sessionToken ?? initializeSessionToken();
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getSessionToken();
  const headers = new Headers(init?.headers ?? {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('x-session-token', token);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.message || '요청을 처리하지 못했습니다.');
  }

  return payload as T;
}

export function buildQuery(params: Record<string, string | number | null | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}
