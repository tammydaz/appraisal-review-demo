import JSZip from 'jszip';
import { extractTextFromPdf, extractTextFromPdfBytes } from './extractPdfText';

const MAX_ZIP_BYTES = 50 * 1024 * 1024;

/** MISMO / UAD 3.6 XML element local names → readable labels */
const XML_FIELD_LABELS: Record<string, string> = {
  PropertyValuationMethodType: 'Property Valuation Method',
  ConstructionMethodType: 'Construction Method',
  AttachmentType: 'Attachment Type',
  LandOwnedInCommonIndicator: 'Subject Site Owned in Common',
  ProjectLegalStructureType: 'Project Legal Structure',
  LivingUnitExcludingADUCount: 'Units Excluding ADUs',
  LivingUnitExcludingAduCount: 'Units Excluding ADUs',
  AccessoryDwellingUnitTotalCount: 'Accessory Dwelling Units',
  PropertyEstateType: 'Property Rights Appraised',
  PropertyRightsAppraisedType: 'Property Rights Appraised',
  AppraisalReportEffectiveDate: 'Effective Date of Appraisal',
  AppraisalEffectiveDate: 'Effective Date of Appraisal',
  OpinionOfValueAmount: 'Opinion of Market Value',
  PropertyValuationAmount: 'Opinion of Market Value',
  BorrowerName: 'Borrower Name',
  PropertyOwnerName: 'Current Owner of Public Record',
  SellerName: 'Seller Name',
  AssignmentReasonType: 'Assignment Reason',
  SalesContractAmount: 'Contract Price',
  ContractPriceAmount: 'Contract Price',
  ListingStatusType: 'Listing Status',
  OverallQualityRatingCode: 'Overall Quality',
  OverallConditionRatingCode: 'Overall Condition',
  MarketValueConditionType: 'Market Value Condition',
  AddressLineText: 'Address Line',
  CityName: 'City',
  StateCode: 'State',
  PostalCode: 'ZIP',
  PlannedUnitDevelopmentIndicator: 'Planned Unit Development (PUD)',
  CondominiumIndicator: 'Condominium',
  CooperativeIndicator: 'Cooperative',
  CondopIndicator: 'Condop',
};

export interface UadPackageExtract {
  combinedText: string;
  summary: string;
  pdfName?: string;
  xmlName?: string;
  imageCount: number;
  imageNames: string[];
  xmlFields: Record<string, string>;
}

function isIgnoredPath(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.includes('__macosx') || lower.startsWith('.');
}

function parseUadXml(xmlString: string): Record<string, string> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  if (doc.querySelector('parsererror')) {
    return {};
  }

  const fields: Record<string, string> = {};
  const labelKeys = Object.keys(XML_FIELD_LABELS);
  const all = doc.getElementsByTagName('*');

  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    const local = (el.localName || el.tagName.split(':').pop() || '').trim();
    if (!local || el.children.length > 0) continue;

    const matchKey = labelKeys.find((k) => k.toLowerCase() === local.toLowerCase());
    if (!matchKey) continue;

    const val = (el.textContent ?? '').trim();
    if (!val) continue;

    const label = XML_FIELD_LABELS[matchKey];
    if (!fields[label]) fields[label] = val;
  }

  return fields;
}

function buildXmlSection(fields: Record<string, string>): string {
  if (Object.keys(fields).length === 0) return '';

  const lines = Object.entries(fields).map(([k, v]) => `${k}: ${v}`);
  return ['=== UAD 3.6 XML DATA (from package) ===', ...lines, ''].join('\n');
}

function buildImagesSection(names: string[]): string {
  if (names.length === 0) return '';

  return [
    `=== IMAGE FILES IN PACKAGE (${names.length}) ===`,
    ...names.map((n) => n.split('/').pop() ?? n),
    '',
  ].join('\n');
}

async function extractFromZip(file: File): Promise<UadPackageExtract> {
  if (file.size > MAX_ZIP_BYTES) {
    throw new Error('ZIP is too large (max 50 MB).');
  }

  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const paths = Object.keys(zip.files).filter((p) => !zip.files[p].dir && !isIgnoredPath(p));

  const pdfPaths = paths.filter((p) => p.toLowerCase().endsWith('.pdf'));
  const xmlPaths = paths.filter((p) => p.toLowerCase().endsWith('.xml'));
  const imagePaths = paths.filter((p) => /\.(jpe?g|png|gif|webp|tif{1,2})$/i.test(p));

  if (pdfPaths.length === 0 && xmlPaths.length === 0) {
    throw new Error('No PDF or XML found inside ZIP. Expected a UAD 3.6 submission package.');
  }

  let pdfName: string | undefined;
  let pdfText = '';

  if (pdfPaths.length > 0) {
    const sized = await Promise.all(
      pdfPaths.map(async (p) => ({
        path: p,
        size: (await zip.file(p)!.async('uint8array')).length,
      })),
    );
    sized.sort((a, b) => b.size - a.size);
    const mainPdf = sized[0].path;
    pdfName = mainPdf.split('/').pop();
    const pdfBytes = await zip.file(mainPdf)!.async('uint8array');
    try {
      pdfText = await extractTextFromPdfBytes(pdfBytes);
    } catch {
      pdfText = '';
    }
  }

  let xmlName: string | undefined;
  let xmlFields: Record<string, string> = {};

  if (xmlPaths.length > 0) {
    xmlPaths.sort((a, b) => b.length - a.length);
    xmlName = xmlPaths[0].split('/').pop();
    const xmlString = await zip.file(xmlPaths[0])!.async('string');
    xmlFields = parseUadXml(xmlString);
  }

  const imageNames = imagePaths.map((p) => p.split('/').pop() ?? p).sort();

  const parts: string[] = [];
  const xmlSection = buildXmlSection(xmlFields);
  if (xmlSection) parts.push(xmlSection);

  const imgSection = buildImagesSection(imagePaths);
  if (imgSection) parts.push(imgSection);

  if (pdfText) {
    parts.push('=== PDF REPORT TEXT ===', pdfText);
  } else if (Object.keys(xmlFields).length === 0) {
    throw new Error(
      'Could not read PDF text and no XML summary fields found. Try paste manually.',
    );
  }

  const bits: string[] = [];
  if (pdfName) bits.push(`PDF: ${pdfName}`);
  if (xmlName) bits.push(`XML: ${xmlName}`);
  if (imageNames.length) bits.push(`${imageNames.length} images`);

  return {
    combinedText: parts.join('\n'),
    summary: bits.join(' · ') || 'ZIP loaded',
    pdfName,
    xmlName,
    imageCount: imageNames.length,
    imageNames,
    xmlFields,
  };
}

export async function extractUadPackage(file: File): Promise<UadPackageExtract> {
  const name = file.name.toLowerCase();
  const isZip =
    file.type === 'application/zip' ||
    file.type === 'application/x-zip-compressed' ||
    name.endsWith('.zip');

  if (isZip) {
    return extractFromZip(file);
  }

  const isPdf =
    file.type === 'application/pdf' || name.endsWith('.pdf');

  if (isPdf) {
    const pdfText = await extractTextFromPdf(file);
    return {
      combinedText: pdfText,
      summary: `PDF: ${file.name}`,
      pdfName: file.name,
      imageCount: 0,
      imageNames: [],
      xmlFields: {},
    };
  }

  throw new Error('Please upload a UAD 3.6 ZIP package or PDF file.');
}
