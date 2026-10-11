import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as RouterModule from '../router/router';
import type * as AuthStateModule from './authState';
import type * as AuthGuardModule from './authGuard';
import { SESSION_LIFETIME_MS, SESSION_STORAGE_KEY } from './session';

const mocks = vi.hoisted(() => ({
  signOutUser: vi.fn(() => Promise.resolve()),
  showSnackbar: vi.fn(),
}));

vi.mock('./firebase', () => ({ signOutUser: mocks.signOutUser }));
vi.mock('../components/Snackbar/Snackbar', () => ({ showSnackbar: mocks.showSnackbar }));

const PROFILE = { displayName: 'AlexPro', email: 'alex@minigames.com' };

interface Context {
  router: typeof RouterModule;
  authState: typeof AuthStateModule;
  guard: typeof AuthGuardModule;
}

async function boot(url: string, authenticatedAt?: number): Promise<Context> {
  localStorage.clear();
  if (authenticatedAt !== undefined) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ ...PROFILE, authenticatedAt }));
  }
  window.history.replaceState(null, '', url);
  vi.resetModules();
  const authState = await import('./authState');
  const guard = await import('./authGuard');
  const router = await import('../router/router');
  authState.initSession();
  guard.installAuthGuard();
  router.startRouter();
  return { router, authState, guard };
}

const location = (): string =>
  `${window.location.pathname}${window.location.search}${window.location.hash}`;

const alreadyLoggedIn = (): unknown[][] =>
  mocks.showSnackbar.mock.calls.filter(([message]) => message === 'You are already logged in.');

describe('auth dialog guard', () => {
  beforeEach(() => {
    mocks.showSnackbar.mockClear();
    mocks.signOutUser.mockClear();
  });

  it('lets guests open auth from the url', async () => {
    const { router } = await boot('/?auth=register');
    expect(router.getState().auth).toBe('register');
    expect(location()).toBe('/?auth=register');
  });

  it('strips auth from a deep link for a signed in user and keeps the rest', async () => {
    const { router } = await boot(
      '/library?category=puzzle&sort=name-asc&page=2&auth=login#top',
      Date.now()
    );
    expect(router.getState()).toMatchObject({ route: 'library', category: 'puzzle', auth: null });
    expect(location()).toBe('/library?category=puzzle&sort=name-asc&page=2#top');
    expect(alreadyLoggedIn()).toHaveLength(1);
  });

  it('ignores ui requests to open auth without adding history', async () => {
    const { router } = await boot('/', Date.now());
    const before = window.history.length;
    router.navigate({ auth: 'login' });
    expect(router.getState().auth).toBeNull();
    expect(window.history.length).toBe(before);
    expect(location()).toBe('/');
    expect(alreadyLoggedIn()).toHaveLength(1);
  });

  it('replaces the history entry when other state changes too', async () => {
    const { router } = await boot('/', Date.now());
    const before = window.history.length;
    router.navigate({ game: 'palia', auth: 'login' });
    expect(location()).toBe('/?game=palia');
    expect(window.history.length).toBe(before);
  });

  it('cleans auth when history lands on it', async () => {
    const { router, authState } = await boot('/?game=palia&auth=login');
    expect(router.getState().auth).toBe('login');
    authState.startSession(PROFILE);

    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(router.getState()).toMatchObject({ game: 'palia', auth: null });
    expect(location()).toBe('/?game=palia');
  });

  it('treats an expired session as a guest and opens auth', async () => {
    const { router, authState } = await boot(
      '/?auth=login',
      Date.now() - SESSION_LIFETIME_MS - 1000
    );
    expect(authState.getSession()).toBeNull();
    expect(router.getState().auth).toBe('login');
    expect(alreadyLoggedIn()).toHaveLength(0);
  });

  it('checks expiry before navigation and continues as a guest', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const { router, authState } = await boot('/', Date.now());
    vi.setSystemTime(Date.now() + SESSION_LIFETIME_MS + 1);

    router.navigate({ route: 'library' });

    expect(authState.getSession()).toBeNull();
    expect(router.getRoute()).toBe('library');
    expect(mocks.showSnackbar).toHaveBeenCalledWith(expect.stringMatching(/expired/), 'warning');
    vi.useRealTimers();
  });
});

describe('requireSession', () => {
  beforeEach(() => {
    mocks.showSnackbar.mockClear();
  });

  it('returns the active session', async () => {
    const { guard, router } = await boot('/?game=palia', Date.now());
    expect(guard.requireSession('Log in first')).toMatchObject(PROFILE);
    expect(router.getState().auth).toBeNull();
  });

  it('asks guests to log in and keeps the game in the url', async () => {
    const { guard, router } = await boot('/?game=palia');
    expect(guard.requireSession('Log in to add favorites.')).toBeNull();
    expect(mocks.showSnackbar).toHaveBeenCalledWith('Log in to add favorites.', 'warning');
    expect(router.getState()).toMatchObject({ game: 'palia', auth: 'login' });
  });

  it('shows only the expiry message for an expired session', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const { guard, router } = await boot('/?game=palia', Date.now());
    vi.setSystemTime(Date.now() + SESSION_LIFETIME_MS);

    expect(guard.requireSession('Log in to add favorites.')).toBeNull();
    expect(mocks.showSnackbar).toHaveBeenCalledTimes(1);
    expect(mocks.showSnackbar).toHaveBeenCalledWith(expect.stringMatching(/expired/), 'warning');
    expect(router.getState()).toMatchObject({ game: 'palia', auth: 'login' });
    vi.useRealTimers();
  });
});
