import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { mockHandleRequest } from './mockContentStore.js';

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  if (body == null) {
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export function contentApiMockPlugin(): Plugin {
  return {
    name: 'bonae-content-api-mock',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const addr = server.httpServer?.address();
        const port = typeof addr === 'object' && addr ? addr.port : 5173;
        console.log(
          `[bonae-content-api-mock] /content/* → in-memory store + apps/static/content (http://localhost:${port})`,
        );
      });

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (!url.startsWith('/content/')) {
          next();
          return;
        }

        const method = req.method ?? 'GET';
        try {
          const bodyText = method === 'GET' || method === 'HEAD' ? '' : await readBody(req);
          const result = await mockHandleRequest(method, url, bodyText);
          sendJson(res, result.status, result.body);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Request failed';
          sendJson(res, 400, { error: message });
        }
      });
    },
  };
}
