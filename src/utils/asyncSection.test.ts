import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import { flush } from '../test/http';
import { el } from './dom';
import { createAsyncSection } from './asyncSection';
import type { AsyncSection, AsyncSectionOptions } from './asyncSection';

vi.mock('../components/Snackbar/Snackbar', () => ({ showSnackbar: vi.fn() }));
const { showSnackbar } = await import('../components/Snackbar/Snackbar');

const setup = (
  load: () => Promise<string[]>,
  extra: Partial<AsyncSectionOptions<string[]>> = {}
): { container: HTMLDivElement; section: AsyncSection } => {
  const container = el('div');
  const section = createAsyncSection<string[]>({
    container,
    skeleton: () => [el('span', { className: 'skeleton' })],
    load,
    render: (items) => items.map((text) => el('p', { text })),
    isEmpty: (items) => items.length === 0,
    ...extra,
  });
  return { container, section };
};

describe('createAsyncSection', () => {
  it('shows the skeleton and marks the container busy while loading', () => {
    const { container } = setup(() => new Promise(() => undefined));
    expect(container.querySelector('.skeleton')).not.toBeNull();
    expect(container.getAttribute('aria-busy')).toBe('true');
  });

  it('renders the data and reports it', async () => {
    const onData = vi.fn();
    const { container } = setup(() => Promise.resolve(['a', 'b']), { onData });
    await flush();
    expect(container.textContent).toBe('ab');
    expect(container.hasAttribute('aria-busy')).toBe(false);
    expect(onData).toHaveBeenCalledWith(['a', 'b']);
  });

  it('shows the empty state for empty data', async () => {
    const { container } = setup(() => Promise.resolve([]), { emptyMessage: 'Nothing here' });
    await flush();
    expect(container.querySelector('.data-state--empty')?.textContent).toContain('Nothing here');
  });

  it('shows an error banner with a working retry', async () => {
    const load = vi
      .fn<() => Promise<string[]>>()
      .mockRejectedValueOnce(new ApiError('Server down', 500))
      .mockResolvedValueOnce(['ok']);
    const { container } = setup(load, { errorMessage: 'Could not load' });
    await flush();

    expect(container.querySelector('.data-state--error')?.textContent).toContain('Could not load');
    expect(showSnackbar).toHaveBeenCalledWith('Server down', 'error');

    container.querySelector('button')?.click();
    await flush();
    expect(container.textContent).toBe('ok');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('uses the fallback message for unknown errors', async () => {
    setup(() => Promise.reject(new Error('boom')), { errorMessage: 'Could not load' });
    await flush();
    expect(showSnackbar).toHaveBeenCalledWith('Could not load', 'error');
  });

  it('renders the not found state for 404 responses', async () => {
    const { container } = setup(() => Promise.reject(new ApiError('Missing', 404)), {
      notFound: { title: 'Game not found', message: 'Pick another one' },
      wrap: (state) => [el('li', { children: [state] })],
    });
    await flush();
    expect(container.querySelector('li .data-state--empty')?.textContent).toContain(
      'Pick another one'
    );
    expect(showSnackbar).toHaveBeenCalledWith('Game not found', 'warning');
  });

  it('ignores a stale response after reload', async () => {
    let resolveFirst: (value: string[]) => void = () => undefined;
    const load = vi
      .fn<() => Promise<string[]>>()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          })
      )
      .mockResolvedValueOnce(['fresh']);
    const { container, section } = setup(load);

    section.reload();
    resolveFirst(['stale']);
    await flush();
    expect(container.textContent).toBe('fresh');
  });
});
