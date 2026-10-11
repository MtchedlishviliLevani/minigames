import { describe, expect, it } from 'vitest';
import { relativeTime } from './relativeTime';

const NOW = Date.parse('2026-10-11T12:00:00Z');
const ago = (ms: number): string => new Date(NOW - ms).toISOString();
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('relativeTime', () => {
  it('returns the input when it is not a date', () => {
    expect(relativeTime('yesterday', NOW)).toBe('yesterday');
  });

  it.each([
    [10_000, 'just now'],
    [5 * MINUTE, '5 min ago'],
    [HOUR, '1 hour ago'],
    [3 * HOUR, '3 hours ago'],
    [2 * DAY, '2 days ago'],
    [14 * DAY, '2 weeks ago'],
    [60 * DAY, '2 months ago'],
    [400 * DAY, '1 year ago'],
  ])('formats %i ms ago as "%s"', (ms, expected) => {
    expect(relativeTime(ago(ms), NOW)).toBe(expected);
  });

  it('treats future timestamps as just now', () => {
    expect(relativeTime(ago(-HOUR), NOW)).toBe('just now');
  });
});
