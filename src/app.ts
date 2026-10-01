import { AuthDialog } from './components/AuthDialog/AuthDialog';
import { Footer } from './components/Footer/Footer';
import { GameDetailsDialog } from './components/GameDetailsDialog/GameDetailsDialog';
import { Header } from './components/Header/Header';
import { MobileMenu } from './components/MobileMenu/MobileMenu';
import { HomePage } from './pages/HomePage';
import { LibraryPage } from './pages/LibraryPage';
import { getRoute, onRouteChange } from './router/router';
import type { Route } from './types';
import { el } from './utils/dom';

const PAGES: Record<Route, () => Node[]> = {
  home: HomePage,
  library: LibraryPage,
};

const rendered = new Map<Route, Node[]>();

function pageNodes(route: Route): Node[] {
  const cached = rendered.get(route);
  if (cached !== undefined) return cached;
  const nodes = PAGES[route]();
  rendered.set(route, nodes);
  return nodes;
}

export function mountApp(root: HTMLElement): void {
  const main = el('main', { className: 'main', attrs: { id: 'main' } });

  const renderPage = (route: Route): void => {
    main.replaceChildren(...pageNodes(route));
    window.scrollTo({ top: 0 });
  };

  renderPage(getRoute());
  onRouteChange(renderPage);

  root.replaceChildren(Header(), main, Footer(), MobileMenu(), AuthDialog(), GameDetailsDialog());
}
