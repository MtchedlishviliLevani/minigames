import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as RouterModule from '../router/router';
import { CATEGORIES, game } from '../test/fixtures';
import { flush, mockFetch, path, requestUrl } from '../test/http';
import type { FetchMock, MockRoute } from '../test/http';

vi.mock('../components/Snackbar/Snackbar', () => ({ showSnackbar: vi.fn() }));

interface Context {
  root: HTMLElement;
  router: typeof RouterModule;
  fetchMock: FetchMock;
}

const gamesRoute = (totalPages = 5, games = [game('palia'), game('tiny-glade')]): MockRoute => ({
  match: path('/games'),
  body: { data: games, meta: { page: 1, limit: 6, totalItems: 30, totalPages } },
});

const categoriesRoute: MockRoute = { match: path('/categories'), body: { data: CATEGORIES } };

async function setup(
  url = '/library',
  routes: MockRoute[] = [categoriesRoute, gamesRoute()]
): Promise<Context> {
  const fetchMock = mockFetch(routes);
  window.history.replaceState(null, '', url);
  vi.resetModules();
  const router = await import('../router/router');
  router.startRouter();
  const { LibraryPage } = await import('./LibraryPage');
  const root = document.createElement('main');
  root.append(...LibraryPage());
  document.body.replaceChildren(root);
  await flush();
  await flush();
  return { root, router, fetchMock };
}

const lastGamesQuery = (ctx: Context): URLSearchParams => {
  const urls = ctx.fetchMock.mock.calls
    .map(([input]) => new URL(requestUrl(input)))
    .filter((url) => url.pathname.endsWith('/games'));
  return urls.at(-1)?.searchParams ?? new URLSearchParams();
};

const gameRequests = (ctx: Context): number =>
  ctx.fetchMock.mock.calls.filter(([input]) =>
    new URL(requestUrl(input)).pathname.endsWith('/games')
  ).length;

describe('LibraryPage', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('renders the intro, category chips and game tiles', async () => {
    const ctx = await setup();
    expect(ctx.root.querySelector('h1')?.textContent).toBe('Game Library');
    const chips = [...ctx.root.querySelectorAll('.chip')].map((chip) => chip.textContent);
    expect(chips).toEqual(['All Games', 'Puzzle', 'Farm']);
    expect(ctx.root.querySelector('.chip--active')?.textContent).toBe('All Games');
    const titles = [...ctx.root.querySelectorAll('.game-tile__title')].map((t) => t.textContent);
    expect(titles).toEqual(['palia', 'tiny glade']);
    expect(ctx.root.querySelector('.game-tile__badge')?.textContent).toBe('Puzzle');
    expect(lastGamesQuery(ctx).toString()).toBe('category=all&sort=rating-desc&page=1&limit=6');
  });

  it('requests a filtered page from the api when a chip is chosen', async () => {
    const ctx = await setup();
    ctx.root.querySelector<HTMLButtonElement>('[data-slug="farm"]')?.click();
    await flush();
    expect(ctx.router.getState().category).toBe('farm');
    expect(lastGamesQuery(ctx).get('category')).toBe('farm');
    expect(ctx.root.querySelector('.chip--active')?.textContent).toBe('Farm');
  });

  it('replaces an unknown category with the default one', async () => {
    const ctx = await setup('/library?category=space');
    expect(ctx.router.getState().category).toBe('all');
    expect(lastGamesQuery(ctx).get('category')).toBe('all');
  });

  it('sorts through the listbox with the mouse and keyboard', async () => {
    const ctx = await setup();
    const toggle = ctx.root.querySelector<HTMLButtonElement>('.sort__toggle');
    const menu = ctx.root.querySelector<HTMLElement>('.sort__menu');
    toggle?.click();
    expect(menu?.hidden).toBe(false);
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');

    ctx.root.querySelector<HTMLElement>('[data-id="name-asc"]')?.click();
    await flush();
    expect(menu?.hidden).toBe(true);
    expect(lastGamesQuery(ctx).get('sort')).toBe('name-asc');
    expect(toggle?.getAttribute('aria-label')).toBe('Sort by: Name A to Z');

    toggle?.click();
    const options = [...ctx.root.querySelectorAll<HTMLElement>('.sort__option')];
    options[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(options.at(-1));
    options[3]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(options[0]);
    options[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    options[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await flush();
    expect(ctx.router.getState().sort).toBe('rating-asc');
  });

  it('closes the sort menu on outside clicks and Escape', async () => {
    const ctx = await setup();
    const toggle = ctx.root.querySelector<HTMLButtonElement>('.sort__toggle');
    const menu = ctx.root.querySelector<HTMLElement>('.sort__menu');
    toggle?.click();
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(menu?.hidden).toBe(true);

    toggle?.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(menu?.hidden).toBe(true);
  });

  it('paginates through the api', async () => {
    const ctx = await setup();
    const pages = (): string[] =>
      [...ctx.root.querySelectorAll('.pagination__page')].map((page) => page.textContent);
    expect(pages()).toEqual(['1', '2', '3', '4']);
    const previous = ctx.root.querySelector<HTMLButtonElement>('[aria-label="Previous page"]');
    expect(previous?.disabled).toBe(true);

    ctx.root.querySelector<HTMLButtonElement>('[aria-label="Next page"]')?.click();
    await flush();
    expect(lastGamesQuery(ctx).get('page')).toBe('2');

    [...ctx.root.querySelectorAll<HTMLButtonElement>('.pagination__page')].at(-1)?.click();
    await flush();
    expect(ctx.router.getState().page).toBe(4);
  });

  it('only reloads when the library query changes', async () => {
    const ctx = await setup();
    const before = gameRequests(ctx);
    ctx.router.navigate({ game: 'palia' });
    ctx.router.navigate({ route: 'home' });
    expect(gameRequests(ctx)).toBe(before);
  });

  it('opens game details from a tile', async () => {
    const ctx = await setup();
    ctx.root.querySelector<HTMLButtonElement>('.game-tile__details')?.click();
    expect(ctx.router.getState().game).toBe('palia');
  });

  it('shows the empty state when no games match', async () => {
    const ctx = await setup('/library', [categoriesRoute, gamesRoute(1, [])]);
    expect(ctx.root.querySelector('.library-games .data-state--empty')).not.toBeNull();
  });

  it('still loads games when categories fail', async () => {
    const ctx = await setup('/library?category=space', [
      { match: path('/categories'), status: 500, body: {} },
      gamesRoute(),
    ]);
    expect(ctx.root.querySelector('.library-filters .data-state--error')).not.toBeNull();
    expect(lastGamesQuery(ctx).get('category')).toBe('space');
  });
});
