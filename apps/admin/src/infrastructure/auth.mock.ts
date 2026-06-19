import { SessionExpiredError } from './session.js';

const STORAGE_KEY = 'bonae-admin-mock-auth';
const EXPIRY_KEY = 'bonae-admin-mock-exp';

let sessionExpiredHandler: (() => void) | null = null;

export function onSessionExpired(handler: () => void): void {
  sessionExpiredHandler = handler;
}

function notifySessionExpired(): void {
  signOut();
  sessionExpiredHandler?.();
}

export interface MockSession {
  isValid(): boolean;
}

export function signIn(
  email: string,
  password: string,
): Promise<{ type: 'success' } | { type: 'newPasswordRequired'; completeChallenge: (newPassword: string) => Promise<void> }> {
  if (!email.trim() || !password) {
    return Promise.reject(new Error('Email and password required'));
  }
  sessionStorage.setItem(STORAGE_KEY, email.trim());
  sessionStorage.setItem(EXPIRY_KEY, String(Date.now() + 60 * 60 * 1000));
  return Promise.resolve({ type: 'success' });
}

export function signOut(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(EXPIRY_KEY);
}

export function getCurrentSession(): Promise<MockSession | null> {
  if (!sessionStorage.getItem(STORAGE_KEY)) {
    return Promise.resolve(null);
  }
  const exp = Number(sessionStorage.getItem(EXPIRY_KEY) ?? '0');
  if (exp <= Date.now()) {
    signOut();
    return Promise.resolve(null);
  }
  return Promise.resolve({ isValid: () => true });
}

export async function getSessionExpiresAt(): Promise<number | null> {
  if (!sessionStorage.getItem(STORAGE_KEY)) return null;
  const exp = Number(sessionStorage.getItem(EXPIRY_KEY) ?? '0');
  return exp > Date.now() ? exp : null;
}

export async function getIdToken(): Promise<string> {
  if (!sessionStorage.getItem(STORAGE_KEY)) {
    throw new SessionExpiredError('Not authenticated');
  }
  const exp = Number(sessionStorage.getItem(EXPIRY_KEY) ?? '0');
  if (exp <= Date.now()) {
    notifySessionExpired();
    throw new SessionExpiredError('Not authenticated');
  }
  return 'mock-local-token';
}
