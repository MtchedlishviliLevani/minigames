import './GameDetailsDialog.scss';
import { assetUrl } from '../../api/mock-api';
import { GAME_DETAILS } from '../../data/gameDetails';
import type { GameComment, GameFact, GameRecord } from '../../data/gameDetails';
import { el } from '../../utils/dom';
import { Icon } from '../Icon/Icon';

const TEXTAREA_MAX_HEIGHT = 88;
const AVATAR_VARIANTS = 3;

const resetters: (() => void)[] = [];

const runAfterTransition = (target: HTMLElement, callback: () => void): void => {
  const finish = (event: TransitionEvent): void => {
    if (event.target !== target) return;
    target.removeEventListener('transitionend', finish);
    callback();
  };
  target.addEventListener('transitionend', finish);
};

const Stat = (icon: 'star' | 'heart', value: string): HTMLSpanElement =>
  el('span', {
    className: 'game-dialog__stat',
    children: [Icon(icon, `game-dialog__${icon}`), el('span', { text: value })],
  });

const Fact = (fact: GameFact): HTMLLIElement =>
  el('li', {
    className: 'game-dialog__fact',
    children: [
      el('span', { className: 'game-dialog__fact-label', text: fact.label }),
      el('span', { className: 'game-dialog__fact-value', text: fact.value }),
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
            text: record.medal,
          }),
          el('span', { text: record.player }),
        ],
      }),
      el('span', {
        className: 'game-dialog__record-score',
        children: [
          el('span', { text: record.score }),
          el('span', { className: 'game-dialog__record-when', text: record.achievedAt }),
        ],
      }),
    ],
  });

/** Toggle whose only job is to flip a pressed state and its styling. */
const createToggle = (
  button: HTMLButtonElement,
  activeClass: string,
  onChange?: () => void
): void => {
  const set = (pressed: boolean): void => {
    button.setAttribute('aria-pressed', String(pressed));
    button.classList.toggle(activeClass, pressed);
    onChange?.();
  };
  button.addEventListener('click', () => {
    set(button.getAttribute('aria-pressed') !== 'true');
  });
  resetters.push(() => {
    set(false);
  });
};

const LikeButton = (comment: GameComment): HTMLButtonElement => {
  const count = el('span', { text: String(comment.likes) });
  const button = el('button', {
    className: 'game-dialog__like',
    attrs: {
      type: 'button',
      'aria-pressed': 'false',
      'aria-label': `Like the comment by ${comment.author}`,
    },
    children: [Icon('heart', 'game-dialog__like-icon'), count],
  });

  createToggle(button, 'game-dialog__like--active', () => {
    const liked = button.getAttribute('aria-pressed') === 'true';
    count.textContent = String(liked ? comment.likes + 1 : comment.likes);
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
                text: comment.initial,
              }),
              el('span', { text: comment.author }),
            ],
          }),
          el('span', { className: 'game-dialog__comment-time', text: comment.postedAt }),
        ],
      }),
      el('p', { className: 'game-dialog__comment-body', text: comment.body }),
      LikeButton(comment),
    ],
  });

const commentField = el('textarea', {
  className: 'game-dialog__textarea',
  attrs: {
    rows: '1',
    placeholder: 'Write a comment...',
    'aria-label': `Write a comment about ${GAME_DETAILS.name}`,
  },
});

// Grows with the text up to Figma's 88px cap, then scrolls inside the field.
commentField.addEventListener('input', () => {
  commentField.style.height = 'auto';
  commentField.style.height = `${String(Math.min(commentField.scrollHeight, TEXTAREA_MAX_HEIGHT))}px`;
});

resetters.push(() => {
  commentField.value = '';
  commentField.style.height = '';
});

const commentForm = el('form', {
  className: 'game-dialog__comment-form',
  children: [
    el('span', {
      className: 'game-dialog__avatar game-dialog__avatar--me',
      attrs: { 'aria-hidden': 'true' },
      text: 'U',
    }),
    commentField,
    el('button', {
      className: 'game-dialog__send',
      attrs: { type: 'submit', 'aria-label': 'Submit comment' },
      children: [Icon('send', 'game-dialog__send-icon')],
    }),
  ],
});

commentForm.addEventListener('submit', (event) => {
  event.preventDefault();
});

const closeButton = el('button', {
  className: 'game-dialog__close',
  attrs: { type: 'button', 'aria-label': 'Close game details' },
  children: [Icon('close', 'game-dialog__close-icon')],
});

const favoriteButton = el('button', {
  className: 'btn game-dialog__favorite',
  attrs: { type: 'button', 'aria-pressed': 'false' },
  children: [
    Icon('heart', 'game-dialog__favorite-icon'),
    el('span', { className: 'game-dialog__favorite-label', text: 'Add to Favorites' }),
  ],
});
createToggle(favoriteButton, 'game-dialog__favorite--active');

const body = el('div', {
  className: 'game-dialog__body',
  children: [
    el('div', {
      className: 'game-dialog__headline',
      children: [
        el('h2', {
          className: 'game-dialog__title',
          attrs: { id: 'game-dialog-title' },
          text: GAME_DETAILS.name,
        }),
        el('div', {
          className: 'game-dialog__stats',
          children: [Stat('star', GAME_DETAILS.rating), Stat('heart', GAME_DETAILS.likes)],
        }),
      ],
    }),
    el('p', { className: 'game-dialog__description', text: GAME_DETAILS.description }),
    el('ul', { className: 'game-dialog__facts', children: GAME_DETAILS.facts.map(Fact) }),
    el('div', {
      className: 'game-dialog__actions',
      children: [
        el('button', {
          className: 'btn btn--filled game-dialog__play',
          attrs: { type: 'button' },
          text: 'Play Now',
        }),
        favoriteButton,
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
        el('ul', { className: 'game-dialog__records', children: GAME_DETAILS.records.map(Record) }),
      ],
    }),
    el('section', {
      className: 'game-dialog__section',
      children: [
        el('h3', {
          className: 'game-dialog__section-title',
          text: `Comments (${String(GAME_DETAILS.comments.length)})`,
        }),
        commentForm,
        el('ul', {
          className: 'game-dialog__comments',
          children: GAME_DETAILS.comments.map((comment, index) => Comment(comment, index)),
        }),
      ],
    }),
  ],
});

const hero = el('div', {
  className: 'game-dialog__hero',
  children: [
    el('img', {
      className: 'game-dialog__cover',
      attrs: { src: assetUrl(GAME_DETAILS.image), alt: GAME_DETAILS.name, loading: 'lazy' },
    }),
    closeButton,
  ],
});

const panel = el('div', { className: 'game-dialog__panel', children: [hero, body] });

const dialog = el('dialog', {
  className: 'game-dialog',
  attrs: { 'aria-labelledby': 'game-dialog-title' },
  children: [panel],
});

export function openGameDetails(): void {
  if (dialog.open) return;
  for (const reset of resetters) reset();
  dialog.showModal();
  dialog.scrollTop = 0;
  requestAnimationFrame(() => {
    dialog.classList.add('is-open');
  });
  document.body.classList.add('is-locked');
}

export function closeGameDetails(): void {
  if (!dialog.open) return;
  dialog.classList.remove('is-open');
  document.body.classList.remove('is-locked');
  runAfterTransition(panel, () => {
    dialog.close();
  });
}

closeButton.addEventListener('click', closeGameDetails);

dialog.addEventListener('click', (event) => {
  if (event.target === event.currentTarget) closeGameDetails();
});

dialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeGameDetails();
});

export const GameDetailsDialog = (): HTMLDialogElement => dialog;
