import { SessionExpiredError } from './session.js';

const STORAGE_KEY = 'bonae-admin-mock-auth';
const EXPIRY_KEY = 'bonae-admin-mock-exp';
const RESET_EMAIL_KEY = 'bonae-admin-mock-reset-email';
const MOCK_RESET_CODE = '123456';

export type LogoutReason = 'expired' | 'manual';

let sessionExpiredHandler: ((reason: LogoutReason) => void) | null = null;
let sessionRefreshedHandler: (() => void) | null = null;

export function onSessionExpired(handler: (reason: LogoutReason) => void): void {
  sessionExpiredHandler = handler;
}

export function onSessionRefreshed(handler: () => void): void {
  sessionRefreshedHandler = handler;
}

function notifySessionExpired(reason: LogoutReason = 'expired'): void {
  signOut();
  sessionExpiredHandler?.(reason);
}

function notifySessionRefreshed(): void {
  sessionRefreshedHandler?.();
}

export interface MockSession {
  isValid(): boolean;
}

export function signIn(
  email: string,
  password: string,
): Promise<{ type: 'success' } | { type: 'newPasswordRequired'; completeChallenge: (newPassword: string) => Promise<void> }> {
  if (!email.trim() || !password) {
    return Promise.reject(new Error('Se requieren correo y contraseña'));
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
    return Promise.resolve({ isValid: () => false });
  }
  return Promise.resolve({ isValid: () => true });
}

export async function refreshSession(): Promise<MockSession | null> {
  return ensureValidMockSession(true);
}

async function ensureValidMockSession(notifyOnRefresh: boolean): Promise<MockSession | null> {
  if (!sessionStorage.getItem(STORAGE_KEY)) {
    return null;
  }
  const exp = Number(sessionStorage.getItem(EXPIRY_KEY) ?? '0');
  const wasExpired = exp <= Date.now();
  if (wasExpired) {
    sessionStorage.setItem(EXPIRY_KEY, String(Date.now() + 60 * 60 * 1000));
    if (notifyOnRefresh) {
      notifySessionRefreshed();
    }
  }
  return { isValid: () => true };
}

export async function getSessionExpiresAt(): Promise<number | null> {
  if (!sessionStorage.getItem(STORAGE_KEY)) return null;
  const exp = Number(sessionStorage.getItem(EXPIRY_KEY) ?? '0');
  return exp > Date.now() ? exp : null;
}

export async function getIdToken(): Promise<string> {
  const session = await ensureValidMockSession(false);
  if (!session?.isValid()) {
    notifySessionExpired('expired');
    throw new SessionExpiredError('No autenticado');
  }
  return 'mock-local-token';
}

export function requestPasswordReset(email: string): Promise<void> {
  if (!email.trim()) {
    return Promise.reject(new Error('Se requiere correo electrónico'));
  }
  sessionStorage.setItem(RESET_EMAIL_KEY, email.trim());
  return Promise.resolve();
}

export function confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
  const storedEmail = sessionStorage.getItem(RESET_EMAIL_KEY);
  if (!storedEmail || storedEmail !== email.trim()) {
    return Promise.reject(new Error('Código de verificación inválido'));
  }
  if (code.trim() !== MOCK_RESET_CODE) {
    return Promise.reject(new Error('Código de verificación inválido'));
  }
  if (!newPassword) {
    return Promise.reject(new Error('Se requiere contraseña'));
  }
  sessionStorage.removeItem(RESET_EMAIL_KEY);
  return Promise.resolve();
}
