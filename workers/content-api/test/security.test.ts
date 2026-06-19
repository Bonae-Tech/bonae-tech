import { describe, expect, it } from 'vitest';
import { buildAuthContext, requireAuthorized } from '../src/auth/authorize.js';
import { extractBearerToken, parseCognitoGroups } from '../src/auth/cognito.js';

describe('parseCognitoGroups', () => {
  it('parses array groups', () => {
    expect(parseCognitoGroups(['Administrators', 'Editors'])).toEqual([
      'Administrators',
      'Editors',
    ]);
  });

  it('parses comma-separated string', () => {
    expect(parseCognitoGroups('Administrators, Editors')).toEqual(['Administrators', 'Editors']);
  });

  it('parses JSON array string', () => {
    expect(parseCognitoGroups('["Administrators"]')).toEqual(['Administrators']);
  });

  it('returns empty for null', () => {
    expect(parseCognitoGroups(null)).toEqual([]);
  });
});

describe('requireAuthorized', () => {
  it('allows Administrators group', () => {
    expect(() =>
      requireAuthorized({ sub: 'user-1', groups: ['Administrators'] }, 'publish'),
    ).not.toThrow();
  });

  it('rejects users without Administrators group', () => {
    expect(() =>
      requireAuthorized({ sub: 'user-1', groups: ['Editors'] }, 'read_draft'),
    ).toThrow('Forbidden: Administrators group required');
  });

  it('allows tenant-scoped group for read', () => {
    expect(() =>
      requireAuthorized(
        { sub: 'user-2', groups: ['site-acme'], siteId: 'acme' },
        'read_draft',
      ),
    ).not.toThrow();
  });

  it('rejects tenant publish without publisher group', () => {
    expect(() =>
      requireAuthorized(
        { sub: 'user-2', groups: ['site-acme'], siteId: 'acme' },
        'publish',
      ),
    ).toThrow('Forbidden: publish permission required');
  });
});

describe('buildAuthContext', () => {
  it('extracts site id from custom attribute', () => {
    const ctx = buildAuthContext({
      sub: 'user-3',
      'cognito:groups': ['site-acme'],
      'custom:site_id': 'acme',
    });
    expect(ctx.siteId).toBe('acme');
    expect(ctx.groups).toEqual(['site-acme']);
  });
});

describe('extractBearerToken', () => {
  it('extracts bearer token from Authorization header', () => {
    const request = new Request('https://example.com/content/drafts/es', {
      headers: { Authorization: 'Bearer jwt-token-here' },
    });
    expect(extractBearerToken(request)).toBe('jwt-token-here');
  });

  it('returns null when header is missing', () => {
    const request = new Request('https://example.com/content/drafts/es');
    expect(extractBearerToken(request)).toBeNull();
  });
});
