import { describe, expect, it } from 'vitest';
import { ApiError } from '../api/client';
import { mutationFailure } from './mutation';

describe('mutationFailure', () => {
  it('explains an unknown outcome', () => {
    expect(mutationFailure(new ApiError('offline', 0), 'Unknown')).toBe('Unknown');
    expect(mutationFailure(new ApiError('bad gateway', 502), 'Unknown')).toBe('Unknown');
  });

  it('passes through definitive server messages', () => {
    expect(mutationFailure(new ApiError('Rate limit exceeded', 429), 'Unknown')).toBe(
      'Rate limit exceeded'
    );
  });

  it('falls back for unexpected errors', () => {
    expect(mutationFailure(new Error('x'), 'Unknown')).toMatch(/Something went wrong/);
  });
});
