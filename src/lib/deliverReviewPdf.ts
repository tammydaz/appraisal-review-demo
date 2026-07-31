import { buildReviewEmailContent } from './buildReviewEmail';
import { buildReviewPdfBase64, buildReviewPdfFile } from './buildReviewPdf';
import { sendReviewEmail } from './emailReview';
import type { ExtractResult, ReviewHeader } from '../types/Appraisal';

export type PdfDeliveryMethod = 'share' | 'server' | 'download';

function downloadPdfFile(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
}

/** Email/share review as PDF — iPhone uses Mail share sheet with attachment. */
export async function deliverReviewPdf(input: {
  header: ReviewHeader;
  result: ExtractResult;
  loanNumber?: string;
  collateralId?: string;
  recipient?: string;
}): Promise<{ method: PdfDeliveryMethod; filename: string }> {
  const options = {
    loanNumber: input.loanNumber,
    collateralId: input.collateralId,
  };
  const { subject, text, html } = buildReviewEmailContent(input.header, input.result, options);
  const { file, filename } = buildReviewPdfFile(input.header, input.result, options);

  const shareData: ShareData = {
    files: [file],
    title: subject,
    text: 'Appraisal review — top section (PDF attached)',
  };

  if (typeof navigator.share === 'function' && navigator.canShare?.(shareData)) {
    await navigator.share(shareData);
    return { method: 'share', filename };
  }

  const to = (input.recipient ?? '').trim();
  if (to) {
    const { base64 } = buildReviewPdfBase64(input.header, input.result, options);
    await sendReviewEmail({
      to,
      subject,
      text,
      html,
      pdfBase64: base64,
      pdfFilename: filename,
    });
    return { method: 'server', filename };
  }

  downloadPdfFile(file);
  return { method: 'download', filename };
}
