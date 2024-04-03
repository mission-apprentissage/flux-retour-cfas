export function addDaysUTC(date: Date, days: number) {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
  return result;
}
