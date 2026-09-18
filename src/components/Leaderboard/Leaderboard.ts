import './Leaderboard.scss';
import { getLeaderboard } from '../../api/mock-api';
import type { LeaderboardEntry } from '../../types';
import { el } from '../../utils/dom';
import { formatCompact, formatNumber, initials } from '../../utils/format';

type ColumnKey = 'rank' | 'player' | 'gamesPlayed' | 'totalScore' | 'streakDays' | 'favoriteGame';

interface Column {
  key: ColumnKey;
  label: string;
  /** Shorter label used below the desktop breakpoint. */
  shortLabel?: string;
  /** Narrowest breakpoint at which the column is visible. */
  from?: 'tablet' | 'desktop';
}

const COLUMNS: Column[] = [
  { key: 'rank', label: 'Rank' },
  { key: 'player', label: 'Player' },
  { key: 'gamesPlayed', label: 'Games Played', shortLabel: 'Games', from: 'tablet' },
  { key: 'totalScore', label: 'Total Score', shortLabel: 'Score' },
  { key: 'streakDays', label: 'Streak' },
  { key: 'favoriteGame', label: 'Favorite Game', from: 'desktop' },
];

const AVATAR_VARIANTS = 5;
const LEADERBOARD_TITLE = 'Top Players This Week';

const cellClass = (column: Column): string => {
  let className = `leaderboard__cell leaderboard__cell--${column.key}`;
  if (column.from) className += ` leaderboard__cell--from-${column.from}`;
  return className;
};

/** Full text on desktop, short text below it (toggled in CSS). */
const ResponsiveText = (full: string, short?: string): HTMLSpanElement[] => {
  if (!short) return [el('span', { text: full })];
  return [
    el('span', { className: 'leaderboard__text-full', text: full }),
    el('span', { className: 'leaderboard__text-short', text: short }),
  ];
};

const Player = (entry: LeaderboardEntry): HTMLSpanElement => {
  const variant = ((entry.rank - 1) % AVATAR_VARIANTS) + 1;
  return el('span', {
    className: 'leaderboard__player',
    children: [
      el('span', {
        className: `leaderboard__avatar leaderboard__avatar--${String(variant)}`,
        attrs: { 'aria-hidden': 'true' },
        text: initials(entry.playerName),
      }),
      el('span', { className: 'leaderboard__name', text: entry.playerName }),
    ],
  });
};

const Cell = (column: Column, entry: LeaderboardEntry): HTMLTableCellElement => {
  const className = cellClass(column);
  switch (column.key) {
    case 'rank':
      return el('th', {
        className: `${className}${entry.rank === 1 ? ' leaderboard__cell--first' : ''}`,
        attrs: { scope: 'row' },
        text: `#${String(entry.rank)}`,
      });
    case 'player':
      return el('td', { className, children: [Player(entry)] });
    case 'gamesPlayed':
      return el('td', { className, text: formatNumber(entry.gamesPlayed) });
    case 'totalScore':
      return el('td', {
        className,
        children: ResponsiveText(formatNumber(entry.totalScore), formatCompact(entry.totalScore)),
      });
    case 'streakDays': {
      const days = String(entry.streakDays);
      return el('td', {
        className,
        children: [
          el('span', {
            className: 'leaderboard__flame',
            attrs: { 'aria-hidden': 'true' },
            text: '🔥',
          }),
          ...ResponsiveText(`${days} days`, `${days}d`),
        ],
      });
    }
    case 'favoriteGame':
      return el('td', {
        className,
        children: [el('span', { className: 'leaderboard__badge', text: entry.favoriteGameName })],
      });
  }
};

const Row = (entry: LeaderboardEntry): HTMLTableRowElement =>
  el('tr', {
    className: 'leaderboard__row',
    children: COLUMNS.map((column) => Cell(column, entry)),
  });

const ErrorRow = (): HTMLTableRowElement =>
  el('tr', {
    children: [
      el('td', {
        className: 'leaderboard__error',
        attrs: { colspan: String(COLUMNS.length) },
        text: 'Leaderboard could not be loaded.',
      }),
    ],
  });

export const Leaderboard = (): HTMLElement => {
  const tbody = el('tbody', { attrs: { 'aria-busy': 'true' } });

  getLeaderboard()
    .then((entries) => {
      tbody.append(...entries.map(Row));
    })
    .catch(() => {
      tbody.append(ErrorRow());
    })
    .finally(() => {
      tbody.removeAttribute('aria-busy');
    });

  const headRow = el('tr', {
    children: COLUMNS.map((column) =>
      el('th', {
        className: cellClass(column),
        attrs: { scope: 'col' },
        children: ResponsiveText(column.label, column.shortLabel),
      })
    ),
  });

  const table = el('table', {
    className: 'leaderboard__table',
    children: [
      el('caption', { className: 'visually-hidden', text: LEADERBOARD_TITLE }),
      el('thead', { className: 'leaderboard__head', children: [headRow] }),
      tbody,
    ],
  });

  const title = el('h2', {
    className: 'section-title',
    attrs: { id: 'top-players-title' },
    children: [
      el('span', { className: 'leaderboard__title-full', text: LEADERBOARD_TITLE }),
      el('span', { className: 'leaderboard__title-short', text: 'Top Players' }),
    ],
  });

  return el('section', {
    className: 'section leaderboard',
    attrs: { id: 'top-players', 'aria-labelledby': 'top-players-title' },
    children: [
      el('div', {
        className: 'container',
        children: [
          el('div', { className: 'section__header', children: [title] }),
          el('div', { className: 'leaderboard__wrapper', children: [table] }),
        ],
      }),
    ],
  });
};
