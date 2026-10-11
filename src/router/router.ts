import { FALLBACK_CATEGORY } from '../data/categories';
import { DEFAULT_SORT, SORT_OPTIONS } from '../data/library';
import type { AuthMode, KnownRoute, Route } from '../types';

export interface AppState {
  route: Route;
  category: string;
  sort: string;
  page: number;
  game: string | null;
  auth: AuthMode | null;
}

export interface NavigateOptions {
  replace?: boolean;
}

type StateListener = (state: AppState, previous: AppState) => void;

export type NavigationGuard = (next: AppState, previous: AppState) => AppState;

const ROUTE_PATHS: Record<KnownRoute, string> = { home: '/', library: '/library' };
const HOME_ALIAS = '/home';
const AUTH_MODES: AuthMode[] = ['login', 'register'];

const listeners = new Set<StateListener>();

let guard: NavigationGuard = (next) => next;

let state: AppState = {
  route: 'home',
  category: FALLBACK_CATEGORY,
  sort: DEFAULT_SORT,
  page: 1,
  game: null,
  auth: null,
};

function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '').toLowerCase();
  return trimmed === '' ? '/' : trimmed;
}

function parseRoute(pathname: string): Route {
  const path = normalizePath(pathname);
  if (path === ROUTE_PATHS.library) return 'library';
  if (path === ROUTE_PATHS.home || path === HOME_ALIAS) return 'home';
  return 'not-found';
}

function routePath(route: Route): string {
  return route === 'not-found' ? window.location.pathname : ROUTE_PATHS[route];
}

function parseCategory(value: string | null): string {
  return value === null || value === '' ? FALLBACK_CATEGORY : value;
}

function parseSort(value: string | null): string {
  if (value !== null && SORT_OPTIONS.some((option) => option.id === value)) return value;
  return DEFAULT_SORT;
}

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

function parseAuth(value: string | null): AuthMode | null {
  return AUTH_MODES.find((mode) => mode === value) ?? null;
}

function parseLocation(): AppState {
  const params = new URLSearchParams(window.location.search);
  const game = params.get('game');
  return {
    route: parseRoute(window.location.pathname),
    category: parseCategory(params.get('category')),
    sort: parseSort(params.get('sort')),
    page: parsePage(params.get('page')),
    game: game === null || game === '' ? null : game,
    auth: parseAuth(params.get('auth')),
  };
}

function buildUrl(next: AppState): string {
  const params = new URLSearchParams();
  if (next.route === 'library') {
    params.set('category', next.category);
    params.set('sort', next.sort);
    params.set('page', String(next.page));
  }
  if (next.game !== null) params.set('game', next.game);
  if (next.auth !== null) params.set('auth', next.auth);
  const path = routePath(next.route);
  const query = params.toString();
  return query === '' ? path : `${path}?${query}`;
}

function resolve(patch: Partial<AppState>): AppState {
  const next: AppState = { ...state, ...patch };

  if (next.route !== state.route) {
    if (patch.game === undefined) next.game = null;
    if (patch.auth === undefined) next.auth = null;
  }

  const filterChanged = next.category !== state.category || next.sort !== state.sort;
  if (filterChanged && patch.page === undefined) next.page = 1;

  return next;
}

function currentUrl(): string {
  return `${window.location.pathname}${window.location.search}`;
}

function withoutAuthParam(): string {
  const url = new URL(window.location.href);
  url.searchParams.delete('auth');
  return `${url.pathname}${url.search}${url.hash}`;
}

function guarded(candidate: AppState, previous: AppState): AppState {
  const next = guard(candidate, previous);
  if (next !== candidate && next.auth === null && candidate.auth !== null) {
    window.history.replaceState(null, '', withoutAuthParam());
  }
  return next;
}

function commit(next: AppState): void {
  const previous = state;
  state = next;
  for (const listener of listeners) listener(next, previous);
}

export function getState(): AppState {
  return state;
}

export function getRoute(): Route {
  return state.route;
}

export function setNavigationGuard(next: NavigationGuard): void {
  guard = next;
}

export function navigate(patch: Partial<AppState>, options: NavigateOptions = {}): void {
  const candidate = resolve(patch);
  const next = guard(candidate, state);
  const url = buildUrl(next);
  if (url === currentUrl()) return;

  if (options.replace === true || (next !== candidate && next.auth !== candidate.auth)) {
    window.history.replaceState(null, '', url);
  } else {
    window.history.pushState(null, '', url);
  }

  commit(next);
}

export function onStateChange(listener: StateListener): void {
  listeners.add(listener);
}

export function onRouteChange(listener: (route: Route) => void): void {
  onStateChange((next, previous) => {
    if (next.route !== previous.route) listener(next.route);
  });
}

export function startRouter(): void {
  const initial = parseLocation();
  state = guarded(initial, initial);
  window.history.replaceState(null, '', `${buildUrl(state)}${window.location.hash}`);
  window.addEventListener('popstate', () => {
    commit(guarded(parseLocation(), state));
  });
}
