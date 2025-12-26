import { calculatePercentage } from "shared/utils/stats";

export const COLOR_PALETTE = {
  GREY: "var(--text-default-grey)",
  SUCCESS: "var(--text-default-success)",
  ERROR: "var(--text-default-error)",
  ML_INACTIVE: "#E3E3FD",
  GREEN_DARK: "#18753C",
  GREEN_LIGHT: "#68A532",
  RED_DARK: "#CE0500",
  RED_LIGHT: "#F95C5E",
  PINK_LIGHT: "#FFB6B6",
  YELLOW: "#FFD666",
  GREY_LIGHT: "#C4C4C4",
  GREY_NEUTRAL: "#666666",
} as const;

export const COLORS = {
  GREY: COLOR_PALETTE.GREY,
  SUCCESS: COLOR_PALETTE.SUCCESS,
  ERROR: COLOR_PALETTE.ERROR,
} as const;

export { calculatePercentage };

export function getPercentageColor(current: number, previous: number): string {
  if (current === previous) return COLORS.GREY;
  return current > previous ? COLORS.SUCCESS : COLORS.ERROR;
}

export function getVariationColorFromString(variation: string): string {
  if (variation.startsWith("+")) return COLOR_PALETTE.GREEN_DARK;
  if (variation.startsWith("-")) return COLOR_PALETTE.RED_DARK;
  return COLOR_PALETTE.GREY_NEUTRAL;
}

export const DOSSIERS_TRAITES_COLORS = {
  rdv_pris: COLOR_PALETTE.GREEN_DARK,
  nouveau_projet: COLOR_PALETTE.GREEN_LIGHT,
  contacte_sans_retour: COLOR_PALETTE.YELLOW,
  deja_accompagne: "#6A6AF4",
  injoignables: COLOR_PALETTE.RED_LIGHT,
  coordonnees_incorrectes: COLOR_PALETTE.PINK_LIGHT,
  autre: COLOR_PALETTE.GREY_LIGHT,
} as const;

export const DOSSIERS_TRAITES_LABELS = {
  rdv_pris: "Rendez-vous pris",
  nouveau_projet: "Nouveau projet",
  contacte_sans_retour: "À recontacter",
  deja_accompagne: "Déjà suivi par le service public à l'emploi",
  injoignables: "Injoignables",
  coordonnees_incorrectes: "Mauvaises coordonnées",
  autre: "Autre",
} as const;

export const RUPTURANTS_COLORS = {
  a_traiter: COLOR_PALETTE.ML_INACTIVE,
  traites: "#00A95F",
} as const;

export const RUPTURANTS_LABELS = {
  a_traiter: "À traiter",
  traites: "Traités",
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
