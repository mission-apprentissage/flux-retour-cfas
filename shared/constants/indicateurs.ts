export const typesEffectifNominatif = [
  "apprenant",
  "apprenti",
  "inscritSansContrat",
  "rupturant",
  "abandon",
  "inconnu",
] as const;

export type TypeEffectifNominatif = (typeof typesEffectifNominatif)[number];
