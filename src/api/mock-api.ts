import type { Game, MockResponse } from '../types';

const MOCK_API_BASE = `${import.meta.env.BASE_URL}mock`;

async function fetchJson<T>(resource: string): Promise<T> {
  const response = await fetch(`${MOCK_API_BASE}/${resource}.json`);
  if (!response.ok) {
    throw new Error(`Request to ${resource} failed with status ${String(response.status)}`);
  }
  const body: unknown = await response.json();
  return body as T;
}

export async function getGames(): Promise<Game[]> {
  const { data } = await fetchJson<MockResponse<Game>>('all-games-seed');
  return data;
}

export async function getFeaturedGames(): Promise<Game[]> {
  const games = await getGames();
  return games.filter((game) => game.featured);
}

export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
