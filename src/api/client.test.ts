import { describe, expect, it, vi } from 'vitest';
import { jsonResponse } from '../test/http';
import { API_BASE_URL, ApiError, isOutcomeUnknown, request, send } from './client';

describe('request', () => {
  it('builds the url from the path and skips undefined params', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({ data: [] })));
    vi.stubGlobal('fetch', fetchMock);

    await request('/games', { page: 2, featured: true, category: undefined });

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/games?page=2&featured=true`, {
      signal: undefined,
    });
  });

  it('returns the parsed body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse({ data: [1, 2] })))
    );
    await expect(request('/games')).resolves.toEqual({ data: [1, 2] });
  });

  it('throws an ApiError with the server message and status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse({ error: 'Game not found: x' }, 404)))
    );
    await expect(request('/games/x')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'Game not found: x',
    });
  });

  it('falls back to a generic message when the error body is not json', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('oops', { status: 500 })))
    );
    await expect(request('/games')).rejects.toMatchObject({
      status: 500,
      message: 'Request failed with status 500',
    });
  });

  it('reports network failures with status 0', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch')))
    );
    const error = await request('/games').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(0);
  });

  it('rethrows aborts untouched', async () => {
    const abort = new DOMException('Aborted', 'AbortError');
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(abort))
    );
    await expect(request('/games')).rejects.toBe(abort);
  });
});

describe('send', () => {
  it('posts json with a timeout signal', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({ data: { ok: true } }, 201)));
    vi.stubGlobal('fetch', fetchMock);

    await expect(send('/games/a/favorite', { userEmail: 'a@b.co' })).resolves.toEqual({
      data: { ok: true },
    });

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/games/a/favorite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"userEmail":"a@b.co"}',
      signal: expect.any(AbortSignal) as AbortSignal,
    });
  });

  it('reports a definitive rejection with its status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse({ error: 'Text is too long' }, 400)))
    );
    const error = await send('/x', {}).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ status: 400, message: 'Text is too long' });
    expect(isOutcomeUnknown(error)).toBe(false);
  });

  it('marks network failures and timeouts as an unknown outcome', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new DOMException('Timed out', 'TimeoutError')))
    );
    const error = await send('/x', {}).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ status: 0 });
    expect(isOutcomeUnknown(error)).toBe(true);
  });

  it('treats server errors as unknown and other errors as known', () => {
    expect(isOutcomeUnknown(new ApiError('boom', 502))).toBe(true);
    expect(isOutcomeUnknown(new ApiError('nope', 429))).toBe(false);
    expect(isOutcomeUnknown(new Error('x'))).toBe(false);
  });
});
