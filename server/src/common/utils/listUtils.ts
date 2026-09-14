/** Nombre d'éléments nommés par défaut avant de résumer le reste en « et N autres ». */
export const NB_ELEMENTS_NOMMES = 2;

/**
 * Formate une liste déjà tronquée, suivie du nombre d'éléments restants :
 * « ML A » / « ML A, ML B » / « ML A, ML B et 3 autres ».
 *
 * À utiliser quand le découpage est fait en amont (agrégation Mongo par exemple) ;
 * sinon passer par `formatListeTronquee`, qui découpe puis délègue ici.
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

/**
 * Tronque une liste complète aux `max` premiers éléments et résume le reste.
 * Les entrées vides sont ignorées avant le découpage, pour ne pas consommer une place.
 */
export function formatListeTronquee(elements: string[], max: number = NB_ELEMENTS_NOMMES): string {
  const cleaned = elements.filter(Boolean);
  const nommes = cleaned.slice(0, max);
  return formatListeAvecReste(nommes, cleaned.length - nommes.length);
}
