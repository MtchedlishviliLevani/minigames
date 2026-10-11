import type { AuthMode } from '../../types';
import { el } from '../../utils/dom';
import {
  AUTH_FIELDS,
  isAuthFormValid,
  PASSWORD_MIN_LENGTH,
  validateAuthField,
} from '../../utils/validation';
import type { AuthField, AuthValues } from '../../utils/validation';
import { Icon, type IconName } from '../Icon/Icon';

interface FieldConfig {
  name: AuthField;
  label: string;
  type: 'text' | 'email' | 'password';
  icon: IconName;
  autocomplete: string;
  placeholder: string;
}

const FIELD_CONFIG: Record<AuthField, FieldConfig> = {
  username: {
    name: 'username',
    label: 'Username',
    type: 'text',
    icon: 'user',
    autocomplete: 'username',
    placeholder: 'e.g. AlexPro99',
  },
  email: {
    name: 'email',
    label: 'Email',
    type: 'email',
    icon: 'mail',
    autocomplete: 'email',
    placeholder: 'e.g. alex@minigames.com',
  },
  password: {
    name: 'password',
    label: 'Password',
    type: 'password',
    icon: 'lock',
    autocomplete: 'new-password',
    placeholder: `${String(PASSWORD_MIN_LENGTH)}+ chars, A-Z, digit, symbol`,
  },
  confirm: {
    name: 'confirm',
    label: 'Confirm password',
    type: 'password',
    icon: 'lock',
    autocomplete: 'new-password',
    placeholder: 'Repeat your password',
  },
};

const LOGIN_PASSWORD: FieldConfig = {
  ...FIELD_CONFIG.password,
  autocomplete: 'current-password',
  placeholder: 'Your password',
};

const fieldConfig = (mode: AuthMode, field: AuthField): FieldConfig =>
  mode === 'login' && field === 'password' ? LOGIN_PASSWORD : FIELD_CONFIG[field];

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

export interface AuthFormProps {
  mode: AuthMode;
  onSubmit: (mode: AuthMode, values: AuthValues) => void;
  onSwitch: (mode: AuthMode) => void;
}

export interface AuthFormHandle {
  element: HTMLDivElement;
  reset: () => void;
  focus: () => void;
  setLocked: (locked: boolean) => void;
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

const isAuthField = (mode: AuthMode, name: string): name is AuthField =>
  AUTH_FIELDS[mode].some((field) => field === name);

export const AuthForm = ({ mode, onSubmit, onSwitch }: AuthFormProps): AuthFormHandle => {
  const copy = COPY[mode];
  const fields = AUTH_FIELDS[mode];
  const touched = new Set<AuthField>();

  const switchButton = el('button', {
    className: 'auth-form__switch',
    attrs: { type: 'button' },
    text: copy.switchTo,
  });
  switchButton.addEventListener('click', () => {
    onSwitch(copy.other);
  });

  const submitButton = el('button', {
    className: 'btn btn--filled btn--large btn--block auth-form__submit',
    attrs: { type: 'submit', disabled: '' },
    text: copy.submit,
  });

  const form = el('form', {
    className: 'auth-form',
    attrs: {
      'aria-label': mode === 'login' ? 'Log in form' : 'Sign up form',
      novalidate: '',
    },
    children: [
      ...fields.map((field) => Field(mode, fieldConfig(mode, field))),
      submitButton,
      el('p', { className: 'auth-form__footer', children: [copy.prompt, switchButton] }),
    ],
  });

  const element = el('div', {
    className: 'auth-form-panel',
    attrs: {
      id: `auth-panel-${mode}`,
      role: 'tabpanel',
      'aria-labelledby': `auth-tab-${mode}`,
    },
    children: [form],
  });

  const input = (field: AuthField): HTMLInputElement | null =>
    form.querySelector<HTMLInputElement>(`[name="${field}"]`);

  const values = (): AuthValues => {
    const result: AuthValues = {};
    for (const field of fields) result[field] = input(field)?.value ?? '';
    return result;
  };

  const showError = (field: AuthField, message: string | null): void => {
    form.querySelector(`[data-error-for="${field}"]`)?.replaceChildren(message ?? '');
    const target = input(field);
    if (message === null) {
      target?.removeAttribute('aria-invalid');
    } else {
      target?.setAttribute('aria-invalid', 'true');
    }
  };

  const validateField = (field: AuthField): void => {
    showError(field, validateAuthField(mode, field, values()));
  };

  let locked = false;

  const updateSubmit = (): void => {
    submitButton.disabled = locked || !isAuthFormValid(mode, values());
  };

  const handleChange = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !isAuthField(mode, target.name)) return;
    if (element.hidden) return;
    const field = target.name;
    if (event.type === 'input' && target.value === '' && !touched.has(field)) {
      updateSubmit();
      return;
    }
    touched.add(field);
    validateField(field);
    if (field === 'password' && touched.has('confirm')) validateField('confirm');
    updateSubmit();
  };

  form.addEventListener('input', handleChange);
  form.addEventListener('focusout', handleChange);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (locked) return;
    const current = values();
    if (!isAuthFormValid(mode, current)) {
      for (const field of fields) {
        touched.add(field);
        validateField(field);
      }
      const firstInvalid = fields.find((field) => validateAuthField(mode, field, current) !== null);
      if (firstInvalid !== undefined) input(firstInvalid)?.focus();
      updateSubmit();
      return;
    }
    onSubmit(mode, current);
  });

  return {
    element,
    reset: () => {
      form.reset();
      touched.clear();
      for (const field of fields) showError(field, null);
      updateSubmit();
    },
    focus: () => {
      form.querySelector('input')?.focus();
    },
    setLocked: (next) => {
      locked = next;
      form.setAttribute('aria-busy', String(next));
      for (const control of form.querySelectorAll<HTMLInputElement | HTMLButtonElement>(
        'input, button'
      )) {
        if (control !== submitButton) control.disabled = next;
      }
      updateSubmit();
    },
  };
};
