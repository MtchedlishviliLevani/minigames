import { navigate } from '../router/router';
import type { NavLink, Route } from '../types';
import { el } from './dom';

interface NavLinkOptions {
  className: string;
  activeClassName: string;
}

export function createNavLink(
  link: NavLink,
  currentRoute: Route,
  { className, activeClassName }: NavLinkOptions,
  onNavigate?: () => void
): HTMLAnchorElement {
  const isActive = link.route === currentRoute;
  const anchor = el('a', {
    className: `${className}${isActive ? ` ${activeClassName}` : ''}`,
    attrs: { href: link.href },
    text: link.label,
  });
  if (isActive) anchor.setAttribute('aria-current', 'page');

  anchor.addEventListener('click', (event) => {
    event.preventDefault();
    navigate(link.route ?? 'home');
    onNavigate?.();
  });

  return anchor;
}

export function setNavLinkActive(
  anchor: HTMLAnchorElement,
  isActive: boolean,
  activeClassName: string
): void {
  anchor.classList.toggle(activeClassName, isActive);
  if (isActive) {
    anchor.setAttribute('aria-current', 'page');
  } else {
    anchor.removeAttribute('aria-current');
  }
}
