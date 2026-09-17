import './Hero.scss';
import heroBackground from '../../assets/images/hero-background.jpg';
import { el } from '../../utils/dom';

export const Hero = (): HTMLElement => {
  const card = el('div', {
    className: 'hero__card',
    children: [
      el('h1', {
        className: 'hero__title',
        attrs: { id: 'hero-title' },
        text: 'Take a Short Break & Have Fun',
      }),
      el('p', {
        className: 'hero__description',
        text: 'Discover hundreds of curated casual mini-games. Play instantly in your browser — puzzle, match 3, farm, and board classics.',
      }),
      // Story 1: the button is purely visual and performs no action.
      el('button', {
        className: 'btn btn--filled hero__button',
        attrs: { type: 'button' },
        text: 'Browse Library',
      }),
    ],
  });

  const section = el('section', {
    className: 'hero',
    attrs: { 'aria-labelledby': 'hero-title' },
    children: [el('div', { className: 'hero__inner container', children: [card] })],
  });
  section.style.setProperty('--hero-image', `url(${heroBackground})`);
  return section;
};
