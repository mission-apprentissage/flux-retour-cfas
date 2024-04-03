import { endOfYear, subYears } from "date-fns";
import { zonedTimeToUtc } from "date-fns-tz";

const AUGUST_MONTH_INDEX = 7;

/**
 * Renvoie l'année scolaire (août à août) et l'année calendaire (janvier à décembre)
 * pour une date donnée.
 * (utilisé pour le filtrage des effectifs)
 */
export function getAnneesScolaireListFromDate(date: Date): string[] {
  const year = date.getUTCFullYear();
  return [
    // année calendaire
    `${year}-${year}`,

    // année scolaire
    getAnneeScolaireFromDate(date),
  ];
}

/**
 * Renvoie l'année scolaire (août à août) pour une date donnée.
 */
export function getAnneeScolaireFromDate(date: Date): string {
  const year = date.getUTCFullYear();
  return date.getUTCMonth() < AUGUST_MONTH_INDEX ? `${year - 1}-${year}` : `${year}-${year + 1}`;
}

/**
 * Retourne la date de l'instantané SIFA. (exemple : 31 décembre 2023 si pendant l'année scolaire 2023-2024)
 */
export function getSIFADate(date: Date): Date {
  return zonedTimeToUtc(
    date.getUTCMonth() < AUGUST_MONTH_INDEX ? subYears(endOfYear(date), 1) : endOfYear(date),
    "UTC"
  );
}

export function addDaysUTC(date: Date, days: number) {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
  return result;
}
