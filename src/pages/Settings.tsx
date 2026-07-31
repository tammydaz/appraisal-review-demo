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
            placeholder="colleague@company.com"
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
        <h2>iCloud Mail setup (for Send Email + PDF)</h2>
        <ol>
          <li>
            On your iPhone or at{' '}
            <a href="https://appleid.apple.com" target="_blank" rel="noreferrer">
              appleid.apple.com
            </a>
            , turn on <strong>Two-Factor Authentication</strong> for your Apple ID.
          </li>
          <li>
            Create an <strong>app-specific password</strong> (Sign-In and Security → App-Specific
            Passwords → generate one for &quot;Mail&quot;).
          </li>
          <li>
            In Vercel → Project → Settings → Environment Variables, set:
            <br />
            <code>ICLOUD_USER=you@icloud.com</code> (or @me.com / @mac.com)
            <br />
            <code>ICLOUD_APP_PASSWORD=your app-specific password</code>
          </li>
          <li>Redeploy after saving env vars.</li>
        </ol>
        <p className="settings-sources">
          No server mail config? Use <strong>Open in Mail</strong> on the review page — opens the
          Mail app on iPhone with the review text (attach PDF manually from Print / Save PDF).
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
