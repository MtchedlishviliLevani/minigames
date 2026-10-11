import { describe, expect, it } from 'vitest';
import {
  isAuthFormValid,
  validateAuthField,
  validateAuthForm,
  validateConfirm,
  validateEmail,
  validateLoginPassword,
  validateNewPassword,
  validateUsername,
} from './validation';

describe('validateEmail', () => {
  it.each(['alex@minigames.com', 'a.b+c@mail.co.uk', '  pad@x.io  '])('accepts %s', (email) => {
    expect(validateEmail(email)).toBeNull();
  });

  it.each(['plain', 'a@b', 'a @b.com', '@b.com', 'a@b.c'])('rejects %s', (email) => {
    expect(validateEmail(email)).toMatch(/valid email/);
  });

  it('requires a value', () => {
    expect(validateEmail('   ')).toBe('Email is required.');
  });
});

describe('validateUsername', () => {
  it.each(['Al', 'AlexPro99', `A${'b'.repeat(29)}`])('accepts %s', (name) => {
    expect(validateUsername(name)).toBeNull();
  });

  it('requires a value', () => {
    expect(validateUsername('')).toBe('Username is required.');
  });

  it.each(['A', `A${'b'.repeat(30)}`])('rejects the length of %s', (name) => {
    expect(validateUsername(name)).toMatch(/2–30 characters/);
  });

  it.each(['alex', '9Lives', 'Ünal'])('rejects %s for not starting with A-Z', (name) => {
    expect(validateUsername(name)).toMatch(/start with an uppercase/);
  });

  it.each(['Alex_Pro', 'Alex Pro', 'Alexé'])('rejects %s for other characters', (name) => {
    expect(validateUsername(name)).toBe('Use English letters and digits only.');
  });
});

describe('validateLoginPassword', () => {
  it('only checks presence and length', () => {
    expect(validateLoginPassword('')).toBe('Password is required.');
    expect(validateLoginPassword('abcde')).toMatch(/at least 6/);
    expect(validateLoginPassword('abcdef')).toBeNull();
  });
});

describe('validateNewPassword', () => {
  it('accepts a strong password', () => {
    expect(validateNewPassword('Secr3t!')).toBeNull();
  });

  it.each([
    ['', /required/],
    ['Ab1!', /at least 6/],
    ['secr3t!', /uppercase/],
    ['Secret!', /digit/],
    ['Secret1', /special character/],
    ['Sécr3t!', /English letters/],
    ['Secr3t !', /English letters/],
  ])('rejects %s', (password, message) => {
    expect(validateNewPassword(password)).toMatch(message);
  });
});

describe('validateConfirm', () => {
  it('requires a value and an exact match only', () => {
    expect(validateConfirm('Secr3t!', '')).toBe('Please confirm your password.');
    expect(validateConfirm('Secr3t!', 'secr3t!')).toBe('Passwords do not match.');
    expect(validateConfirm('weak', 'weak')).toBeNull();
  });
});

describe('form level validation', () => {
  const register = {
    username: 'AlexPro99',
    email: 'alex@minigames.com',
    password: 'Secr3t!',
    confirm: 'Secr3t!',
  };

  it('uses the login rules for the login password', () => {
    expect(validateAuthField('login', 'password', { password: 'simple' })).toBeNull();
    expect(validateAuthField('register', 'password', { password: 'simple' })).not.toBeNull();
  });

  it('validates only the fields of the active mode', () => {
    expect(Object.keys(validateAuthForm('login', {}))).toEqual(['email', 'password']);
    expect(Object.keys(validateAuthForm('register', {}))).toEqual([
      'username',
      'email',
      'password',
      'confirm',
    ]);
  });

  it('reports whether the whole form is valid', () => {
    expect(isAuthFormValid('register', register)).toBe(true);
    expect(isAuthFormValid('register', { ...register, confirm: 'nope' })).toBe(false);
    expect(isAuthFormValid('login', { email: register.email, password: 'simple' })).toBe(true);
  });
});
