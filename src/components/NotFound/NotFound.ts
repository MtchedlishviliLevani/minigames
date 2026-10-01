import './NotFound.scss';
import { HOME_HREF } from '../../data/navigation';
import { navigate } from '../../router/router';
import { el } from '../../utils/dom';

const TITLE = 'This page does not exist';
const MESSAGE =
  'The address you followed is not part of MiniGames. It may have been moved, or the link may be mistyped.';

export const NotFound = (): HTMLElement => {
  const action = el('a', {
    className: 'btn btn--filled btn--large not-found__action',
    attrs: { href: HOME_HREF },
    text: 'Return to Home Page',
  });

  action.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate({ route: 'home' });
  });

  return el('section', {
    className: 'section not-found',
    attrs: { 'aria-labelledby': 'not-found-title' },
    children: [
      el('div', {
        className: 'container not-found__inner',
        children: [
          el('p', { className: 'not-found__code', attrs: { 'aria-hidden': 'true' }, text: '404' }),
          el('h1', {
            className: 'not-found__title',
            attrs: { id: 'not-found-title' },
            text: TITLE,
          }),
          el('p', { className: 'not-found__message', text: MESSAGE }),
          action,
        ],
      }),
    ],
  });
};
