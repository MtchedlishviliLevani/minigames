import type { Category, SortOption } from '../types';

export const LIBRARY_TITLE = 'Game Library';
export const LIBRARY_SUBTITLE = 'Browse our collection of casual mini-games';

export const CATEGORIES: Category[] = [
  { slug: 'all', label: 'All Games', isDefault: true },
  { slug: 'puzzle', label: 'Puzzle', isDefault: false },
  { slug: 'card', label: 'Card', isDefault: false },
  { slug: 'match', label: 'Match', isDefault: false },
  { slug: 'farm', label: 'Farm', isDefault: false },
  { slug: 'strategy', label: 'Strategy', isDefault: false },
  { slug: 'arcade', label: 'Arcade', isDefault: false },
];

export const DEFAULT_CATEGORY = 'all';

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((category) => category.slug === slug)?.label ?? slug;
}

export const SORT_OPTIONS: [SortOption, ...SortOption[]] = [
  { id: 'rating-asc', label: 'Rating ascending', prefix: 'Rating', arrow: 'arrow-upward' },
  { id: 'rating-desc', label: 'Rating descending', prefix: 'Rating', arrow: 'arrow-downward' },
  { id: 'name-asc', label: 'Name A to Z', prefix: 'Name A', suffix: 'Z', arrow: 'arrow-forward' },
  { id: 'name-desc', label: 'Name Z to A', prefix: 'Name Z', suffix: 'A', arrow: 'arrow-forward' },
];

export const DEFAULT_SORT = 'rating-desc';

/** The mockup shows one page of six cards; 24 mock games make four pages. */
export const GAMES_PER_PAGE = 6;
export const TOTAL_PAGES = 4;
