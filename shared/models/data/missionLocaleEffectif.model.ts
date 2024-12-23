import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "missionLocaleEffectif";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [];

export enum SITUATION_ENUM {
  CONTACTE_AVEC_SUIVI = "CONTACTE_AVEC_SUIVI",
  CONTACT_SANS_SUIVI = "CONTACT_SANS_SUIVI",
  DEJA_SUIVI = "DEJA_SUIVI",
  INJOIGNABLE = "INJOIGNABLE",
  NON_CONTACTE = "NON_CONTACTE",
}

const zMissionLocaleEffectif = z.object({
  _id: zObjectId,
  mission_locale_id: zObjectId,
  effectif_id: zObjectId,
  situation: z.nativeEnum(SITUATION_ENUM),
});

export type IMissionLocaleEffectif = z.output<typeof zMissionLocaleEffectif>;
export default { zod: zMissionLocaleEffectif, indexes, collectionName };
