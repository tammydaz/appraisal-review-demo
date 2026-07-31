import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PhotoManifestPanel from '../components/PhotoManifestPanel';
import { checkPhotoManifest, preferManifestPhotos } from '../lib/checkPhotoManifest';
import { extractUadPackage } from '../lib/extractUadPackage';
import { buildReviewEmailContent, mailComposeUrl } from '../lib/buildReviewEmail';
import { buildReviewPdfBase64 } from '../lib/buildReviewPdf';
import { sendReviewEmail } from '../lib/emailReview';
import { basicFactualChecks } from '../lib/basicFactualChecks';
import { extractFromReportLive } from '../lib/analyzeAppraisal';
import { delay, getDemoExtract } from '../lib/demoAnalysis';
import { fmtDate, usd } from '../lib/format';
import { HEADER_LABELS, UAD_SUMMARY_FIELD_GROUPS } from '../lib/uadSummaryFields';
import { APPRAISAL_DETAILS, getAppraisal } from '../lib/sampleAppraisals';
import { hasXmlHeaderFields, headerFromXmlFields } from '../lib/xmlToHeader';
import type { ExtractResult, PhotoCheckItem, ReviewHeader } from '../types/Appraisal';
import { CATEGORY_LABEL, loadSettings } from '../types/Appraisal';
import './Review.css';

function formatHeaderValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (key === 'opinionOfMarketValue' || key === 'contractPrice') {
    return typeof value === 'number' ? usd(value) : String(value);
  }
  if (key === 'effectiveDate' || key === 'reviewDate') {
    return typeof value === 'string' ? fmtDate(value) : String(value);
  }
  return String(value);
}

export default function Review() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isCustom = !id;
  const appraisal = id ? getAppraisal(id) : undefined;
  const loanFromUrl = searchParams.get('loan')?.trim() ?? '';

  const [loanNumber, setLoanNumber] = useState(
    () => loanFromUrl || appraisal?.collateralId || '',
  );
  const [loanCopied, setLoanCopied] = useState(false);

  const [text, setText] = useState(appraisal?.reportText ?? '');
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [header, setHeader] = useState<ReviewHeader | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [recipient, setRecipient] = useState(() => loadSettings().defaultRecipientEmail);
  const [emailStatus, setEmailStatus] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [uploadMeta, setUploadMeta] = useState('');
  const [photoManifest, setPhotoManifest] = useState<PhotoCheckItem[]>([]);
  const [packageImages, setPackageImages] = useState<string[]>([]);
  const [packageXml, setPackageXml] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFile = useCallback(async (file: File) => {
    setUploading(true);
    setError('');
    setResult(null);
    setHeader(null);

    try {
      const pkg = await extractUadPackage(file);
      setText(pkg.combinedText);
      setUploadMeta(`${file.name} — ${pkg.summary}`);
      setPackageImages(pkg.imageNames);
      setPackageXml(pkg.xmlFields);
      setPhotoManifest(
        checkPhotoManifest({
          imageNames: pkg.imageNames,
          xmlFields: pkg.xmlFields,
          reportText: pkg.combinedText,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read file');
      setUploadMeta('');
      setPhotoManifest([]);
      setPackageImages([]);
      setPackageXml({});
    } finally {
      setUploading(false);
    }
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleUploadFile(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleUploadFile(file);
  };

  useEffect(() => {
    if (appraisal) setText(appraisal.reportText);
    setResult(null);
    setHeader(null);
    setError('');
    setPhotoManifest([]);
    setPackageImages([]);
    setPackageXml({});
    setUploadMeta('');
  }, [appraisal]);

  const mergePhotos = useCallback(
    (extract: ExtractResult): ExtractResult => ({
      ...extract,
      photosCheck: preferManifestPhotos(
        checkPhotoManifest({
          imageNames: packageImages,
          xmlFields: packageXml,
          reportText: text,
        }),
        extract.photosCheck,
      ),
    }),
    [packageImages, packageXml, text],
  );

  const runExtract = useCallback(async () => {
    if (!text.trim()) {
      setError('Upload a UAD 3.6 ZIP/PDF or paste report text first.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setHeader(null);

    const cfg = loadSettings();

    try {
      if (cfg.demoMode && id && getDemoExtract(id)) {
        const steps = [
          'Reading UAD 3.6 Summary section…',
          'Extracting property type fields (FID 1.010–1.022)…',
          'Cross-checking bed/bath counts…',
          'Checking photo requirements…',
          'Building review form header…',
        ];
        for (const step of steps) {
          setLoadingStep(step);
          await delay(500);
        }
        const demo = getDemoExtract(id)!;
        demo.header.reviewerName = cfg.reviewerName || 'Reviewer';
        const merged = mergePhotos(demo);
        setResult(merged);
        setHeader({ ...merged.header });
        setPhotoManifest(merged.photosCheck);
      } else if (hasXmlHeaderFields(packageXml)) {
        setLoadingStep('Reading UAD 3.6 XML and running checks (browser-only)…');
        await delay(400);
        const headerFromXml = headerFromXmlFields(packageXml, cfg.reviewerName);
        const extract: ExtractResult = {
          header: headerFromXml,
          factualFlags: basicFactualChecks(text),
          photosCheck: [],
        };
        const merged = mergePhotos(extract);
        setResult(merged);
        setHeader({ ...merged.header });
        setPhotoManifest(merged.photosCheck);
      } else if (!cfg.demoMode) {
        setLoadingStep('Extracting Summary fields and running factual checks…');
        const live = await extractFromReportLive(
          text,
          cfg.reviewerName,
          cfg.apiKey || undefined,
        );
        live.header.reviewerName = cfg.reviewerName || live.header.reviewerName;
        const merged = mergePhotos(live);
        setResult(merged);
        setHeader({ ...merged.header });
        setPhotoManifest(merged.photosCheck);
      } else {
        setError(
          'Upload a UAD 3.6 ZIP (with XML), or turn off Demo Mode in Settings for pasted text / live AI.',
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  }, [text, id, mergePhotos, packageXml]);

  const reviewRef = () => ({ loanNumber: loanNumber.trim() || undefined, collateralId: appraisal?.collateralId });

  const copyHeader = async () => {
    if (!header) return;
    const prefix = loanNumber.trim() ? [`Loan Number: ${loanNumber.trim()}`, ''] : [];
    const lines = [
      ...prefix,
      ...UAD_SUMMARY_FIELD_GROUPS.flatMap((g) =>
        g.fields.map((f) => `${HEADER_LABELS[f] ?? f}: ${formatHeaderValue(f, header[f as keyof ReviewHeader])}`),
      ),
    ];
    await navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLoanNumber = async () => {
    if (!loanNumber.trim()) return;
    await navigator.clipboard.writeText(loanNumber.trim());
    setLoanCopied(true);
    setTimeout(() => setLoanCopied(false), 2000);
  };

  const updateHeader = (key: keyof ReviewHeader, value: string) => {
    if (!header) return;
    setHeader({ ...header, [key]: value });
  };

  const printPdf = () => {
    if (!header) return;
    window.print();
  };

  const openMailCompose = () => {
    if (!header || !result) return;
    const { subject, text } = buildReviewEmailContent(header, result, reviewRef());
    window.location.href = mailComposeUrl(recipient, subject, text);
  };

  const emailReview = async () => {
    if (!header || !result) return;
    if (!recipient.trim()) {
      setEmailStatus('Enter a recipient email address.');
      return;
    }

    setEmailSending(true);
    setEmailStatus('');

    const { subject, text, html } = buildReviewEmailContent(header, result, reviewRef());
    const { base64, filename } = buildReviewPdfBase64(header, result, reviewRef());

    try {
      await sendReviewEmail({
        to: recipient.trim(),
        subject,
        text,
        html,
        pdfBase64: base64,
        pdfFilename: filename,
      });
      setEmailStatus(`Sent to ${recipient.trim()} via iCloud Mail.`);
    } catch (err) {
      setEmailStatus(err instanceof Error ? err.message : 'Email failed');
    } finally {
      setEmailSending(false);
    }
  };

  const printTitle = loanNumber.trim() || appraisal?.collateralId || 'Custom Review';
  const printAddress = header
    ? [header.propertyAddress, header.city, header.state, header.zip].filter(Boolean).join(', ')
    : '';

  return (
    <div className="review-page">
      <header className="page-head no-print">
        <div>
          <Link to="/" className="back-link">
            ← Today&apos;s Work
          </Link>
          <h1>{printTitle}</h1>
          <p className="page-sub">
            UAD 3.6 Summary → Review Form (admin only · no value analysis)
          </p>
        </div>
        <div className="head-actions">
          {!isCustom && (
            <select
              className="sample-select"
              value={id}
              onChange={(e) => navigate(`/review/${e.target.value}`)}
            >
              {Object.values(APPRAISAL_DETAILS).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.collateralId} — {a.address}
                </option>
              ))}
            </select>
          )}
          <button className="btn btn-primary" onClick={runExtract} disabled={loading}>
            {loading ? 'Processing…' : 'Auto-Fill Review Header'}
          </button>
          {header && (
            <button className="btn btn-secondary" onClick={printPdf} type="button">
              Print / Save PDF
            </button>
          )}
        </div>
      </header>

      {error && <div className="alert alert-error no-print">{error}</div>}

      <div className="loan-bar no-print">
        <label className="loan-field">
          <span>Loan number (from MCP)</span>
          <input
            type="text"
            placeholder="Paste loan number once — used in email, PDF, and copy"
            value={loanNumber}
            onChange={(e) => setLoanNumber(e.target.value)}
          />
        </label>
        <button
          className="btn btn-sm"
          type="button"
          onClick={copyLoanNumber}
          disabled={!loanNumber.trim()}
        >
          {loanCopied ? 'Copied!' : 'Copy loan #'}
        </button>
      </div>

      {loading && (
        <div className="loading-panel no-print">
          <div className="spinner" />
          <p>{loadingStep}</p>
        </div>
      )}

      <div className="review-split">
        <section className="panel report-panel no-print">
          <h2>UAD 3.6 Report</h2>

          <div
            className={`pdf-upload ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.zip,application/pdf,application/zip,application/x-zip-compressed"
              className="pdf-upload-input"
              onChange={onFileInput}
            />
            {uploading ? (
              <p>Opening package…</p>
            ) : (
              <>
                <p className="pdf-upload-title">Upload UAD 3.6 ZIP or PDF</p>
                <p className="pdf-upload-hint">
                  ZIP: XML + PDF + images · PDF: report only
                </p>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose file
                </button>
                {uploadMeta && <p className="pdf-upload-name">Loaded: {uploadMeta}</p>}
              </>
            )}
          </div>

          <p className="report-or">or paste / edit text below</p>
          <textarea
            className="report-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste UAD 3.6 URAR report text (Summary section and below)…"
            spellCheck={false}
          />
        </section>

        <section className="panel findings-panel">
          <h2>Review Form — Top Section</h2>

          {!result && !loading && !header && photoManifest.length > 0 && (
            <PhotoManifestPanel items={photoManifest} />
          )}

          {!result && !loading && !header && photoManifest.length === 0 && (
            <div className="empty-state">
              <p>
                Click <strong>Auto-Fill Review Header</strong> to pull Summary page data into your
                review form.
              </p>
              <p className="empty-hint">
                AI extracts fields and flags factual inconsistencies only. You still do comp
                analysis and value review.
              </p>
            </div>
          )}

          {header && (
            <div className="findings-content">
              <div className="print-doc-header print-only">
                <h1>Appraisal Review — Top Section (UAD 3.6)</h1>
                <p>{printTitle}{printAddress ? ` · ${printAddress}` : ''}</p>
                <div className="print-doc-meta">
                  <span>
                    <strong>Reviewer:</strong> {header.reviewerName || '—'}
                  </span>
                  <span>
                    <strong>Review Date:</strong>{' '}
                    {header.reviewDate ? fmtDate(header.reviewDate) : '—'}
                  </span>
                  <span>
                    <strong>Form:</strong> {header.formType}
                  </span>
                </div>
              </div>

              <div className="form-header-actions no-print">
                <span className="form-note">Editable — verify before saving to MS systems</span>
                <div className="form-header-btns">
                  <button className="btn btn-sm" onClick={copyHeader}>
                    {copied ? 'Copied!' : 'Copy Header'}
                  </button>
                  <button className="btn btn-sm" onClick={printPdf} type="button">
                    Print / Save PDF
                  </button>
                </div>
              </div>

              <div className="email-bar no-print">
                <label className="email-field">
                  <span>To</span>
                  <input
                    type="email"
                    placeholder="barbara@… or richard@…"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                </label>
                <div className="email-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    type="button"
                    onClick={emailReview}
                    disabled={emailSending}
                  >
                    {emailSending ? 'Sending…' : 'Send Email + PDF'}
                  </button>
                  <button className="btn btn-sm" type="button" onClick={openMailCompose}>
                    Open in Mail
                  </button>
                </div>
                {emailStatus && (
                  <p className={`email-status ${emailStatus.startsWith('Sent') ? 'ok' : 'err'}`}>
                    {emailStatus}
                  </p>
                )}
              </div>

              {UAD_SUMMARY_FIELD_GROUPS.map((group) => (
                <div key={group.title} className="form-group">
                  <h3>{group.title}</h3>
                  <div className="form-grid">
                    {group.fields.map((field) => (
                      <label key={field} className="form-field">
                        <span>{HEADER_LABELS[field] ?? field}</span>
                        <input
                          type="text"
                          value={formatHeaderValue(field, header[field as keyof ReviewHeader])}
                          onChange={(e) =>
                            updateHeader(field as keyof ReviewHeader, e.target.value)
                          }
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {result && result.factualFlags.length > 0 && (
                <div className="section-block">
                  <h3>Factual Checks — Verify These</h3>
                  <p className="section-hint">
                    Pointed out for you to confirm. AI does not analyze comps or value.
                  </p>
                  <ul className="flag-list">
                    {result.factualFlags.map((f) => (
                      <li key={f.id} className={`flag flag-${f.category === 'bed_bath' || f.category === 'consistency' ? 'review' : 'info'}`}>
                        <span className="flag-sev">{CATEGORY_LABEL[f.category]}</span>
                        <div>
                          <strong>{f.title}</strong>
                          <p>{f.detail}</p>
                          <span className="flag-sources">{f.sources}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result && result.photosCheck.length > 0 && (
                <PhotoManifestPanel items={result.photosCheck} />
              )}

              <div className="print-footer print-only">
                Admin pre-fill only — factual checks require reviewer verification. Value analysis
                and comp review performed separately by licensed reviewer.
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
