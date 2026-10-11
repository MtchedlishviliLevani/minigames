import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as AuthState from './authState';
import { SESSION_LIFETIME_MS, SESSION_STORAGE_KEY } from './session';

const mocks = vi.hoisted(() => ({
  signOutUser: vi.fn(() => Promise.resolve()),
  showSnackbar: vi.fn(),
}));

vi.mock('./firebase', () => ({ signOutUser: mocks.signOutUser }));
vi.mock('../components/Snackbar/Snackbar', () => ({ showSnackbar: mocks.showSnackbar }));

const NOW = 1_760_000_000_000;
const PROFILE = { displayName: 'AlexPro', email: 'alex@minigames.com' };

async function load(stored?: unknown): Promise<typeof AuthState> {
  vi.resetModules();
  if (stored !== undefined) {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      typeof stored === 'string' ? stored : JSON.stringify(stored)
    );
  }
  const module = await import('./authState');
  module.initSession();
  return module;
}

const flush = async (): Promise<void> => {
  await vi.advanceTimersByTimeAsync(0);
};

describe('auth state', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.setSystemTime(NOW);
    localStorage.clear();
    mocks.signOutUser.mockClear();
    mocks.signOutUser.mockImplementation(() => Promise.resolve());
    mocks.showSnackbar.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts as a guest without a stored session', async () => {
    const auth = await load();
    expect(auth.getSession()).toBeNull();
    expect(mocks.signOutUser).not.toHaveBeenCalled();
  });

  it('restores a valid session without extending it', async () => {
    const stored = { ...PROFILE, authenticatedAt: NOW - 60_000 };
    const auth = await load(stored);
    expect(auth.getSession()).toEqual(stored);
    expect(JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) ?? '')).toEqual(stored);
  });

  it('clears invalid data, signs out and stays quiet', async () => {
    localStorage.setItem('unrelated', '1');
    const auth = await load('{not json');
    await flush();
    expect(auth.getSession()).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem('unrelated')).toBe('1');
    expect(mocks.signOutUser).toHaveBeenCalledTimes(1);
    expect(mocks.showSnackbar).not.toHaveBeenCalled();
  });

  it('drops a session that expired while the app was closed', async () => {
    const auth = await load({ ...PROFILE, authenticatedAt: NOW - SESSION_LIFETIME_MS });
    await flush();
    expect(auth.getSession()).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(mocks.signOutUser).toHaveBeenCalledTimes(1);
    expect(mocks.showSnackbar).toHaveBeenCalledTimes(1);
    expect(mocks.showSnackbar).toHaveBeenCalledWith(expect.stringMatching(/expired/), 'warning');
  });

  it('starts a session, persists it and notifies listeners', async () => {
    const auth = await load();
    const listener = vi.fn();
    auth.onSessionChange(listener);

    const session = auth.startSession({ ...PROFILE, avatarUrl: 'https://a.png' });

    expect(session.authenticatedAt).toBe(NOW);
    expect(JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) ?? '')).toEqual(session);
    expect(listener).toHaveBeenCalledWith(session);
    expect(auth.isAuthenticated()).toBe(true);
  });

  it('expires on its own after five minutes with a single snackbar', async () => {
    const auth = await load();
    const listener = vi.fn();
    auth.startSession(PROFILE);
    auth.onSessionChange(listener);

    await vi.advanceTimersByTimeAsync(SESSION_LIFETIME_MS - 1);
    expect(auth.getSession()).not.toBeNull();

    await vi.advanceTimersByTimeAsync(1);
    expect(auth.getSession()).toBeNull();
    expect(listener).toHaveBeenCalledWith(null);
    expect(mocks.signOutUser).toHaveBeenCalledTimes(1);

    auth.checkSession();
    expect(mocks.showSnackbar).toHaveBeenCalledTimes(1);
  });

  it('expires when checked after the deadline', async () => {
    const auth = await load({ ...PROFILE, authenticatedAt: NOW - 1000 });
    expect(auth.checkSession(NOW + SESSION_LIFETIME_MS)).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('rechecks the session when the page becomes visible again', async () => {
    const auth = await load({ ...PROFILE, authenticatedAt: NOW });
    vi.setSystemTime(NOW + SESSION_LIFETIME_MS + 1);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(auth.getSession()).toBeNull();
  });

  it('logs out, clears only its key and confirms', async () => {
    const auth = await load({ ...PROFILE, authenticatedAt: NOW });
    localStorage.setItem('unrelated', '1');

    await auth.logout();

    expect(auth.getSession()).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem('unrelated')).toBe('1');
    expect(mocks.signOutUser).toHaveBeenCalledTimes(1);
    expect(mocks.showSnackbar).toHaveBeenCalledWith('You have logged out.', 'success');
  });

  it('stays a guest and reports an error when sign out fails', async () => {
    mocks.signOutUser.mockImplementation(() => Promise.reject(new Error('offline')));
    const auth = await load({ ...PROFILE, authenticatedAt: NOW });

    await auth.logout();

    expect(auth.getSession()).toBeNull();
    expect(mocks.showSnackbar).toHaveBeenCalledWith(expect.stringMatching(/failed/), 'error');
  });

  it('lets a listener unsubscribe', async () => {
    const auth = await load();
    const listener = vi.fn();
    const unsubscribe = auth.onSessionChange(listener);
    unsubscribe();
    auth.startSession(PROFILE);
    expect(listener).not.toHaveBeenCalled();
  });
});
