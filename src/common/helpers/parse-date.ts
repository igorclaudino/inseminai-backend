/**
 * Parses a date-only string (YYYY-MM-DD) as noon UTC to avoid timezone-induced
 * day rollback. e.g. "2025-02-01" → 2025-02-01T12:00:00.000Z instead of midnight.
 * Full ISO strings (containing "T") are passed through unchanged.
 */
export function parseDateString(dateStr: string): Date {
  if (dateStr.includes('T')) return new Date(dateStr);
  return new Date(`${dateStr}T12:00:00.000Z`);
}
