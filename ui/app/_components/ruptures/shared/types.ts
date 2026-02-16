import { IEffectifMissionLocale, IMissionLocaleEffectifList } from "shared";

export type UserType = "ORGANISME_FORMATION" | "MISSION_LOCALE" | "ADMINISTRATEUR";

export interface EffectifViewProps {
  effectif: IEffectifMissionLocale["effectif"];
  nomListe: IMissionLocaleEffectifList;
  isAdmin?: boolean;
  setIsEditable?: (isEditable: boolean) => void;
}
