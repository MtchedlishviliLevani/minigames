import { getCategories } from '../api/games';
import type { Category } from '../types';

export const FALLBACK_CATEGORY = 'all';

let pending: Promise<Category[]> | undefined;
let loaded: Category[] = [];

export function loadCategories(): Promise<Category[]> {
  pending ??= getCategories()
    .then((categories) => {
      loaded = categories;
      return categories;
    })
    .catch((error: unknown) => {
      pending = undefined;
      throw error;
    });
  return pending;
}

export function categoryLabel(slug: string): string {
  return loaded.find((category) => category.slug === slug)?.label ?? slug;
}

export function defaultCategory(): string {
  return loaded.find((category) => category.isDefault)?.slug ?? FALLBACK_CATEGORY;
}

export function isKnownCategory(slug: string): boolean {
  return loaded.some((category) => category.slug === slug);
}
