import type { ExtractResult } from '../types/Appraisal';

export async function extractFromReportLive(
  text: string,
  reviewerName: string,
  apiKey?: string,
): Promise<ExtractResult> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, apiKey: apiKey || undefined, reviewerName }),
  });

  const data = (await res.json()) as ExtractResult & { error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? `Extraction failed (${res.status})`);
  }

  return data;
}
