import { describe, expect, it } from 'vitest';
import {
  AVATAR_COLOR_COUNT,
  checkCommentText,
  COMMENT_MAX_LENGTH,
  commenterInitial,
  createAvatarPalette,
} from './comments';

describe('checkCommentText', () => {
  it('trims the text', () => {
    expect(checkCommentText('  Great game!  ')).toEqual({ ok: true, text: 'Great game!' });
  });

  it('rejects empty text', () => {
    expect(checkCommentText(' \n ')).toMatchObject({ ok: false });
  });

  it('accepts exactly the limit after trimming and rejects more', () => {
    const limit = 'a'.repeat(COMMENT_MAX_LENGTH);
    expect(checkCommentText(` ${limit} `)).toEqual({ ok: true, text: limit });
    expect(checkCommentText(`${limit}a`)).toMatchObject({
      ok: false,
      error: expect.stringContaining('500') as string,
    });
  });
});

describe('commenterInitial', () => {
  it.each([
    ['  forest dweller', 'F'],
    ['élodie', 'É'],
    ['👍🏽 fan', '👍🏽'],
    ['   ', '?'],
  ])('%s -> %s', (name, expected) => {
    expect(commenterInitial(name)).toBe(expected);
  });
});

describe('createAvatarPalette', () => {
  it('picks a color from the token range and keeps it per commenter', () => {
    const values = [0, 0.99, 0.5];
    const palette = createAvatarPalette(() => values.shift() ?? 0);

    expect(palette.colorFor('Alex')).toBe(1);
    expect(palette.colorFor('Sam')).toBe(AVATAR_COLOR_COUNT);
    expect(palette.colorFor(' Alex ')).toBe(1);
    expect(palette.colorFor('Sam')).toBe(AVATAR_COLOR_COUNT);
  });

  it('assigns new colors after clearing', () => {
    const values = [0, 0.5];
    const palette = createAvatarPalette(() => values.shift() ?? 0);
    expect(palette.colorFor('Alex')).toBe(1);
    palette.clear();
    expect(palette.colorFor('Alex')).toBe(3);
  });

  it('stays within range with the default random source', () => {
    const palette = createAvatarPalette();
    const color = palette.colorFor('Anyone');
    expect(color).toBeGreaterThanOrEqual(1);
    expect(color).toBeLessThanOrEqual(AVATAR_COLOR_COUNT);
  });
});
