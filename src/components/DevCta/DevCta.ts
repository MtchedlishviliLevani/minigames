import './DevCta.scss';
import illustration from '../../assets/images/developer-workspace.jpg';
import { el } from '../../utils/dom';
import { Icon } from '../Icon/Icon';

const CONTACT_EMAIL = 'developers@minigames.com';

export const DevCta = (): HTMLElement => {
  const image = el('img', {
    className: 'dev-cta__illustration',
    attrs: {
      src: illustration,
      alt: 'Illustration of a game developer workspace',
      loading: 'lazy',
    },
  });

  const card = el('div', {
    className: 'dev-cta__card',
    children: [
      el('h2', {
        className: 'dev-cta__title',
        attrs: { id: 'dev-cta-title' },
        text: 'Are You a Game Developer?',
      }),
      el('p', {
        className: 'dev-cta__text',
        text: "Want to see your game on MiniGames? We're always looking for fun, engaging mini games to add to our platform. Submit your game and reach thousands of players!",
      }),
      el('button', {
        className: 'btn btn--filled dev-cta__button',
        attrs: { type: 'button' },
        children: [Icon('upload', 'icon--small'), el('span', { text: 'Submit Form' })],
      }),
      el('p', {
        className: 'dev-cta__contact',
        children: [
          'or contact us at ',
          el('a', {
            className: 'dev-cta__mail',
            attrs: { href: `mailto:${CONTACT_EMAIL}` },
            text: CONTACT_EMAIL,
          }),
        ],
      }),
    ],
  });

  return el('section', {
    className: 'section dev-cta',
    attrs: { id: 'developers', 'aria-labelledby': 'dev-cta-title' },
    children: [el('div', { className: 'container dev-cta__inner', children: [image, card] })],
  });
};
