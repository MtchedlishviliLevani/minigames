import type { Category, Game, GameComment, GameDetails, LeaderboardEntry } from '../types';

export const DETAILS: GameDetails = {
  slug: 'tukoni-forest-keepers',
  name: 'Tukoni Forest Keepers',
  heroImage: '/assets/images/games/tukoni-forest-keepers-hero.jpg',
  rating: 4.8,
  likesCount: 31200,
  isLikedByCurrentUser: false,
  fullDescription: 'Look after a tiny forest.',
  specs: { genre: 'Cozy', players: '1', duration: '10 min', price: 'Free' },
  topRecords: [
    { position: 1, playerName: 'Ann', score: 9100, achievedAt: '2026-10-01T10:00:00Z' },
    { position: 4, playerName: 'Bo', score: 100, achievedAt: '2026-10-01T10:00:00Z' },
  ],
};

export const comment = (overrides: Partial<GameComment> = {}): GameComment => ({
  commentId: 'c1',
  authorName: 'ForestDweller',
  text: 'Such a calming little game!',
  likesCount: 3,
  isLikedByCurrentUser: false,
  createdAt: '2026-10-10T10:00:00Z',
  ...overrides,
});

export const game = (slug: string, overrides: Partial<Game> = {}): Game => ({
  slug,
  name: slug.replace(/-/g, ' '),
  category: 'puzzle',
  price: 'Free',
  shortDescription: `About ${slug}`,
  rating: 4.5,
  likesCount: 1500,
  cardImage: `/assets/images/games/${slug}-card.jpg`,
  ...overrides,
});

export const CATEGORIES: Category[] = [
  { slug: 'all', label: 'All Games', isDefault: true },
  { slug: 'puzzle', label: 'Puzzle', isDefault: false },
  { slug: 'farm', label: 'Farm', isDefault: false },
];

export const LEADERS: LeaderboardEntry[] = [
  {
    rank: 1,
    playerName: 'Alex_Pro99',
    gamesPlayed: 1240,
    totalScore: 98450,
    streakDays: 12,
    favoriteGameSlug: 'palia',
    favoriteGameName: 'Palia',
  },
  {
    rank: 2,
    playerName: 'luna',
    gamesPlayed: 800,
    totalScore: 500,
    streakDays: 1,
    favoriteGameSlug: 'tiny-glade',
    favoriteGameName: 'Tiny Glade',
  },
];
