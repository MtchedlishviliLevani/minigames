import './GameDetailsDialog.scss';
import { getGameDetails } from '../../api/games';
import { getSession, onSessionChange } from '../../auth/authState';
import type { AppState } from '../../router/router';
import { getState, navigate, onStateChange } from '../../router/router';
import type { GameDetails, GameRecord } from '../../types';
import { assetUrl } from '../../utils/assets';
import { createAsyncSection } from '../../utils/asyncSection';
import type { AsyncSection } from '../../utils/asyncSection';
import { el } from '../../utils/dom';
import { formatCompact, formatNumber } from '../../utils/format';
import { relativeTime } from '../../utils/relativeTime';
import { runAfterTransition } from '../../utils/transition';
import { Icon } from '../Icon/Icon';
import { Skeleton, SkeletonLine, SkeletonText } from '../Skeleton/Skeleton';
import { CommentsSection, resetComments } from './CommentsSection';
import { FavoriteButton } from './FavoriteButton';

const MEDALS = ['🥇', '🥈', '🥉'];
const SKELETON_FACTS = 4;
const SKELETON_RECORDS = 3;
const GENERIC_LABEL = 'Game details';

const cardImageUrl = (slug: string): string => assetUrl(`/assets/images/games/${slug}-card.jpg`);

const Stat = (icon: 'star' | 'heart', value: string): HTMLSpanElement =>
  el('span', {
    className: 'game-dialog__stat',
    children: [Icon(icon, `game-dialog__${icon}`), el('span', { text: value })],
  });

const Fact = (label: string, value: string): HTMLLIElement =>
  el('li', {
    className: 'game-dialog__fact',
    children: [
      el('span', { className: 'game-dialog__fact-label', text: label }),
      el('span', { className: 'game-dialog__fact-value', text: value }),
    ],
  });

const Record = (record: GameRecord): HTMLLIElement =>
  el('li', {
    className: 'game-dialog__record',
    children: [
      el('span', {
        className: 'game-dialog__record-player',
        children: [
          el('span', {
            className: 'game-dialog__medal',
            attrs: { 'aria-hidden': 'true' },
            text: MEDALS[record.position - 1] ?? `#${String(record.position)}`,
          }),
          el('span', { text: record.playerName }),
        ],
      }),
      el('span', {
        className: 'game-dialog__record-score',
        children: [
          el('span', { text: `${formatNumber(record.score)} pts` }),
          el('span', {
            className: 'game-dialog__record-when',
            text: relativeTime(record.achievedAt),
          }),
        ],
      }),
    ],
  });

const DetailsContent = (details: GameDetails): Node[] => {
  const likes = Stat('heart', formatCompact(details.likesCount));
  const updateLikes = (likesCount: number): void => {
    likes.lastElementChild?.replaceChildren(formatCompact(likesCount));
  };

  return [
    el('div', {
      className: 'game-dialog__headline',
      children: [
        el('h2', { className: 'game-dialog__title', text: details.name }),
        el('div', {
          className: 'game-dialog__stats',
          children: [Stat('star', String(details.rating)), likes],
        }),
      ],
    }),
    el('p', { className: 'game-dialog__description', text: details.fullDescription }),
    el('ul', {
      className: 'game-dialog__facts',
      children: [
        Fact('Genre', details.specs.genre),
        Fact('Players', details.specs.players),
        Fact('Duration', details.specs.duration),
        Fact('Price', details.specs.price),
      ],
    }),
    el('div', {
      className: 'game-dialog__actions',
      children: [
        el('button', {
          className: 'btn btn--filled game-dialog__play',
          attrs: { type: 'button' },
          text: 'Play Now',
        }),
        FavoriteButton({
          slug: details.slug,
          isFavorite: details.isLikedByCurrentUser,
          onLikesChange: updateLikes,
        }),
      ],
    }),
    el('section', {
      className: 'game-dialog__section',
      children: [
        el('h3', {
          className: 'game-dialog__section-title',
          children: [
            el('span', { attrs: { 'aria-hidden': 'true' }, text: '🏆' }),
            el('span', { text: 'Top Records' }),
          ],
        }),
        el('ul', { className: 'game-dialog__records', children: details.topRecords.map(Record) }),
      ],
    }),
    CommentsSection({ slug: details.slug, gameName: details.name }),
  ];
};

const SkeletonContent = (): Node[] => [
  el('div', {
    className: 'game-dialog__headline',
    children: [SkeletonLine('large'), SkeletonLine('small', 'skeleton--short')],
  }),
  SkeletonText(3),
  el('ul', {
    className: 'game-dialog__facts',
    children: Array.from({ length: SKELETON_FACTS }, () =>
      el('li', { className: 'game-dialog__fact', children: [SkeletonLine('small')] })
    ),
  }),
  el('ul', {
    className: 'game-dialog__records',
    children: Array.from({ length: SKELETON_RECORDS }, () =>
      el('li', { className: 'game-dialog__record', children: [SkeletonLine('medium')] })
    ),
  }),
];

const cover = el('img', { className: 'game-dialog__cover', attrs: { alt: '' } });

cover.addEventListener('error', () => {
  const fallback = cover.dataset.fallback;
  if (fallback === undefined || cover.src.endsWith(fallback)) return;
  delete cover.dataset.fallback;
  cover.src = fallback;
});

const coverSkeleton = Skeleton('game-dialog__cover-skeleton skeleton--fill');

const closeButton = el('button', {
  className: 'game-dialog__close',
  attrs: { type: 'button', 'aria-label': 'Close game details' },
  children: [Icon('close', 'game-dialog__close-icon')],
});

const hero = el('div', {
  className: 'game-dialog__hero',
  children: [coverSkeleton, closeButton],
});

const body = el('div', { className: 'game-dialog__body' });
const panel = el('div', { className: 'game-dialog__panel', children: [hero, body] });

const dialog = el('dialog', {
  className: 'game-dialog',
  attrs: { 'aria-label': GENERIC_LABEL },
  children: [panel],
});

let section: AsyncSection | undefined;
let currentSlug = '';
let loadedFor: string | null = null;

function setCoverLoading(loading: boolean): void {
  if (loading) cover.remove();
  coverSkeleton.hidden = !loading;
  if (loading) {
    coverSkeleton.setAttribute('aria-hidden', 'true');
  } else {
    coverSkeleton.removeAttribute('aria-hidden');
  }
}

function showCover(details: GameDetails): void {
  cover.dataset.fallback = cardImageUrl(details.slug);
  cover.alt = details.name;
  cover.src = assetUrl(details.heroImage);
  if (!cover.isConnected) hero.insertBefore(cover, closeButton);
  setCoverLoading(false);
}

function viewerKey(): string {
  return getSession()?.email ?? '';
}

function loadDetails(slug: string): void {
  currentSlug = slug;
  loadedFor = `${slug}|${viewerKey()}`;

  if (section !== undefined) {
    section.reload();
    return;
  }

  section = createAsyncSection<GameDetails>({
    container: body,
    skeleton: () => {
      dialog.setAttribute('aria-label', GENERIC_LABEL);
      setCoverLoading(true);
      return SkeletonContent();
    },
    load: (signal) => getGameDetails(currentSlug, getSession()?.email, signal),
    render: (details) => {
      dialog.setAttribute('aria-label', details.name);
      showCover(details);
      return DetailsContent(details);
    },
    errorMessage: 'Game details could not be loaded.',
    notFound: {
      title: 'Game not found',
      message: 'This game is not available any more. Pick another one from the library.',
    },
  });
}

function showDialog(slug: string): void {
  dialog.dataset.slug = slug;
  if (loadedFor !== `${slug}|${viewerKey()}`) loadDetails(slug);

  if (!dialog.open) {
    dialog.showModal();
    dialog.scrollTop = 0;
    requestAnimationFrame(() => {
      dialog.classList.add('is-open');
    });
    document.body.classList.add('is-locked');
  }
}

function hideDialog(): void {
  if (!dialog.open) return;
  dialog.classList.remove('is-open');
  if (getState().auth === null) document.body.classList.remove('is-locked');
  runAfterTransition(panel, () => {
    dialog.close();
    delete dialog.dataset.slug;
  });
}

const visibleGame = (state: AppState): string | null => (state.auth === null ? state.game : null);

function syncDialog(next: AppState, previous: AppState): void {
  const game = visibleGame(next);
  if (game === visibleGame(previous)) return;
  if (next.game !== previous.game) {
    loadedFor = null;
    resetComments();
  }
  if (game === null) {
    hideDialog();
  } else {
    showDialog(game);
  }
}

function refreshForViewer(): void {
  const game = visibleGame(getState());
  if (game !== null && dialog.open) loadDetails(game);
}

export function openGameDetails(slug: string): void {
  navigate({ game: slug });
}

export function closeGameDetails(): void {
  navigate({ game: null });
}

closeButton.addEventListener('click', closeGameDetails);

dialog.addEventListener('click', (event) => {
  if (event.target === event.currentTarget) closeGameDetails();
});

dialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeGameDetails();
});

function openAfterMount(slug: string): void {
  queueMicrotask(() => {
    showDialog(slug);
  });
}

export const GameDetailsDialog = (): HTMLDialogElement => {
  const initial = visibleGame(getState());
  onStateChange(syncDialog);
  onSessionChange(refreshForViewer);
  if (initial !== null) openAfterMount(initial);
  return dialog;
};
