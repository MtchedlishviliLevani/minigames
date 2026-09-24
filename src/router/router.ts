import type { Route } from '../types';

type RouteListener = (route: Route) => void;

const listeners = new Set<RouteListener>();
let currentRoute: Route = 'home';

export function getRoute(): Route {
  return currentRoute;
}

export function navigate(route: Route): void {
  if (route === currentRoute) return;
  currentRoute = route;
  for (const listener of listeners) listener(route);
}

export function onRouteChange(listener: RouteListener): void {
  listeners.add(listener);
}
