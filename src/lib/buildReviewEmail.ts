import type { ExtractResult, ReviewHeader } from '../types/Appraisal';
import { HEADER_LABELS, UAD_SUMMARY_FIELD_GROUPS } from './uadSummaryFields';
import { fmtDate, usd } from './format';
import { CATEGORY_LABEL } from '../types/Appraisal';

function formatVal(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (key === 'opinionOfMarketValue' || key === 'contractPrice') {
    return typeof value === 'number' ? usd(value) : String(value);
  }
  if (key === 'effectiveDate' || key === 'reviewDate') {
    return typeof value === 'string' ? fmtDate(value) : String(value);
  }
  return String(value);
}

export function buildReviewEmailContent(
  header: ReviewHeader,
  result: ExtractResult,
  options?: { loanNumber?: string; collateralId?: string },
): { subject: string; text: string; html: string } {
  const loanNumber = options?.loanNumber?.trim();
  const collateralId = options?.collateralId?.trim();
  const title = loanNumber
    ? `Loan ${loanNumber}`
    : collateralId ?? 'Appraisal Review';
  const subject = `${title} — UAD 3.6 Review Top Section`;

  const headerLines: string[] = [];
  for (const group of UAD_SUMMARY_FIELD_GROUPS) {
    headerLines.push(`\n${group.title.toUpperCase()}`);
    headerLines.push('-'.repeat(40));
    for (const field of group.fields) {
      const label = HEADER_LABELS[field] ?? field;
      const val = formatVal(field, header[field as keyof ReviewHeader]);
      headerLines.push(`${label}: ${val}`);
    }
  }

  const flagLines =
    result.factualFlags.length > 0
      ? [
          '\nFACTUAL CHECKS — VERIFY',
          '-'.repeat(40),
          ...result.factualFlags.map(
            (f) =>
              `[${CATEGORY_LABEL[f.category]}] ${f.title}\n  ${f.detail}\n  Source: ${f.sources}`,
          ),
        ]
      : [];

  const photoLines =
    result.photosCheck.length > 0
      ? [
          '\nPHOTOS & CERTIFICATION',
          '-'.repeat(40),
          ...result.photosCheck.map(
            (p) => `${p.status === 'pass' ? '✓' : p.status === 'fail' ? '✗' : '!'} ${p.label}${p.note ? ` (${p.note})` : ''}`,
          ),
        ]
      : [];

  const text = [
    'APPRAISAL REVIEW — TOP SECTION (UAD 3.6)',
    loanNumber ? `Loan Number: ${loanNumber}` : '',
    'Admin pre-fill only. Value analysis performed separately by licensed reviewer.',
    '',
    ...headerLines,
    ...flagLines,
    ...photoLines,
  ].filter(Boolean).join('\n');

  const headerHtml = UAD_SUMMARY_FIELD_GROUPS.map(
    (group) => `
    <h3 style="margin:16px 0 8px;font-size:13px;color:#333;border-bottom:1px solid #ccc">${group.title}</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      ${group.fields
        .map(
          (field) => `
        <tr>
          <td style="padding:4px 8px 4px 0;color:#666;width:45%;vertical-align:top">${HEADER_LABELS[field] ?? field}</td>
          <td style="padding:4px 0;font-weight:500">${formatVal(field, header[field as keyof ReviewHeader])}</td>
        </tr>`,
        )
        .join('')}
    </table>`,
  ).join('');

  const flagsHtml =
    result.factualFlags.length > 0
      ? `<h3 style="margin:16px 0 8px;font-size:13px">Factual Checks — Verify</h3>
      <ul style="padding-left:0;list-style:none">
        ${result.factualFlags
          .map(
            (f) => `<li style="margin-bottom:10px;padding:8px;background:#f5f5f5;border-left:3px solid #c9a227">
              <strong>${CATEGORY_LABEL[f.category]}:</strong> ${f.title}<br/>
              <span style="color:#555;font-size:12px">${f.detail}</span><br/>
              <em style="font-size:11px;color:#888">${f.sources}</em>
            </li>`,
          )
          .join('')}
      </ul>`
      : '';

  const photosHtml =
    result.photosCheck.length > 0
      ? `<h3 style="margin:16px 0 8px;font-size:13px">Photos &amp; Certification</h3>
      <ul>${result.photosCheck.map((p) => `<li>${p.status === 'pass' ? '✓' : p.status === 'fail' ? '✗' : '!'} ${p.label}${p.note ? ` — ${p.note}` : ''}</li>`).join('')}</ul>`
      : '';

  const html = `<!DOCTYPE html><html><body style="font-family:Segoe UI,Arial,sans-serif;color:#111;max-width:640px;margin:0 auto;padding:16px">
    <h2 style="margin:0 0 4px;font-size:18px">Appraisal Review — Top Section</h2>
    <p style="margin:0 0 16px;color:#666;font-size:12px">${title} · UAD 3.6 · Admin pre-fill only</p>
    ${headerHtml}
    ${flagsHtml}
    ${photosHtml}
    <p style="margin-top:24px;font-size:11px;color:#888;border-top:1px solid #ddd;padding-top:8px">
      Value analysis and comp review performed separately by licensed reviewer.
    </p>
  </body></html>`;

  return { subject, text, html };
}

export function gmailComposeUrl(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: to.trim(),
    su: subject,
    body: body.slice(0, 8000),
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}
