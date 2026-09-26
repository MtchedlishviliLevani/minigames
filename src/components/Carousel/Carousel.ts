import './Carousel.scss';
import { assetUrl, getFeaturedGames } from '../../api/mock-api';
import type { Game } from '../../types';
import { el } from '../../utils/dom';
import { formatCompact } from '../../utils/format';
import { openGameDetails } from '../GameDetailsDialog/GameDetailsDialog';
import { Icon } from '../Icon/Icon';

const AUTOPLAY_MS = 4000;
const SWIPE_THRESHOLD = 40;
const INFO_MIN_WIDTH = 288;

const SLOTS = ['featured', 'regular', 'peek'] as const;

const Stat = (iconName: 'star' | 'heart', value: string): HTMLSpanElement =>
  el('span', {
    className: 'game-card__stat',
    children: [Icon(iconName, `game-card__${iconName}`), el('span', { text: value })],
  });

const GameCard = (game: Game): HTMLLIElement =>
  el('li', {
    className: 'carousel__item',
    children: [
      el('article', {
        className: 'game-card',
        children: [
          el('img', {
            className: 'game-card__image',
            attrs: { src: assetUrl(game.cardImage), alt: game.name, loading: 'lazy' },
          }),
          el('div', {
            className: 'game-card__info',
            children: [
              el('h3', { className: 'game-card__title', text: game.name }),
              el('div', {
                className: 'game-card__meta',
                children: [
                  Stat('star', String(game.rating)),
                  Stat('heart', formatCompact(game.likesCount)),
                ],
              }),
            ],
          }),
          el('button', {
            className: 'game-card__open',
            attrs: { type: 'button', 'aria-label': `Open details for ${game.name}` },
          }),
        ],
      }),
    ],
  });

const ControlButton = (
  name: 'arrow-back' | 'arrow-forward',
  label: string,
  variant: string,
  onClick: () => void
): HTMLButtonElement => {
  const button = el('button', {
    className: `btn btn--round ${variant} carousel__control`,
    attrs: { type: 'button', 'aria-label': label },
    children: [Icon(name)],
  });
  button.addEventListener('click', onClick);
  return button;
};

/** Signed distance from the centre card, wrapped so the slider has no ends. */
const circularOffset = (index: number, centre: number, total: number): number => {
  const forward = (index - centre + total) % total;
  return forward > total / 2 ? forward - total : forward;
};

export const Carousel = (): HTMLElement => {
  const track = el('ul', {
    className: 'carousel__track',
    attrs: { 'aria-label': 'New games', 'aria-busy': 'true' },
  });

  let items: HTMLLIElement[] = [];
  let centre = 0;

  const sizeWatcher = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const width = Math.round(entry.contentRect.width);
      entry.target.classList.toggle('carousel__item--compact', width < INFO_MIN_WIDTH);
    }
  });

  /** Cards keep their DOM position and are re-ordered, so their size can animate. */
  const layout = (): void => {
    for (const [index, item] of items.entries()) {
      const offset = circularOffset(index, centre, items.length);
      const distance = Math.abs(offset);
      item.style.order = String(offset);
      for (const [slotIndex, slot] of SLOTS.entries()) {
        item.classList.toggle(`carousel__item--${slot}`, slotIndex === distance);
      }
      item.classList.toggle('carousel__item--hidden', distance >= SLOTS.length);
    }
  };

  const step = (direction: 1 | -1): void => {
    if (items.length === 0) return;
    centre = (centre + direction + items.length) % items.length;
    layout();
  };

  let timerId: number | undefined;
  let remaining = AUTOPLAY_MS;
  let startedAt = 0;

  const stopTimer = (): void => {
    if (timerId === undefined) return;
    clearTimeout(timerId);
    timerId = undefined;
  };

  const startTimer = (duration: number): void => {
    stopTimer();
    if (items.length === 0) return;
    remaining = duration;
    startedAt = performance.now();
    timerId = window.setTimeout(() => {
      step(1);
      startTimer(AUTOPLAY_MS);
    }, duration);
  };

  const pauseTimer = (): void => {
    if (timerId === undefined) return;
    remaining = Math.max(0, remaining - (performance.now() - startedAt));
    stopTimer();
  };

  let pointerId: number | undefined;
  let startX = 0;
  let swiped = false;

  track.addEventListener('pointerdown', (event) => {
    if (pointerId !== undefined) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    swiped = false;
    pauseTimer();
  });

  const endPointer = (event: PointerEvent): void => {
    if (event.pointerId !== pointerId) return;
    pointerId = undefined;
    const delta = event.clientX - startX;

    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      swiped = true;
      step(delta < 0 ? 1 : -1);
      // A deliberate swipe starts a fresh countdown.
      startTimer(AUTOPLAY_MS);
      return;
    }

    // A press without a swipe resumes the time that was left.
    startTimer(remaining);
  };

  track.addEventListener('pointerup', endPointer);
  track.addEventListener('pointercancel', endPointer);

  track.addEventListener(
    'click',
    (event) => {
      if (!swiped) return;
      event.preventDefault();
      event.stopPropagation();
      swiped = false;
    },
    true
  );

  track.addEventListener('click', (event) => {
    if ((event.target as Element).closest('.game-card__open')) openGameDetails();
  });

  const move = (direction: 1 | -1): void => {
    step(direction);
    startTimer(AUTOPLAY_MS);
  };

  getFeaturedGames()
    .then((featured) => {
      items = featured.map((game) => GameCard(game));
      track.replaceChildren(...items);
      for (const item of items) sizeWatcher.observe(item);
      layout();
      startTimer(AUTOPLAY_MS);
    })
    .catch(() => {
      track.append(el('li', { className: 'carousel__error', text: 'Games could not be loaded.' }));
    })
    .finally(() => {
      track.removeAttribute('aria-busy');
    });

  const header = el('div', {
    className: 'section__header',
    children: [
      el('h2', { className: 'section-title', attrs: { id: 'new-games-title' }, text: 'New Games' }),
      el('div', {
        className: 'carousel__controls',
        children: [
          ControlButton('arrow-back', 'Previous games', 'btn--outlined', () => {
            move(-1);
          }),
          ControlButton('arrow-forward', 'Next games', 'btn--filled', () => {
            move(1);
          }),
        ],
      }),
    ],
  });

  return el('section', {
    className: 'section carousel',
    attrs: { id: 'new-games', 'aria-labelledby': 'new-games-title' },
    children: [el('div', { className: 'container', children: [header, track] })],
  });
};
