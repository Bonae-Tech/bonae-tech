import { buildAuthContext } from './auth/authorize.js';
import { extractBearerToken, verifyCognitoJwt } from './auth/cognito.js';
import { handleContentRequest } from './routes.js';
import type { Env } from './types.js';

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

function errorStatus(message: string): number {
  if (message.startsWith('Forbidden')) return 403;
  if (message.startsWith('Unauthorized') || message === 'Not authenticated') return 401;
  if (message === 'Not found') return 404;
  return 400;
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
      const token = extractBearerToken(request);
      if (!token) {
        throw new Error('Unauthorized');
      }

      const claims = await verifyCognitoJwt(token, env);
      const authContext = buildAuthContext(claims);
      const result = await handleContentRequest(request, env, authContext);
      return jsonResponse(200, result, env);
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
