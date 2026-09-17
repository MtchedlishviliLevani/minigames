import { Carousel } from './components/Carousel/Carousel';
import { Header } from './components/Header/Header';
import { Hero } from './components/Hero/Hero';
import { MobileMenu } from './components/MobileMenu/MobileMenu';
import { el } from './utils/dom';

export function mountApp(root: HTMLElement): void {
  const main = el('main', {
    className: 'main',
    attrs: { id: 'main' },
    children: [Hero(), Carousel()],
  });

  const footer = el('footer', {
    className: 'footer',
    children: [el('div', { className: 'container', text: 'MiniGames' })],
  });

  root.replaceChildren(Header(), main, footer, MobileMenu());
}
