import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { config } from '../config.js';
import { SessionExpiredError } from './session.js';

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

const pool = new CognitoUserPool({
  UserPoolId: config.userPoolId,
  ClientId: config.clientId,
});

function getPoolUser(): CognitoUser | null {
  return pool.getCurrentUser();
}

export function signIn(
  email: string,
  password: string,
): Promise<{ type: 'success' } | { type: 'newPasswordRequired'; completeChallenge: (newPassword: string) => Promise<void> }> {
  const user = new CognitoUser({ Username: email, Pool: pool });
  const authDetails = new AuthenticationDetails({ Username: email, Password: password });

  return new Promise((resolve, reject) => {
    user.authenticateUser(authDetails, {
      onSuccess: () => resolve({ type: 'success' }),
      onFailure: reject,
      newPasswordRequired: () => {
        resolve({
          type: 'newPasswordRequired',
          completeChallenge: (newPassword: string) =>
            new Promise<void>((res, rej) => {
              user.completeNewPasswordChallenge(newPassword, {}, {
                onSuccess: () => res(),
                onFailure: rej,
              });
            }),
        });
      },
    });
  });
}

export function signOut(): void {
  pool.getCurrentUser()?.signOut();
}

export function getCurrentSession(): Promise<CognitoUserSession | null> {
  const user = getPoolUser();
  if (!user) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err) reject(err);
      else resolve(session);
    });
  });
}

export function isSessionExpired(session: CognitoUserSession): boolean {
  const exp = session.getIdToken().getExpiration();
  return exp * 1000 <= Date.now();
}

async function ensureValidSession(notifyOnRefresh: boolean): Promise<CognitoUserSession | null> {
  let session: CognitoUserSession | null;
  try {
    session = await getCurrentSession();
  } catch {
    session = null;
  }

  const wasExpired = !session?.isValid() || (session !== null && isSessionExpired(session));

  if (wasExpired) {
    try {
      session = await getCurrentSession();
    } catch {
      return null;
    }
  }

  if (!session?.isValid() || isSessionExpired(session)) {
    return null;
  }

  if (notifyOnRefresh && wasExpired) {
    notifySessionRefreshed();
  }

  return session;
}

export async function refreshSession(): Promise<CognitoUserSession | null> {
  return ensureValidSession(true);
}

export async function getSessionExpiresAt(): Promise<number | null> {
  let session: CognitoUserSession | null;
  try {
    session = await getCurrentSession();
  } catch {
    return null;
  }
  if (!session?.isValid() || isSessionExpired(session)) {
    return null;
  }
  return session.getIdToken().getExpiration() * 1000;
}

export async function getIdToken(): Promise<string> {
  const session = await ensureValidSession(false);

  if (!session) {
    notifySessionExpired('expired');
    throw new SessionExpiredError('Not authenticated');
  }

  return session.getIdToken().getJwtToken();
}

export function requestPasswordReset(email: string): Promise<void> {
  const user = new CognitoUser({ Username: email.trim(), Pool: pool });

  return new Promise((resolve, reject) => {
    user.forgotPassword({
      onSuccess: () => resolve(),
      onFailure: (err) => reject(err),
    });
  });
}

export function confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
  const user = new CognitoUser({ Username: email.trim(), Pool: pool });

  return new Promise((resolve, reject) => {
    user.confirmPassword(code.trim(), newPassword, {
      onSuccess: () => resolve(),
      onFailure: (err) => reject(err),
    });
  });
}
