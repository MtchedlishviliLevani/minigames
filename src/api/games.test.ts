import { describe, expect, it } from 'vitest';
import { mockFetch, path } from '../test/http';
import {
  getCategories,
  getFeaturedGames,
  getGameComments,
  getGameDetails,
  getGames,
  getLeaderboard,
} from './games';

const firstUrl = (fetchMock: ReturnType<typeof mockFetch>): URL =>
  new URL(String(fetchMock.mock.calls[0]?.[0]));

describe('games api', () => {
  it('maps a games page and forwards the query', async () => {
    const fetchMock = mockFetch([
      {
        match: path('/games'),
        body: { data: [{ slug: 'a' }], meta: { page: 2, limit: 6, totalItems: 9, totalPages: 2 } },
      },
    ]);

    const page = await getGames({ category: 'puzzle', sort: 'name-asc', page: 2, limit: 6 });

    expect(page).toEqual({ games: [{ slug: 'a' }], page: 2, totalPages: 2, totalItems: 9 });
    const url = firstUrl(fetchMock);
    expect(url.searchParams.get('category')).toBe('puzzle');
    expect(url.searchParams.get('sort')).toBe('name-asc');
    expect(url.searchParams.get('page')).toBe('2');
  });

  it('asks for featured games', async () => {
    const fetchMock = mockFetch([{ match: path('/games'), body: { data: [{ slug: 'f' }] } }]);
    await expect(getFeaturedGames()).resolves.toEqual([{ slug: 'f' }]);
    expect(firstUrl(fetchMock).searchParams.get('featured')).toBe('true');
  });

  it('encodes the slug for details', async () => {
    const fetchMock = mockFetch([{ match: () => true, body: { data: { slug: 'a b' } } }]);
    await getGameDetails('a b');
    expect(firstUrl(fetchMock).pathname.endsWith('/games/a%20b')).toBe(true);
  });

  it('returns the latest comments with the total count', async () => {
    const fetchMock = mockFetch([
      {
        match: path('/comments'),
        body: { data: [{ commentId: '1' }], meta: { totalComments: 7, returnedCount: 1 } },
      },
    ]);
    await expect(getGameComments('tukoni')).resolves.toEqual({
      comments: [{ commentId: '1' }],
      totalComments: 7,
    });
    const url = firstUrl(fetchMock);
    expect(url.searchParams.get('limit')).toBe('3');
    expect(url.searchParams.get('sort')).toBe('newest');
  });

  it('loads categories and the leaderboard', async () => {
    mockFetch([
      { match: path('/categories'), body: { data: [{ slug: 'all' }] } },
      { match: path('/leaderboard'), body: { data: [{ rank: 1 }] } },
    ]);
    await expect(getCategories()).resolves.toEqual([{ slug: 'all' }]);
    await expect(getLeaderboard()).resolves.toEqual([{ rank: 1 }]);
  });
});
