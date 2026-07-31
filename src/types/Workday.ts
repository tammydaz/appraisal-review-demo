export type WorkdayStatus =
  | 'queued'
  | 'pulled'
  | 'admin_done'
  | 'value_done'
  | 'uploaded';

export interface WorkdayItem {
  id: string;
  loanNumber: string;
  notes: string;
  status: WorkdayStatus;
  addedAt: string;
}

export const WORKDAY_KEY = 'collateral-review-workday';

export const STATUS_LABEL: Record<WorkdayStatus, string> = {
  queued: 'From MCP',
  pulled: 'Pulled from Mercury',
  admin_done: 'Admin done',
  value_done: 'Value review done',
  uploaded: 'Uploaded to MS',
};

export function loadWorkday(): WorkdayItem[] {
  try {
    const raw = localStorage.getItem(WORKDAY_KEY);
    if (raw) return JSON.parse(raw) as WorkdayItem[];
  } catch {
    /* ignore */
  }
  return [];
}

export function saveWorkday(items: WorkdayItem[]): void {
  localStorage.setItem(WORKDAY_KEY, JSON.stringify(items));
}

export function newWorkdayItem(loanNumber: string): WorkdayItem {
  return {
    id: crypto.randomUUID(),
    loanNumber: loanNumber.trim(),
    notes: '',
    status: 'queued',
    addedAt: new Date().toISOString(),
  };
}
