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
  injoignables: COLOR_PALETTE.RED_LIGHT,
  coordonnees_incorrectes: COLOR_PALETTE.PINK_LIGHT,
  autre: COLOR_PALETTE.GREY_LIGHT,
} as const;

export const DOSSIERS_TRAITES_LABELS = {
  rdv_pris: "Rendez-vous pris",
  nouveau_projet: "Nouveau projet",
  contacte_sans_retour: "À recontacter",
  injoignables: "Injoignables",
  coordonnees_incorrectes: "Mauvaises coordonnées",
  autre: "Autre",
} as const;

export const RUPTURANTS_COLORS = {
  a_traiter: COLOR_PALETTE.ML_INACTIVE,
  traites: COLOR_PALETTE.GREEN_DARK,
} as const;

export const RUPTURANTS_LABELS = {
  a_traiter: "À traiter",
  traites: "Traités",
} as const;
