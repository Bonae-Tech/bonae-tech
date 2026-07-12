import { config } from '../config.js';

export type SignInResult =
  | { type: 'success' }
  | { type: 'newPasswordRequired'; completeChallenge: (newPassword: string) => Promise<void> };

export type LogoutReason = 'expired' | 'manual';

type AuthModule = typeof import('./auth.mock.js');

let authModule: AuthModule | null = null;

async function getAuth(): Promise<AuthModule> {
  if (config.useMock) {
    return import('./auth.mock.js');
  }
  if (!authModule) {
    authModule = await import('./auth.cognito.js');
  }
  return authModule;
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  return (await getAuth()).signIn(email, password);
}

export async function signOut() {
  (await getAuth()).signOut();
}

export async function getCurrentSession() {
  return (await getAuth()).getCurrentSession();
}

export async function getIdToken(): Promise<string> {
  return (await getAuth()).getIdToken();
}

export async function refreshSession() {
  const auth = await getAuth();
  if ('refreshSession' in auth && typeof auth.refreshSession === 'function') {
    return auth.refreshSession();
  }
  return null;
}

export async function getSessionExpiresAt(): Promise<number | null> {
  const auth = await getAuth();
  if ('getSessionExpiresAt' in auth && typeof auth.getSessionExpiresAt === 'function') {
    return auth.getSessionExpiresAt();
  }
  return null;
}

export async function onSessionExpired(handler: (reason: LogoutReason) => void): Promise<void> {
  const auth = await getAuth();
  if ('onSessionExpired' in auth && typeof auth.onSessionExpired === 'function') {
    auth.onSessionExpired(handler);
  }
}

export async function onSessionRefreshed(handler: () => void): Promise<void> {
  const auth = await getAuth();
  if ('onSessionRefreshed' in auth && typeof auth.onSessionRefreshed === 'function') {
    auth.onSessionRefreshed(handler);
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const auth = await getAuth();
  if ('requestPasswordReset' in auth && typeof auth.requestPasswordReset === 'function') {
    return auth.requestPasswordReset(email);
  }
  throw new Error('El restablecimiento de contraseña no está disponible');
}

export async function confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
  const auth = await getAuth();
  if ('confirmPasswordReset' in auth && typeof auth.confirmPasswordReset === 'function') {
    return auth.confirmPasswordReset(email, code, newPassword);
  }
  throw new Error('El restablecimiento de contraseña no está disponible');
}

export { SessionExpiredError } from './session.js';
