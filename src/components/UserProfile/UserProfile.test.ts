import { describe, expect, it, vi } from 'vitest';
import type { AppSession } from '../../auth/session';
import { UserAvatar, UserProfile } from './UserProfile';

const mocks = vi.hoisted(() => ({ logout: vi.fn(() => Promise.resolve()) }));
vi.mock('../../auth/authState', () => ({ logout: mocks.logout }));

const session = (overrides: Partial<AppSession> = {}): AppSession => ({
  displayName: 'Alex Pro',
  email: 'alex@minigames.com',
  authenticatedAt: 0,
  ...overrides,
});

describe('UserAvatar', () => {
  it('shows initials when there is no photo', () => {
    expect(UserAvatar(session()).textContent).toBe('AP');
  });

  it('uses the email name when the display name is empty', () => {
    expect(UserAvatar(session({ displayName: '', email: 'gamer@mail.com' })).textContent).toBe('G');
  });

  it('shows a generic icon when no initials can be built', () => {
    const avatar = UserAvatar(session({ displayName: '!!!' }));
    expect(avatar.querySelector('svg')).not.toBeNull();
    expect(avatar.textContent).toBe('');
  });

  it('renders the photo and falls back to initials when it fails', () => {
    const avatar = UserAvatar(session({ avatarUrl: 'https://img/a.png' }), 'extra');
    const image = avatar.querySelector('img');
    expect(image?.getAttribute('src')).toBe('https://img/a.png');
    expect(avatar.className).toBe('user-avatar extra');

    image?.dispatchEvent(new Event('error'));
    expect(avatar.querySelector('img')).toBeNull();
    expect(avatar.textContent).toBe('AP');
  });
});

describe('UserProfile', () => {
  it('shows the name as text and logs out', () => {
    const onLogout = vi.fn();
    const profile = UserProfile(session({ displayName: '<b>Alex</b>' }), 'menu', onLogout);

    expect(profile.querySelector('.user-profile__name')?.textContent).toBe('<b>Alex</b>');
    expect(profile.querySelector('b')).toBeNull();
    expect(profile.classList.contains('user-profile--menu')).toBe(true);

    profile.querySelector('button')?.click();
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(mocks.logout).toHaveBeenCalledTimes(1);
  });

  it('works without a logout callback', () => {
    const profile = UserProfile(session(), 'header');
    profile.querySelector('button')?.click();
    expect(mocks.logout).toHaveBeenCalled();
  });
});
