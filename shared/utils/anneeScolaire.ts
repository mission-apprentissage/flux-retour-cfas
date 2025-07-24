import { endOfYear, subYears } from "date-fns";
import { zonedTimeToUtc } from "date-fns-tz";

const AUGUST_MONTH_INDEX = 7;

/**
 * Returns an array of academic years between two dates
 * Academic years follow the format "YYYY-YYYY" and span from August 1 to July 31
 * For each calendar year, two entries are generated:
 * - "YYYY-YYYY" (the calendar year)
 * - "YYYY-(YYYY+1)" or "(YYYY-1)-YYYY" depending on where the date falls in the academic year
 *
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @returns Array of academic years in string format
 */
export function getAnneeScolaireListFromDateRange(startDate: Date, endDate: Date): string[] {
  const result = new Set<string>();

  // Get all calendar years in the range
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  // Add academic years for all dates in the range
  for (let year = startYear; year <= endYear; year++) {
    // Add the calendar year format (YYYY-YYYY)
    result.add(`${year}-${year}`);

    // Add academic year that starts in previous year if we're before August
    if (startDate.getMonth() < 7 || (startDate.getMonth() === 7 && startDate.getDate() === 0)) {
      if (year === startYear) {
        result.add(`${year - 1}-${year}`);
      }
    }

    // Add academic years for all intermediate years
    if (year > startYear && year < endYear) {
      result.add(`${year - 1}-${year}`);
      result.add(`${year}-${year + 1}`);
    }

    // Add academic year that starts in current year for the end date
    if (endDate.getMonth() >= 7 || (endDate.getMonth() === 7 && endDate.getDate() > 0)) {
      if (year === endYear) {
        result.add(`${year}-${year + 1}`);
      }
    }
  }

  // Convert to array and sort chronologically
  return Array.from(result).sort((a, b) => {
    const yearA = parseInt(a.split("-")[0]);
    const yearB = parseInt(b.split("-")[0]);
    return yearA - yearB;
  });
}

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
