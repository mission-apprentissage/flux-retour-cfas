export function addDaysUTC(date: Date, days: number) {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
  return result;
}

export function subtractDaysUTC(date: Date, days: number) {
  return addDaysUTC(date, -days);
}

export function subtractYearsUTC(date: Date, years: number) {
  const annee = date.getUTCFullYear() - years;
  const mois = date.getUTCMonth();
  const dernierJourDuMois = new Date(Date.UTC(annee, mois + 1, 0)).getUTCDate();
  return new Date(Date.UTC(annee, mois, Math.min(date.getUTCDate(), dernierJourDuMois)));
}

export function getYearFromDate(date?: Date | null): number | undefined {
  return date ? new Date(date).getFullYear() : undefined;
}

export function normalizeToUTCDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}
