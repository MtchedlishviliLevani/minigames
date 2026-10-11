import { toggleFavorite } from '../../api/games';
import { requireSession } from '../../auth/authGuard';
import { el } from '../../utils/dom';
import { mutationFailure } from '../../utils/mutation';
import { Icon } from '../Icon/Icon';
import { showSnackbar } from '../Snackbar/Snackbar';

const LABELS = { on: 'Remove from Favorites', off: 'Add to Favorites' };
const UNKNOWN_OUTCOME =
  'We could not confirm the favorite change. Reopen the game to see its current state.';

export interface FavoriteButtonProps {
  slug: string;
  isFavorite: boolean;
  onLikesChange: (likesCount: number) => void;
}

export const FavoriteButton = ({
  slug,
  isFavorite,
  onLikesChange,
}: FavoriteButtonProps): HTMLButtonElement => {
  const icon = Icon('heart', 'game-dialog__favorite-icon');
  const label = el('span', { className: 'game-dialog__favorite-label' });
  const button = el('button', {
    className: 'btn game-dialog__favorite',
    attrs: { type: 'button' },
    children: [icon, label],
  });

  let pending = false;

  const render = (active: boolean): void => {
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('game-dialog__favorite--active', active);
    label.textContent = active ? LABELS.on : LABELS.off;
  };

  const setPending = (next: boolean): void => {
    pending = next;
    button.disabled = next;
    button.setAttribute('aria-busy', String(next));
    button.replaceChildren(
      next ? el('span', { className: 'spinner', attrs: { 'aria-hidden': 'true' } }) : icon,
      label
    );
  };

  render(isFavorite);

  button.addEventListener('click', () => {
    if (pending) return;
    const session = requireSession('Log in to add games to your favorites.');
    if (session === null) return;

    setPending(true);
    toggleFavorite(slug, session.email)
      .then((state) => {
        render(state.isFavorited);
        onLikesChange(state.likesCount);
        showSnackbar(
          state.isFavorited ? 'Added to favorites.' : 'Removed from favorites.',
          'success'
        );
      })
      .catch((error: unknown) => {
        showSnackbar(mutationFailure(error, UNKNOWN_OUTCOME), 'error');
      })
      .finally(() => {
        setPending(false);
      });
  });

  return button;
};
