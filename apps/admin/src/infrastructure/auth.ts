import { config } from '../config.js';

export type SignInResult =
  | { type: 'success' }
  | { type: 'newPasswordRequired'; completeChallenge: (newPassword: string) => Promise<void> };

type AuthModule = typeof import('./auth.mock.js');

let authModule: AuthModule | null = null;

async function getAuth(): Promise<AuthModule> {
  if (!authModule) {
    authModule = config.useMock
      ? await import('./auth.mock.js')
      : await import('./auth.cognito.js');
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

export async function getSessionExpiresAt(): Promise<number | null> {
  const auth = await getAuth();
  if ('getSessionExpiresAt' in auth && typeof auth.getSessionExpiresAt === 'function') {
    return auth.getSessionExpiresAt();
  }
  return null;
}

export async function onSessionExpired(handler: () => void): Promise<void> {
  const auth = await getAuth();
  if ('onSessionExpired' in auth && typeof auth.onSessionExpired === 'function') {
    auth.onSessionExpired(handler);
  }
}

export { SessionExpiredError } from './session.js';
