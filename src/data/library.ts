import type { Category, SortOption } from '../types';

export const LIBRARY_TITLE = 'Game Library';
export const LIBRARY_SUBTITLE = 'Browse our collection of casual mini-games';

export const CATEGORIES: Category[] = [
  { slug: 'all', label: 'All Games' },
  { slug: 'puzzle', label: 'Puzzle' },
  { slug: 'card', label: 'Card' },
  { slug: 'match', label: 'Match' },
  { slug: 'farm', label: 'Farm' },
  { slug: 'strategy', label: 'Strategy' },
  { slug: 'arcade', label: 'Arcade' },
];

export const DEFAULT_CATEGORY = 'all';

export const SORT_OPTIONS: [SortOption, ...SortOption[]] = [
  { id: 'rating-asc', label: 'Rating ascending', prefix: 'Rating', arrow: 'arrow-upward' },
  { id: 'rating-desc', label: 'Rating descending', prefix: 'Rating', arrow: 'arrow-downward' },
  { id: 'name-asc', label: 'Name A to Z', prefix: 'Name A', suffix: 'Z', arrow: 'arrow-forward' },
  { id: 'name-desc', label: 'Name Z to A', prefix: 'Name Z', suffix: 'A', arrow: 'arrow-forward' },
];

export const DEFAULT_SORT = 'rating-desc';
