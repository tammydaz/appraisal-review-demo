import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  loadWorkday,
  newWorkdayItem,
  saveWorkday,
  STATUS_LABEL,
  type WorkdayItem,
  type WorkdayStatus,
} from '../types/Workday';
import './Workday.css';
import './Queue.css';

export default function Workday() {
  const [items, setItems] = useState<WorkdayItem[]>(() => loadWorkday());
  const [draftLoan, setDraftLoan] = useState('');
  const [toast, setToast] = useState('');

  const persist = (next: WorkdayItem[]) => {
    setItems(next);
    saveWorkday(next);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const addLoan = () => {
    const loan = draftLoan.trim();
    if (!loan) return;
    if (items.some((i) => i.loanNumber === loan)) {
      showToast('Loan number already on the list');
      return;
    }
    persist([newWorkdayItem(loan), ...items]);
    setDraftLoan('');
  };

  const updateItem = (id: string, patch: Partial<WorkdayItem>) => {
    persist(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const removeItem = (id: string) => {
    persist(items.filter((i) => i.id !== id));
  };

  const copyLoan = async (loanNumber: string) => {
    await navigator.clipboard.writeText(loanNumber);
    showToast(`Copied ${loanNumber}`);
  };

  const clearDone = () => {
    persist(items.filter((i) => i.status !== 'uploaded'));
  };

  return (
    <div className="workday-page">
      <header className="page-head">
        <div>
          <h1>Today&apos;s Work</h1>
          <p className="page-sub">Replaces your Excel tracker · MCP → Mercury → review</p>
        </div>
        {items.some((i) => i.status === 'uploaded') && (
          <button className="btn btn-secondary btn-sm" type="button" onClick={clearDone}>
            Clear uploaded
          </button>
        )}
      </header>

      <p className="workday-intro">
        Open MCP, copy each loan number here once. Use <strong>Copy</strong> when you need it in
        Mercury, your MS review form, or email — no re-typing from Excel.
      </p>

      <div className="add-row no-print">
        <input
          type="text"
          placeholder="Paste loan number from MCP…"
          value={draftLoan}
          onChange={(e) => setDraftLoan(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addLoan()}
        />
        <button className="btn btn-primary" type="button" onClick={addLoan}>
          Add to today
        </button>
      </div>

      {items.length === 0 ? (
        <div className="workday-empty">
          No loans yet. Paste the first loan number from MCP above.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="queue-table">
            <thead>
              <tr>
                <th>Loan #</th>
                <th>Status</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="loan-cell">{item.loanNumber}</td>
                  <td>
                    <select
                      className="status-select"
                      value={item.status}
                      onChange={(e) =>
                        updateItem(item.id, { status: e.target.value as WorkdayStatus })
                      }
                    >
                      {(Object.keys(STATUS_LABEL) as WorkdayStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="notes-input"
                      placeholder="Borrower, address…"
                      value={item.notes}
                      onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                    />
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn btn-sm"
                        type="button"
                        onClick={() => copyLoan(item.loanNumber)}
                      >
                        Copy
                      </button>
                      <Link
                        to={`/review?loan=${encodeURIComponent(item.loanNumber)}`}
                        className="btn btn-sm btn-primary"
                      >
                        Review
                      </Link>
                      <button
                        className="btn btn-sm btn-secondary"
                        type="button"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toast && <div className="copy-toast">{toast}</div>}
    </div>
  );
}
