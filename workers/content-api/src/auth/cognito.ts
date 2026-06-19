import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { Env } from '../types.js';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

export function parseCognitoGroups(groupsRaw: unknown): string[] {
  if (groupsRaw == null) return [];
  if (Array.isArray(groupsRaw)) return groupsRaw.map(String);
  if (typeof groupsRaw !== 'string') return [];

  const trimmed = groupsRaw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      // fall through to comma split
    }
  }

  return trimmed.split(',').map((group) => group.trim()).filter(Boolean);
}

export interface VerifiedClaims extends JWTPayload {
  sub: string;
  'cognito:groups'?: string | string[];
  'custom:site_id'?: string;
}

function getIssuer(env: Env): string {
  return `https://cognito-idp.${env.COGNITO_REGION}.amazonaws.com/${env.COGNITO_USER_POOL_ID}`;
}

function getJwks(env: Env) {
  if (!jwks) {
    const issuer = getIssuer(env);
    jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
  }
  return jwks;
}

export async function verifyCognitoJwt(token: string, env: Env): Promise<VerifiedClaims> {
  if (!env.COGNITO_USER_POOL_ID || !env.COGNITO_CLIENT_ID) {
    throw new Error('Unauthorized');
  }

  const issuer = getIssuer(env);
  const { payload } = await jwtVerify(token, getJwks(env), {
    issuer,
    audience: env.COGNITO_CLIENT_ID,
  });

  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new Error('Unauthorized');
  }

  return payload as VerifiedClaims;
}

export function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get('Authorization') ?? request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice('Bearer '.length);
}
