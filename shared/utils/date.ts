export function addDaysUTC(date: Date, days: number) {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
  return result;
}

export function substractDaysUTC(date: Date, days: number) {
  return addDaysUTC(date, -days);
}

export const getYearFromDate = (date?: Date | null): number | undefined => {
  return date ? new Date(date).getFullYear() : undefined;
};
