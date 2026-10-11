import { describe, expect, it, vi } from 'vitest';
import type { AuthMode } from '../../types';
import { AuthForm } from './AuthForm';
import type { AuthFormHandle } from './AuthForm';

const setup = (
  mode: AuthMode
): {
  handle: AuthFormHandle;
  onSubmit: ReturnType<typeof vi.fn>;
  onSwitch: ReturnType<typeof vi.fn>;
  input: (name: string) => HTMLInputElement;
  error: (name: string) => string;
  submit: HTMLButtonElement;
  type: (name: string, value: string) => void;
  blur: (name: string) => void;
} => {
  const onSubmit = vi.fn();
  const onSwitch = vi.fn();
  const handle = AuthForm({ mode, onSubmit, onSwitch });
  document.body.replaceChildren(handle.element);
  const input = (name: string): HTMLInputElement => {
    const found = handle.element.querySelector<HTMLInputElement>(`[name="${name}"]`);
    if (found === null) throw new Error(`No input ${name}`);
    return found;
  };
  const submit = handle.element.querySelector<HTMLButtonElement>('[type="submit"]');
  if (submit === null) throw new Error('No submit button');
  return {
    handle,
    onSubmit,
    onSwitch,
    input,
    submit,
    error: (name) => handle.element.querySelector(`[data-error-for="${name}"]`)?.textContent ?? '',
    type: (name, value) => {
      input(name).value = value;
      input(name).dispatchEvent(new Event('input', { bubbles: true }));
    },
    blur: (name) => {
      input(name).dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    },
  };
};

const fillRegister = (form: ReturnType<typeof setup>): void => {
  form.type('username', 'AlexPro99');
  form.type('email', 'alex@minigames.com');
  form.type('password', 'Secr3t!');
  form.type('confirm', 'Secr3t!');
};

describe('AuthForm', () => {
  it('renders only the fields of its mode', () => {
    const login = setup('login');
    expect([...login.handle.element.querySelectorAll('input')].map((i) => i.name)).toEqual([
      'email',
      'password',
    ]);
    expect(login.input('password').autocomplete).toBe('current-password');
  });

  it('shows errors while typing and clears them once valid', () => {
    const form = setup('register');
    form.type('email', 'alex@');
    expect(form.error('email')).toMatch(/valid email/);
    expect(form.input('email').getAttribute('aria-invalid')).toBe('true');

    form.type('email', 'alex@minigames.com');
    expect(form.error('email')).toBe('');
    expect(form.input('email').hasAttribute('aria-invalid')).toBe(false);
  });

  it('validates an untouched field when it loses focus', () => {
    const form = setup('register');
    form.blur('username');
    expect(form.error('username')).toBe('Username is required.');
  });

  it('keeps submit disabled until every field is valid', () => {
    const form = setup('register');
    expect(form.submit.disabled).toBe(true);
    form.type('username', 'AlexPro99');
    form.type('email', 'alex@minigames.com');
    form.type('password', 'Secr3t!');
    expect(form.submit.disabled).toBe(true);
    form.type('confirm', 'Secr3t!');
    expect(form.submit.disabled).toBe(false);
  });

  it('revalidates the confirmation when the password changes', () => {
    const form = setup('register');
    fillRegister(form);
    expect(form.error('confirm')).toBe('');

    form.type('password', 'Secr3t!2');
    expect(form.error('confirm')).toBe('Passwords do not match.');
    expect(form.submit.disabled).toBe(true);
  });

  it('submits the values of the active mode', () => {
    const form = setup('register');
    fillRegister(form);
    form.submit.click();
    expect(form.onSubmit).toHaveBeenCalledWith('register', {
      username: 'AlexPro99',
      email: 'alex@minigames.com',
      password: 'Secr3t!',
      confirm: 'Secr3t!',
    });
  });

  it('shows every error and focuses the first invalid field on an invalid submit', () => {
    const form = setup('login');
    form.type('email', 'alex@minigames.com');
    form.handle.element.querySelector('form')?.requestSubmit();
    expect(form.onSubmit).not.toHaveBeenCalled();
    expect(form.error('password')).toBe('Password is required.');
    expect(document.activeElement).toBe(form.input('password'));
  });

  it('applies the login password rules', () => {
    const form = setup('login');
    form.type('email', 'alex@minigames.com');
    form.type('password', 'simple');
    expect(form.submit.disabled).toBe(false);
  });

  it('clears values and errors on reset', () => {
    const form = setup('register');
    form.type('email', 'bad');
    form.handle.reset();
    expect(form.input('email').value).toBe('');
    expect(form.error('email')).toBe('');
    expect(form.submit.disabled).toBe(true);
  });

  it('locks every control and blocks submit while locked', () => {
    const form = setup('register');
    fillRegister(form);
    form.handle.setLocked(true);
    expect(form.input('email').disabled).toBe(true);
    expect(form.submit.disabled).toBe(true);
    form.handle.element.querySelector('form')?.requestSubmit();
    expect(form.onSubmit).not.toHaveBeenCalled();

    form.handle.setLocked(false);
    expect(form.input('email').disabled).toBe(false);
    expect(form.submit.disabled).toBe(false);
  });

  it('asks to switch to the other mode', () => {
    const form = setup('login');
    form.handle.element.querySelector<HTMLButtonElement>('.auth-form__switch')?.click();
    expect(form.onSwitch).toHaveBeenCalledWith('register');
  });

  it('focuses the first field', () => {
    const form = setup('register');
    form.handle.focus();
    expect(document.activeElement).toBe(form.input('username'));
  });
});
