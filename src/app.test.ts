import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as RouterModule from './router/router';
import { CATEGORIES, game, LEADERS } from './test/fixtures';
import { flush, mockFetch, path } from './test/http';

vi.mock('./auth/firebase', () => ({ signOutUser: vi.fn(() => Promise.resolve()) }));
vi.mock('./components/Snackbar/Snackbar', () => ({ showSnackbar: vi.fn() }));

async function boot(url: string): Promise<typeof RouterModule> {
  mockFetch([
    { match: path('/leaderboard'), body: { data: LEADERS } },
    { match: path('/categories'), body: { data: CATEGORIES } },
    {
      match: path('/games'),
      body: {
        data: [game('palia')],
        meta: { page: 1, limit: 6, totalItems: 1, totalPages: 1 },
      },
    },
  ]);
  localStorage.clear();
  document.body.replaceChildren();
  window.history.replaceState(null, '', url);
  vi.resetModules();
  const { initSession } = await import('./auth/authState');
  const { installAuthGuard } = await import('./auth/authGuard');
  const router = await import('./router/router');
  const { mountApp } = await import('./app');
  initSession();
  installAuthGuard();
  router.startRouter();
  mountApp(document.body);
  await flush();
  return router;
}

const main = (): HTMLElement => {
  const found = document.querySelector<HTMLElement>('main');
  if (found === null) throw new Error('No main element');
  return found;
};

const click = (selector: string): void => {
  document.querySelector<HTMLElement>(selector)?.click();
};

const scrollTo = vi.fn();

describe('app shell', () => {
  beforeEach(() => {
    scrollTo.mockClear();
    window.scrollTo = scrollTo;
  });

  it('mounts the layout around the home page', async () => {
    await boot('/');
    const landmarks = [...document.body.children].map((node) => node.tagName.toLowerCase());
    expect(landmarks.slice(0, 4)).toEqual(['header', 'main', 'footer', 'div']);
    expect(document.querySelectorAll('dialog')).toHaveLength(2);
    expect(main().querySelector('.hero')).not.toBeNull();
    expect(main().querySelector('#new-games')).not.toBeNull();
    expect(main().querySelector('#top-players tbody tr')?.textContent).toContain('Alex_Pro99');
    expect(document.querySelector('footer')?.textContent).toContain('MiniGames');
    expect(document.querySelector('.header__link--active')?.textContent).toBe('Home');
  });

  it('switches pages through nav links without reloading', async () => {
    const router = await boot('/');
    click('.header__link[href="/library"]');
    await flush();
    expect(router.getRoute()).toBe('library');
    expect(window.location.pathname).toBe('/library');
    expect(main().querySelector('.library-games')).not.toBeNull();
    expect(document.querySelector('.header__link--active')?.textContent).toBe('Library');
    expect(document.querySelector('.mobile-menu__link--active')?.getAttribute('aria-current')).toBe(
      'page'
    );
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
  });

  it('reuses rendered pages when going back', async () => {
    const router = await boot('/');
    const hero = main().querySelector('.hero');
    router.navigate({ route: 'library' });
    router.navigate({ route: 'home' });
    expect(main().querySelector('.hero')).toBe(hero);
  });

  it('lets modified clicks through to the browser', async () => {
    const router = await boot('/');
    const link = document.querySelector<HTMLAnchorElement>('.header__link[href="/library"]');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    link?.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(router.getRoute()).toBe('home');
  });

  it('renders the 404 page and returns home from it', async () => {
    const router = await boot('/missing/page');
    expect(main().querySelector('.not-found h1')?.textContent).toBe('This page does not exist');

    click('.not-found__action');
    expect(router.getRoute()).toBe('home');
    expect(main().querySelector('.hero')).not.toBeNull();
  });

  it('closes the mobile menu with Escape and on desktop widths', async () => {
    await boot('/');
    const menu = document.querySelector<HTMLElement>('#mobile-menu');
    click('.header__burger');
    expect(menu?.hidden).toBe(false);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.body.classList.contains('is-locked')).toBe(false);

    click('.header__burger');
    click('.mobile-menu__close');
    expect(document.querySelector('.header__burger')?.getAttribute('aria-expanded')).toBe('false');

    click('.header__burger');
    click('.mobile-menu__link[href="/library"]');
    expect(document.querySelector('.header__burger')?.getAttribute('aria-label')).toBe('Open menu');
  });
});
