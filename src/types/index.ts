import type { IconName } from '../components/Icon/Icon';

export type Route = 'home' | 'library' | 'not-found';

export type KnownRoute = Exclude<Route, 'not-found'>;

export interface NavLink {
  label: string;
  href: string;
  route?: Route;
}

export interface FooterLinkGroup {
  title: string;
  links: NavLink[];
}

export type SocialIcon = 'share' | 'chat' | 'rss';

export interface SocialLink extends NavLink {
  icon: SocialIcon;
}

export type AuthMode = 'login' | 'register';

export interface Game {
  slug: string;
  name: string;
  category: string;
  price: string;
  shortDescription: string;
  rating: number;
  likesCount: number;
  cardImage: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  gamesPlayed: number;
  totalScore: number;
  streakDays: number;
  favoriteGameSlug: string;
  favoriteGameName: string;
}

export interface Category {
  slug: string;
  label: string;
  isDefault: boolean;
}

export interface SortOption {
  id: string;
  label: string;
  prefix: string;
  suffix?: string;
  arrow: IconName;
}

export interface GameSpecs {
  genre: string;
  players: string;
  duration: string;
  price: string;
}

export interface GameRecord {
  position: number;
  playerName: string;
  score: number;
  achievedAt: string;
}

export interface GameDetails {
  slug: string;
  name: string;
  heroImage: string;
  rating: number;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  fullDescription: string;
  specs: GameSpecs;
  topRecords: GameRecord[];
}

export interface GameComment {
  commentId: string;
  authorName: string;
  text: string;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  createdAt: string;
}

export interface GamesPage {
  games: Game[];
  page: number;
  totalPages: number;
  totalItems: number;
}

export interface GamesQuery {
  category?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface GameCommentsPage {
  comments: GameComment[];
  totalComments: number;
}
