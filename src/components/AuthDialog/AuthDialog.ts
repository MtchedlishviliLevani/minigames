import './AuthDialog.scss';
import type { AuthMode } from '../../types';
import { el } from '../../utils/dom';
import { Icon } from '../Icon/Icon';
import { AuthForm, focusAuthForm, resetAuthForm } from './AuthForm';

const COPY: Record<AuthMode, { title: string; subtitle: string; tab: string; done: string }> = {
  login: {
    title: 'Welcome back',
    subtitle: 'Log in to keep your streak alive.',
    tab: 'Login',
    done: 'Logged in successfully (demo).',
  },
  register: {
    title: 'Create your account',
    subtitle: 'Join thousands of players in seconds.',
    tab: 'Register',
    done: 'Account created successfully (demo).',
  },
};

const MODES: AuthMode[] = ['login', 'register'];

let currentMode: AuthMode = 'login';
let switching = false;

const runAfterTransition = (target: HTMLElement, callback: () => void): void => {
  const finish = (event: TransitionEvent): void => {
    if (event.target !== target) return;
    target.removeEventListener('transitionend', finish);
    callback();
  };
  target.addEventListener('transitionend', finish);
};

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
    requestMode(mode);
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
const forms: Record<AuthMode, HTMLElement> = {
  login: AuthForm({ mode: 'login', onSubmit: showStatus, onSwitch: requestMode }),
  register: AuthForm({ mode: 'register', onSubmit: showStatus, onSwitch: requestMode }),
};

const body = el('div', {
  className: 'auth-dialog__body',
  children: [
    el('div', { className: 'auth-dialog__header', children: [title, subtitle] }),
    forms.login,
    forms.register,
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
    forms[other].hidden = !isActive;
  }
}

function requestMode(mode: AuthMode): void {
  if (mode === currentMode || switching) return;
  switching = true;
  status.textContent = '';
  runAfterTransition(body, () => {
    applyMode(mode);
    body.classList.remove('is-switching');
    switching = false;
    focusAuthForm(forms[mode]);
  });
  body.classList.add('is-switching');
}

function showStatus(mode: AuthMode): void {
  status.textContent = COPY[mode].done;
}

export function openAuthDialog(mode: AuthMode = 'login'): void {
  applyMode(mode);
  status.textContent = '';
  if (!dialog.open) {
    dialog.showModal();
    requestAnimationFrame(() => {
      dialog.classList.add('is-open');
    });
  }
  document.body.classList.add('is-locked');
  focusAuthForm(forms[mode]);
}

export function closeAuthDialog(): void {
  if (!dialog.open) return;
  dialog.classList.remove('is-open');
  document.body.classList.remove('is-locked');
  runAfterTransition(panel, () => {
    dialog.close();
    status.textContent = '';
    for (const mode of MODES) resetAuthForm(forms[mode]);
  });
}

closeButton.addEventListener('click', closeAuthDialog);
dialog.addEventListener('click', (event) => {
  if (event.target === event.currentTarget) closeAuthDialog();
});
dialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeAuthDialog();
});

export const AuthDialog = (): HTMLDialogElement => {
  applyMode('login');
  return dialog;
};
