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
export function getAnneeScolaireListFromDateRange(start: Date, end: Date): string[] {
  const startMs = startOfDayUTC(start);
  const endExclusiveMs = addDaysUTC(startOfDayUTC(end), 1); // rend la fin inclusive

  const startYear = new Date(startMs).getUTCFullYear();
  const endYear = new Date(startOfDayUTC(end)).getUTCFullYear();

  type Entry = { label: string; startMs: number; endMs: number };
  const entries: Entry[] = [];

  // Années civiles candidates : [startYear .. endYear]
  for (let y = startYear; y <= endYear; y++) {
    const yStart = Date.UTC(y, 0, 1);
    const yEnd = Date.UTC(y + 1, 0, 1);
    if (overlaps(startMs, endExclusiveMs, yStart, yEnd)) {
      entries.push({ label: `${y}-${y}`, startMs: yStart, endMs: yEnd });
    }
  }

  // Années scolaires candidates : [startYear-1 .. endYear]
  for (let y = startYear - 1; y <= endYear; y++) {
    const sStart = Date.UTC(y, 7, 1); // 1er août
    const sEnd = Date.UTC(y + 1, 7, 1); // 1er août suivant
    if (overlaps(startMs, endExclusiveMs, sStart, sEnd)) {
      entries.push({ label: `${y}-${y + 1}`, startMs: sStart, endMs: sEnd });
    }
  }

  entries.sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
  return entries.map((e) => e.label);
}

function overlaps(aStart: number, aEndExclusive: number, bStart: number, bEndExclusive: number): boolean {
  // chevauchement sur intervalles [start, endExclusive)
  return bStart < aEndExclusive && bEndExclusive > aStart;
}

function startOfDayUTC(d: Date): number {
  // Normalise la date à minuit UTC du même "jour" (calendrier local de l’objet Date).
  // On reconstruit via les champs UTC pour rester cohérent quel que soit le timezone.
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function addDaysUTC(ms: number, days: number): number {
  return ms + days * 24 * 60 * 60 * 1000;
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
