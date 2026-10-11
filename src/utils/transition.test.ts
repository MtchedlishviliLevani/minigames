import { afterEach, describe, expect, it, vi } from 'vitest';
import { runAfterTransition } from './transition';
import { el } from './dom';

describe('runAfterTransition', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs once when the element finishes its own transition', () => {
    const target = el('div');
    const callback = vi.fn();
    runAfterTransition(target, callback);

    target.append(el('span'));
    target.firstElementChild?.dispatchEvent(new Event('transitionend', { bubbles: true }));
    expect(callback).not.toHaveBeenCalled();

    target.dispatchEvent(new Event('transitionend'));
    target.dispatchEvent(new Event('transitionend'));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('falls back to a timer derived from the computed duration', () => {
    vi.useFakeTimers();
    const target = el('div');
    target.style.transitionDuration = '0.2s, 0.4s';
    target.style.transitionDelay = '0.1s';
    document.body.append(target);
    const callback = vi.fn();

    runAfterTransition(target, callback);
    vi.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60);
    expect(callback).toHaveBeenCalledTimes(1);
    target.remove();
  });
});
