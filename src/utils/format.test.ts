import { describe, expect, it } from 'vitest';
import { formatCompact, formatNumber, initials } from './format';

describe('formatNumber', () => {
  it('adds thousands separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });
});

describe('formatCompact', () => {
  it('keeps values below a thousand as they are', () => {
    expect(formatCompact(999)).toBe('999');
  });

  it('shortens thousands to one decimal without rounding up', () => {
    expect(formatCompact(31299)).toBe('31.2K');
    expect(formatCompact(1000)).toBe('1K');
  });
});

describe('initials', () => {
  it('prefers uppercase letters', () => {
    expect(initials('Alex_Pro99')).toBe('AP');
  });

  it('falls back to the first letters in uppercase', () => {
    expect(initials('gamer')).toBe('GA');
  });
});
