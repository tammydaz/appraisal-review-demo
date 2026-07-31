import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleEmail } from './emailCore.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body ?? {};
  const result = await handleEmail(body, {
    user: (process.env.ICLOUD_USER ?? process.env.GMAIL_USER ?? '').trim(),
    pass: (process.env.ICLOUD_APP_PASSWORD ?? process.env.GMAIL_APP_PASSWORD ?? '').trim(),
  });

  res.status(result.status);
  res.setHeader('Content-Type', 'application/json');
  res.send(result.body);
}
