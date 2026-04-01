import { IEffectifMissionLocale, SITUATION_ENUM } from "shared";

export const CONTACTED_SITUATIONS = new Set([
  SITUATION_ENUM.RDV_PRIS,
  SITUATION_ENUM.NOUVEAU_CONTRAT,
  SITUATION_ENUM.NOUVEAU_PROJET,
  SITUATION_ENUM.CHERCHE_CONTRAT,
  SITUATION_ENUM.REORIENTATION,
  SITUATION_ENUM.AUTRE,
  SITUATION_ENUM.DEJA_ACCOMPAGNE,
]);

export function isContactReussi(situation: SITUATION_ENUM): boolean {
  return CONTACTED_SITUATIONS.has(situation);
}

export type MlLog = NonNullable<IEffectifMissionLocale["effectif"]["mission_locale_logs"]>[number];

export function getSituationLogs(effectif: IEffectifMissionLocale["effectif"]) {
  return (effectif.mission_locale_logs || [])
    .filter((log) => log.situation)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function getCommentOnlyLogs(effectif: IEffectifMissionLocale["effectif"]) {
  return (effectif.mission_locale_logs || [])
    .filter((log) => !log.situation && !!log.commentaires)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}
