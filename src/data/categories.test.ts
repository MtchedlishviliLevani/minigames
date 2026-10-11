import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as CategoriesModule from './categories';
import { CATEGORIES } from '../test/fixtures';
import { mockFetch, path } from '../test/http';

async function load(): Promise<typeof CategoriesModule> {
  vi.resetModules();
  return import('./categories');
}

describe('categories', () => {
  beforeEach(() => {
    mockFetch([{ match: path('/categories'), body: { data: CATEGORIES } }]);
  });

  it('falls back before anything is loaded', async () => {
    const categories = await load();
    expect(categories.defaultCategory()).toBe('all');
    expect(categories.categoryLabel('puzzle')).toBe('puzzle');
    expect(categories.isKnownCategory('puzzle')).toBe(false);
  });

  it('loads once and answers lookups', async () => {
    const categories = await load();
    const [first, second] = await Promise.all([
      categories.loadCategories(),
      categories.loadCategories(),
    ]);
    expect(first).toBe(second);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    expect(categories.categoryLabel('puzzle')).toBe('Puzzle');
    expect(categories.isKnownCategory('farm')).toBe(true);
    expect(categories.defaultCategory()).toBe('all');
  });

  it('allows a retry after a failure', async () => {
    const fetchMock = mockFetch([{ match: path('/categories'), status: 500, body: {} }]);
    const categories = await load();
    await expect(categories.loadCategories()).rejects.toMatchObject({ status: 500 });

    fetchMock.mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ data: CATEGORIES })))
    );
    await expect(categories.loadCategories()).resolves.toHaveLength(3);
  });
});
