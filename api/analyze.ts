import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAnalyze } from './analyzeCore.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { text, apiKey, reviewerName } = req.body ?? {};
  const result = await handleAnalyze(
    { text, apiKey, reviewerName },
    { apiKey: (process.env.OPENAI_API_KEY ?? '').trim() },
  );

  res.status(result.status);
  res.setHeader('Content-Type', 'application/json');
  res.send(result.body);
}
