import type {
  Category,
  Game,
  GameComment,
  GameCommentsPage,
  GameDetails,
  GamesPage,
  GamesQuery,
  LeaderboardEntry,
} from '../types';
import { request } from './client';

interface ListResponse<T, M = unknown> {
  data: T[];
  meta: M;
}

interface ItemResponse<T> {
  data: T;
}

interface CommentsMeta {
  totalComments: number;
  returnedCount: number;
}

interface GamesMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export async function getGames(query: GamesQuery = {}, signal?: AbortSignal): Promise<GamesPage> {
  const { data, meta } = await request<ListResponse<Game, GamesMeta>>(
    '/games',
    { ...query },
    signal
  );
  return { games: data, page: meta.page, totalPages: meta.totalPages, totalItems: meta.totalItems };
}

export async function getFeaturedGames(signal?: AbortSignal): Promise<Game[]> {
  const { data } = await request<ListResponse<Game, GamesMeta>>(
    '/games',
    { featured: true },
    signal
  );
  return data;
}

export async function getGameDetails(slug: string, signal?: AbortSignal): Promise<GameDetails> {
  const { data } = await request<ItemResponse<GameDetails>>(
    `/games/${encodeURIComponent(slug)}`,
    {},
    signal
  );
  return data;
}

export const COMMENTS_LIMIT = 3;

export async function getGameComments(
  slug: string,
  signal?: AbortSignal
): Promise<GameCommentsPage> {
  const { data, meta } = await request<ListResponse<GameComment, CommentsMeta>>(
    `/games/${encodeURIComponent(slug)}/comments`,
    { limit: COMMENTS_LIMIT, sort: 'newest' },
    signal
  );
  return { comments: data, totalComments: meta.totalComments };
}

export async function getCategories(signal?: AbortSignal): Promise<Category[]> {
  const { data } = await request<ListResponse<Category>>('/categories', {}, signal);
  return data;
}

export async function getLeaderboard(signal?: AbortSignal): Promise<LeaderboardEntry[]> {
  const { data } = await request<ListResponse<LeaderboardEntry>>('/leaderboard', {}, signal);
  return data;
}
