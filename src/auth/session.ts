import type { AuthProfile } from '../types';

export const SESSION_STORAGE_KEY = 'minigames:mtchedlishvili-levani:app-session';
export const SESSION_LIFETIME_MS = 5 * 60 * 1000;

export interface AppSession extends AuthProfile {
  authenticatedAt: number;
}

export type StoredSession =
  { status: 'none' } | { status: 'invalid' } | { status: 'valid'; session: AppSession };

export function createSession(profile: AuthProfile, now: number = Date.now()): AppSession {
  const session: AppSession = {
    displayName: profile.displayName,
    email: profile.email,
    authenticatedAt: now,
  };
  if (profile.avatarUrl) session.avatarUrl = profile.avatarUrl;
  return session;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function parseSession(raw: string | null): StoredSession {
  if (raw === null) return { status: 'none' };

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { status: 'invalid' };
  }

  if (!isRecord(value)) return { status: 'invalid' };
  const { displayName, email, authenticatedAt, avatarUrl } = value;
  if (
    typeof displayName !== 'string' ||
    typeof email !== 'string' ||
    email === '' ||
    typeof authenticatedAt !== 'number' ||
    !Number.isFinite(authenticatedAt) ||
    (avatarUrl !== undefined && typeof avatarUrl !== 'string')
  ) {
    return { status: 'invalid' };
  }

  const session: AppSession = { displayName, email, authenticatedAt };
  if (avatarUrl) session.avatarUrl = avatarUrl;
  return { status: 'valid', session };
}

export function sessionExpiresAt(session: AppSession): number {
  return session.authenticatedAt + SESSION_LIFETIME_MS;
}

export function isSessionExpired(session: AppSession, now: number = Date.now()): boolean {
  return now >= sessionExpiresAt(session);
}

export function readStoredSession(storage: Storage = window.localStorage): StoredSession {
  try {
    return parseSession(storage.getItem(SESSION_STORAGE_KEY));
  } catch {
    return { status: 'none' };
  }
}

export function saveSession(session: AppSession, storage: Storage = window.localStorage): void {
  try {
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    return;
  }
}

export function removeStoredSession(storage: Storage = window.localStorage): void {
  try {
    storage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    return;
  }
}
