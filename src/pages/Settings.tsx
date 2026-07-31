import { useState } from 'react';
import { loadSettings, saveSettings, type AppSettings } from '../types/Appraisal';
import './Settings.css';

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<AppSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-page">
      <header className="page-head">
        <div>
          <h1>Settings</h1>
          <p className="page-sub">Reviewer name, demo mode, and OpenAI key for live extract</p>
        </div>
      </header>

      <div className="settings-card">
        <div className="field">
          <label htmlFor="reviewerName">Reviewer Name</label>
          <p className="field-hint">Auto-fills on your review form header (e.g. Kim Keller)</p>
          <input
            id="reviewerName"
            type="text"
            className="text-input"
            placeholder="Your name"
            value={settings.reviewerName}
            onChange={(e) => update({ reviewerName: e.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="defaultRecipientEmail">Default Email Recipient</label>
          <p className="field-hint">Pre-fills the To field when emailing a review</p>
          <input
            id="defaultRecipientEmail"
            type="email"
            className="text-input"
            placeholder="colleague@gmail.com"
            value={settings.defaultRecipientEmail}
            onChange={(e) => update({ defaultRecipientEmail: e.target.value })}
          />
        </div>

        <label className="toggle-row">
          <div>
            <strong>Demo Mode</strong>
            <p>Instant extract from sample UAD 3.6 reports. No API key needed.</p>
          </div>
          <input
            type="checkbox"
            checked={settings.demoMode}
            onChange={(e) => update({ demoMode: e.target.checked })}
          />
        </label>

        <div className="field">
          <label htmlFor="apiKey">OpenAI API Key</label>
          <p className="field-hint">
            Only for live mode — extracts Summary fields and factual checks from pasted reports.
          </p>
          <input
            id="apiKey"
            type="password"
            className="text-input"
            placeholder="sk-..."
            value={settings.apiKey}
            onChange={(e) => update({ apiKey: e.target.value })}
            autoComplete="off"
          />
        </div>

        <div className="settings-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            Save Settings
          </button>
          {saved && <span className="saved-msg">Saved</span>}
        </div>
      </div>

      <div className="settings-info">
        <h2>Gmail setup (for Send Email + PDF)</h2>
        <ol>
          <li>Use a Gmail account with <strong>2-Step Verification</strong> turned on.</li>
          <li>
            Go to{' '}
            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">
              Google App Passwords
            </a>{' '}
            and create one for &quot;Mail&quot;.
          </li>
          <li>
            Copy <code>.env.example</code> to <code>.env</code> and set:
            <br />
            <code>GMAIL_USER=you@gmail.com</code>
            <br />
            <code>GMAIL_APP_PASSWORD=your 16-char app password</code>
          </li>
          <li>Restart <code>npm run dev</code>.</li>
        </ol>
        <p className="settings-sources">
          No Gmail config? Use <strong>Open in Gmail</strong> on the review page — opens Gmail
          compose in your browser with the review text (no PDF attachment).
        </p>
      </div>

      <div className="settings-info">
        <h2>What this tool does (and does not do)</h2>
        <ul>
          <li>
            <strong>Does:</strong> Pull UAD 3.6 Summary page into your review form top section;
            flag bed/bath mismatches, missing photos, unsigned reports, etc.
          </li>
          <li>
            <strong>Does not:</strong> Analyze comps, neighborhood, market, or value — that stays
            with the licensed reviewer.
          </li>
        </ul>
        <p className="settings-sources">
          UAD 3.6 field reference: Fannie Mae / Freddie Mac Uniform Appraisal Dataset documentation
          (Appendix F-1, Summary section FIDs 1.010–1.022).
        </p>
      </div>
    </div>
  );
}
