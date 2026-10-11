import { describe, expect, it } from 'vitest';
import { commentAuthorName, FALLBACK_NAME, profileInitials, profileName } from './profile';

describe('profileName', () => {
  it('prefers the trimmed display name', () => {
    expect(profileName({ displayName: '  Alex Pro ', email: 'a@b.co' })).toBe('Alex Pro');
  });

  it('falls back to the email local part, then a generic name', () => {
    expect(profileName({ displayName: '  ', email: 'gamer42@mail.com' })).toBe('gamer42');
    expect(profileName({ displayName: '', email: '' })).toBe(FALLBACK_NAME);
  });
});

describe('profileInitials', () => {
  it.each([
    ['Alex', 'A'],
    ['  alex pro  ', 'AP'],
    ['Mary Jane Watson', 'MJ'],
    ['_alex', 'A'],
    ['иван петров', 'ИП'],
    ['élodie', 'É'],
    ['42 Club', '4C'],
    ['--- !!!', ''],
    ['', ''],
  ])('%s -> %s', (name, expected) => {
    expect(profileInitials(name)).toBe(expected);
  });
});

describe('commentAuthorName', () => {
  it('uses a display name within 2-30 characters', () => {
    expect(commentAuthorName({ displayName: ' AlexPro ', email: 'a@b.co' })).toBe('AlexPro');
  });

  it('falls back to the email local part when the name does not fit', () => {
    expect(commentAuthorName({ displayName: 'A', email: 'gamer@mail.com' })).toBe('gamer');
    expect(commentAuthorName({ displayName: 'x'.repeat(31), email: 'gamer@mail.com' })).toBe(
      'gamer'
    );
  });

  it('trims a long local part and ends with a generic name', () => {
    expect(
      commentAuthorName({ displayName: '', email: `${'y'.repeat(40)}@mail.com` })
    ).toHaveLength(30);
    expect(commentAuthorName({ displayName: '', email: 'a@mail.com' })).toBe(FALLBACK_NAME);
  });
});
