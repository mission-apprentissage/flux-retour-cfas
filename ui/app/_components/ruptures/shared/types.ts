import { IEffecifMissionLocale, IMissionLocaleEffectifList } from "shared";

export type UserType = "ORGANISME_FORMATION" | "MISSION_LOCALE" | "ADMINISTRATEUR";

export interface EffectifViewProps {
  effectif: IEffecifMissionLocale["effectif"];
  nomListe: IMissionLocaleEffectifList;
  isAdmin?: boolean;
  setIsEditable?: (isEditable: boolean) => void;
}

export interface BaseFormProps {
  effectifId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export interface HistoryDisplayProps {
  situation: any;
  lastContactDate?: Date | string;
}
