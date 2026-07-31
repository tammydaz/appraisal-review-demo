export async function sendReviewEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  pdfBase64?: string;
  pdfFilename?: string;
}): Promise<void> {
  const res = await fetch('/api/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as { error?: string; ok?: boolean };

  if (!res.ok) {
    throw new Error(data.error ?? `Email failed (${res.status})`);
  }
}
