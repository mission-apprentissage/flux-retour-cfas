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
    date.getMonth() < AUGUST_MONTH_INDEX ? `${year - 1}-${year}` : `${year}-${year + 1}`,
  ];
};
