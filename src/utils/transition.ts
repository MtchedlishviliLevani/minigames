export function runAfterTransition(target: HTMLElement, callback: () => void): void {
  const finish = (event: TransitionEvent): void => {
    if (event.target !== target) return;
    target.removeEventListener('transitionend', finish);
    callback();
  };
  target.addEventListener('transitionend', finish);
}
