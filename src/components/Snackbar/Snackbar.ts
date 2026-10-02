import './Snackbar.scss';
import { el } from '../../utils/dom';
import { Icon } from '../Icon/Icon';

export type SnackbarVariant = 'success' | 'error' | 'warning' | 'info';

const AUTO_DISMISS_MS = 5000;
const EXIT_DURATION_MS = 250;

let host: HTMLElement | undefined;

function snackbarHost(): HTMLElement {
  host ??= el('div', {
    className: 'snackbar-host',
    attrs: { role: 'region', 'aria-label': 'Notifications' },
  });
  if (!host.isConnected) document.body.append(host);
  return host;
}

export function showSnackbar(message: string, variant: SnackbarVariant = 'info'): void {
  const isError = variant === 'error';

  const toast = el('div', {
    className: `snackbar snackbar--${variant}`,
    attrs: {
      role: isError ? 'alert' : 'status',
      'aria-live': isError ? 'assertive' : 'polite',
    },
  });

  const dismiss = el('button', {
    className: 'snackbar__dismiss',
    attrs: { type: 'button', 'aria-label': 'Dismiss notification' },
    children: [Icon('close', 'icon--small')],
  });

  toast.append(el('p', { className: 'snackbar__message', text: message }), dismiss);
  snackbarHost().prepend(toast);
  requestAnimationFrame(() => {
    toast.classList.add('is-open');
  });

  const close = (): void => {
    if (!toast.isConnected) return;
    window.clearTimeout(timerId);
    toast.classList.remove('is-open');
    window.setTimeout(() => {
      toast.remove();
    }, EXIT_DURATION_MS);
  };

  const timerId = window.setTimeout(close, AUTO_DISMISS_MS);
  dismiss.addEventListener('click', close);
}
