import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { zEffectif } from "./effectifs.model";
import { zEffectifDECA } from "./effectifsDECA.model";

const collectionName = "missionLocaleEffectif";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ mission_locale_id: 1, effectif_id: 1 }, { unique: true }],
];

export enum SITUATION_ENUM {
  RDV_PRIS = "RDV_PRIS",
  PAS_BESOIN_SUIVI = "PAS_BESOIN_SUIVI",
  CONTACTE_SANS_RETOUR = "CONTACTE_SANS_RETOUR",
  COORDONNEES_INCORRECT = "COORDONNEES_INCORRECT",
  AUTRE = "AUTRE",
}

export enum API_SITUATION_ENUM {
  NON_TRAITE = "NON_TRAITE",
}

export enum SITUATION_LABEL_ENUM {
  RDV_PRIS = "Rendez-vous pris à la Mission Locale",
  PAS_BESOIN_SUIVI = "Pas besoin de suivi",
  CONTACTE_SANS_RETOUR = "Contacté mais sans réponse",
  COORDONNEES_INCORRECT = "Coordonnées incorrectes",
  AUTRE = "Autre situation / retour",
}

export enum API_TRAITEMENT_TYPE {
  A_TRAITER = "A_TRAITER",
  TRAITE = "TRAITE",
}

export const zSituationEnum = z.nativeEnum(SITUATION_ENUM);
export const zApiTypeEnum = z.nativeEnum(API_TRAITEMENT_TYPE);

const zMissionLocaleEffectif = z.object({
  _id: zObjectId,
  mission_locale_id: zObjectId,
  effectif_id: zObjectId,
  situation: zSituationEnum.nullish(),
  situation_autre: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date().optional(),
  deja_connu: z.boolean().nullish(),
  commentaires: z.string().optional(),
  effectif_snapshot: zEffectif.or(zEffectifDECA),
  effectif_snapshot_date: z.date().optional(),
});

export type IMissionLocaleEffectif = z.output<typeof zMissionLocaleEffectif>;
export default { zod: zMissionLocaleEffectif, indexes, collectionName };
