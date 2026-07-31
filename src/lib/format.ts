export function usd(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}

export function riskClass(score: number): string {
  if (score >= 70) return 'risk-high';
  if (score >= 50) return 'risk-med';
  return 'risk-low';
}

export function riskLabel(score: number): string {
  if (score >= 70) return 'High';
  if (score >= 50) return 'Medium';
  return 'Low';
}
