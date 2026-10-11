import { describe, expect, it, vi } from 'vitest';
import { jsonResponse } from '../test/http';
import { API_BASE_URL, ApiError, request } from './client';

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
