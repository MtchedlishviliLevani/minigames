import { showSnackbar } from '../components/Snackbar/Snackbar';
import type { AppState } from '../router/router';
import { navigate, setNavigationGuard } from '../router/router';
import { checkSession, getSession } from './authState';
import type { AppSession } from './session';

export function guardNavigation(next: AppState): AppState {
  const session = checkSession();
  if (next.auth === null || session === null) return next;
  showSnackbar('You are already logged in.', 'info');
  return { ...next, auth: null };
}

export function installAuthGuard(): void {
  setNavigationGuard(guardNavigation);
}

export function requireSession(reason: string): AppSession | null {
  const hadSession = getSession() !== null;
  const session = checkSession();
  if (session !== null) return session;
  if (!hadSession) showSnackbar(reason, 'warning');
  navigate({ auth: 'login' });
  return null;
}
