import { showSnackbar } from '../components/Snackbar/Snackbar';
import type { AuthProfile } from '../types';
import { signOutUser } from './firebase';
import {
  createSession,
  isSessionExpired,
  readStoredSession,
  removeStoredSession,
  saveSession,
  sessionExpiresAt,
} from './session';
import type { AppSession } from './session';

export type SessionEndReason = 'logout' | 'expired' | 'invalid';

type SessionListener = (session: AppSession | null) => void;

const listeners = new Set<SessionListener>();

let session: AppSession | null = null;
let expiryTimer = 0;

function notify(): void {
  for (const listener of listeners) listener(session);
}

function scheduleExpiry(active: AppSession): void {
  window.clearTimeout(expiryTimer);
  const delay = Math.max(0, sessionExpiresAt(active) - Date.now());
  expiryTimer = window.setTimeout(() => {
    checkSession();
  }, delay);
}

async function signOutFirebase(reason: SessionEndReason): Promise<void> {
  try {
    await signOutUser();
    if (reason === 'logout') showSnackbar('You have logged out.', 'success');
  } catch {
    if (reason === 'logout') {
      showSnackbar('You are logged out here, but signing out of Firebase failed.', 'error');
    }
  }
}

export function endSession(reason: SessionEndReason): Promise<void> {
  const wasActive = session !== null;
  window.clearTimeout(expiryTimer);
  removeStoredSession();
  session = null;
  if (wasActive) notify();
  if (reason === 'expired') {
    showSnackbar('Your session has expired. Please log in again.', 'warning');
  }
  return signOutFirebase(reason);
}

export function getSession(): AppSession | null {
  return session;
}

export function checkSession(now: number = Date.now()): AppSession | null {
  if (session !== null && isSessionExpired(session, now)) void endSession('expired');
  return session;
}

export function isAuthenticated(): boolean {
  return checkSession() !== null;
}

export function startSession(profile: AuthProfile): AppSession {
  const next = createSession(profile);
  saveSession(next);
  session = next;
  scheduleExpiry(next);
  notify();
  return next;
}

export function logout(): Promise<void> {
  return endSession('logout');
}

export function onSessionChange(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function initSession(): void {
  const stored = readStoredSession();

  if (stored.status === 'invalid') {
    void endSession('invalid');
  } else if (stored.status === 'valid') {
    if (isSessionExpired(stored.session)) {
      void endSession('expired');
    } else {
      session = stored.session;
      scheduleExpiry(stored.session);
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkSession();
  });
}
