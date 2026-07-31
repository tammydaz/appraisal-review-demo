import type { ReviewHeader } from '../types/Appraisal';

function emptyHeader(reviewerName: string): ReviewHeader {
  const today = new Date().toISOString().slice(0, 10);
  return {
    reviewerName,
    reviewDate: today,
    borrowerName: '',
    sellerName: '',
    propertyAddress: '',
    city: '',
    state: '',
    zip: '',
    opinionOfMarketValue: null,
    effectiveDate: '',
    assignmentReason: '',
    contractPrice: null,
    listingStatus: '',
    propertyValuationMethod: '',
    constructionMethod: '',
    attachmentType: '',
    pud: false,
    condominium: false,
    cooperative: false,
    condop: false,
    subjectSiteOwnedInCommon: false,
    propertyOnNativeAmericanLands: false,
    unitsExcludingADUs: null,
    accessoryDwellingUnits: null,
    propertyRightsAppraised: '',
    overallQuality: '',
    overallCondition: '',
    marketValueCondition: '',
    appraiserName: '',
    amcVendor: '',
    formType: 'UAD 3.6 URAR',
    legacyFormEquivalent: '',
  };
}

function pick(fields: Record<string, string>, ...labels: string[]): string {
  for (const label of labels) {
    const val = fields[label]?.trim();
    if (val) return val;
  }
  return '';
}

function parseMoney(raw: string): number | null {
  const n = Number(raw.replace(/[$,]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function parseIntField(raw: string): number | null {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function parseBool(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return v === 'true' || v === 'yes' || v === 'y' || v === '1';
}

function normalizeDate(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const d = new Date(trimmed);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return trimmed;
}

/** Build review header from UAD 3.6 XML fields (client-side, no API). */
export function headerFromXmlFields(
  xmlFields: Record<string, string>,
  reviewerName = '',
): ReviewHeader {
  const header = emptyHeader(reviewerName);

  header.borrowerName = pick(xmlFields, 'Borrower Name');
  header.sellerName = pick(xmlFields, 'Seller Name', 'Current Owner of Public Record');
  header.propertyAddress = pick(xmlFields, 'Address Line');
  header.city = pick(xmlFields, 'City');
  header.state = pick(xmlFields, 'State');
  header.zip = pick(xmlFields, 'ZIP');
  header.assignmentReason = pick(xmlFields, 'Assignment Reason');
  header.listingStatus = pick(xmlFields, 'Listing Status');
  header.propertyValuationMethod = pick(xmlFields, 'Property Valuation Method');
  header.constructionMethod = pick(xmlFields, 'Construction Method');
  header.attachmentType = pick(xmlFields, 'Attachment Type');
  header.propertyRightsAppraised = pick(xmlFields, 'Property Rights Appraised');
  header.overallQuality = pick(xmlFields, 'Overall Quality');
  header.overallCondition = pick(xmlFields, 'Overall Condition');
  header.marketValueCondition = pick(xmlFields, 'Market Value Condition');

  const valueRaw = pick(xmlFields, 'Opinion of Market Value');
  if (valueRaw) header.opinionOfMarketValue = parseMoney(valueRaw);

  const contractRaw = pick(xmlFields, 'Contract Price');
  if (contractRaw) header.contractPrice = parseMoney(contractRaw);

  const effectiveRaw = pick(xmlFields, 'Effective Date of Appraisal');
  if (effectiveRaw) header.effectiveDate = normalizeDate(effectiveRaw);

  const unitsRaw = pick(xmlFields, 'Units Excluding ADUs');
  if (unitsRaw) header.unitsExcludingADUs = parseIntField(unitsRaw);

  const aduRaw = pick(xmlFields, 'Accessory Dwelling Units');
  if (aduRaw) header.accessoryDwellingUnits = parseIntField(aduRaw);

  const pudRaw = pick(xmlFields, 'Planned Unit Development (PUD)');
  if (pudRaw) header.pud = parseBool(pudRaw);

  const condoRaw = pick(xmlFields, 'Condominium');
  if (condoRaw) header.condominium = parseBool(condoRaw);

  const coopRaw = pick(xmlFields, 'Cooperative');
  if (coopRaw) header.cooperative = parseBool(coopRaw);

  const condopRaw = pick(xmlFields, 'Condop');
  if (condopRaw) header.condop = parseBool(condopRaw);

  const commonRaw = pick(xmlFields, 'Subject Site Owned in Common');
  if (commonRaw) header.subjectSiteOwnedInCommon = parseBool(commonRaw);

  return header;
}

export function hasXmlHeaderFields(xmlFields: Record<string, string>): boolean {
  return Object.keys(xmlFields).length > 0;
}
