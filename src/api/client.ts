export const API_BASE_URL = 'https://faxb76kxra.execute-api.eu-central-1.amazonaws.com/api';

export type QueryValue = string | number | boolean | undefined;

/** Thrown for every failed request. `status` is 0 when the request never reached the server. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function buildUrl(path: string, params: Record<string, QueryValue>): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null && 'error' in body) {
      if (typeof body.error === 'string') return body.error;
    }
  } catch {
    // Error responses are not guaranteed to carry a JSON body.
  }
  return `Request failed with status ${String(response.status)}`;
}

export async function request<T>(
  path: string,
  params: Record<string, QueryValue> = {},
  signal?: AbortSignal
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(buildUrl(path, params), { signal });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError('Network unavailable. Check your connection and try again.', 0);
  }

  if (!response.ok) throw new ApiError(await readErrorMessage(response), response.status);

  const body: unknown = await response.json();
  return body as T;
}
