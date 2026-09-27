import './Header.scss';
import { NAV_LINKS } from '../../data/navigation';
import { getRoute, onRouteChange } from '../../router/router';
import type { AuthMode } from '../../types';
import { el } from '../../utils/dom';
import { createNavLink, setNavLinkActive } from '../../utils/navLink';
import { openAuthDialog } from '../AuthDialog/AuthDialog';
import { Icon } from '../Icon/Icon';
import { Logo } from '../Logo/Logo';
import { toggleMenu } from '../MobileMenu/MobileMenu';

let burger: HTMLButtonElement | null = null;

export function setBurgerOpen(isOpen: boolean): void {
  if (!burger) return;
  burger.classList.toggle('is-open', isOpen);
  burger.setAttribute('aria-expanded', String(isOpen));
  burger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
}

const ACTIVE_CLASS = 'header__link--active';

const AuthButton = (mode: AuthMode, label: string, variant: string): HTMLButtonElement => {
  const button = el('button', {
    className: `btn ${variant}`,
    attrs: { type: 'button' },
    text: label,
  });
  button.addEventListener('click', () => {
    openAuthDialog(mode);
  });
  return button;
};

const Burger = (): HTMLButtonElement => {
  burger = el('button', {
    className: 'btn btn--icon header__burger',
    attrs: {
      type: 'button',
      'aria-label': 'Open menu',
      'aria-controls': 'mobile-menu',
      'aria-expanded': 'false',
    },
    children: [
      Icon('menu', 'header__burger-icon header__burger-icon--open'),
      Icon('close', 'header__burger-icon header__burger-icon--close'),
    ],
  });
  burger.addEventListener('click', toggleMenu);
  return burger;
};

export const Header = (): HTMLElement => {
  const anchors = NAV_LINKS.map((link) =>
    createNavLink(link, getRoute(), {
      className: 'header__link',
      activeClassName: ACTIVE_CLASS,
    })
  );

  onRouteChange((route) => {
    anchors.forEach((anchor, index) => {
      setNavLinkActive(anchor, NAV_LINKS[index]?.route === route, ACTIVE_CLASS);
    });
  });

  const nav = el('nav', {
    className: 'header__nav',
    attrs: { 'aria-label': 'Main navigation' },
    children: [
      el('ul', {
        className: 'header__links',
        children: anchors.map((anchor) => el('li', { children: [anchor] })),
      }),
    ],
  });

  const actions = el('div', {
    className: 'header__actions',
    children: [
      AuthButton('login', 'Log In', 'btn--outlined header__login'),
      AuthButton('register', 'Sign Up', 'btn--filled header__signup'),
    ],
  });

  return el('header', {
    className: 'header',
    children: [
      el('div', {
        className: 'header__inner container',
        children: [Logo(), nav, actions, Burger()],
      }),
    ],
  });
};
