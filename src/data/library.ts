import type { SortOption } from '../types';

export const LIBRARY_TITLE = 'Game Library';
export const LIBRARY_SUBTITLE = 'Browse our collection of casual mini-games';

export const SORT_OPTIONS: [SortOption, ...SortOption[]] = [
  { id: 'rating-asc', label: 'Rating ascending', prefix: 'Rating', arrow: 'arrow-upward' },
  { id: 'rating-desc', label: 'Rating descending', prefix: 'Rating', arrow: 'arrow-downward' },
  { id: 'name-asc', label: 'Name A to Z', prefix: 'Name A', suffix: 'Z', arrow: 'arrow-forward' },
  { id: 'name-desc', label: 'Name Z to A', prefix: 'Name Z', suffix: 'A', arrow: 'arrow-forward' },
];

export const DEFAULT_SORT = 'rating-desc';
export const GAMES_PER_PAGE = 6;
