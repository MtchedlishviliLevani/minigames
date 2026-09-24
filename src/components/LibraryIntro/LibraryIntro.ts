import './LibraryIntro.scss';
import { LIBRARY_SUBTITLE, LIBRARY_TITLE } from '../../data/library';
import { el } from '../../utils/dom';

export const LibraryIntro = (): HTMLElement =>
  el('section', {
    className: 'library-intro',
    attrs: { 'aria-labelledby': 'library-title' },
    children: [
      el('div', {
        className: 'container library-intro__inner',
        children: [
          el('h1', {
            className: 'library-intro__title',
            attrs: { id: 'library-title' },
            text: LIBRARY_TITLE,
          }),
          el('p', { className: 'library-intro__subtitle', text: LIBRARY_SUBTITLE }),
        ],
      }),
    ],
  });
