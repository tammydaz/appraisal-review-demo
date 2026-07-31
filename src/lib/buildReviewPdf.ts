import { jsPDF } from 'jspdf';
import type { ExtractResult, ReviewHeader } from '../types/Appraisal';
import { buildReviewEmailContent } from './buildReviewEmail';

export function buildReviewPdfBase64(
  header: ReviewHeader,
  result: ExtractResult,
  options?: { loanNumber?: string; collateralId?: string },
): { base64: string; filename: string } {
  const { text } = buildReviewEmailContent(header, result, options);
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const margin = 48;
  const lineHeight = 11;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  const lines = doc.splitTextToSize(text, maxWidth);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Appraisal Review — Top Section (UAD 3.6)', margin, margin);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let y = margin + 28;

  for (const line of lines) {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }

  const label =
    options?.loanNumber?.trim() ||
    options?.collateralId?.trim() ||
    'review';
  const filename = `${label.replace(/[^\w-]/g, '-')}-uad-review.pdf`;
  const base64 = doc.output('datauristring').split(',')[1] ?? '';
  return { base64, filename };
}

export function buildReviewPdfFile(
  header: ReviewHeader,
  result: ExtractResult,
  options?: { loanNumber?: string; collateralId?: string },
): { file: File; filename: string } {
  const { base64, filename } = buildReviewPdfBase64(header, result, options);
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: 'application/pdf' });
  return { file: new File([blob], filename, { type: 'application/pdf' }), filename };
}
