import { describe, expect, it } from 'vitest';
import { mockFetch, path, requestUrl } from '../test/http';
import type { FetchMock } from '../test/http';
import {
  getCategories,
  getFeaturedGames,
  getGameComments,
  getGameDetails,
  getGames,
  getLeaderboard,
  postComment,
  toggleCommentLike,
  toggleFavorite,
} from './games';

const firstUrl = (fetchMock: FetchMock): URL => {
  const input = fetchMock.mock.calls[0]?.[0];
  if (input === undefined) throw new Error('No request was made');
  return new URL(requestUrl(input));
};

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

  it('personalises details and comments with an encoded email', async () => {
    const fetchMock = mockFetch([
      { match: path('/comments'), body: { data: [], meta: { totalComments: 0 } } },
      { match: path('/palia'), body: { data: { slug: 'palia' } } },
    ]);

    await getGameDetails('palia', 'a+b@mail.com');
    await getGameComments('palia', 'a+b@mail.com');

    for (const [input] of fetchMock.mock.calls) {
      expect(requestUrl(input)).toContain('userEmail=a%2Bb%40mail.com');
    }
  });

  it('omits the email for guests', async () => {
    const fetchMock = mockFetch([{ match: () => true, body: { data: { slug: 'palia' } } }]);
    await getGameDetails('palia');
    expect(firstUrl(fetchMock).searchParams.has('userEmail')).toBe(false);
  });

  it('toggles a favorite with the user email', async () => {
    const fetchMock = mockFetch([
      {
        match: path('/games/palia/favorite', 'POST'),
        body: { data: { gameSlug: 'palia', isFavorited: true, likesCount: 11 } },
      },
    ]);
    await expect(toggleFavorite('palia', 'a@b.co')).resolves.toMatchObject({
      isFavorited: true,
      likesCount: 11,
    });
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ body: '{"userEmail":"a@b.co"}' });
  });

  it('posts a comment', async () => {
    const fetchMock = mockFetch([
      {
        match: path('/games/palia/comments', 'POST'),
        status: 201,
        body: { data: { commentId: 'c1', text: 'Nice' } },
      },
    ]);
    const comment = { userEmail: 'a@b.co', authorName: 'Alex', text: 'Nice' };
    await expect(postComment('palia', comment)).resolves.toMatchObject({ commentId: 'c1' });
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ body: JSON.stringify(comment) });
  });

  it('toggles a comment like', async () => {
    mockFetch([
      {
        match: path('/comments/c%201/like', 'POST'),
        body: { data: { isLikedByCurrentUser: true, likesCount: 4 } },
      },
    ]);
    await expect(toggleCommentLike('c 1', 'a@b.co')).resolves.toEqual({
      isLikedByCurrentUser: true,
      likesCount: 4,
    });
  });
});
