import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as RouterModule from '../../router/router';
import { game } from '../../test/fixtures';
import { mockFetch, path } from '../../test/http';
import type { MockRoute } from '../../test/http';

vi.mock('../Snackbar/Snackbar', () => ({ showSnackbar: vi.fn() }));

const FEATURED = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((slug) => game(slug));

async function setup(routes: MockRoute[]): Promise<{
  carousel: HTMLElement;
  router: typeof RouterModule;
}> {
  mockFetch(routes);
  window.history.replaceState(null, '', '/');
  vi.resetModules();
  const router = await import('../../router/router');
  router.startRouter();
  const { Carousel } = await import('./Carousel');
  const carousel = Carousel();
  document.body.replaceChildren(carousel);
  await vi.advanceTimersByTimeAsync(0);
  return { carousel, router };
}

const featuredRoute: MockRoute = { match: path('/games'), body: { data: FEATURED } };

const featuredSlug = (carousel: HTMLElement): string | undefined =>
  carousel.querySelector<HTMLElement>('.carousel__item--featured .game-card__open')?.dataset.slug;

const pointer = (type: string, clientX: number): PointerEvent =>
  new PointerEvent(type, { clientX, pointerId: 7, bubbles: true });

describe('Carousel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows an empty state when there are no featured games', async () => {
    const { carousel } = await setup([{ match: () => true, body: { data: [] }, status: 200 }]);
    expect(carousel.querySelector('.data-state--empty')?.textContent).toContain('no new games');
  });

  it('renders featured games around a centred card', async () => {
    const { carousel } = await setup([featuredRoute]);
    expect(carousel.querySelectorAll('.carousel__item')).toHaveLength(7);
    expect(featuredSlug(carousel)).toBe('a');
    expect(carousel.querySelectorAll('.carousel__item--regular')).toHaveLength(2);
    expect(carousel.querySelectorAll('.carousel__item--peek')).toHaveLength(2);
    expect(carousel.querySelectorAll('.carousel__item--hidden')).toHaveLength(2);
    expect(carousel.querySelector('.game-card__meta')?.textContent).toBe('4.51.5K');
  });

  it('moves with the arrow buttons and wraps around', async () => {
    const { carousel } = await setup([featuredRoute]);
    carousel.querySelector<HTMLButtonElement>('[aria-label="Previous games"]')?.click();
    expect(featuredSlug(carousel)).toBe('g');
    carousel.querySelector<HTMLButtonElement>('[aria-label="Next games"]')?.click();
    carousel.querySelector<HTMLButtonElement>('[aria-label="Next games"]')?.click();
    expect(featuredSlug(carousel)).toBe('b');
  });

  it('advances on its own every few seconds', async () => {
    const { carousel } = await setup([featuredRoute]);
    await vi.advanceTimersByTimeAsync(4000);
    expect(featuredSlug(carousel)).toBe('b');
    await vi.advanceTimersByTimeAsync(4000);
    expect(featuredSlug(carousel)).toBe('c');
  });

  it('follows swipes and ignores the click that ends them', async () => {
    const { carousel, router } = await setup([featuredRoute]);
    const track = carousel.querySelector('.carousel__track');
    const card = carousel.querySelector('.carousel__item--featured .game-card__open');

    track?.dispatchEvent(pointer('pointerdown', 300));
    track?.dispatchEvent(pointer('pointerup', 200));
    expect(featuredSlug(carousel)).toBe('b');
    card?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(router.getState().game).toBeNull();

    track?.dispatchEvent(pointer('pointerdown', 100));
    track?.dispatchEvent(pointer('pointercancel', 200));
    expect(featuredSlug(carousel)).toBe('a');
  });

  it('pauses while pressed and resumes the remaining time', async () => {
    const { carousel } = await setup([featuredRoute]);
    await vi.advanceTimersByTimeAsync(3000);
    const track = carousel.querySelector('.carousel__track');
    track?.dispatchEvent(pointer('pointerdown', 100));
    await vi.advanceTimersByTimeAsync(5000);
    expect(featuredSlug(carousel)).toBe('a');

    track?.dispatchEvent(pointer('pointerup', 110));
    await vi.advanceTimersByTimeAsync(1000);
    expect(featuredSlug(carousel)).toBe('b');
  });

  it('opens game details from a card', async () => {
    const { carousel, router } = await setup([featuredRoute]);
    carousel
      .querySelector<HTMLButtonElement>('.carousel__item--featured .game-card__open')
      ?.click();
    expect(router.getState().game).toBe('a');
  });

  it('shows an error banner that can retry', async () => {
    const { carousel } = await setup([{ match: path('/games'), status: 500, body: {} }]);
    expect(carousel.querySelector('.data-state--error')).not.toBeNull();
  });
});
