/** Paramètres d'une page hôte (ex. fiche CFA des stats) que les listes embarquées ne doivent pas effacer. */
const PARAMS_CONSERVES = ["tab", "from", "q", "ml_id"];

export function conserverParamsHote(
  source: { get(cle: string): string | null } | null | undefined,
  cible: URLSearchParams
) {
  PARAMS_CONSERVES.forEach((cle) => {
    const valeur = source?.get(cle);
    if (valeur && !cible.has(cle)) cible.set(cle, valeur);
  });
  return cible;
}
