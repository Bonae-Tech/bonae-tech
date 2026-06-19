import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { config } from '../config.js';
import { SessionExpiredError } from './session.js';

let sessionExpiredHandler: (() => void) | null = null;

export function onSessionExpired(handler: () => void): void {
  sessionExpiredHandler = handler;
}

function notifySessionExpired(): void {
  signOut();
  sessionExpiredHandler?.();
}

const pool = new CognitoUserPool({
  UserPoolId: config.userPoolId,
  ClientId: config.clientId,
});

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
  const user = pool.getCurrentUser();
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

export async function getSessionExpiresAt(): Promise<number | null> {
  const session = await getCurrentSession();
  if (!session?.isValid() || isSessionExpired(session)) {
    return null;
  }
  return session.getIdToken().getExpiration() * 1000;
}

export async function getIdToken(): Promise<string> {
  const session = await getCurrentSession();
  if (!session?.isValid() || isSessionExpired(session)) {
    notifySessionExpired();
    throw new SessionExpiredError('Not authenticated');
  }
  return session.getIdToken().getJwtToken();
}
