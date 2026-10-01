import './LibraryPagination.scss';
import { navigate } from '../../router/router';
import { el } from '../../utils/dom';
import { Icon } from '../Icon/Icon';

const MOBILE_QUERY = '(max-width: 767px)';
const MOBILE_PAGE_WINDOW = 3;
const WIDE_PAGE_WINDOW = 4;

const visiblePages = (current: number, total: number, size: number): number[] => {
  const count = Math.min(size, total);
  const start = Math.max(1, Math.min(current - Math.floor((count - 1) / 2), total - count + 1));
  return Array.from({ length: count }, (_, index) => start + index);
};

const ArrowButton = (icon: 'chevron-left' | 'chevron-right', label: string): HTMLButtonElement =>
  el('button', {
    className: 'pagination__arrow',
    attrs: { type: 'button', 'aria-label': label },
    children: [Icon(icon, 'pagination__icon')],
  });

export interface LibraryPaginationHandle {
  element: HTMLElement;
  update: (page: number, totalPages: number) => void;
}

export const LibraryPagination = (): LibraryPaginationHandle => {
  const mobileQuery = window.matchMedia(MOBILE_QUERY);
  let totalPages = 1;
  let current = 1;

  const pages = el('ul', { className: 'pagination__pages' });
  const previous = ArrowButton('chevron-left', 'Previous page');
  const next = ArrowButton('chevron-right', 'Next page');

  const PageItem = (page: number): HTMLLIElement => {
    const isCurrent = page === current;
    const button = el('button', {
      className: `pagination__page${isCurrent ? ' pagination__page--current' : ''}`,
      attrs: { type: 'button', ...(isCurrent && { 'aria-current': 'page' }) },
      text: String(page),
    });
    button.addEventListener('click', () => {
      if (page !== current) navigate({ page });
    });
    return el('li', { children: [button] });
  };

  function render(): void {
    const size = mobileQuery.matches ? MOBILE_PAGE_WINDOW : WIDE_PAGE_WINDOW;
    pages.replaceChildren(...visiblePages(current, totalPages, size).map(PageItem));
    previous.disabled = current === 1;
    next.disabled = current === totalPages;
  }

  const goTo = (page: number): void => {
    const target = Math.min(Math.max(page, 1), totalPages);
    if (target !== current) navigate({ page: target });
  };

  previous.addEventListener('click', () => {
    goTo(current - 1);
  });
  next.addEventListener('click', () => {
    goTo(current + 1);
  });
  mobileQuery.addEventListener('change', render);

  render();

  return {
    element: el('nav', {
      className: 'library-pagination',
      attrs: { 'aria-label': 'Library pagination' },
      children: [
        el('div', {
          className: 'container library-pagination__inner',
          children: [previous, pages, next],
        }),
      ],
    }),
    update: (page, pageCount) => {
      totalPages = Math.max(pageCount, 1);
      current = Math.min(Math.max(page, 1), totalPages);
      render();
    },
  };
};
