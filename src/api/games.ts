import type {
  Category,
  CommentLikeState,
  FavoriteState,
  NewComment,
  Game,
  GameComment,
  GameCommentsPage,
  GameDetails,
  GamesPage,
  GamesQuery,
  LeaderboardEntry,
} from '../types';
import { request, send } from './client';

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

const gamePath = (slug: string): string => `/games/${encodeURIComponent(slug)}`;

export async function getGameDetails(
  slug: string,
  userEmail?: string,
  signal?: AbortSignal
): Promise<GameDetails> {
  const { data } = await request<ItemResponse<GameDetails>>(gamePath(slug), { userEmail }, signal);
  return data;
}

export const COMMENTS_LIMIT = 3;

export async function getGameComments(
  slug: string,
  userEmail?: string,
  signal?: AbortSignal
): Promise<GameCommentsPage> {
  const { data, meta } = await request<ListResponse<GameComment, CommentsMeta>>(
    `${gamePath(slug)}/comments`,
    { limit: COMMENTS_LIMIT, sort: 'newest', userEmail },
    signal
  );
  return { comments: data, totalComments: meta.totalComments };
}

export async function toggleFavorite(slug: string, userEmail: string): Promise<FavoriteState> {
  const { data } = await send<ItemResponse<FavoriteState>>(`${gamePath(slug)}/favorite`, {
    userEmail,
  });
  return data;
}

export async function postComment(slug: string, comment: NewComment): Promise<GameComment> {
  const { data } = await send<ItemResponse<GameComment>>(`${gamePath(slug)}/comments`, comment);
  return data;
}

export async function toggleCommentLike(
  commentId: string,
  userEmail: string
): Promise<CommentLikeState> {
  const { data } = await send<ItemResponse<CommentLikeState>>(
    `/comments/${encodeURIComponent(commentId)}/like`,
    { userEmail }
  );
  return data;
}

export async function getCategories(signal?: AbortSignal): Promise<Category[]> {
  const { data } = await request<ListResponse<Category>>('/categories', {}, signal);
  return data;
}

export async function getLeaderboard(signal?: AbortSignal): Promise<LeaderboardEntry[]> {
  const { data } = await request<ListResponse<LeaderboardEntry>>('/leaderboard', {}, signal);
  return data;
}
