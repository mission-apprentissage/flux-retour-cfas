export const AGE_MIN_MISSION_LOCALE = 16;
export const AGE_MAX_MISSION_LOCALE = 26;

const yearsAgo = (years: number, now: Date) => {
  const date = new Date(now);
  date.setFullYear(date.getFullYear() - years);
  return date;
};

export function getBornesNaissanceMissionLocale(now: Date = new Date()) {
  return {
    nesApres: yearsAgo(AGE_MAX_MISSION_LOCALE, now),
    nesAvant: yearsAgo(AGE_MIN_MISSION_LOCALE, now),
  };
}

export function isAgeEligibleMissionLocale(
  dateDeNaissance: Date | string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!dateDeNaissance) return false;
  const naissance = new Date(dateDeNaissance);
  const { nesApres, nesAvant } = getBornesNaissanceMissionLocale(now);
  return naissance >= nesApres && naissance <= nesAvant;
}
