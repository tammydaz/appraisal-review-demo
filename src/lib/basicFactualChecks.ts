import type { FactualFlag } from '../types/Appraisal';

/** Lightweight text checks — no AI, runs in the browser. */
export function basicFactualChecks(reportText: string): FactualFlag[] {
  const flags: FactualFlag[] = [];
  const text = reportText.toLowerCase();

  const bedMatches = [...reportText.matchAll(/\b(\d+)\s*(?:bed(?:room)?s?)\b/gi)].map((m) =>
    Number(m[1]),
  );
  const uniqueBeds = [...new Set(bedMatches)];
  if (uniqueBeds.length > 1) {
    flags.push({
      id: 'bf-bed',
      category: 'bed_bath',
      title: 'Bedroom count varies in report text',
      detail: `Found counts: ${uniqueBeds.join(', ')}. Verify Room Summary, sketch, and photos.`,
      sources: 'Report text scan',
    });
  }

  const bathMatches = [...reportText.matchAll(/\b(\d+(?:\.\d+)?)\s*(?:bath(?:room)?s?)\b/gi)].map(
    (m) => m[1],
  );
  const uniqueBaths = [...new Set(bathMatches)];
  if (uniqueBaths.length > 1) {
    flags.push({
      id: 'bf-bath',
      category: 'bed_bath',
      title: 'Bathroom count varies in report text',
      detail: `Found counts: ${uniqueBaths.join(', ')}. Verify Room Summary, sketch, and photos.`,
      sources: 'Report text scan',
    });
  }

  if (text.includes('smoke') && !text.includes('smoke detector') && !text.includes('smoke alarm')) {
    flags.push({
      id: 'bf-smoke',
      category: 'detector',
      title: 'Smoke detector not clearly mentioned',
      detail: 'Report mentions smoke but not smoke detector/alarm. Verify certification or comments.',
      sources: 'Report text scan',
    });
  }

  if (
    (text.includes('certificate') || text.includes('certification')) &&
    !text.includes('signed') &&
    !text.includes('signature')
  ) {
    flags.push({
      id: 'bf-sign',
      category: 'signature',
      title: 'Signed certification not found in text',
      detail: 'Could not find "signed" or "signature" near certification language. Verify PDF.',
      sources: 'Report text scan',
    });
  }

  return flags;
}
