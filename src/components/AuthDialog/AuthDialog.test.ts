import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as AuthStateModule from '../../auth/authState';
import type * as FirebaseModule from '../../auth/firebase';
import type * as RouterModule from '../../router/router';
import { SESSION_STORAGE_KEY } from '../../auth/session';

const mocks = vi.hoisted(() => ({
  signInWithEmail: vi.fn(),
  registerWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOutUser: vi.fn(() => Promise.resolve()),
  showSnackbar: vi.fn(),
}));

vi.mock('../../auth/firebase', async (importOriginal) => {
  const actual = await importOriginal<typeof FirebaseModule>();
  return {
    authErrorMessage: actual.authErrorMessage,
    isAuthCancelled: actual.isAuthCancelled,
    signInWithEmail: mocks.signInWithEmail,
    registerWithEmail: mocks.registerWithEmail,
    signInWithGoogle: mocks.signInWithGoogle,
    signOutUser: mocks.signOutUser,
  };
});
vi.mock('../Snackbar/Snackbar', () => ({ showSnackbar: mocks.showSnackbar }));

const PROFILE = { displayName: 'AlexPro', email: 'alex@minigames.com' };

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const wait = (ms = 0): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

interface Setup {
  dialog: HTMLDialogElement;
  router: typeof RouterModule;
  authState: typeof AuthStateModule;
  q: (selector: string) => Element;
  field: (selector: string) => HTMLInputElement;
  button: (selector: string) => HTMLButtonElement;
  form: (selector: string) => HTMLFormElement;
  type: (selector: string, value: string) => void;
}

async function setup(url = '/?auth=login'): Promise<Setup> {
  window.history.replaceState(null, '', url);
  localStorage.clear();
  vi.resetModules();
  const router = await import('../../router/router');
  router.startRouter();
  const authState = await import('../../auth/authState');
  const { AuthDialog } = await import('./AuthDialog');
  const dialog = AuthDialog();
  document.body.replaceChildren(dialog);
  await wait();

  const q = (selector: string): Element => {
    const found = dialog.querySelector(selector);
    if (found === null) throw new Error(`Missing ${selector}`);
    return found;
  };
  const field = (selector: string): HTMLInputElement => q(selector) as HTMLInputElement;

  return {
    dialog,
    router,
    authState,
    q,
    field,
    button: (selector) => q(selector) as HTMLButtonElement,
    form: (selector) => q(selector) as HTMLFormElement,
    type: (selector, value) => {
      field(selector).value = value;
      field(selector).dispatchEvent(new Event('input', { bubbles: true }));
    },
  };
}

const fillLogin = ({ type }: Setup): void => {
  type('#login-email', 'alex@minigames.com');
  type('#login-password', 'secret');
};

describe('AuthDialog', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.signOutUser.mockImplementation(() => Promise.resolve());
  });

  it('opens from the url in the requested mode', async () => {
    const { dialog, q } = await setup('/?auth=register');
    expect(dialog.open).toBe(true);
    expect(dialog.dataset.mode).toBe('register');
    expect(q('#auth-panel-login').hasAttribute('hidden')).toBe(true);
    expect(q('#auth-dialog-title').textContent).toBe('Create your account');
  });

  it('logs in with email and password, creates the session and closes', async () => {
    const ctx = await setup();
    mocks.signInWithEmail.mockResolvedValue(PROFILE);
    fillLogin(ctx);
    ctx.button('#auth-panel-login [type="submit"]').click();
    await wait();

    expect(mocks.signInWithEmail).toHaveBeenCalledWith('alex@minigames.com', 'secret');
    expect(ctx.authState.getSession()).toMatchObject(PROFILE);
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull();
    expect(ctx.router.getState().auth).toBeNull();
    expect(mocks.showSnackbar).toHaveBeenCalledWith('Welcome, AlexPro!', 'success');

    await wait(100);
    expect(ctx.dialog.open).toBe(false);
  });

  it('registers with the username as display name', async () => {
    const ctx = await setup('/?auth=register');
    mocks.registerWithEmail.mockResolvedValue(PROFILE);
    ctx.type('#register-username', 'AlexPro');
    ctx.type('#register-email', 'alex@minigames.com');
    ctx.type('#register-password', 'Secr3t!');
    ctx.type('#register-confirm', 'Secr3t!');
    ctx.button('#auth-panel-register [type="submit"]').click();
    await wait();

    expect(mocks.registerWithEmail).toHaveBeenCalledWith(
      'AlexPro',
      'alex@minigames.com',
      'Secr3t!'
    );
    expect(ctx.authState.getSession()?.displayName).toBe('AlexPro');
  });

  it('locks every control and refuses to close while a request is pending', async () => {
    const ctx = await setup();
    const request = deferred<typeof PROFILE>();
    mocks.signInWithEmail.mockReturnValue(request.promise);
    fillLogin(ctx);
    ctx.button('#auth-panel-login [type="submit"]').click();

    expect(ctx.field('#login-email').disabled).toBe(true);
    expect(ctx.button('#auth-panel-login [type="submit"]').disabled).toBe(true);
    expect(ctx.button('.auth-dialog__google').disabled).toBe(true);
    expect(ctx.button('#auth-tab-register').disabled).toBe(true);
    expect(ctx.button('.auth-dialog__close').disabled).toBe(true);
    expect(ctx.q('.auth-dialog__status').textContent).toBe('Logging you in…');

    ctx.dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    ctx.dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    ctx.form('#auth-panel-login form').requestSubmit();
    ctx.button('.auth-dialog__google').click();
    expect(ctx.router.getState().auth).toBe('login');
    expect(mocks.signInWithEmail).toHaveBeenCalledTimes(1);
    expect(mocks.signInWithGoogle).not.toHaveBeenCalled();

    request.resolve(PROFILE);
    await wait();
    expect(ctx.router.getState().auth).toBeNull();
  });

  it('keeps the dialog open and unlocks it after a failure', async () => {
    const ctx = await setup();
    mocks.signInWithEmail.mockRejectedValue({ code: 'auth/invalid-credential' });
    fillLogin(ctx);
    ctx.button('#auth-panel-login [type="submit"]').click();
    await wait();

    expect(mocks.showSnackbar).toHaveBeenCalledWith('Wrong email or password.', 'error');
    expect(ctx.authState.getSession()).toBeNull();
    expect(ctx.dialog.open).toBe(true);
    expect(ctx.router.getState().auth).toBe('login');
    expect(ctx.field('#login-email').disabled).toBe(false);
    expect(ctx.field('#login-email').value).toBe('alex@minigames.com');
    expect(ctx.button('#auth-panel-login [type="submit"]').disabled).toBe(false);
  });

  it('signs in with Google', async () => {
    const ctx = await setup('/?auth=register');
    mocks.signInWithGoogle.mockResolvedValue({ ...PROFILE, avatarUrl: 'https://a.png' });
    ctx.button('.auth-dialog__google').click();
    expect(ctx.q('.auth-dialog__status').textContent).toBe('Waiting for Google…');
    await wait();

    expect(ctx.authState.getSession()).toMatchObject({ avatarUrl: 'https://a.png' });
    expect(ctx.router.getState().auth).toBeNull();
  });

  it('stays open and re-enables controls when the Google popup is closed', async () => {
    const ctx = await setup();
    mocks.signInWithGoogle.mockRejectedValue({ code: 'auth/popup-closed-by-user' });
    ctx.button('.auth-dialog__google').click();
    await wait();

    expect(mocks.showSnackbar).toHaveBeenCalledWith('Google sign-in was cancelled.', 'info');
    expect(ctx.dialog.open).toBe(true);
    expect(ctx.button('.auth-dialog__google').disabled).toBe(false);
  });

  it('switches mode and clears both forms', async () => {
    const ctx = await setup();
    ctx.type('#login-email', 'bad');
    ctx.button('#auth-tab-register').click();
    expect(ctx.router.getState().auth).toBe('register');
    await wait(100);

    expect(ctx.dialog.dataset.mode).toBe('register');
    expect(ctx.field('#login-email').value).toBe('');
    expect(ctx.q('[data-error-for="email"]').textContent).toBe('');
  });

  it('closes with the close button, the backdrop and Escape', async () => {
    const ctx = await setup();
    ctx.button('.auth-dialog__close').click();
    expect(ctx.router.getState().auth).toBeNull();

    ctx.router.navigate({ auth: 'login' });
    ctx.dialog.dispatchEvent(new MouseEvent('click'));
    expect(ctx.router.getState().auth).toBeNull();

    ctx.router.navigate({ auth: 'login' });
    ctx.dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(ctx.router.getState().auth).toBeNull();
  });

  it('opens through the exported helper', async () => {
    const ctx = await setup('/');
    const { openAuthDialog } = await import('./AuthDialog');
    expect(ctx.dialog.open).toBe(false);
    openAuthDialog('register');
    expect(ctx.dialog.open).toBe(true);
    expect(ctx.router.getState().auth).toBe('register');
  });
});
