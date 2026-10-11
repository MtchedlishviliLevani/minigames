import { vi } from 'vitest';

export interface MockRoute {
  match: (url: URL, init: RequestInit | undefined) => boolean;
  status?: number;
  body?: unknown;
  error?: Error;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function mockFetch(routes: MockRoute[] = []): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const route = routes.find((candidate) => candidate.match(url, init));
    if (route === undefined) return Promise.resolve(jsonResponse({ error: 'Not mocked' }, 500));
    if (route.error !== undefined) return Promise.reject(route.error);
    return Promise.resolve(jsonResponse(route.body ?? {}, route.status ?? 200));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export const path =
  (expected: string, method = 'GET') =>
  (url: URL, init: RequestInit | undefined): boolean =>
    url.pathname.endsWith(expected) && (init?.method ?? 'GET') === method;

export function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}
