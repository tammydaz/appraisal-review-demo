import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const MAX_PDF_BYTES = 25 * 1024 * 1024;

export async function extractTextFromPdfBytes(data: Uint8Array): Promise<string> {
  const pdf = await getDocument({ data }).promise;

  const parts: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (pageText) parts.push(pageText);
  }

  const text = parts.join('\n\n').trim();

  if (!text) {
    throw new Error(
      'No readable text in PDF. It may be scanned images only — paste text manually.',
    );
  }

  return text;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Please upload a PDF file.');
  }

  if (file.size > MAX_PDF_BYTES) {
    throw new Error('PDF is too large (max 25 MB).');
  }

  return extractTextFromPdfBytes(new Uint8Array(await file.arrayBuffer()));
}
