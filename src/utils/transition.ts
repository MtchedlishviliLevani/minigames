const SAFETY_MARGIN_MS = 50;

function longestSeconds(value: string): number {
  return value
    .split(',')
    .reduce((longest, part) => Math.max(longest, Number.parseFloat(part) || 0), 0);
}

function fallbackDelay(target: HTMLElement): number {
  const style = window.getComputedStyle(target);
  const seconds = longestSeconds(style.transitionDuration) + longestSeconds(style.transitionDelay);
  return seconds * 1000 + SAFETY_MARGIN_MS;
}

export function runAfterTransition(target: HTMLElement, callback: () => void): void {
  let finished = false;
  let timerId = 0;

  const finish = (): void => {
    if (finished) return;
    finished = true;
    window.clearTimeout(timerId);
    target.removeEventListener('transitionend', onTransitionEnd);
    callback();
  };

  function onTransitionEnd(event: TransitionEvent): void {
    if (event.target === target) finish();
  }

  target.addEventListener('transitionend', onTransitionEnd);
  timerId = window.setTimeout(finish, fallbackDelay(target));
}
