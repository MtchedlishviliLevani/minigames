import type { AuthMode } from '../types';

export const PASSWORD_MIN_LENGTH = 6;
export const USERNAME_MIN_LENGTH = 2;
export const USERNAME_MAX_LENGTH = 30;

export type AuthField = 'username' | 'email' | 'password' | 'confirm';

export type AuthValues = Partial<Record<AuthField, string>>;

export type AuthErrors = Partial<Record<AuthField, string | null>>;

export const AUTH_FIELDS: Record<AuthMode, AuthField[]> = {
  login: ['email', 'password'],
  register: ['username', 'email', 'password', 'confirm'],
};

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const USERNAME_PATTERN = /^[A-Za-z0-9]+$/;
const UPPERCASE_PATTERN = /[A-Z]/;
const DIGIT_PATTERN = /\d/;
const SPECIAL_PATTERN = /[!-/:-@[-`{-~]/;
const PASSWORD_CHARSET = /^[A-Za-z0-9!-/:-@[-`{-~]+$/;

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (email === '') return 'Email is required.';
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address, e.g. alex@minigames.com.';
  return null;
}

export function validateUsername(value: string): string | null {
  if (value === '') return 'Username is required.';
  if (value.length < USERNAME_MIN_LENGTH || value.length > USERNAME_MAX_LENGTH) {
    return `Username must be ${String(USERNAME_MIN_LENGTH)}–${String(USERNAME_MAX_LENGTH)} characters long.`;
  }
  if (!/^[A-Z]/.test(value)) return 'Username must start with an uppercase English letter.';
  if (!USERNAME_PATTERN.test(value)) return 'Use English letters and digits only.';
  return null;
}

export function validateLoginPassword(value: string): string | null {
  if (value === '') return 'Password is required.';
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${String(PASSWORD_MIN_LENGTH)} characters.`;
  }
  return null;
}

export function validateNewPassword(value: string): string | null {
  const basic = validateLoginPassword(value);
  if (basic !== null) return basic;
  if (!PASSWORD_CHARSET.test(value)) {
    return 'Use English letters, digits and special characters only.';
  }
  if (!UPPERCASE_PATTERN.test(value)) return 'Add at least one uppercase English letter.';
  if (!DIGIT_PATTERN.test(value)) return 'Add at least one digit.';
  if (!SPECIAL_PATTERN.test(value)) return 'Add at least one special character, e.g. ! or #.';
  return null;
}

export function validateConfirm(password: string, confirm: string): string | null {
  if (confirm === '') return 'Please confirm your password.';
  if (password !== confirm) return 'Passwords do not match.';
  return null;
}

export function validateAuthField(
  mode: AuthMode,
  field: AuthField,
  values: AuthValues
): string | null {
  const value = values[field] ?? '';
  switch (field) {
    case 'username':
      return validateUsername(value);
    case 'email':
      return validateEmail(value);
    case 'password':
      return mode === 'register' ? validateNewPassword(value) : validateLoginPassword(value);
    case 'confirm':
      return validateConfirm(values.password ?? '', value);
  }
}

export function validateAuthForm(mode: AuthMode, values: AuthValues): AuthErrors {
  const errors: AuthErrors = {};
  for (const field of AUTH_FIELDS[mode]) errors[field] = validateAuthField(mode, field, values);
  return errors;
}

export function isAuthFormValid(mode: AuthMode, values: AuthValues): boolean {
  return AUTH_FIELDS[mode].every((field) => validateAuthField(mode, field, values) === null);
}
