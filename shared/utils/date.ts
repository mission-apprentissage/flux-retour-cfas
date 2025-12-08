export function addDaysUTC(date: Date, days: number) {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
  return result;
}

export function subtractDaysUTC(date: Date, days: number) {
  return addDaysUTC(date, -days);
}

export function getYearFromDate(date?: Date | null): number | undefined {
  return date ? new Date(date).getFullYear() : undefined;
}

export function normalizeToUTCDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}
