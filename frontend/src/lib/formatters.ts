/**
 * Convert cents (integer) to display currency string
 * e.g. 1350000 → "13,500.00"
 */
export function formatCurrency(cents: number, currency = 'LKR'): string {
  return `${currency} ${(cents / 100).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Short currency without symbol
 */
export function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Parse a display value back to cents
 */
export function toCents(value: number | string): number {
  return Math.round(parseFloat(String(value)) * 100)
}

/**
 * Format date to "15 Jan 2026"
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format datetime to "15 Jan 2026 14:30"
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a relative date "2 hours ago"
 */
export function formatRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Format a number with commas
 */
export function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString('en-LK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Percentage from 0-100
 */
export function pct(value: number, total: number): number {
  if (total === 0) return 0
  return Math.min(100, Math.round((value / total) * 100))
}
