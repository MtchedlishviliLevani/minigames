import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as SnackbarModule from './Snackbar';

let showSnackbar: typeof SnackbarModule.showSnackbar;

const toasts = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('.snackbar')];

describe('showSnackbar', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    document.body.replaceChildren();
    vi.resetModules();
    ({ showSnackbar } = await import('./Snackbar'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds a polite status toast with the message as text', () => {
    showSnackbar('<b>Saved</b>', 'success');
    const [toast] = toasts();
    expect(toast?.classList.contains('snackbar--success')).toBe(true);
    expect(toast?.getAttribute('role')).toBe('status');
    expect(toast?.getAttribute('aria-live')).toBe('polite');
    expect(toast?.textContent).toBe('<b>Saved</b>');
    expect(document.querySelector('.snackbar-host')?.getAttribute('aria-label')).toBe(
      'Notifications'
    );
  });

  it('announces errors assertively and stacks the newest first', () => {
    showSnackbar('First');
    showSnackbar('Broken', 'error');
    const [newest, oldest] = toasts();
    expect(newest?.getAttribute('role')).toBe('alert');
    expect(newest?.getAttribute('aria-live')).toBe('assertive');
    expect(oldest?.classList.contains('snackbar--info')).toBe(true);
  });

  it('dismisses itself after a few seconds', () => {
    showSnackbar('Bye');
    vi.advanceTimersByTime(5000);
    expect(toasts()[0]?.classList.contains('is-open')).toBe(false);
    vi.advanceTimersByTime(250);
    expect(toasts()).toHaveLength(0);
  });

  it('can be dismissed with its button', () => {
    showSnackbar('Bye');
    toasts()[0]?.querySelector('button')?.click();
    vi.advanceTimersByTime(250);
    expect(toasts()).toHaveLength(0);
    vi.advanceTimersByTime(5000);
    expect(toasts()).toHaveLength(0);
  });

  it('reattaches its host when the page replaced the body', () => {
    showSnackbar('One');
    document.body.replaceChildren();
    showSnackbar('Two');
    expect(document.querySelector('.snackbar-host')?.isConnected).toBe(true);
    expect(toasts().map((toast) => toast.textContent)).toEqual(['Two', 'One']);
  });
});
