import { config } from '../config.js';

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

export async function signIn(email: string, password: string) {
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
