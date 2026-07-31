import type { AppraisalDetail, AppraisalQueueItem } from '../types/Appraisal';

export const QUEUE_ITEMS: AppraisalQueueItem[] = [
  {
    id: 'uad-sfr-greenwich',
    collateralId: 'FSL-2026-0847',
    address: '14 Hemlock Lane',
    city: 'Greenwich',
    state: 'CT',
    assetClass: 'UHNW Residential',
    appraisedValue: 4_850_000,
    effectiveDate: '2026-06-15',
    reviewType: 'Initial Underwriting',
    amcVendor: 'ProTeck Valuation Services',
    status: 'Pending',
    formType: 'UAD 3.6 URAR',
  },
  {
    id: 'uad-2unit-hi',
    collateralId: 'FSL-2026-0912',
    address: '12345 Holiday Hwy',
    city: 'Surfside',
    state: 'HI',
    assetClass: '2-4 Unit',
    appraisedValue: 195_000,
    effectiveDate: '2019-10-05',
    reviewType: 'Initial Underwriting',
    amcVendor: 'Arthur Appraiser Appraisals',
    status: 'Pending',
    formType: 'UAD 3.6 URAR',
  },
  {
    id: 'uad-condo-ca',
    collateralId: 'FSL-2026-0881',
    address: 'Unit 1206, 500 Grammy Gold Blvd',
    city: 'Grammy Gold',
    state: 'CA',
    assetClass: 'Condominium',
    appraisedValue: 778_000,
    effectiveDate: '2023-08-15',
    reviewType: 'Initial Underwriting',
    amcVendor: 'Clear Capital AMC',
    status: 'Pending',
    formType: 'UAD 3.6 URAR',
  },
];

/** Based on Fannie/Freddie UAD 3.6 sample scenario structure (Summary section) */
const GREENWICH_UAD36 = `Uniform Residential Appraisal Report
14 HEMLOCK LANE, GREENWICH, CT 06830

SUMMARY
Opinion of Market Value $4,850,000    Market Value Condition As Is
Effective Date of Appraisal 06/15/2026
Assignment Reason Refinance
Borrower Name Redacted UHNW Client
Current Owner of Public Record Redacted UHNW Client
Contract Price —
Listing Status Not Listed

Property Valuation Method Traditional Appraisal    Appraiser Name James Whitfield, MAI

Property Description
Construction Method Site Built    Attachment Type Detached

Yes  No
Planned Unit Development (PUD)     [ ]  [X]
Condominium                        [ ]  [X]
Cooperative                        [ ]  [X]
Condop                             [ ]  [X]
Subject Site Owned in Common       [ ]  [X]
Units Excluding ADUs 1
Accessory Dwelling Units 0
Property Rights Appraised Fee Simple

Overall Quality Q1    Overall Condition C3

SUBJECT PROPERTY
Physical Address 14 Hemlock Lane, Greenwich, CT 06830

Dwelling Exterior — Room Summary (Unit 1)
Bedrooms 4    Baths - Full | Half 3 | 1
Finished Area 6,240 Sq. Ft.

SKETCH / FLOOR PLAN
Labels: 4 BR, 2 Full Bath, 1 Half Bath (no third full bath drawn)
GLA per sketch: 6,180 Sq. Ft.

PHOTOS — Subject Property
Front elevation: present
Rear elevation: MISSING
Street scene: present
Kitchen: present
Bathroom (full): shows 2 full baths in photos
Half bath: not photographed

CERTIFICATION
Appraiser: James Whitfield, MAI — CT Certified General #CG.0001234
Report signed: Yes    USPAP certification: Yes
Effective date within 120 days: Yes

FEMA Flood Zone (Site section): Zone X
Flood Certification on file: Zone AE`;

/** From GSE combined sample scenario PDF — 2-unit detached Hawaii property */
const HI_2UNIT_UAD36 = `Uniform Residential Appraisal Report
12345 HOLIDAY HWY, SURFSIDE, HI 12345

SUMMARY
Opinion of Market Value $195,000    Market Value Condition As Is
Effective Date of Appraisal 10/05/2019
Assignment Reason Purchase
Borrower Name Betty Borrower
Current Owner of Public Record Sydney Seller
Contract Price $160,000
Listing Status Pending

Property Valuation Method Traditional Appraisal    Appraiser Name Tom Appraiser

Property Description
Construction Method Site Built    Attachment Type Detached

Yes  No
Planned Unit Development (PUD)     [ ]  [X]
Condominium                        [ ]  [X]
Cooperative                        [ ]  [X]
Condop                             [ ]  [X]
Subject Site Owned in Common       [ ]  [X]
Units Excluding ADUs 2
Accessory Dwelling Units 0
Property Rights Appraised Fee Simple

Overall Quality Q5    Overall Condition C4

SUBJECT PROPERTY — Unit 1 Room Summary
Bedrooms 2    Baths - Full | Half 1 | 0    Finished Area 864 Sq. Ft.

SUBJECT PROPERTY — Unit 2 Room Summary
Bedrooms 2    Baths - Full | Half 1 | 0    Finished Area 864 Sq. Ft.

SKETCH
Unit 1: 2 BR, 1 Full Bath
Unit 2: 2 BR, 1 Full Bath

PHOTOS
Subject Property photo: present
Property Access (Street Scene): present
Rear elevation: not required for this scenario

CERTIFICATION
Appraiser: Tom Appraiser (Trainee) — HI #1111TRHI
Supervisory Appraiser: Arthur Appraiser — HI #987654HI
Report signed: Yes`;

const CONDO_UAD36 = `Uniform Residential Appraisal Report
UNIT 1206, 500 GRAMMY GOLD BLVD, GRAMMY GOLD, CA 90021

SUMMARY
Opinion of Market Value $778,000    Market Value Condition As Is
Effective Date of Appraisal 08/15/2023
Assignment Reason Purchase
Borrower Name Jane Condo-Buyer
Current Owner of Public Record Grammy Gold Seller LLC
Contract Price $775,000
Listing Status Settled

Property Valuation Method Traditional Appraisal    Appraiser Name Lisa Nguyen, MAI

Property Description
Construction Method Site Built    Attachment Type Attached

Yes  No
Planned Unit Development (PUD)     [ ]  [X]
Condominium                        [X]  [ ]
Cooperative                        [ ]  [X]
Condop                             [ ]  [X]
Subject Site Owned in Common       [X]  [ ]
Units Excluding ADUs 1
Accessory Dwelling Units 0
Property Rights Appraised Fee Simple

Overall Quality Q3    Overall Condition C3

SUBJECT PROPERTY — Unit Interior Room Summary
Bedrooms 2    Baths - Full | Half 2 | 1    Finished Area 1,420 Sq. Ft.

SKETCH
2 Bedrooms, 2 Full Baths, 1 Half Bath — matches room summary

PHOTOS
Subject Property photo: present
Unit interior: present
Comparable photos: Comp 2 front photo MISSING

CERTIFICATION
Appraiser: Lisa Nguyen, MAI — CA Certified General
Report signed: Yes    USPAP: Yes
Smoke/CO detectors noted in Unit Interior: No mention`;

export const APPRAISAL_DETAILS: Record<string, AppraisalDetail> = {
  'uad-sfr-greenwich': {
    ...QUEUE_ITEMS[0],
    reportText: GREENWICH_UAD36,
  },
  'uad-2unit-hi': {
    ...QUEUE_ITEMS[1],
    reportText: HI_2UNIT_UAD36,
  },
  'uad-condo-ca': {
    ...QUEUE_ITEMS[2],
    reportText: CONDO_UAD36,
  },
};

export function getAppraisal(id: string): AppraisalDetail | undefined {
  return APPRAISAL_DETAILS[id];
}
