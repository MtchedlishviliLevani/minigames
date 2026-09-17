import { el } from './utils/dom';

export function mountApp(root: HTMLElement): void {
  const header = el('header', {
    className: 'header',
    children: [el('div', { className: 'container', text: 'MiniGames' })],
  });

  const main = el('main', {
    className: 'main',
    attrs: { id: 'main' },
    children: [el('section', { className: 'section container', text: 'Home' })],
  });

  const footer = el('footer', {
    className: 'footer',
    children: [el('div', { className: 'container', text: 'MiniGames' })],
  });

  root.replaceChildren(header, main, footer);
}
