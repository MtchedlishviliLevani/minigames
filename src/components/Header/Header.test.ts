import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as AuthStateModule from '../../auth/authState';
import { SESSION_STORAGE_KEY } from '../../auth/session';
import type * as RouterModule from '../../router/router';

vi.mock('../../auth/firebase', () => ({ signOutUser: vi.fn(() => Promise.resolve()) }));
vi.mock('../Snackbar/Snackbar', () => ({ showSnackbar: vi.fn() }));

const STORED = { displayName: 'Alex Pro', email: 'alex@minigames.com' };

async function setup(signedIn: boolean): Promise<{
  header: HTMLElement;
  menu: HTMLElement;
  router: typeof RouterModule;
  authState: typeof AuthStateModule;
}> {
  localStorage.clear();
  if (signedIn) {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...STORED, authenticatedAt: Date.now() })
    );
  }
  window.history.replaceState(null, '', '/');
  vi.resetModules();
  const router = await import('../../router/router');
  router.startRouter();
  const authState = await import('../../auth/authState');
  authState.initSession();
  const { Header } = await import('./Header');
  const { MobileMenu } = await import('../MobileMenu/MobileMenu');
  const header = Header();
  const menu = MobileMenu();
  document.body.replaceChildren(header, menu);
  return { header, menu, router, authState };
}

const buttonLabels = (root: HTMLElement, selector: string): string[] =>
  [...root.querySelectorAll(`${selector} button`)].map((button) => button.textContent);

describe('Header and mobile menu auth state', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('shows login and sign up for guests', async () => {
    const { header, menu, router } = await setup(false);
    expect(buttonLabels(header, '.header__actions')).toEqual(['Log In', 'Sign Up']);
    expect(buttonLabels(menu, '.mobile-menu__actions')).toEqual(['Log In', 'Sign Up']);

    header.querySelector<HTMLButtonElement>('.header__signup')?.click();
    expect(router.getState().auth).toBe('register');
  });

  it('shows the profile and logout for a restored session', async () => {
    const { header, menu } = await setup(true);
    expect(header.querySelector('.user-profile__name')?.textContent).toBe('Alex Pro');
    expect(header.querySelector('.user-avatar')?.textContent).toBe('AP');
    expect(buttonLabels(header, '.header__actions')).toEqual(['Log Out']);
    expect(buttonLabels(menu, '.mobile-menu__actions')).toEqual(['Log Out']);
  });

  it('switches to the profile after login and back after logout', async () => {
    const { header, menu, authState } = await setup(false);
    authState.startSession(STORED);
    expect(header.querySelector('.user-profile')).not.toBeNull();

    menu.querySelector<HTMLButtonElement>('.user-profile__logout')?.click();
    expect(authState.getSession()).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(buttonLabels(header, '.header__actions')).toEqual(['Log In', 'Sign Up']);
    expect(buttonLabels(menu, '.mobile-menu__actions')).toEqual(['Log In', 'Sign Up']);
  });

  it('opens the auth dialog from the mobile menu and closes the menu', async () => {
    const { header, menu, router } = await setup(false);
    header.querySelector<HTMLButtonElement>('.header__burger')?.click();
    expect(menu.hidden).toBe(false);

    menu.querySelector<HTMLButtonElement>('.mobile-menu__actions button')?.click();
    expect(router.getState().auth).toBe('login');
    expect(header.querySelector('.header__burger')?.getAttribute('aria-expanded')).toBe('false');
  });
});
