import { endOfYear, subYears } from "date-fns";

const AUGUST_MONTH_INDEX = 7;

/**
 * Renvoie l'année scolaire (août à août) et l'année calendaire (janvier à décembre)
 * pour une date donnée.
 * (utilisé pour le filtrage des effectifs)
 */
export const getAnneesScolaireListFromDate = (date: Date) => {
  const year = date.getFullYear();
  return [
    // année calendaire
    `${year}-${year}`,

    // année scolaire
    getAnneeScolaireFromDate(date),
  ];
};

/**
 * Renvoie l'année scolaire (août à août) pour une date donnée.
 */
export function getAnneeScolaireFromDate(date: Date): string {
  const year = date.getFullYear();
  return date.getMonth() < AUGUST_MONTH_INDEX ? `${year - 1}-${year}` : `${year}-${year + 1}`;
}

/**
 * Retourne la date de l'instantané SIFA. (exemple : 31 décembre 2023 si pendant l'année scolaire 2023-2024)
 */
export function getSIFADate(date: Date): Date {
  return date.getMonth() < AUGUST_MONTH_INDEX ? subYears(endOfYear(date), 1) : endOfYear(date);
}
