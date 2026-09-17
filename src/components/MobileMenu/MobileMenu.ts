import './MobileMenu.scss';
import { NAV_LINKS } from '../../data/navigation';
import { el } from '../../utils/dom';
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
  // Next frame so the slide-in transition starts from the hidden state.
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
  drawer.addEventListener(
    'transitionend',
    (event) => {
      if (event.target === drawer) drawer.hidden = true;
    },
    { once: true }
  );
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

const MenuLink = (label: string, href: string, isActive: boolean): HTMLLIElement => {
  const link = el('a', {
    className: `mobile-menu__link${isActive ? ' mobile-menu__link--active' : ''}`,
    attrs: { href },
    text: label,
  });
  if (isActive) link.setAttribute('aria-current', 'page');
  link.addEventListener('click', closeMenu);
  return el('li', { children: [link] });
};

const AuthButton = (label: string, variant: string): HTMLButtonElement => {
  const button = el('button', {
    className: `btn btn--block ${variant}`,
    attrs: { type: 'button' },
    text: label,
  });
  button.addEventListener('click', closeMenu);
  return button;
};

export const MobileMenu = (): HTMLElement => {
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
            children: NAV_LINKS.map((link, index) => MenuLink(link.label, link.href, index === 0)),
          }),
        ],
      }),
      el('div', {
        className: 'mobile-menu__actions',
        children: [AuthButton('Log In', 'btn--inverse'), AuthButton('Sign Up', 'btn--filled')],
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
