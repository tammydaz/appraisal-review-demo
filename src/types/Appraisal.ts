export type ReviewType = 'Initial Underwriting' | 'Annual Monitoring' | 'Regulatory Audit';
export type AssetClass = 'UHNW Residential' | 'Multifamily CRE' | 'Residential SFR' | 'Condominium' | '2-4 Unit';
export type ReviewStatus = 'Pending' | 'In Review' | 'Complete';
export type PhotoCheckStatus = 'pass' | 'fail' | 'warn';
export type FactualCategory =
  | 'bed_bath'
  | 'photos'
  | 'signature'
  | 'consistency'
  | 'required_field'
  | 'detector'
  | 'other';

/** Top section of reviewer form — populated from UAD 3.6 Summary (Appendix F-1 / FIDs 1.010–1.022) */
export interface ReviewHeader {
  reviewerName: string;
  reviewDate: string;
  borrowerName: string;
  sellerName: string;
  propertyAddress: string;
  city: string;
  state: string;
  zip: string;
  opinionOfMarketValue: number | null;
  effectiveDate: string;
  assignmentReason: string;
  contractPrice: number | null;
  listingStatus: string;
  propertyValuationMethod: string;
  constructionMethod: string;
  attachmentType: string;
  pud: boolean;
  condominium: boolean;
  cooperative: boolean;
  condop: boolean;
  subjectSiteOwnedInCommon: boolean;
  propertyOnNativeAmericanLands: boolean;
  unitsExcludingADUs: number | null;
  accessoryDwellingUnits: number | null;
  propertyRightsAppraised: string;
  overallQuality: string;
  overallCondition: string;
  marketValueCondition: string;
  appraiserName: string;
  amcVendor: string;
  formType: string;
  legacyFormEquivalent: string;
}

export interface FactualFlag {
  id: string;
  category: FactualCategory;
  title: string;
  detail: string;
  sources: string;
}

export interface PhotoCheckItem {
  id: string;
  label: string;
  status: PhotoCheckStatus;
  note?: string;
  /** UAD 3.6 Photo Job Aid */
  requirement?: 'required' | 'conditional' | 'optional';
  section?: string;
  matchedFile?: string;
}

export interface ExtractResult {
  header: ReviewHeader;
  factualFlags: FactualFlag[];
  photosCheck: PhotoCheckItem[];
}

export interface AppraisalQueueItem {
  id: string;
  collateralId: string;
  address: string;
  city: string;
  state: string;
  assetClass: AssetClass;
  appraisedValue: number;
  effectiveDate: string;
  reviewType: ReviewType;
  amcVendor: string;
  status: ReviewStatus;
  formType: string;
}

export interface AppraisalDetail extends AppraisalQueueItem {
  reportText: string;
}

export interface AppSettings {
  demoMode: boolean;
  apiKey: string;
  reviewerName: string;
  defaultRecipientEmail: string;
}

export const SETTINGS_KEY = 'collateral-review-settings';

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as AppSettings;
  } catch {
    /* ignore */
  }
  return { demoMode: true, apiKey: '', reviewerName: '', defaultRecipientEmail: '' };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export const CATEGORY_LABEL: Record<FactualCategory, string> = {
  bed_bath: 'Bed/Bath Count',
  photos: 'Photos',
  signature: 'Signature / Cert',
  consistency: 'Cross-Section',
  required_field: 'Required Field',
  detector: 'Safety / Detectors',
  other: 'Other',
};
