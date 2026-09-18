import './Carousel.scss';
import { assetUrl, getFeaturedGames } from '../../api/mock-api';
import type { Game } from '../../types';
import { el } from '../../utils/dom';
import { formatCompact } from '../../utils/format';
import { Icon } from '../Icon/Icon';

const SLOTS = ['peek', 'regular', 'featured', 'regular', 'peek'] as const;

type Slot = (typeof SLOTS)[number];

const Stat = (iconName: 'star' | 'heart', value: string): HTMLSpanElement =>
  el('span', {
    className: 'game-card__stat',
    children: [Icon(iconName, `game-card__${iconName}`), el('span', { text: value })],
  });

const GameCard = (game: Game, slot: Slot): HTMLLIElement =>
  el('li', {
    className: `carousel__item carousel__item--${slot}`,
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

const windowCards = (games: Game[], offset: number): HTMLLIElement[] =>
  SLOTS.slice(0, games.length).flatMap((slot, index) => {
    const game = games[(offset + index) % games.length];
    return game ? [GameCard(game, slot)] : [];
  });

export const Carousel = (): HTMLElement => {
  const track = el('ul', {
    className: 'carousel__track',
    attrs: { 'aria-label': 'New games', 'aria-busy': 'true' },
  });

  let games: Game[] = [];
  let offset = 0;

  const render = (): void => {
    track.replaceChildren(...windowCards(games, offset));
  };

  const step = (direction: 1 | -1): void => {
    if (games.length === 0) return;
    offset = (offset + direction + games.length) % games.length;
    render();
  };

  getFeaturedGames()
    .then((featured) => {
      games = featured;
      render();
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
            step(-1);
          }),
          ControlButton('arrow-forward', 'Next games', 'btn--filled', () => {
            step(1);
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
