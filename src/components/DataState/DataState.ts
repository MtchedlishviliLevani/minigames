import './DataState.scss';
import { el } from '../../utils/dom';

const RETRY_LABEL = 'Try again';

export function ErrorBanner(message: string, onRetry: () => void): HTMLElement {
  const retry = el('button', {
    className: 'btn btn--filled data-state__action',
    attrs: { type: 'button' },
    text: RETRY_LABEL,
  });
  retry.addEventListener('click', onRetry);

  return el('div', {
    className: 'data-state data-state--error',
    attrs: { role: 'alert' },
    children: [
      el('p', { className: 'data-state__title', text: 'Something went wrong' }),
      el('p', { className: 'data-state__message', text: message }),
      retry,
    ],
  });
}

export function EmptyState(message: string, title = 'Data not found'): HTMLElement {
  return el('div', {
    className: 'data-state data-state--empty',
    attrs: { role: 'status' },
    children: [
      el('p', { className: 'data-state__title', text: title }),
      el('p', { className: 'data-state__message', text: message }),
    ],
  });
}
