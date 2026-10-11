import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';
import type * as Firebase from './firebase';

const sdk = vi.hoisted(() => ({
  initializeApp: vi.fn(() => ({ name: 'app' })),
  getAuth: vi.fn(() => ({ name: 'auth' })),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(() => Promise.resolve()),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
  setCustomParameters: vi.fn(),
}));

vi.mock('firebase/app', () => ({ initializeApp: sdk.initializeApp }));
vi.mock('firebase/auth', () => ({
  getAuth: sdk.getAuth,
  signInWithEmailAndPassword: sdk.signInWithEmailAndPassword,
  createUserWithEmailAndPassword: sdk.createUserWithEmailAndPassword,
  updateProfile: sdk.updateProfile,
  signInWithPopup: sdk.signInWithPopup,
  signOut: sdk.signOut,
  GoogleAuthProvider: class {
    setCustomParameters = sdk.setCustomParameters;
  },
}));

const CONFIG = {
  VITE_FIREBASE_API_KEY: 'key',
  VITE_FIREBASE_AUTH_DOMAIN: 'demo.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'demo',
  VITE_FIREBASE_APP_ID: 'app-id',
};

const user = (overrides: Partial<User> = {}): User =>
  ({ displayName: 'Alex', email: 'alex@minigames.com', photoURL: null, ...overrides }) as User;

type FirebaseModule = typeof Firebase;

async function load(env: Record<string, string> = CONFIG): Promise<FirebaseModule> {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import('./firebase');
}

describe('firebase auth wrapper', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    for (const mock of Object.values(sdk)) mock.mockClear();
  });

  it('reads the config only when the required keys exist', async () => {
    const { readFirebaseConfig } = await load();
    expect(readFirebaseConfig({ ...CONFIG } as ImportMetaEnv)).toEqual({
      apiKey: 'key',
      authDomain: 'demo.firebaseapp.com',
      projectId: 'demo',
      appId: 'app-id',
    });
    expect(readFirebaseConfig({ VITE_FIREBASE_API_KEY: 'key' } as ImportMetaEnv)).toBeNull();
  });

  it('signs in with a trimmed email and maps the profile', async () => {
    const firebase = await load();
    sdk.signInWithEmailAndPassword.mockResolvedValue({
      user: user({ photoURL: 'https://img/a.png' }),
    });

    const profile = await firebase.signInWithEmail(' alex@minigames.com ', 'Secr3t!');

    expect(sdk.signInWithEmailAndPassword).toHaveBeenCalledWith(
      { name: 'auth' },
      'alex@minigames.com',
      'Secr3t!'
    );
    expect(profile).toEqual({
      displayName: 'Alex',
      email: 'alex@minigames.com',
      avatarUrl: 'https://img/a.png',
    });
    expect(sdk.initializeApp).toHaveBeenCalledTimes(1);
  });

  it('saves the username as displayName when registering', async () => {
    const firebase = await load();
    const created = user({ displayName: null });
    sdk.createUserWithEmailAndPassword.mockResolvedValue({ user: created });

    const profile = await firebase.registerWithEmail('AlexPro', 'alex@minigames.com', 'Secr3t!');

    expect(sdk.updateProfile).toHaveBeenCalledWith(created, { displayName: 'AlexPro' });
    expect(profile).toEqual({ displayName: 'AlexPro', email: 'alex@minigames.com' });
  });

  it('signs in with a Google popup', async () => {
    const firebase = await load();
    sdk.signInWithPopup.mockResolvedValue({ user: user({ displayName: 'Google User' }) });
    await expect(firebase.signInWithGoogle()).resolves.toMatchObject({
      displayName: 'Google User',
    });
    expect(sdk.setCustomParameters).toHaveBeenCalledWith({ prompt: 'select_account' });
  });

  it('signs out through firebase and skips it without config', async () => {
    const firebase = await load();
    await firebase.signOutUser();
    expect(sdk.signOut).toHaveBeenCalledTimes(1);

    const unconfigured = await load({ VITE_FIREBASE_API_KEY: '' });
    await unconfigured.signOutUser();
    expect(sdk.signOut).toHaveBeenCalledTimes(1);
  });

  it('fails with a config error when firebase is not configured', async () => {
    const firebase = await load({ VITE_FIREBASE_API_KEY: '' });
    const error = await firebase.signInWithEmail('a@b.co', 'secret').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(firebase.AuthConfigError);
    expect(firebase.authErrorMessage(error)).toBe('Sign-in is not configured for this deployment.');
  });

  it('maps firebase error codes to readable messages', async () => {
    const { authErrorMessage, isAuthCancelled } = await load();
    expect(authErrorMessage({ code: 'auth/invalid-credential' })).toBe('Wrong email or password.');
    expect(authErrorMessage({ code: 'auth/email-already-in-use' })).toMatch(/already exists/);
    expect(authErrorMessage({ code: 'auth/unknown' })).toBe(
      'Authentication failed. Please try again.'
    );
    expect(authErrorMessage(new Error('x'))).toBe('Authentication failed. Please try again.');
    expect(isAuthCancelled({ code: 'auth/popup-closed-by-user' })).toBe(true);
    expect(isAuthCancelled({ code: 'auth/popup-blocked' })).toBe(false);
    expect(isAuthCancelled('nope')).toBe(false);
  });
});
