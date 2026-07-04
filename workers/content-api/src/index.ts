import { buildAuthContext } from './auth/authorize.js';
import { extractBearerToken, verifyCognitoJwt } from './auth/cognito.js';
import { ContentStore } from './content-store/index.js';
import { handleContentRequest, handlePublishCallbackRequest } from './routes.js';
import type { Env } from './types.js';

export { ContentStore };

function corsHeaders(env: Env): Record<string, string> {
  const origin = env.CORS_ORIGIN ?? '*';
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
  };
}

function jsonResponse(status: number, body: unknown, env: Env): Response {
  return new Response(body == null ? null : JSON.stringify(body), {
    status,
    headers: corsHeaders(env),
  });
}

function emptyResponse(status: number, env: Env): Response {
  const headers = { ...corsHeaders(env) };
  delete headers['Content-Type'];
  return new Response(null, { status, headers });
}

function errorStatus(message: string): number {
  if (message.startsWith('Forbidden')) return 403;
  if (message.startsWith('Unauthorized') || message === 'Not authenticated') return 401;
  if (message === 'Not found') return 404;
  if (message.startsWith('Conflict')) return 409;
  if (message.startsWith('Validation')) return 422;
  return 400;
}

function verifyCallbackSecret(request: Request, env: Env): boolean {
  const auth = request.headers.get('Authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;
  return Boolean(token && env.PUBLISH_CALLBACK_SECRET && token === env.PUBLISH_CALLBACK_SECRET);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return jsonResponse(204, null, env);
    }

    const path = new URL(request.url).pathname;
    if (!path.startsWith('/content/')) {
      return jsonResponse(404, { error: 'Not found' }, env);
    }

    try {
      if (path === '/content/publish/callback' && request.method === 'POST') {
        if (!verifyCallbackSecret(request, env)) {
          throw new Error('Unauthorized');
        }
        const result = await handlePublishCallbackRequest(request, env);
        if (result.status === 204) {
          return emptyResponse(204, env);
        }
        return jsonResponse(result.status, result.body, env);
      }

      const token = extractBearerToken(request);
      if (!token) {
        throw new Error('Unauthorized');
      }

      const claims = await verifyCognitoJwt(token, env);
      const authContext = buildAuthContext(claims);
      const result = await handleContentRequest(request, env, authContext);
      if (result.status === 204) {
        return emptyResponse(204, env);
      }
      return jsonResponse(result.status, result.body, env);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal error';
      const status = errorStatus(message);
      if (status >= 500) {
        console.error(JSON.stringify({ error: message }));
      } else {
        console.error(JSON.stringify({ error: message, status }));
      }
      return jsonResponse(status, { error: message }, env);
    }
  },
};
