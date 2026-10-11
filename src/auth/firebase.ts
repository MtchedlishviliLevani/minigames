import { initializeApp } from 'firebase/app';
import type { FirebaseOptions } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import type { Auth, User } from 'firebase/auth';
import type { AuthProfile } from '../types';

export class AuthConfigError extends Error {
  constructor() {
    super('Sign-in is not configured for this deployment.');
    this.name = 'AuthConfigError';
  }
}

let auth: Auth | undefined;

export function readFirebaseConfig(env: ImportMetaEnv = import.meta.env): FirebaseOptions | null {
  const { VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID } = env;
  if (!VITE_FIREBASE_API_KEY || !VITE_FIREBASE_AUTH_DOMAIN || !VITE_FIREBASE_PROJECT_ID) {
    return null;
  }
  return {
    apiKey: VITE_FIREBASE_API_KEY,
    authDomain: VITE_FIREBASE_AUTH_DOMAIN,
    projectId: VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
}

function firebaseAuth(): Auth {
  if (auth !== undefined) return auth;
  const config = readFirebaseConfig();
  if (config === null) throw new AuthConfigError();
  auth = getAuth(initializeApp(config));
  return auth;
}

export function toProfile(user: User, fallbackName = ''): AuthProfile {
  const profile: AuthProfile = {
    displayName: user.displayName ?? fallbackName,
    email: user.email ?? '',
  };
  if (user.photoURL) profile.avatarUrl = user.photoURL;
  return profile;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthProfile> {
  const { user } = await signInWithEmailAndPassword(firebaseAuth(), email.trim(), password);
  return toProfile(user);
}

export async function registerWithEmail(
  username: string,
  email: string,
  password: string
): Promise<AuthProfile> {
  const { user } = await createUserWithEmailAndPassword(firebaseAuth(), email.trim(), password);
  await updateProfile(user, { displayName: username });
  return toProfile(user, username);
}

export async function signInWithGoogle(): Promise<AuthProfile> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const { user } = await signInWithPopup(firebaseAuth(), provider);
  return toProfile(user);
}

export async function signOutUser(): Promise<void> {
  if (readFirebaseConfig() === null) return;
  await signOut(firebaseAuth());
}

const CANCELLED_CODES = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request']);

const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/invalid-login-credentials': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/weak-password': 'This password is too weak.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network unavailable. Check your connection and try again.',
  'auth/popup-blocked': 'The sign-in window was blocked. Allow pop-ups and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled.',
};

const DEFAULT_MESSAGE = 'Authentication failed. Please try again.';

function errorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return typeof error.code === 'string' ? error.code : null;
  }
  return null;
}

export function isAuthCancelled(error: unknown): boolean {
  const code = errorCode(error);
  return code !== null && CANCELLED_CODES.has(code);
}

export function authErrorMessage(error: unknown): string {
  if (error instanceof AuthConfigError) return error.message;
  const code = errorCode(error);
  return (code !== null ? MESSAGES[code] : undefined) ?? DEFAULT_MESSAGE;
}
