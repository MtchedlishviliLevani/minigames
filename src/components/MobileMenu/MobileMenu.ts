import './MobileMenu.scss';
import { NAV_LINKS } from '../../data/navigation';
import { getRoute, onRouteChange } from '../../router/router';
import type { AuthMode } from '../../types';
import { el } from '../../utils/dom';
import { createNavLink, setNavLinkActive } from '../../utils/navLink';
import { openAuthDialog } from '../AuthDialog/AuthDialog';
import { setBurgerOpen } from '../Header/Header';
import { Icon } from '../Icon/Icon';
import { Logo } from '../Logo/Logo';

const DESKTOP_QUERY = '(min-width: 1024px)';

let menu: HTMLElement | null = null;
let isOpen = false;
let lastFocused: HTMLElement | null = null;

export function openMenu(): void {
  if (!menu || isOpen) return;
  isOpen = true;
  lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  menu.hidden = false;
  requestAnimationFrame(() => {
    menu?.classList.add('is-open');
    menu?.querySelector<HTMLElement>('.mobile-menu__close')?.focus();
  });
  document.body.classList.add('is-locked');
  setBurgerOpen(true);
}

export function closeMenu(): void {
  if (!menu || !isOpen) return;
  isOpen = false;
  const drawer = menu;
  drawer.classList.remove('is-open');
  const hideDrawer = (event: TransitionEvent): void => {
    if (event.target !== drawer) return;
    drawer.hidden = true;
    drawer.removeEventListener('transitionend', hideDrawer);
  };
  drawer.addEventListener('transitionend', hideDrawer);
  document.body.classList.remove('is-locked');
  setBurgerOpen(false);
  lastFocused?.focus();
}

export function toggleMenu(): void {
  if (isOpen) {
    closeMenu();
  } else {
    openMenu();
  }
}

const ACTIVE_CLASS = 'mobile-menu__link--active';

const AuthButton = (mode: AuthMode, label: string, variant: string): HTMLButtonElement => {
  const button = el('button', {
    className: `btn btn--block ${variant}`,
    attrs: { type: 'button' },
    text: label,
  });
  button.addEventListener('click', () => {
    closeMenu();
    openAuthDialog(mode);
  });
  return button;
};

export const MobileMenu = (): HTMLElement => {
  const anchors = NAV_LINKS.map((link) =>
    createNavLink(
      link,
      getRoute(),
      { className: 'mobile-menu__link', activeClassName: ACTIVE_CLASS },
      closeMenu
    )
  );

  onRouteChange((route) => {
    anchors.forEach((anchor, index) => {
      setNavLinkActive(anchor, NAV_LINKS[index]?.route === route, ACTIVE_CLASS);
    });
  });

  const closeButton = el('button', {
    className: 'btn btn--icon mobile-menu__close',
    attrs: { type: 'button', 'aria-label': 'Close menu' },
    children: [Icon('close', 'icon--small')],
  });
  closeButton.addEventListener('click', closeMenu);

  menu = el('div', {
    className: 'mobile-menu',
    attrs: { id: 'mobile-menu', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Menu' },
    children: [
      el('div', { className: 'mobile-menu__top', children: [Logo('logo--inverse'), closeButton] }),
      el('nav', {
        className: 'mobile-menu__nav',
        attrs: { 'aria-label': 'Mobile navigation' },
        children: [
          el('ul', {
            className: 'mobile-menu__links',
            children: anchors.map((anchor) => el('li', { children: [anchor] })),
          }),
        ],
      }),
      el('div', {
        className: 'mobile-menu__actions',
        children: [
          AuthButton('login', 'Log In', 'btn--inverse'),
          AuthButton('register', 'Sign Up', 'btn--filled'),
        ],
      }),
    ],
  });
  menu.hidden = true;

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
  window.matchMedia(DESKTOP_QUERY).addEventListener('change', (event) => {
    if (event.matches) closeMenu();
  });

  return menu;
};
