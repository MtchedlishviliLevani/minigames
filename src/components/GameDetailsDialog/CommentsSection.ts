import { COMMENTS_LIMIT, getGameComments, postComment, toggleCommentLike } from '../../api/games';
import { requireSession } from '../../auth/authGuard';
import { getSession } from '../../auth/authState';
import { commentAuthorName, profileName } from '../../auth/profile';
import { navigate } from '../../router/router';
import type { GameComment, GameCommentsPage } from '../../types';
import { createAsyncSection } from '../../utils/asyncSection';
import type { AsyncSection } from '../../utils/asyncSection';
import { checkCommentText, commenterInitial, createAvatarPalette } from '../../utils/comments';
import { el } from '../../utils/dom';
import { mutationFailure } from '../../utils/mutation';
import { relativeTime } from '../../utils/relativeTime';
import { Icon } from '../Icon/Icon';
import { Skeleton, SkeletonLine, SkeletonText } from '../Skeleton/Skeleton';
import { showSnackbar } from '../Snackbar/Snackbar';

const COMMENT_UNKNOWN =
  'We could not confirm whether your comment was posted. Check the comments before sending it again.';
const LIKE_UNKNOWN = 'We could not confirm the like. Reopen the game to see the current count.';

const palette = createAvatarPalette();
const draft = { slug: '', text: '' };

export function resetComments(): void {
  palette.clear();
  draft.slug = '';
  draft.text = '';
}

const spinner = (): HTMLSpanElement =>
  el('span', { className: 'spinner', attrs: { 'aria-hidden': 'true' } });

const LikeButton = (comment: GameComment): HTMLButtonElement => {
  const icon = Icon('heart', 'game-dialog__like-icon');
  const count = el('span', { text: String(comment.likesCount) });
  const button = el('button', {
    className: 'game-dialog__like',
    attrs: { type: 'button', 'aria-label': `Like the comment by ${comment.authorName}` },
    children: [icon, count],
  });

  let pending = false;

  const render = (liked: boolean, likes: number): void => {
    button.setAttribute('aria-pressed', String(liked));
    button.classList.toggle('game-dialog__like--active', liked);
    count.textContent = String(likes);
  };

  render(comment.isLikedByCurrentUser, comment.likesCount);

  button.addEventListener('click', () => {
    if (pending) return;
    const session = requireSession('Log in to like comments.');
    if (session === null) return;

    pending = true;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.replaceChildren(spinner(), count);

    toggleCommentLike(comment.commentId, session.email)
      .then((state) => {
        render(state.isLikedByCurrentUser, state.likesCount);
      })
      .catch((error: unknown) => {
        showSnackbar(mutationFailure(error, LIKE_UNKNOWN), 'error');
      })
      .finally(() => {
        pending = false;
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.replaceChildren(icon, count);
      });
  });

  return button;
};

const Comment = (comment: GameComment): HTMLLIElement =>
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
                className: `game-dialog__avatar game-dialog__avatar--small game-dialog__avatar--color-${String(palette.colorFor(comment.authorName))}`,
                attrs: { 'aria-hidden': 'true' },
                text: commenterInitial(comment.authorName),
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

interface CommentFormProps {
  slug: string;
  gameName: string;
  onPosted: () => void;
}

const CommentForm = ({ slug, gameName, onPosted }: CommentFormProps): HTMLElement => {
  const session = getSession();
  if (draft.slug !== slug) {
    draft.slug = slug;
    draft.text = '';
  }

  const field = el('textarea', {
    className: 'game-dialog__textarea',
    attrs: {
      rows: '1',
      name: 'comment',
      placeholder: session === null ? 'Log in to write a comment' : 'Write a comment...',
      'aria-label': `Write a comment about ${gameName}`,
      'aria-describedby': 'game-comment-error',
    },
  });
  field.value = draft.text;

  const sendIcon = Icon('send', 'game-dialog__send-icon');
  const sendButton = el('button', {
    className: 'game-dialog__send',
    attrs: { type: 'submit', 'aria-label': 'Submit comment' },
    children: [sendIcon],
  });

  const error = el('p', {
    className: 'game-dialog__comment-error',
    attrs: { id: 'game-comment-error', 'aria-live': 'polite' },
  });

  const avatar = el('span', {
    className: 'game-dialog__avatar game-dialog__avatar--me',
    attrs: { 'aria-hidden': 'true' },
    children: [
      session === null
        ? Icon('user', 'icon--small')
        : document.createTextNode(commenterInitial(profileName(session))),
    ],
  });

  const form = el('form', {
    className: 'game-dialog__comment-form',
    attrs: { novalidate: '' },
    children: [avatar, field, sendButton],
  });

  const resize = (): void => {
    field.style.height = 'auto';
    field.style.height = `${String(field.scrollHeight)}px`;
  };

  const setLocked = (locked: boolean): void => {
    field.disabled = locked;
    sendButton.disabled = locked;
    form.setAttribute('aria-busy', String(locked));
    sendButton.replaceChildren(locked ? spinner() : sendIcon);
  };

  let pending = false;

  if (session === null) {
    field.disabled = true;
    sendButton.disabled = true;
  }

  field.addEventListener('input', () => {
    draft.text = field.value;
    error.textContent = '';
    resize();
  });

  field.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    form.requestSubmit();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (pending) return;
    const active = requireSession('Log in to post a comment.');
    if (active === null) return;

    const checked = checkCommentText(field.value);
    if (!checked.ok) {
      error.textContent = checked.error;
      return;
    }

    pending = true;
    error.textContent = '';
    setLocked(true);

    postComment(slug, {
      userEmail: active.email,
      authorName: commentAuthorName(active),
      text: checked.text,
    })
      .then(() => {
        field.value = '';
        draft.text = '';
        showSnackbar('Comment posted.', 'success');
        onPosted();
      })
      .catch((reason: unknown) => {
        const message = mutationFailure(reason, COMMENT_UNKNOWN);
        error.textContent = message;
        showSnackbar(message, 'error');
      })
      .finally(() => {
        pending = false;
        setLocked(false);
        resize();
      });
  });

  if (session !== null) return el('div', { children: [form, error] });

  const login = el('button', {
    className: 'game-dialog__login',
    attrs: { type: 'button' },
    text: 'Log in',
  });
  login.addEventListener('click', () => {
    navigate({ auth: 'login' });
  });

  return el('div', {
    children: [
      form,
      el('p', {
        className: 'game-dialog__comment-hint',
        children: [login, ' to join the conversation.'],
      }),
    ],
  });
};

export interface CommentsSectionProps {
  slug: string;
  gameName: string;
}

export const CommentsSection = ({ slug, gameName }: CommentsSectionProps): HTMLElement => {
  const title = el('h3', { className: 'game-dialog__section-title', text: 'Comments' });
  const list = el('ul', { className: 'game-dialog__comments' });

  const section: AsyncSection = createAsyncSection<GameCommentsPage>({
    container: list,
    skeleton: () => Array.from({ length: COMMENTS_LIMIT }, () => SkeletonComment()),
    load: (signal) => getGameComments(slug, getSession()?.email, signal),
    onData: (page) => {
      title.textContent = `Comments (${String(page.totalComments)})`;
    },
    render: (page) => page.comments.map((comment) => Comment(comment)),
    isEmpty: (page) => page.comments.length === 0,
    emptyMessage: 'No comments yet. Be the first to share your thoughts.',
    errorMessage: 'Comments could not be loaded.',
    wrap: (state) => [el('li', { className: 'game-dialog__comments-state', children: [state] })],
  });

  return el('section', {
    className: 'game-dialog__section',
    children: [
      title,
      CommentForm({
        slug,
        gameName,
        onPosted: () => {
          section.reload();
        },
      }),
      list,
    ],
  });
};
