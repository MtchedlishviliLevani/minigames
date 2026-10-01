import './GameDetailsDialog.scss';
import { COMMENTS_LIMIT, getGameComments, getGameDetails } from '../../api/games';
import type { AppState } from '../../router/router';
import { getState, navigate, onStateChange } from '../../router/router';
import type { GameComment, GameCommentsPage, GameDetails, GameRecord } from '../../types';
import { assetUrl } from '../../utils/assets';
import { createAsyncSection } from '../../utils/asyncSection';
import type { AsyncSection } from '../../utils/asyncSection';
import { el } from '../../utils/dom';
import { formatCompact, formatNumber, initials } from '../../utils/format';
import { relativeTime } from '../../utils/relativeTime';
import { runAfterTransition } from '../../utils/transition';
import { Icon } from '../Icon/Icon';
import { Skeleton, SkeletonLine, SkeletonText } from '../Skeleton/Skeleton';

const TEXTAREA_MAX_HEIGHT = 88;
const AVATAR_VARIANTS = 3;
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

const LikeButton = (comment: GameComment): HTMLButtonElement => {
  const count = el('span', { text: String(comment.likesCount) });
  const button = el('button', {
    className: 'game-dialog__like',
    attrs: {
      type: 'button',
      'aria-pressed': String(comment.isLikedByCurrentUser),
      'aria-label': `Like the comment by ${comment.authorName}`,
    },
    children: [Icon('heart', 'game-dialog__like-icon'), count],
  });
  button.classList.toggle('game-dialog__like--active', comment.isLikedByCurrentUser);

  button.addEventListener('click', () => {
    const liked = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(liked));
    button.classList.toggle('game-dialog__like--active', liked);
    count.textContent = String(liked ? comment.likesCount + 1 : comment.likesCount);
  });

  return button;
};

const Comment = (comment: GameComment, index: number): HTMLLIElement =>
  el('li', {
    className: 'game-dialog__comment',
    children: [
      el('div', {
        className: 'game-dialog__comment-head',
        children: [
          el('span', {
            className: 'game-dialog__comment-author',
            children: [
              el('span', {
                className: `game-dialog__avatar game-dialog__avatar--small game-dialog__avatar--${String((index % AVATAR_VARIANTS) + 1)}`,
                attrs: { 'aria-hidden': 'true' },
                text: initials(comment.authorName),
              }),
              el('span', { text: comment.authorName }),
            ],
          }),
          el('span', {
            className: 'game-dialog__comment-time',
            text: relativeTime(comment.createdAt),
          }),
        ],
      }),
      el('p', { className: 'game-dialog__comment-body', text: comment.text }),
      LikeButton(comment),
    ],
  });

const SkeletonComment = (): HTMLLIElement =>
  el('li', {
    className: 'game-dialog__comment',
    children: [
      el('div', {
        className: 'game-dialog__comment-head',
        children: [Skeleton('skeleton--circle'), SkeletonLine('small', 'skeleton--short')],
      }),
      SkeletonText(2),
    ],
  });

const CommentForm = (gameName: string): HTMLFormElement => {
  const field = el('textarea', {
    className: 'game-dialog__textarea',
    attrs: {
      rows: '1',
      placeholder: 'Write a comment...',
      'aria-label': `Write a comment about ${gameName}`,
    },
  });

  field.addEventListener('input', () => {
    field.style.height = 'auto';
    field.style.height = `${String(Math.min(field.scrollHeight, TEXTAREA_MAX_HEIGHT))}px`;
  });

  const form = el('form', {
    className: 'game-dialog__comment-form',
    children: [
      el('span', {
        className: 'game-dialog__avatar game-dialog__avatar--me',
        attrs: { 'aria-hidden': 'true' },
        text: 'U',
      }),
      field,
      el('button', {
        className: 'game-dialog__send',
        attrs: { type: 'submit', 'aria-label': 'Submit comment' },
        children: [Icon('send', 'game-dialog__send-icon')],
      }),
    ],
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
  });

  return form;
};

const CommentsSection = (slug: string, gameName: string): HTMLElement => {
  const title = el('h3', { className: 'game-dialog__section-title', text: 'Comments' });
  const list = el('ul', { className: 'game-dialog__comments' });

  createAsyncSection<GameCommentsPage>({
    container: list,
    skeleton: () => Array.from({ length: COMMENTS_LIMIT }, () => SkeletonComment()),
    load: (signal) => getGameComments(slug, signal),
    onData: (page) => {
      title.textContent = `Comments (${String(page.totalComments)})`;
    },
    render: (page) => page.comments.map((comment, index) => Comment(comment, index)),
    isEmpty: (page) => page.comments.length === 0,
    emptyMessage: 'No comments yet. Be the first to share your thoughts.',
    errorMessage: 'Comments could not be loaded.',
    wrap: (state) => [el('li', { className: 'game-dialog__comments-state', children: [state] })],
  });

  return el('section', {
    className: 'game-dialog__section',
    children: [title, CommentForm(gameName), list],
  });
};

const FavoriteButton = (isFavorite: boolean): HTMLButtonElement => {
  const button = el('button', {
    className: 'btn game-dialog__favorite',
    attrs: { type: 'button', 'aria-pressed': String(isFavorite) },
    children: [
      Icon('heart', 'game-dialog__favorite-icon'),
      el('span', { className: 'game-dialog__favorite-label', text: 'Add to Favorites' }),
    ],
  });
  button.classList.toggle('game-dialog__favorite--active', isFavorite);

  button.addEventListener('click', () => {
    const pressed = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(pressed));
    button.classList.toggle('game-dialog__favorite--active', pressed);
  });

  return button;
};

const DetailsContent = (details: GameDetails): Node[] => [
  el('div', {
    className: 'game-dialog__headline',
    children: [
      el('h2', { className: 'game-dialog__title', text: details.name }),
      el('div', {
        className: 'game-dialog__stats',
        children: [
          Stat('star', String(details.rating)),
          Stat('heart', formatCompact(details.likesCount)),
        ],
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
      FavoriteButton(details.isLikedByCurrentUser),
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
  CommentsSection(details.slug, details.name),
];

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

const cover = el('img', { className: 'game-dialog__cover', attrs: { alt: '', src: '' } });
cover.hidden = true;

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
  children: [coverSkeleton, cover, closeButton],
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

function setCoverLoading(loading: boolean): void {
  cover.hidden = loading;
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
  setCoverLoading(false);
}

function loadDetails(slug: string): void {
  currentSlug = slug;

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
    load: (signal) => getGameDetails(currentSlug, signal),
    render: (details) => {
      dialog.setAttribute('aria-label', details.name);
      showCover(details);
      return DetailsContent(details);
    },
    errorMessage: 'Game details could not be loaded.',
  });
}

function showDialog(slug: string): void {
  dialog.dataset.slug = slug;
  loadDetails(slug);

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
  document.body.classList.remove('is-locked');
  runAfterTransition(panel, () => {
    dialog.close();
    delete dialog.dataset.slug;
  });
}

function syncDialog(next: AppState, previous: AppState): void {
  if (next.game === previous.game) return;
  if (next.game === null) {
    hideDialog();
  } else {
    showDialog(next.game);
  }
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
  const initial = getState();
  onStateChange(syncDialog);
  if (initial.game !== null) openAfterMount(initial.game);
  return dialog;
};
