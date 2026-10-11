import './AuthDialog.scss';
import { startSession } from '../../auth/authState';
import {
  authErrorMessage,
  isAuthCancelled,
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
} from '../../auth/firebase';
import type { AppState } from '../../router/router';
import { getState, navigate, onStateChange } from '../../router/router';
import type { AuthMode, AuthProfile } from '../../types';
import { el } from '../../utils/dom';
import { runAfterTransition } from '../../utils/transition';
import type { AuthValues } from '../../utils/validation';
import { Icon } from '../Icon/Icon';
import { showSnackbar } from '../Snackbar/Snackbar';
import { AuthForm } from './AuthForm';
import type { AuthFormHandle } from './AuthForm';

const COPY: Record<AuthMode, { title: string; subtitle: string; tab: string; pending: string }> = {
  login: {
    title: 'Welcome back',
    subtitle: 'Log in to keep your streak alive.',
    tab: 'Login',
    pending: 'Logging you in…',
  },
  register: {
    title: 'Create your account',
    subtitle: 'Join thousands of players in seconds.',
    tab: 'Register',
    pending: 'Creating your account…',
  },
};

const GOOGLE_PENDING = 'Waiting for Google…';

const MODES: AuthMode[] = ['login', 'register'];

let currentMode: AuthMode = 'login';
let switching = false;
let pending = false;

const Tab = (mode: AuthMode): HTMLButtonElement => {
  const tab = el('button', {
    className: 'auth-dialog__tab',
    attrs: {
      type: 'button',
      role: 'tab',
      id: `auth-tab-${mode}`,
      'aria-controls': `auth-panel-${mode}`,
    },
    text: COPY[mode].tab,
  });
  tab.addEventListener('click', () => {
    if (!pending) navigate({ auth: mode });
  });
  return tab;
};

const title = el('h2', { className: 'auth-dialog__title', attrs: { id: 'auth-dialog-title' } });
const subtitle = el('p', { className: 'auth-dialog__subtitle' });
const status = el('p', {
  className: 'auth-dialog__status',
  attrs: { role: 'status', 'aria-live': 'polite' },
});

const tabs: Record<AuthMode, HTMLButtonElement> = {
  login: Tab('login'),
  register: Tab('register'),
};
const forms: Record<AuthMode, AuthFormHandle> = {
  login: AuthForm({ mode: 'login', onSubmit: submitCredentials, onSwitch: requestAuthMode }),
  register: AuthForm({
    mode: 'register',
    onSubmit: submitCredentials,
    onSwitch: requestAuthMode,
  }),
};

const googleButton = el('button', {
  className: 'btn btn--outlined btn--large btn--block auth-dialog__google',
  attrs: { type: 'button' },
  children: [Icon('google', 'icon--small'), el('span', { text: 'Continue with Google' })],
});

const body = el('div', {
  className: 'auth-dialog__body',
  children: [
    el('div', { className: 'auth-dialog__header', children: [title, subtitle] }),
    forms.login.element,
    forms.register.element,
  ],
});

const closeButton = el('button', {
  className: 'btn btn--icon auth-dialog__close',
  attrs: { type: 'button', 'aria-label': 'Close dialog' },
  children: [Icon('close', 'icon--small')],
});

const panel = el('div', {
  className: 'auth-dialog__panel',
  children: [
    closeButton,
    el('div', {
      className: 'auth-dialog__switcher',
      attrs: { role: 'tablist', 'aria-label': 'Authentication mode' },
      children: [tabs.login, tabs.register],
    }),
    body,
    el('p', { className: 'auth-dialog__divider', children: [el('span', { text: 'or' })] }),
    googleButton,
    status,
  ],
});

const dialog = el('dialog', {
  className: 'auth-dialog',
  attrs: { 'aria-labelledby': 'auth-dialog-title' },
  children: [panel],
});

function applyMode(mode: AuthMode): void {
  currentMode = mode;
  title.textContent = COPY[mode].title;
  subtitle.textContent = COPY[mode].subtitle;
  dialog.dataset.mode = mode;
  for (const other of MODES) {
    const isActive = other === mode;
    tabs[other].classList.toggle('is-active', isActive);
    tabs[other].setAttribute('aria-selected', String(isActive));
    tabs[other].setAttribute('tabindex', isActive ? '0' : '-1');
    forms[other].element.hidden = !isActive;
  }
}

function requestMode(mode: AuthMode): void {
  if (mode === currentMode || switching) return;
  switching = true;
  runAfterTransition(body, () => {
    for (const other of MODES) forms[other].reset();
    applyMode(mode);
    body.classList.remove('is-switching');
    switching = false;
    forms[mode].focus();
  });
  body.classList.add('is-switching');
}

function setPending(next: boolean, message = ''): void {
  pending = next;
  status.replaceChildren(
    ...(next ? [el('span', { className: 'spinner', attrs: { 'aria-hidden': 'true' } })] : []),
    message
  );
  panel.setAttribute('aria-busy', String(next));
  dialog.classList.toggle('is-pending', next);
  for (const mode of MODES) {
    forms[mode].setLocked(next);
    tabs[mode].disabled = next;
  }
  googleButton.disabled = next;
  closeButton.disabled = next;
}

function finishAuthentication(profile: AuthProfile): void {
  const session = startSession(profile);
  setPending(false);
  showSnackbar(`Welcome, ${session.displayName || session.email}!`, 'success');
  closeAuthDialog();
}

function failAuthentication(error: unknown): void {
  setPending(false);
  showSnackbar(authErrorMessage(error), isAuthCancelled(error) ? 'info' : 'error');
  if (getState().auth === null) hideDialog();
}

async function authenticate(message: string, run: () => Promise<AuthProfile>): Promise<void> {
  if (pending) return;
  setPending(true, message);
  let profile: AuthProfile;
  try {
    profile = await run();
  } catch (error) {
    failAuthentication(error);
    return;
  }
  finishAuthentication(profile);
}

function submitCredentials(mode: AuthMode, values: AuthValues): void {
  const email = values.email ?? '';
  const password = values.password ?? '';
  void authenticate(COPY[mode].pending, () =>
    mode === 'register'
      ? registerWithEmail(values.username ?? '', email, password)
      : signInWithEmail(email, password)
  );
}

function requestAuthMode(mode: AuthMode): void {
  if (!pending) navigate({ auth: mode });
}

function showDialog(mode: AuthMode): void {
  applyMode(mode);
  if (!dialog.open) {
    dialog.showModal();
    requestAnimationFrame(() => {
      dialog.classList.add('is-open');
    });
  }
  document.body.classList.add('is-locked');
  forms[mode].focus();
}

function hideDialog(): void {
  if (!dialog.open || pending) return;
  dialog.classList.remove('is-open');
  document.body.classList.remove('is-locked');
  runAfterTransition(panel, () => {
    dialog.close();
    status.textContent = '';
    for (const mode of MODES) forms[mode].reset();
  });
}

function syncDialog(next: AppState, previous: AppState): void {
  if (next.auth === previous.auth) return;
  if (next.auth === null) {
    hideDialog();
  } else if (previous.auth === null || !dialog.open) {
    showDialog(next.auth);
  } else {
    requestMode(next.auth);
  }
}

export function openAuthDialog(mode: AuthMode = 'login'): void {
  navigate({ auth: mode });
}

export function closeAuthDialog(): void {
  if (pending) return;
  navigate({ auth: null });
}

googleButton.addEventListener('click', () => {
  void authenticate(GOOGLE_PENDING, signInWithGoogle);
});
closeButton.addEventListener('click', closeAuthDialog);
dialog.addEventListener('click', (event) => {
  if (event.target === event.currentTarget) closeAuthDialog();
});
dialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeAuthDialog();
});

function openAfterMount(mode: AuthMode): void {
  queueMicrotask(() => {
    showDialog(mode);
  });
}

export const AuthDialog = (): HTMLDialogElement => {
  const initial = getState();
  applyMode(initial.auth ?? 'login');
  onStateChange(syncDialog);
  if (initial.auth !== null) openAfterMount(initial.auth);
  return dialog;
};
