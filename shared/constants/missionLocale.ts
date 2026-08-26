import { z } from "zod";

/** Seuil partagé : remontée en tête des listes ML côté serveur, sous-texte en orange côté UI. */
export const ML_DELAI_RELANCE_JOURS = 7;

/** Situation du dossier affichée côté ML, distincte de SITUATION_ENUM (retour du conseiller). */
export enum ML_SITUATION_DOSSIER {
  RUPTURE = "RUPTURE",
  PREVENTION_RUPTURE = "PREVENTION_RUPTURE",
  BESOIN_AIDE_HORS_RUPTURE = "BESOIN_AIDE_HORS_RUPTURE",
  ABANDON = "ABANDON",
  INSCRIT_SANS_CONTRAT = "INSCRIT_SANS_CONTRAT",
}

export const ML_SITUATION_DOSSIER_LABEL: Record<ML_SITUATION_DOSSIER, string> = {
  [ML_SITUATION_DOSSIER.RUPTURE]: "Rupture",
  [ML_SITUATION_DOSSIER.PREVENTION_RUPTURE]: "Prévention de rupture",
  [ML_SITUATION_DOSSIER.BESOIN_AIDE_HORS_RUPTURE]: "Besoin d'aide hors rupture",
  [ML_SITUATION_DOSSIER.ABANDON]: "Abandon",
  [ML_SITUATION_DOSSIER.INSCRIT_SANS_CONTRAT]: "Inscrit sans contrat",
};

export const zMlSituationDossier = z.nativeEnum(ML_SITUATION_DOSSIER);
export type IMlSituationDossier = z.infer<typeof zMlSituationDossier>;
