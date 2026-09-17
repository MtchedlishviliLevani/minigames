import type { AuthMode } from '../../types';
import { el } from '../../utils/dom';
import {
  PASSWORD_MIN_LENGTH,
  validateConfirm,
  validateEmail,
  validateName,
  validatePassword,
} from '../../utils/validation';
import { Icon, type IconName } from '../Icon/Icon';

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password';
  icon: IconName;
  autocomplete: string;
  placeholder: string;
  minLength?: number;
}

const EMAIL_FIELD: FieldConfig = {
  name: 'email',
  label: 'Email',
  type: 'email',
  icon: 'mail',
  autocomplete: 'email',
  placeholder: 'e.g. alex@minigames.com',
};

const FIELDS: Record<AuthMode, FieldConfig[]> = {
  login: [
    EMAIL_FIELD,
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      icon: 'lock',
      autocomplete: 'current-password',
      placeholder: 'Your password',
      minLength: PASSWORD_MIN_LENGTH,
    },
  ],
  register: [
    {
      name: 'name',
      label: 'Nickname',
      type: 'text',
      icon: 'user',
      autocomplete: 'nickname',
      placeholder: 'e.g. Alex_Pro99',
    },
    EMAIL_FIELD,
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      icon: 'lock',
      autocomplete: 'new-password',
      placeholder: `At least ${String(PASSWORD_MIN_LENGTH)} characters`,
      minLength: PASSWORD_MIN_LENGTH,
    },
    {
      name: 'confirm',
      label: 'Confirm password',
      type: 'password',
      icon: 'lock',
      autocomplete: 'new-password',
      placeholder: 'Repeat your password',
      minLength: PASSWORD_MIN_LENGTH,
    },
  ],
};

const COPY: Record<
  AuthMode,
  { submit: string; prompt: string; switchTo: string; other: AuthMode }
> = {
  login: {
    submit: 'Log In',
    prompt: "Don't have an account? ",
    switchTo: 'Register',
    other: 'register',
  },
  register: {
    submit: 'Create Account',
    prompt: 'Already have an account? ',
    switchTo: 'Login',
    other: 'login',
  },
};

export type AuthFormData = Record<string, string>;

export interface AuthFormProps {
  mode: AuthMode;
  onSubmit: (mode: AuthMode, data: AuthFormData) => void;
  onSwitch: (mode: AuthMode) => void;
}

const Field = (mode: AuthMode, config: FieldConfig): HTMLElement => {
  const id = `${mode}-${config.name}`;
  const errorId = `${id}-error`;

  const input = el('input', {
    className: 'auth-form__input',
    attrs: {
      id,
      type: config.type,
      name: config.name,
      autocomplete: config.autocomplete,
      placeholder: config.placeholder,
      required: '',
      'aria-describedby': errorId,
    },
  });
  if (config.minLength) input.setAttribute('minlength', String(config.minLength));

  return el('div', {
    className: 'auth-form__field',
    children: [
      el('label', { className: 'auth-form__label', attrs: { for: id }, text: config.label }),
      el('span', {
        className: 'auth-form__control',
        children: [Icon(config.icon, 'icon--small auth-form__icon'), input],
      }),
      el('p', {
        className: 'auth-form__error',
        attrs: { id: errorId, 'aria-live': 'polite', 'data-error-for': config.name },
      }),
    ],
  });
};

const collect = (form: HTMLFormElement): AuthFormData => {
  const data: AuthFormData = {};
  for (const [key, value] of new FormData(form)) {
    if (typeof value === 'string') data[key] = value;
  }
  return data;
};

const validate = (mode: AuthMode, data: AuthFormData): [string, string | null][] => {
  const results: [string, string | null][] = [];
  if (mode === 'register') results.push(['name', validateName(data.name ?? '')]);
  results.push(['email', validateEmail(data.email ?? '')]);
  results.push(['password', validatePassword(data.password ?? '')]);
  if (mode === 'register') {
    results.push(['confirm', validateConfirm(data.password ?? '', data.confirm ?? '')]);
  }
  return results;
};

function setError(form: HTMLFormElement, name: string, message: string | null): void {
  const error = form.querySelector(`[data-error-for="${name}"]`);
  const input = form.querySelector(`[name="${name}"]`);
  error?.replaceChildren(message ?? '');
  if (message) {
    input?.setAttribute('aria-invalid', 'true');
  } else {
    input?.removeAttribute('aria-invalid');
  }
}

export function resetAuthForm(form: HTMLFormElement): void {
  form.reset();
  for (const input of form.querySelectorAll('input')) setError(form, input.name, null);
}

export function focusAuthForm(form: HTMLFormElement): void {
  form.querySelector('input')?.focus();
}

export const AuthForm = ({ mode, onSubmit, onSwitch }: AuthFormProps): HTMLFormElement => {
  const copy = COPY[mode];

  const switchButton = el('button', {
    className: 'auth-form__switch',
    attrs: { type: 'button' },
    text: copy.switchTo,
  });
  switchButton.addEventListener('click', () => {
    onSwitch(copy.other);
  });

  const form = el('form', {
    className: 'auth-form',
    attrs: {
      id: `auth-panel-${mode}`,
      role: 'tabpanel',
      'aria-labelledby': `auth-tab-${mode}`,
      'aria-label': mode === 'login' ? 'Log in form' : 'Sign up form',
      novalidate: '',
    },
    children: [
      ...FIELDS[mode].map((field) => Field(mode, field)),
      el('button', {
        className: 'btn btn--filled btn--large btn--block',
        attrs: { type: 'submit' },
        text: copy.submit,
      }),
      el('p', { className: 'auth-form__footer', children: [copy.prompt, switchButton] }),
    ],
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = collect(form);
    const problems = validate(mode, data).filter(([, message]) => message !== null);
    for (const [name, message] of problems) setError(form, name, message);

    const firstInvalid = problems[0]?.[0];
    if (firstInvalid) {
      form.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    onSubmit(mode, data);
  });

  form.addEventListener('input', (event) => {
    if (event.target instanceof HTMLInputElement) setError(form, event.target.name, null);
  });

  return form;
};
