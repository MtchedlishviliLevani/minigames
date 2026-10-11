import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as Router from './router';

type RouterModule = typeof Router;

async function loadRouter(url: string): Promise<RouterModule> {
  window.history.replaceState(null, '', url);
  vi.resetModules();
  const router = await import('./router');
  router.startRouter();
  return router;
}

const currentUrl = (): string => `${window.location.pathname}${window.location.search}`;

describe('router', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('parses a library deep link', async () => {
    const router = await loadRouter('/library?category=puzzle&sort=name-asc&page=3&game=cat-chess');
    expect(router.getState()).toMatchObject({
      route: 'library',
      category: 'puzzle',
      sort: 'name-asc',
      page: 3,
      game: 'cat-chess',
      auth: null,
    });
  });

  it('normalises invalid params and writes them back to the url', async () => {
    const router = await loadRouter('/library?sort=bogus&page=-2&auth=nope');
    expect(router.getState()).toMatchObject({ sort: 'rating-desc', page: 1, auth: null });
    expect(currentUrl()).toBe('/library?category=all&sort=rating-desc&page=1');
  });

  it('maps unknown paths to not-found and keeps the path', async () => {
    const router = await loadRouter('/nowhere/');
    expect(router.getRoute()).toBe('not-found');
    expect(window.location.pathname).toBe('/nowhere/');
  });

  it('treats /home and trailing slashes as home', async () => {
    expect((await loadRouter('/home')).getRoute()).toBe('home');
    expect((await loadRouter('/Library/')).getRoute()).toBe('library');
  });

  it('pushes a new entry and notifies listeners', async () => {
    const router = await loadRouter('/');
    const listener = vi.fn();
    router.onStateChange(listener);
    const lengthBefore = window.history.length;

    router.navigate({ auth: 'login' });

    expect(currentUrl()).toBe('/?auth=login');
    expect(window.history.length).toBe(lengthBefore + 1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ auth: 'login' }),
      expect.objectContaining({ auth: null })
    );
  });

  it('replaces the entry when asked', async () => {
    const router = await loadRouter('/');
    const lengthBefore = window.history.length;
    router.navigate({ game: 'palia' }, { replace: true });
    expect(currentUrl()).toBe('/?game=palia');
    expect(window.history.length).toBe(lengthBefore);
  });

  it('ignores navigation to the current url', async () => {
    const router = await loadRouter('/');
    const listener = vi.fn();
    router.onStateChange(listener);
    router.navigate({ route: 'home' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('drops dialogs when the route changes and resets the page on filter change', async () => {
    const router = await loadRouter('/library?category=all&sort=rating-desc&page=4&game=palia');
    router.navigate({ category: 'farm' });
    expect(router.getState()).toMatchObject({ category: 'farm', page: 1, game: 'palia' });

    router.navigate({ route: 'home' });
    expect(router.getState()).toMatchObject({ route: 'home', game: null });
    expect(currentUrl()).toBe('/');
  });

  it('reports only route changes to route listeners', async () => {
    const router = await loadRouter('/');
    const listener = vi.fn();
    router.onRouteChange(listener);
    router.navigate({ game: 'palia' });
    router.navigate({ route: 'library' });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('library');
  });

  it('re-reads the location on popstate', async () => {
    const router = await loadRouter('/');
    window.history.replaceState(null, '', '/library?page=2&auth=register');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(router.getState()).toMatchObject({ route: 'library', page: 2, auth: 'register' });
  });
});
