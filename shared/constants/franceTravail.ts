export const FRANCE_TRAVAIL_SITUATION_LABELS = {
  REORIENTATION: "Réorientation du jeune",
  ENTREPRISE: "Recherche d'entreprise",
  PAS_DE_RECONTACT: "Pas de recontact",
  EVENEMENT: "Événement",
  MISSION_LOCALE: "Orientation mission locale",
} as const;

export type FranceTravailSituationKey = keyof typeof FRANCE_TRAVAIL_SITUATION_LABELS;
