import './LibraryFilters.scss';
import { CATEGORIES, DEFAULT_CATEGORY, DEFAULT_SORT, SORT_OPTIONS } from '../../data/library';
import type { Category, SortOption } from '../../types';
import { el } from '../../utils/dom';
import { enableDragScroll } from '../../utils/dragScroll';
import { Icon } from '../Icon/Icon';

const SORT_PREFIX = 'Sort by: ';

const sortLabel = (option: SortOption, textPrefix = ''): Node[] => {
  const nodes: Node[] = [
    el('span', { text: textPrefix + option.prefix }),
    Icon(option.arrow, 'sort__arrow'),
  ];
  if (option.suffix !== undefined) nodes.push(el('span', { text: option.suffix }));
  return nodes;
};

const Chip = (category: Category, isActive: boolean): HTMLButtonElement => {
  const chip = el('button', {
    className: `chip${isActive ? ' chip--active' : ''}`,
    attrs: { type: 'button', 'aria-pressed': String(isActive), 'data-slug': category.slug },
    text: category.label,
  });
  return chip;
};

const ChipRow = (): HTMLElement => {
  let activeChip: HTMLButtonElement | null = null;

  const chips = CATEGORIES.map((category) => {
    const isActive = category.slug === DEFAULT_CATEGORY;
    const chip = Chip(category, isActive);
    if (isActive) activeChip = chip;
    return chip;
  });

  const row = el('div', {
    className: 'library-filters__chips',
    attrs: { role: 'group', 'aria-label': 'Filter games by category' },
    children: chips,
  });

  row.addEventListener('click', (event) => {
    const chip = (event.target as Element).closest<HTMLButtonElement>('.chip');
    if (!chip || chip === activeChip) return;
    activeChip?.classList.remove('chip--active');
    activeChip?.setAttribute('aria-pressed', 'false');
    chip.classList.add('chip--active');
    chip.setAttribute('aria-pressed', 'true');
    activeChip = chip;
  });

  enableDragScroll(row);
  return row;
};

const SortControl = (): HTMLElement => {
  let selected: SortOption =
    SORT_OPTIONS.find((option) => option.id === DEFAULT_SORT) ?? SORT_OPTIONS[0];
  let isOpen = false;

  const label = el('span', {
    className: 'sort__label',
    children: sortLabel(selected, SORT_PREFIX),
  });

  const toggle = el('button', {
    className: 'sort__toggle',
    attrs: {
      type: 'button',
      'aria-haspopup': 'listbox',
      'aria-expanded': 'false',
      'aria-label': SORT_PREFIX + selected.label,
    },
    children: [label, Icon('arrow-drop-down', 'sort__caret')],
  });

  const options = SORT_OPTIONS.map((option) => {
    const isSelected = option.id === selected.id;
    return el('li', {
      className: `sort__option${isSelected ? ' sort__option--selected' : ''}`,
      attrs: {
        role: 'option',
        tabindex: '0',
        'aria-selected': String(isSelected),
        'aria-label': option.label,
        'data-id': option.id,
      },
      children: [
        Icon('check', 'sort__check'),
        el('span', { className: 'sort__option-label', children: sortLabel(option) }),
      ],
    });
  });

  const menu = el('ul', {
    className: 'sort__menu',
    attrs: { role: 'listbox', 'aria-label': 'Sort games' },
    children: options,
  });
  menu.hidden = true;

  const setOpen = (open: boolean): void => {
    isOpen = open;
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.classList.toggle('sort__toggle--open', open);
  };

  const select = (option: HTMLElement): void => {
    const id = option.dataset.id;
    const match = SORT_OPTIONS.find((item) => item.id === id);
    if (!match) return;
    selected = match;
    label.replaceChildren(...sortLabel(match, SORT_PREFIX));
    toggle.setAttribute('aria-label', SORT_PREFIX + match.label);
    for (const item of options) {
      const isSelected = item === option;
      item.classList.toggle('sort__option--selected', isSelected);
      item.setAttribute('aria-selected', String(isSelected));
    }
    setOpen(false);
    toggle.focus();
  };

  toggle.addEventListener('click', () => {
    setOpen(!isOpen);
  });

  menu.addEventListener('click', (event) => {
    const option = (event.target as Element).closest<HTMLElement>('.sort__option');
    if (option) select(option);
  });

  menu.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const option = (event.target as Element).closest<HTMLElement>('.sort__option');
    if (!option) return;
    event.preventDefault();
    select(option);
  });

  const sort = el('div', { className: 'sort', children: [toggle, menu] });

  document.addEventListener('click', (event) => {
    if (isOpen && !sort.contains(event.target as Node)) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) {
      setOpen(false);
      toggle.focus();
    }
  });

  return sort;
};

export const LibraryFilters = (): HTMLElement =>
  el('section', {
    className: 'library-filters',
    attrs: { 'aria-labelledby': 'library-filters-title' },
    children: [
      el('h2', {
        className: 'visually-hidden',
        attrs: { id: 'library-filters-title' },
        text: 'Filters and sorting',
      }),
      el('div', {
        className: 'container library-filters__inner',
        children: [ChipRow(), SortControl()],
      }),
    ],
  });
