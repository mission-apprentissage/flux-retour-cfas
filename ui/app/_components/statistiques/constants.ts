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
  deja_accompagne: "#6A6AF4",
  contacte_sans_retour: COLOR_PALETTE.YELLOW,
  injoignables: COLOR_PALETTE.RED_LIGHT,
  coordonnees_incorrectes: COLOR_PALETTE.PINK_LIGHT,
  autre: COLOR_PALETTE.GREY_LIGHT,
} as const;

export const DOSSIERS_TRAITES_LABELS = {
  rdv_pris: "Rendez-vous pris",
  nouveau_projet: "Nouveau projet",
  deja_accompagne: "Déjà suivi par le service public à l'emploi",
  contacte_sans_retour: "À recontacter",
  injoignables: "Injoignables",
  coordonnees_incorrectes: "Mauvaises coordonnées",
  autre: "Autre",
} as const;

export const DOSSIERS_TRAITES_DESCRIPTIONS = {
  rdv_pris:
    "La Mission Locale a réussi à contacter le jeune et à convenir d'un rendez-vous pour commencer ou poursuivre un accompagnement.",
  nouveau_projet:
    "Le jeune a un nouveau projet en cours. Soit il a retrouvé un nouveau contrat. Soit il est en cours de rescolarisation.\nCe jeune ne nécessite pas d'accompagnement de la Mission Locale.",
  deja_accompagne:
    "La Mission Locale a réussi à contacter le jeune et sait qu'il est déjà accompagné par le service public à l'emploi, soit dans la structure soit dans une autre (autre antenne MiLo ou France Travail).",
  contacte_sans_retour:
    "Le jeune a été contacté une fois par la Mission Locale mais n'a pas donné de réponse. La Mission Locale a prévu de relancer la démarche de contact d'ici peu.",
  injoignables:
    "La Mission Locale a tenté de contacter le jeune à plusieurs reprises et de différentes manières mais n'a jamais obtenu de réponse.\nElle marque ce dossier comme traité mais le jeune sera resté injoignable.",
  coordonnees_incorrectes:
    "La Mission Locale a tenté de contacter le jeune mais les coordonnées fournies par le CFA sont incorrectes et par conséquent ne lui permettent pas d'atteindre ce jeune.\nMalheureusement la Mission Locale n'a pas la possibilité de chercher d'autre moyen de le contacter.",
  autre:
    "NB : Cette catégorie de traitement de dossier a vocation à être supprimée dans la démarche d'amélioration continue du service du Tableau de bord de l'apprentissage.\nUne Mission Locale peut marquer un dossier comme traité avec le motif \"Autre\" (auquel s'ajoute parfois un commentaire). Ce motif couvre principalement des cas exceptionnels comme des déménagements, des décès, des situations socio-professionnelles trop spéciales.\nPour améliorer nos synthèses vous retrouvez actuellement la prise en compte de la raison pour limiter l'utilisation de cette catégorie \"Autre\".",
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

export const WHATSAPP_RESPONSE_COLORS = {
  callback: COLOR_PALETTE.GREEN_DARK,
  no_help: COLOR_PALETTE.YELLOW,
  no_response: COLOR_PALETTE.GREY_LIGHT,
  opted_out: COLOR_PALETTE.RED_DARK,
} as const;

export const WHATSAPP_RESPONSE_LABELS = {
  callback: "Demande de rappel",
  no_help: "Ne souhaite pas d'aide",
  no_response: "Pas de réponse",
  opted_out: "Désinscrit (STOP)",
} as const;

export const WHATSAPP_OUTCOMES_COLORS = {
  rdv_pris: COLOR_PALETTE.GREEN_DARK,
  nouveau_projet: COLOR_PALETTE.GREEN_LIGHT,
  deja_accompagne: "#6A6AF4",
  injoignable: COLOR_PALETTE.RED_LIGHT,
  coordonnees_incorrect: COLOR_PALETTE.PINK_LIGHT,
  autre: COLOR_PALETTE.GREY_LIGHT,
  en_attente: COLOR_PALETTE.GREY_NEUTRAL,
} as const;

export const WHATSAPP_OUTCOMES_LABELS = {
  rdv_pris: "RDV pris",
  nouveau_projet: "Nouveau projet",
  deja_accompagne: "Déjà accompagné",
  injoignable: "Injoignable",
  coordonnees_incorrect: "Coordonnées incorrectes",
  autre: "Autre",
  en_attente: "En attente de traitement",
} as const;

export const STATS_LAUNCH_DATE_LABEL = "février 2025";
