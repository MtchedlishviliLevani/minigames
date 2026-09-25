import './LibraryGames.scss';
import { assetUrl, getGames } from '../../api/mock-api';
import { categoryLabel } from '../../data/library';
import type { Game } from '../../types';
import { el } from '../../utils/dom';
import { formatCompact } from '../../utils/format';
import { Icon } from '../Icon/Icon';

const Stat = (iconName: 'star' | 'heart', value: string): HTMLSpanElement =>
  el('span', {
    className: 'game-tile__stat',
    children: [Icon(iconName, `game-tile__${iconName}`), el('span', { text: value })],
  });

const GameTile = (game: Game): HTMLLIElement =>
  el('li', {
    children: [
      el('article', {
        className: 'game-tile',
        children: [
          el('img', {
            className: 'game-tile__media',
            attrs: { src: assetUrl(game.cardImage), alt: game.name, loading: 'lazy' },
          }),
          el('div', {
            className: 'game-tile__content',
            children: [
              el('div', {
                className: 'game-tile__heading',
                children: [
                  el('h3', { className: 'game-tile__title', text: game.name }),
                  el('p', { className: 'game-tile__badge', text: categoryLabel(game.category) }),
                ],
              }),
              el('p', { className: 'game-tile__price', text: game.price }),
              el('p', { className: 'game-tile__description', text: game.shortDescription }),
              el('div', {
                className: 'game-tile__stats',
                children: [
                  Stat('star', String(game.rating)),
                  Stat('heart', formatCompact(game.likesCount)),
                ],
              }),
              el('button', {
                className: 'btn btn--filled game-tile__details',
                attrs: { type: 'button', 'aria-label': `Details about ${game.name}` },
                text: 'Details',
              }),
            ],
          }),
        ],
      }),
    ],
  });

export const LibraryGames = (): HTMLElement => {
  const list = el('ul', {
    className: 'library-games__list',
    attrs: { 'aria-busy': 'true' },
  });

  getGames()
    .then((games) => {
      list.replaceChildren(...games.map((game) => GameTile(game)));
    })
    .catch(() => {
      list.append(
        el('li', { className: 'library-games__error', text: 'Games could not be loaded.' })
      );
    })
    .finally(() => {
      list.removeAttribute('aria-busy');
    });

  return el('section', {
    className: 'library-games',
    attrs: { 'aria-labelledby': 'library-games-title' },
    children: [
      el('div', {
        className: 'container',
        children: [
          el('h2', {
            className: 'visually-hidden',
            attrs: { id: 'library-games-title' },
            text: 'Games',
          }),
          list,
        ],
      }),
    ],
  });
};
