/**
 * UAD 3.6 Summary section field reference (public GSE documentation).
 * Source: Fannie Mae/Freddie Mac URAR Sample Scenarios, Appendix F-1,
 * "Functioning without Form Numbers" mapping doc (FIDs 1.010–1.022).
 */
export const UAD_SUMMARY_FIELD_GROUPS = [
  {
    title: 'Review Info',
    fields: ['reviewerName', 'reviewDate'],
  },
  {
    title: 'Assignment (Summary)',
    fields: [
      'borrowerName',
      'sellerName',
      'propertyAddress',
      'city',
      'state',
      'zip',
      'assignmentReason',
      'contractPrice',
      'listingStatus',
    ],
  },
  {
    title: 'Value & Dates',
    fields: ['opinionOfMarketValue', 'effectiveDate', 'marketValueCondition'],
  },
  {
    title: 'Property Type (FID 1.010–1.022)',
    fields: [
      'propertyValuationMethod',
      'constructionMethod',
      'attachmentType',
      'pud',
      'condominium',
      'cooperative',
      'condop',
      'subjectSiteOwnedInCommon',
      'propertyOnNativeAmericanLands',
      'unitsExcludingADUs',
      'accessoryDwellingUnits',
      'propertyRightsAppraised',
    ],
  },
  {
    title: 'Quality / Condition',
    fields: ['overallQuality', 'overallCondition'],
  },
  {
    title: 'Report / Vendor',
    fields: ['appraiserName', 'amcVendor', 'formType', 'legacyFormEquivalent'],
  },
] as const;

export const HEADER_LABELS: Record<string, string> = {
  reviewerName: 'Reviewer Name',
  reviewDate: 'Review Date',
  borrowerName: 'Borrower Name',
  sellerName: 'Seller Name',
  propertyAddress: 'Property Address',
  city: 'City',
  state: 'State',
  zip: 'ZIP',
  opinionOfMarketValue: 'Opinion of Market Value',
  effectiveDate: 'Effective Date of Appraisal',
  assignmentReason: 'Assignment Reason',
  contractPrice: 'Contract Price',
  listingStatus: 'Listing Status',
  propertyValuationMethod: 'Property Valuation Method',
  constructionMethod: 'Construction Method',
  attachmentType: 'Attachment Type',
  pud: 'Planned Unit Development (PUD)',
  condominium: 'Condominium',
  cooperative: 'Cooperative',
  condop: 'Condop',
  subjectSiteOwnedInCommon: 'Subject Site Owned in Common',
  propertyOnNativeAmericanLands: 'Property on Native American Lands',
  unitsExcludingADUs: 'Units Excluding ADUs',
  accessoryDwellingUnits: 'Accessory Dwelling Units',
  propertyRightsAppraised: 'Property Rights Appraised',
  overallQuality: 'Overall Quality',
  overallCondition: 'Overall Condition',
  marketValueCondition: 'Market Value Condition',
  appraiserName: 'Appraiser Name',
  amcVendor: 'AMC Vendor',
  formType: 'Form Type',
  legacyFormEquivalent: 'Legacy Form Equivalent',
};
