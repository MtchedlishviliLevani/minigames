import './Skeleton.scss';
import { el } from '../../utils/dom';

export type SkeletonLineSize = 'small' | 'medium' | 'large';

export function Skeleton(className = ''): HTMLSpanElement {
  return el('span', {
    className: `skeleton${className === '' ? '' : ` ${className}`}`,
    attrs: { 'aria-hidden': 'true' },
  });
}

export function SkeletonLine(size: SkeletonLineSize = 'medium', className = ''): HTMLSpanElement {
  return Skeleton(`skeleton--${size}${className === '' ? '' : ` ${className}`}`);
}

export function SkeletonText(lines: number, className = ''): HTMLElement {
  return el('span', {
    className: `skeleton-text${className === '' ? '' : ` ${className}`}`,
    attrs: { 'aria-hidden': 'true' },
    children: Array.from({ length: lines }, (_, index) =>
      SkeletonLine('small', index === lines - 1 ? 'skeleton--short' : '')
    ),
  });
}
