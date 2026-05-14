import Constants from 'expo-constants';
import { Platform } from 'react-native';

const STORAGE_KEY = 'horang-market-token';
const PRODUCTION_API_BASE_URL = 'https://ku-market-d8o2.onrender.com/api';
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

function normalizeApiBaseUrl(url: string) {
  const normalizedUrl = url.trim().replace(/\/+$/, '');
  return normalizedUrl.endsWith('/api') ? normalizedUrl : `${normalizedUrl}/api`;
}

function isHostedWeb() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return false;
  }

  return !['localhost', '127.0.0.1'].includes(window.location.hostname);
}

function isLocalApiBaseUrl(url: string) {
  try {
    return ['localhost', '127.0.0.1'].includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

function resolveApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configuredUrl) {
    if (isHostedWeb() && isLocalApiBaseUrl(configuredUrl)) {
      return PRODUCTION_API_BASE_URL;
    }

    return normalizeApiBaseUrl(configuredUrl);
  }

  if (isHostedWeb()) {
    return PRODUCTION_API_BASE_URL;
  }

  return `http://${resolveHost()}:4000/api`;
}

export const apiBaseUrl = resolveApiBaseUrl();

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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  if (token) {
    headers.set('x-session-token', token);
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      credentials: 'include',
      ...init,
      headers,
      signal: init?.signal ?? controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('서버 응답이 너무 늦습니다. 잠시 후 다시 시도해 주세요.');
    }
    throw error;
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    clearTimeout(timeoutId);
    throw new Error(payload?.message || '요청을 처리하지 못했습니다.');
  }

  clearTimeout(timeoutId);
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
