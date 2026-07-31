/**
 * UAD 3.6 photo requirements vs zip image manifest.
 * Based on Fannie Mae / Freddie Mac UAD 3.6 Photo and Image Job Aid (public).
 * Site section: two street scene photos (East & West views; often named "street scene" in zip).
 */
import type { PhotoCheckItem } from '../types/Appraisal';

export interface PhotoManifestContext {
  imageNames: string[];
  xmlFields?: Record<string, string>;
  reportText?: string;
}

type ReqLevel = 'required' | 'conditional' | 'optional';

interface PhotoRule {
  id: string;
  section: string;
  label: string;
  requirement: ReqLevel;
  patterns: RegExp[];
  applies?: (ctx: PhotoManifestContext) => boolean;
  missingNote: string;
}

function isTruthy(val?: string): boolean {
  if (!val) return false;
  const v = val.toLowerCase();
  return v === 'true' || v === 'yes' || v === '1' || v === 'y';
}

function findMatch(images: string[], patterns: RegExp[]): string | undefined {
  for (const name of images) {
    const lower = name.toLowerCase();
    if (patterns.some((p) => p.test(lower))) return name;
  }
  return undefined;
}

function countMatches(images: string[], patterns: RegExp[]): string[] {
  return images.filter((name) => patterns.some((p) => p.test(name.toLowerCase())));
}

function parseAduCount(ctx: PhotoManifestContext): number {
  const raw = ctx.xmlFields?.['Accessory Dwelling Units'] ?? '';
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

function parseCompCountFromText(text: string): number {
  const matches = text.match(/Comp(?:arable)?\s*#?\s*(\d+)/gi) ?? [];
  const nums = matches.map((m) => parseInt(m.replace(/\D/g, ''), 10)).filter((n) => n > 0);
  return nums.length ? Math.max(...nums) : 0;
}

function isCondo(ctx: PhotoManifestContext): boolean {
  return isTruthy(ctx.xmlFields?.['Condominium']);
}

const STREET_SCENE = [/street.?scene/, /streetscene/, /street_scene/, /street-scene/];

function streetSceneChecks(images: string[]): PhotoCheckItem[] {
  const matches = countMatches(images, STREET_SCENE);

  if (matches.length >= 2) {
    return [
      {
        id: 'ph-street-1',
        section: 'Site',
        label: 'Street scene (1 of 2)',
        requirement: 'required',
        status: 'pass',
        matchedFile: matches[0],
        note: `Found: ${matches[0]}`,
      },
      {
        id: 'ph-street-2',
        section: 'Site',
        label: 'Street scene (2 of 2)',
        requirement: 'required',
        status: 'pass',
        matchedFile: matches[1],
        note: `Found: ${matches[1]}`,
      },
    ];
  }

  if (matches.length === 1) {
    return [
      {
        id: 'ph-street-1',
        section: 'Site',
        label: 'Street scene (1 of 2)',
        requirement: 'required',
        status: 'pass',
        matchedFile: matches[0],
        note: `Found: ${matches[0]}`,
      },
      {
        id: 'ph-street-2',
        section: 'Site',
        label: 'Street scene (2 of 2)',
        requirement: 'required',
        status: 'fail',
        note: 'Only 1 street scene in zip — 2 required (East & West views)',
      },
    ];
  }

  return [
    {
      id: 'ph-street-1',
      section: 'Site',
      label: 'Street scene (1 of 2)',
      requirement: 'required',
      status: 'fail',
      note: 'No files named street scene in zip',
    },
    {
      id: 'ph-street-2',
      section: 'Site',
      label: 'Street scene (2 of 2)',
      requirement: 'required',
      status: 'fail',
      note: 'No files named street scene in zip',
    },
  ];
}

const RULES: PhotoRule[] = [
  {
    id: 'ph-subject',
    section: 'Summary',
    label: 'Subject property photo',
    requirement: 'required',
    patterns: [/subject/, /property.?photo/, /^s[_-]?(front|01|1)/, /front.?elevation/],
    missingNote: 'Required per UAD 3.6 Summary section',
  },
  {
    id: 'ph-rear',
    section: 'Dwelling exterior',
    label: 'Rear elevation',
    requirement: 'conditional',
    patterns: [/rear/, /back.?elevation/, /rear.?elevation/],
    applies: (ctx) => !isCondo(ctx),
    missingNote: 'Typically required for detached SFR — verify',
  },
  {
    id: 'ph-adu',
    section: 'Unit interior',
    label: 'ADU / accessory unit interior photos',
    requirement: 'conditional',
    patterns: [/adu/, /accessory/, /in[- ]?law/, /guest.?unit/],
    applies: (ctx) => parseAduCount(ctx) > 0,
    missingNote: 'Separate ADU unit photos expected when ADU count > 0',
  },
  {
    id: 'ph-interior',
    section: 'Unit interior',
    label: 'Subject unit interior photos',
    requirement: 'conditional',
    patterns: [/interior/, /kitchen/, /bath/, /bedroom/, /living/],
    applies: (ctx) => isCondo(ctx),
    missingNote: 'Condominium — interior documentation expected',
  },
  {
    id: 'ph-cert',
    section: 'Assignment',
    label: 'Appraiser credentials / certification exhibit',
    requirement: 'optional',
    patterns: [/cert/, /credential/, /license/, /signature/, /seal/],
    missingNote: 'Optional unless required by engagement letter',
  },
];

export function checkPhotoManifest(ctx: PhotoManifestContext): PhotoCheckItem[] {
  const images = ctx.imageNames.filter(Boolean);
  const items: PhotoCheckItem[] = [];

  if (images.length === 0) {
    return [
      {
        id: 'ph-none',
        label: 'Image files in package',
        status: 'warn',
        note: 'No images found — upload UAD 3.6 ZIP or verify package contents',
        requirement: 'required',
        section: 'Package',
      },
    ];
  }

  items.push({
    id: 'ph-count',
    label: 'Image files in package',
    status: 'pass',
    note: `${images.length} file(s)`,
    requirement: 'required',
    section: 'Package',
  });

  for (const rule of RULES) {
    if (rule.applies && !rule.applies(ctx)) continue;

    const matched = findMatch(images, rule.patterns);
    let status: PhotoCheckItem['status'] = matched ? 'pass' : 'fail';
    if (!matched && rule.requirement === 'optional') status = 'warn';
    if (!matched && rule.requirement === 'conditional') status = 'warn';

    items.push({
      id: rule.id,
      label: rule.label,
      status,
      requirement: rule.requirement,
      section: rule.section,
      matchedFile: matched,
      note: matched ? `Found: ${matched}` : rule.missingNote,
    });
  }

  items.push(...streetSceneChecks(images));

  const compCount = parseCompCountFromText(ctx.reportText ?? '');
  const compImages = countMatches(images, [
    /^comp/,
    /comparable/,
    /sale[_-]?\d/,
    /comp[_-]?\d/,
    /c\d[_-]/,
  ]);

  const expectedComps = compCount > 0 ? compCount : 3;

  items.push({
    id: 'ph-comps',
    label: `Comparable sale photos (${expectedComps} expected)`,
    status:
      compImages.length >= expectedComps
        ? 'pass'
        : compImages.length > 0
          ? 'warn'
          : 'fail',
    requirement: 'required',
    section: 'Sales comparison',
    note:
      compImages.length > 0
        ? `Found ${compImages.length}: ${compImages.slice(0, 4).join(', ')}${compImages.length > 4 ? '…' : ''}`
        : 'No comp photo filenames detected in zip',
  });

  return items;
}

/** Merge zip manifest checks over AI photo checks when manifest data exists */
export function preferManifestPhotos(
  manifest: PhotoCheckItem[],
  fromAi: PhotoCheckItem[],
): PhotoCheckItem[] {
  if (manifest.length === 0) return fromAi;
  if (manifest.length === 1 && manifest[0].id === 'ph-none') return manifest;
  return manifest;
}
