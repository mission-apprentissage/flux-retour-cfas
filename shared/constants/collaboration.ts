import { SITUATION_ENUM } from "../models/data/missionLocaleEffectif.model";

/**
 * Date à partir de laquelle on commence à compter les événements de
 * collaboration CFA / Mission Locale (V2 TBA).
 */
export const COLLABORATION_CUTOFF_DATE = new Date("2026-01-01T00:00:00.000Z");

/**
 * Situations considérées comme une réponse du jeune (utilisé pour le KPI
 * "jeunes_repondus" et le détail d'export "reponse_jeune").
 */
export const REPONDU_SITUATIONS: ReadonlyArray<SITUATION_ENUM> = [
  SITUATION_ENUM.RDV_PRIS,
  SITUATION_ENUM.NOUVEAU_PROJET,
  SITUATION_ENUM.NE_VEUT_PAS_ACCOMPAGNEMENT,
  SITUATION_ENUM.NE_SOUHAITE_PAS_ETRE_RECONTACTE,
  SITUATION_ENUM.CHERCHE_CONTRAT,
  SITUATION_ENUM.REORIENTATION,
  SITUATION_ENUM.AUTRE,
];
