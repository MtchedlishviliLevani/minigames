import { describe, expect, it, vi } from 'vitest';
import { LEADERS } from '../../test/fixtures';
import { flush, mockFetch, path } from '../../test/http';
import { Leaderboard } from './Leaderboard';

vi.mock('../Snackbar/Snackbar', () => ({ showSnackbar: vi.fn() }));

const cells = (row: Element | undefined): string[] =>
  [...(row?.children ?? [])].map((cell) => cell.textContent);

describe('Leaderboard', () => {
  it('renders a row per player with full and short values', async () => {
    mockFetch([{ match: path('/leaderboard'), body: { data: LEADERS } }]);
    const section = Leaderboard();
    expect(section.querySelectorAll('tbody .skeleton').length).toBeGreaterThan(0);
    await flush();

    const rows = [...section.querySelectorAll('tbody tr')];
    expect(rows).toHaveLength(2);
    expect(cells(rows[0])).toEqual([
      '#1',
      'APAlex_Pro99',
      '1,240',
      '98,45098.4K',
      '🔥12 days12d',
      'Palia',
    ]);
    expect(rows[0]?.querySelector('th')?.className).toContain('leaderboard__cell--first');
    expect(rows[1]?.querySelector('.leaderboard__avatar--2')?.textContent).toBe('LU');
    expect(section.querySelector('caption')?.textContent).toBe('Top Players This Week');
  });

  it('shows an empty state spanning the table', async () => {
    mockFetch([{ match: path('/leaderboard'), body: { data: [] } }]);
    const section = Leaderboard();
    await flush();
    const cell = section.querySelector('.leaderboard__state');
    expect(cell?.getAttribute('colspan')).toBe('6');
    expect(cell?.textContent).toContain('No players');
  });

  it('shows an error state', async () => {
    mockFetch([{ match: path('/leaderboard'), status: 503, body: { error: 'Down' } }]);
    const section = Leaderboard();
    await flush();
    expect(section.querySelector('.data-state--error')?.textContent).toContain(
      'The leaderboard could not be loaded.'
    );
  });
});
