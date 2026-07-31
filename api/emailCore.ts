import nodemailer from 'nodemailer';

export interface EmailInput {
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
  pdfBase64?: string;
  pdfFilename?: string;
}

export async function handleEmail(
  input: EmailInput,
  env: { user: string; pass: string },
): Promise<{ status: number; body: string }> {
  const to = (input.to ?? '').trim();
  const subject = (input.subject ?? '').trim();
  const text = input.text ?? '';
  const html = input.html ?? '';
  const user = env.user.trim();
  const pass = env.pass.trim();

  if (!to) {
    return { status: 400, body: JSON.stringify({ error: 'Missing recipient email (to)' }) };
  }

  if (!subject) {
    return { status: 400, body: JSON.stringify({ error: 'Missing subject' }) };
  }

  if (!user || !pass) {
    return {
      status: 500,
      body: JSON.stringify({
        error:
          'Gmail not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to .env, or use Open in Gmail.',
      }),
    };
  }

  try {
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });

    const attachments = [];
    if (input.pdfBase64 && input.pdfFilename) {
      attachments.push({
        filename: input.pdfFilename,
        content: Buffer.from(input.pdfBase64, 'base64'),
        contentType: 'application/pdf',
      });
    }

    await transport.sendMail({
      from: `"Collateral Review" <${user}>`,
      to,
      subject,
      text,
      html,
      attachments,
    });

    return { status: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { status: 502, body: JSON.stringify({ error: `Gmail send failed: ${msg}` }) };
  }
}
