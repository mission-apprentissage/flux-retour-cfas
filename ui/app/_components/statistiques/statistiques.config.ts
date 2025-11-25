const FIVE_MINUTES = 5 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

export const STATS_QUERY_CONFIG = {
  staleTime: FIVE_MINUTES,
  cacheTime: TEN_MINUTES,
  retry: 3,
  refetchOnWindowFocus: false,
} as const;

export const STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA = {
  ...STATS_QUERY_CONFIG,
  keepPreviousData: true,
} as const;

export const TRAITEMENT_SEGMENTS = [
  { key: "rdv_pris" as const, label: "RDV pris", color: "#6A6AF4" },
  { key: "nouveau_projet" as const, label: "Nouveau projet", color: "#18753C" },
  { key: "deja_accompagne" as const, label: "Accompagné", color: "#A558A0" },
  { key: "contacte_sans_retour" as const, label: "Sans retour", color: "#C8AA39" },
  { key: "injoignables" as const, label: "Injoignable", color: "#CE614A" },
  { key: "coordonnees_incorrectes" as const, label: "Coord. incorrectes", color: "#E1000F" },
  { key: "autre" as const, label: "Autre", color: "#929292" },
] as const;

export type TraitementSegmentKey = (typeof TRAITEMENT_SEGMENTS)[number]["key"];

export const STATS_LAUNCH_DATE_LABEL = "février 2025";
