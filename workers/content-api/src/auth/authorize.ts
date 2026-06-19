import type { VerifiedClaims } from './cognito.js';
import { parseCognitoGroups } from './cognito.js';

export interface AuthContext {
  sub: string;
  groups: string[];
  siteId?: string;
}

export function buildAuthContext(claims: VerifiedClaims): AuthContext {
  const groups = parseCognitoGroups(claims['cognito:groups']);
  const siteId =
    typeof claims['custom:site_id'] === 'string' ? claims['custom:site_id'] : undefined;
  return { sub: claims.sub, groups, siteId };
}

export type ContentAction = 'read_draft' | 'write_draft' | 'read_published' | 'publish';

/**
 * Authorization policy for content API actions.
 * Today: platform admins via Cognito Administrators group.
 * Future: tenant-scoped access via custom:site_id and site-{id} groups.
 */
export function requireAuthorized(ctx: AuthContext, action: ContentAction): void {
  if (ctx.groups.includes('Administrators')) {
    return;
  }

  if (ctx.siteId && ctx.groups.includes(`site-${ctx.siteId}`)) {
    if (action === 'publish' && !ctx.groups.includes(`site-${ctx.siteId}-publisher`)) {
      throw new Error('Forbidden: publish permission required');
    }
    return;
  }

  console.error(JSON.stringify({
    error: 'Forbidden: Administrators group required',
    action,
    sub: ctx.sub,
    resolvedGroupCount: ctx.groups.length,
    siteId: ctx.siteId,
  }));
  throw new Error('Forbidden: Administrators group required');
}
