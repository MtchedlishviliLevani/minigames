const DRAG_THRESHOLD = 4;

export function enableDragScroll(container: HTMLElement): void {
  let startX = 0;
  let startScroll = 0;
  let isDragging = false;

  container.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') return;
    isDragging = true;
    startX = event.clientX;
    startScroll = container.scrollLeft;
  });

  container.addEventListener('pointermove', (event) => {
    if (!isDragging) return;
    const distance = event.clientX - startX;
    if (Math.abs(distance) < DRAG_THRESHOLD) return;
    container.setPointerCapture(event.pointerId);
    container.classList.add('is-dragging');
    container.scrollLeft = startScroll - distance;
  });

  const stop = (event: PointerEvent): void => {
    if (!isDragging) return;
    isDragging = false;
    if (container.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }
    container.classList.remove('is-dragging');
  };

  container.addEventListener('pointerup', stop);
  container.addEventListener('pointercancel', stop);
  container.addEventListener('click', (event) => {
    if (container.classList.contains('is-dragging')) event.stopPropagation();
  });
}
