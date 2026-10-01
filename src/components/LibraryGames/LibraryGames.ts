import './LibraryGames.scss';
import { getGames } from '../../api/games';
import { categoryLabel, FALLBACK_CATEGORY, loadCategories } from '../../data/categories';
import { GAMES_PER_PAGE } from '../../data/library';
import { getState, navigate, onStateChange } from '../../router/router';
import type { GamesPage } from '../../types';
import type { Game } from '../../types';
import { assetUrl } from '../../utils/assets';
import { createAsyncSection } from '../../utils/asyncSection';
import { el } from '../../utils/dom';
import { formatCompact } from '../../utils/format';
import { openGameDetails } from '../GameDetailsDialog/GameDetailsDialog';
import { Icon } from '../Icon/Icon';
import { Skeleton, SkeletonText } from '../Skeleton/Skeleton';

const Stat = (iconName: 'star' | 'heart', value: string): HTMLSpanElement =>
  el('span', {
    className: 'game-tile__stat',
    children: [Icon(iconName, `game-tile__${iconName}`), el('span', { text: value })],
  });

const DetailsButton = (game: Game): HTMLButtonElement => {
  const button = el('button', {
    className: 'btn btn--filled game-tile__details',
    attrs: { type: 'button', 'aria-label': `Details about ${game.name}` },
    text: 'Details',
  });
  button.addEventListener('click', () => {
    openGameDetails(game.slug);
  });
  return button;
};

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
              DetailsButton(game),
            ],
          }),
        ],
      }),
    ],
  });

const SkeletonTile = (): HTMLLIElement =>
  el('li', {
    children: [
      el('div', {
        className: 'game-tile',
        children: [
          Skeleton('game-tile__media skeleton--fill'),
          el('div', {
            className: 'game-tile__content',
            children: [
              el('div', {
                className: 'game-tile__heading',
                children: [Skeleton('skeleton--large')],
              }),
              SkeletonText(3),
            ],
          }),
        ],
      }),
    ],
  });

export interface LibraryGamesOptions {
  onLoaded: (page: number, totalPages: number) => void;
}

export const LibraryGames = ({ onLoaded }: LibraryGamesOptions): HTMLElement => {
  const list = el('ul', { className: 'library-games__list' });

  const section = createAsyncSection<GamesPage>({
    container: list,
    skeleton: () => Array.from({ length: GAMES_PER_PAGE }, () => SkeletonTile()),
    load: async (signal) => {
      const categories = await loadCategories().catch(() => []);
      const { category, sort, page } = getState();
      const known = categories.some((item) => item.slug === category);
      const fallback = categories.find((item) => item.isDefault)?.slug ?? FALLBACK_CATEGORY;
      const resolved = categories.length === 0 || known ? category : fallback;
      if (resolved !== category) navigate({ category: resolved }, { replace: true });
      return getGames({ category: resolved, sort, page, limit: GAMES_PER_PAGE }, signal);
    },
    onData: (result) => {
      onLoaded(result.page, result.totalPages);
    },
    render: (result) => result.games.map((game) => GameTile(game)),
    isEmpty: (result) => result.games.length === 0,
    emptyMessage: 'No games match the selected filters.',
    errorMessage: 'Games could not be loaded.',
    wrap: (state) => [el('li', { className: 'library-games__state', children: [state] })],
  });

  onStateChange((next, previous) => {
    if (next.route !== 'library') return;
    if (
      next.category === previous.category &&
      next.sort === previous.sort &&
      next.page === previous.page
    ) {
      return;
    }
    section.reload();
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
