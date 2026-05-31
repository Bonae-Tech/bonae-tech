const STORAGE_KEY = 'bonae-admin-mock-auth';

export interface MockSession {
  isValid(): boolean;
}

export function signIn(email: string, password: string): Promise<MockSession> {
  if (!email.trim() || !password) {
    return Promise.reject(new Error('Email and password required'));
  }
  sessionStorage.setItem(STORAGE_KEY, email.trim());
  return Promise.resolve({ isValid: () => true });
}

export function signOut(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getCurrentSession(): Promise<MockSession | null> {
  if (!sessionStorage.getItem(STORAGE_KEY)) {
    return Promise.resolve(null);
  }
  return Promise.resolve({ isValid: () => true });
}

export async function getIdToken(): Promise<string> {
  if (!sessionStorage.getItem(STORAGE_KEY)) {
    throw new Error('Not authenticated');
  }
  return 'mock-local-token';
}
