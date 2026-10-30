export const formatDateYYYYMMDD = (date?: Date | null) => {
  if (!date) {
    return;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const DECALAGE_DATE_METIER_MS = 2 * 3600 * 1000;

export function jourMetier(date: Date): Date {
  const jour = new Date(new Date(date).getTime() + DECALAGE_DATE_METIER_MS);
  jour.setUTCHours(0, 0, 0, 0);
  return jour;
}

export function dateMetier(date: Date | null | undefined): string | null {
  return date instanceof Date ? jourMetier(date).toISOString().slice(0, 10) : null;
}
