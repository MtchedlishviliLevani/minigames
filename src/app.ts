import { Carousel } from './components/Carousel/Carousel';
import { DevCta } from './components/DevCta/DevCta';
import { Header } from './components/Header/Header';
import { Hero } from './components/Hero/Hero';
import { Leaderboard } from './components/Leaderboard/Leaderboard';
import { MobileMenu } from './components/MobileMenu/MobileMenu';
import { el } from './utils/dom';

export function mountApp(root: HTMLElement): void {
  const main = el('main', {
    className: 'main',
    attrs: { id: 'main' },
    children: [Hero(), Carousel(), Leaderboard(), DevCta()],
  });

  const footer = el('footer', {
    className: 'footer',
    children: [el('div', { className: 'container', text: 'MiniGames' })],
  });

  root.replaceChildren(Header(), main, footer, MobileMenu());
}
