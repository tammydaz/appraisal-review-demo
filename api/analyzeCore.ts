export const EXTRACT_SYSTEM_PROMPT = `You are an administrative assistant for a licensed real estate appraisal REVIEWER at an investment bank. You do NOT analyze value, comps, neighborhood, or market trends.

Your ONLY jobs:
1. Extract fields from the UAD 3.6 URAR Summary section (and related header data) to populate the reviewer's form top section.
2. Flag factual INCONSISTENCIES for the reviewer to verify manually (bed/bath counts across sections, missing photos, unsigned report, flood zone mismatches, GLA mismatches, missing required fields, smoke/CO detector not mentioned).

DO NOT: recommend approve/revise, analyze comparable sales quality, opine on value, or draft value review memos.

Return ONLY valid JSON:
{
  "header": {
    "reviewerName": "from input or empty",
    "reviewDate": "YYYY-MM-DD today",
    "borrowerName": "",
    "sellerName": "",
    "propertyAddress": "",
    "city": "",
    "state": "",
    "zip": "",
    "opinionOfMarketValue": number or null,
    "effectiveDate": "YYYY-MM-DD",
    "assignmentReason": "",
    "contractPrice": number or null,
    "listingStatus": "",
    "propertyValuationMethod": "",
    "constructionMethod": "",
    "attachmentType": "",
    "pud": boolean,
    "condominium": boolean,
    "cooperative": boolean,
    "condop": boolean,
    "subjectSiteOwnedInCommon": boolean,
    "propertyOnNativeAmericanLands": boolean,
    "unitsExcludingADUs": number or null,
    "accessoryDwellingUnits": number or null,
    "propertyRightsAppraised": "",
    "overallQuality": "",
    "overallCondition": "",
    "marketValueCondition": "",
    "appraiserName": "",
    "amcVendor": "",
    "formType": "UAD 3.6 URAR",
    "legacyFormEquivalent": "e.g. 1004, 1073, 1025 based on property type"
  },
  "factualFlags": [{
    "id": "f1",
    "category": "bed_bath|photos|signature|consistency|required_field|detector|other",
    "title": "short title",
    "detail": "what to verify",
    "sources": "which sections compared"
  }],
  "photosCheck": [{
    "id": "p1",
    "label": "photo or cert item",
    "status": "pass|fail|warn",
    "note": "optional"
  }]
}

When a UAD 3.6 ZIP package is uploaded, prefer the "UAD 3.6 XML DATA" section for Summary fields. Use PDF text for bed/bath/sketch/photo cross-checks. The "IMAGE FILES IN PACKAGE" list helps verify required photos are present.

UAD 3.6 Summary property type fields (FID 1.010-1.022): Property Valuation Method, Construction Method, PUD, Condominium, Cooperative, Condop, Subject Site Owned in Common, Units Excluding ADUs, Accessory Dwelling Units.`;

export async function handleAnalyze(
  input: { text?: string; apiKey?: string; reviewerName?: string },
  env: { apiKey: string },
): Promise<{ status: number; body: string }> {
  const text = (input.text ?? '').trim();
  const apiKey = (input.apiKey ?? env.apiKey ?? '').trim();
  const reviewerName = (input.reviewerName ?? '').trim();

  if (!text) {
    return { status: 400, body: JSON.stringify({ error: 'Missing appraisal report text' }) };
  }

  if (!apiKey) {
    return {
      status: 500,
      body: JSON.stringify({
        error: 'No OpenAI API key. Add OPENAI_API_KEY to .env or Settings.',
      }),
    };
  }

  if (text.length > 50000) {
    return { status: 400, body: JSON.stringify({ error: 'Text too long (max 50,000 chars)' }) };
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: EXTRACT_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Reviewer name: ${reviewerName || '(not set)'}\nToday's date: ${new Date().toISOString().slice(0, 10)}\n\nExtract from this UAD 3.6 appraisal report:\n\n${text}`,
          },
        ],
        temperature: 0.2,
      }),
    });

    const raw = await upstream.json();

    if (!upstream.ok) {
      const msg =
        (raw as { error?: { message?: string } }).error?.message ?? 'OpenAI request failed';
      return { status: upstream.status, body: JSON.stringify({ error: msg }) };
    }

    const content = (raw as { choices?: { message?: { content?: string } }[] }).choices?.[0]
      ?.message?.content;

    if (!content) {
      return { status: 502, body: JSON.stringify({ error: 'Empty response from OpenAI' }) };
    }

    const parsed = JSON.parse(content) as Record<string, unknown>;
    if (reviewerName && parsed.header && typeof parsed.header === 'object') {
      (parsed.header as Record<string, unknown>).reviewerName = reviewerName;
    }
    return { status: 200, body: JSON.stringify(parsed) };
  } catch (err) {
    return { status: 502, body: JSON.stringify({ error: String(err) }) };
  }
}
