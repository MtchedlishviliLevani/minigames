import { beforeEach, describe, expect, it } from 'vitest';
import {
  createSession,
  isSessionExpired,
  parseSession,
  readStoredSession,
  removeStoredSession,
  saveSession,
  SESSION_LIFETIME_MS,
  SESSION_STORAGE_KEY,
  sessionExpiresAt,
} from './session';

const NOW = 1_760_000_000_000;
const PROFILE = { displayName: 'AlexPro', email: 'alex@minigames.com' };

describe('session model', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('uses a namespaced storage key and a five minute lifetime', () => {
    expect(SESSION_STORAGE_KEY).toMatch(/^minigames:[a-z-]+:app-session$/);
    expect(SESSION_LIFETIME_MS).toBe(300_000);
  });

  it('stores only the profile fields and the authentication time', () => {
    expect(createSession({ ...PROFILE, avatarUrl: 'https://a.png' }, NOW)).toEqual({
      ...PROFILE,
      avatarUrl: 'https://a.png',
      authenticatedAt: NOW,
    });
    expect(createSession({ ...PROFILE, avatarUrl: '' }, NOW)).not.toHaveProperty('avatarUrl');
  });

  it('expires exactly at the end of the fixed lifetime', () => {
    const session = createSession(PROFILE, NOW);
    expect(sessionExpiresAt(session)).toBe(NOW + SESSION_LIFETIME_MS);
    expect(isSessionExpired(session, NOW + SESSION_LIFETIME_MS - 1)).toBe(false);
    expect(isSessionExpired(session, NOW + SESSION_LIFETIME_MS)).toBe(true);
  });

  it('parses a valid stored session', () => {
    const session = createSession({ ...PROFILE, avatarUrl: 'https://a.png' }, NOW);
    expect(parseSession(JSON.stringify(session))).toEqual({ status: 'valid', session });
  });

  it('reports a missing value', () => {
    expect(parseSession(null)).toEqual({ status: 'none' });
  });

  it.each([
    ['broken json', '{"displayName":'],
    ['an array', '[]'],
    ['a string', '"hello"'],
    ['a missing email', JSON.stringify({ displayName: 'A', authenticatedAt: NOW })],
    ['an empty email', JSON.stringify({ displayName: 'A', email: '', authenticatedAt: NOW })],
    ['a missing name', JSON.stringify({ email: 'a@b.co', authenticatedAt: NOW })],
    ['a string time', JSON.stringify({ displayName: 'A', email: 'a@b.co', authenticatedAt: '1' })],
    [
      'a numeric avatar',
      JSON.stringify({ displayName: 'A', email: 'a@b.co', authenticatedAt: NOW, avatarUrl: 1 }),
    ],
  ])('rejects %s', (_, raw) => {
    expect(parseSession(raw)).toEqual({ status: 'invalid' });
  });

  it('saves, reads and removes only its own key', () => {
    localStorage.setItem('other-app', 'keep');
    const session = createSession(PROFILE, NOW);

    saveSession(session);
    expect(readStoredSession()).toEqual({ status: 'valid', session });

    removeStoredSession();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem('other-app')).toBe('keep');
  });

  it('survives a storage that throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    } as unknown as Storage;

    expect(readStoredSession(broken)).toEqual({ status: 'none' });
    expect(() => {
      saveSession(createSession(PROFILE, NOW), broken);
      removeStoredSession(broken);
    }).not.toThrow();
  });
});
