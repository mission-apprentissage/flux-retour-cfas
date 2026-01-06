export const typesEffectifNominatif = [
  "apprenant",
  "apprenti",
  "inscritSansContrat",
  "rupturant",
  "abandon",
  "inconnu",
] as const;

export type TypeEffectifNominatif = (typeof typesEffectifNominatif)[number];

export const ORGANISME_INDICATEURS_TYPE = {
  SANS_EFFECTIFS: "sans_effectifs",
  NATURE_INCONNUE: "nature_inconnue",
  SIRET_FERME: "siret_ferme",
  UAI_NON_DETERMINE: "uai_non_determine",
};

export const typesOrganismesIndicateurs = [
  ORGANISME_INDICATEURS_TYPE.SANS_EFFECTIFS as "sans_effectifs",
  ORGANISME_INDICATEURS_TYPE.NATURE_INCONNUE as "nature_inconnue",
  ORGANISME_INDICATEURS_TYPE.SIRET_FERME as "siret_ferme",
  ORGANISME_INDICATEURS_TYPE.UAI_NON_DETERMINE as "uai_non_determine",
] as const;

export type TypeOrganismesIndicateurs = (typeof typesOrganismesIndicateurs)[number];

export const typesAffelnet = ["affelnet_concretise", "affelnet", "affelnet_non_concretise"];

export const typesMissionLocale = ["ml_a_traiter", "ml_traite", "ml_injoignable"];

export const typesARML = ["arml"];

export const typesFranceTravail = ["ft_a_traiter", "ft_traite"];
