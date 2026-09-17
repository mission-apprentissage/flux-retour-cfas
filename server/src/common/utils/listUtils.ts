export const NB_ELEMENTS_NOMMES = 2;

/**
 * « ML A, ML B et 3 autres ». Pour une liste déjà tronquée en amont (agrégation Mongo) ;
 * sinon passer par `formatListeTronquee`.
 */
export function formatListeAvecReste(nommes: string[], autres: number): string {
  const cleaned = nommes.filter(Boolean);
  if (cleaned.length === 0) {
    return "";
  }
  if (autres <= 0) {
    return cleaned.join(", ");
  }
  return `${cleaned.join(", ")} et ${autres} autre${autres > 1 ? "s" : ""}`;
}

/** Les entrées vides sont ignorées avant le découpage, pour ne pas consommer une place. */
export function formatListeTronquee(elements: string[], max: number = NB_ELEMENTS_NOMMES): string {
  const cleaned = elements.filter(Boolean);
  const nommes = cleaned.slice(0, max);
  return formatListeAvecReste(nommes, cleaned.length - nommes.length);
}
