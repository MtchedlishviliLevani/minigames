import { describe, expect, it, vi } from 'vitest';
import { el } from './dom';
import { enableDragScroll } from './dragScroll';

const pointer = (type: string, clientX: number, pointerType = 'mouse'): PointerEvent =>
  new PointerEvent(type, { clientX, pointerId: 1, pointerType, bubbles: true });

const releasePointerCapture = vi.fn();

const setup = (): HTMLDivElement => {
  const row = el('div');
  row.setPointerCapture = vi.fn();
  row.releasePointerCapture = releasePointerCapture;
  row.hasPointerCapture = vi.fn(() => true);
  enableDragScroll(row);
  return row;
};

describe('enableDragScroll', () => {
  it('scrolls by the dragged distance with a mouse', () => {
    const row = setup();
    row.scrollLeft = 100;
    row.dispatchEvent(pointer('pointerdown', 200));
    row.dispatchEvent(pointer('pointermove', 150));
    expect(row.scrollLeft).toBe(150);
    expect(row.classList.contains('is-dragging')).toBe(true);
  });

  it('ignores tiny movements and touch input', () => {
    const row = setup();
    row.dispatchEvent(pointer('pointerdown', 200));
    row.dispatchEvent(pointer('pointermove', 198));
    expect(row.classList.contains('is-dragging')).toBe(false);

    const touch = setup();
    touch.dispatchEvent(pointer('pointerdown', 200, 'touch'));
    touch.dispatchEvent(pointer('pointermove', 100, 'touch'));
    expect(touch.classList.contains('is-dragging')).toBe(false);
  });

  it('swallows the click that ends a drag and then resets', () => {
    const row = setup();
    const parent = el('div', { children: [row] });
    const onClick = vi.fn();
    parent.addEventListener('click', onClick);

    row.dispatchEvent(pointer('pointerdown', 200));
    row.dispatchEvent(pointer('pointermove', 100));
    row.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClick).not.toHaveBeenCalled();

    row.dispatchEvent(pointer('pointerup', 100));
    expect(releasePointerCapture).toHaveBeenCalledWith(1);
    expect(row.classList.contains('is-dragging')).toBe(false);
    row.dispatchEvent(pointer('pointercancel', 100));

    row.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
