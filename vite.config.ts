import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage } from 'node:http';
import { handleAnalyze } from './api/analyzeCore.js';
import { handleEmail } from './api/emailCore.js';

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString();
      if (!text) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(text));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function apiDevProxy(env: Record<string, string>): Plugin {
  return {
    name: 'api-dev-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        const send = (status: number, body: string) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(body);
        };

        if (req.method !== 'POST') return next();

        try {
          if (url === '/api/analyze') {
            const input = (await readJsonBody(req)) as {
              text?: string;
              apiKey?: string;
              reviewerName?: string;
            };
            const result = await handleAnalyze(input, {
              apiKey: (input.apiKey ?? env.OPENAI_API_KEY ?? '').trim(),
            });
            send(result.status, result.body);
            return;
          }

          if (url === '/api/email') {
            const input = (await readJsonBody(req)) as Parameters<typeof handleEmail>[0];
            const result = await handleEmail(input, {
              user: env.GMAIL_USER ?? '',
              pass: env.GMAIL_APP_PASSWORD ?? '',
            });
            send(result.status, result.body);
            return;
          }

          next();
        } catch (err) {
          send(400, JSON.stringify({ error: err instanceof Error ? err.message : 'Bad request' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), apiDevProxy(env)],
  };
});
