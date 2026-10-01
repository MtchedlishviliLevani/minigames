import { ApiError } from '../api/client';
import { EmptyState, ErrorBanner } from '../components/DataState/DataState';
import { showSnackbar } from '../components/Snackbar/Snackbar';

export interface AsyncSectionOptions<T> {
  container: HTMLElement;
  skeleton: () => Node[];
  load: (signal: AbortSignal) => Promise<T>;
  render: (data: T) => Node[];
  isEmpty?: (data: T) => boolean;
  emptyMessage?: string;
  errorMessage?: string;
  wrap?: (state: HTMLElement) => Node[];
}

export interface AsyncSection {
  reload: () => void;
}

const DEFAULT_EMPTY_MESSAGE = 'There is nothing to show here yet.';
const DEFAULT_ERROR_MESSAGE = 'We could not load this content. Please try again.';

function describe(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function createAsyncSection<T>(options: AsyncSectionOptions<T>): AsyncSection {
  const { container, skeleton, load, render } = options;
  const wrap = options.wrap ?? ((state: HTMLElement): Node[] => [state]);
  let controller: AbortController | undefined;

  const reload = (): void => {
    controller?.abort();
    const request = new AbortController();
    controller = request;

    container.setAttribute('aria-busy', 'true');
    container.replaceChildren(...skeleton());

    void load(request.signal)
      .then((data) => {
        if (request.signal.aborted) return;
        const isEmpty = options.isEmpty?.(data) ?? false;
        container.replaceChildren(
          ...(isEmpty ? [EmptyState(options.emptyMessage ?? DEFAULT_EMPTY_MESSAGE)] : render(data))
        );
      })
      .catch((error: unknown) => {
        if (request.signal.aborted) return;
        const message = options.errorMessage ?? DEFAULT_ERROR_MESSAGE;
        container.replaceChildren(...wrap(ErrorBanner(message, reload)));
        showSnackbar(describe(error, message), 'error');
      })
      .finally(() => {
        if (request.signal.aborted) return;
        container.removeAttribute('aria-busy');
      });
  };

  reload();
  return { reload };
}
