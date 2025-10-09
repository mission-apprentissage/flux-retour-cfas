import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { zSituationEnum, zProblemeTypeEnum, zAccConjointMotifEnum } from "./missionLocaleEffectif.model";

const collectionName = "missionLocaleEffectifLog";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [[{ mission_locale_effectif_id: 1 }, {}]];

const zBase = z.object({
  _id: zObjectId,
  created_at: z.date(),
});

const zMissionLocaleEffectifMLLogCreate = z.object({
  type: z.literal("MISSION_LOCALE"),
  situation: zSituationEnum.nullish(),
  situation_autre: z.string().nullish(),
  deja_connu: z.boolean().nullish(),
  commentaires: z.string().nullish(),
  probleme_type: zProblemeTypeEnum.nullish(),
  probleme_detail: z.string().nullish(),
  created_by: zObjectId.nullish(),
  read_by: z.array(zObjectId).default([]).describe("Liste des IDs des utilisateurs CFA qui ont lu ce log"),
  mission_locale_effectif_id: zObjectId,
  mission_locale_effectif_2_id: zObjectId.nullish(),
});

const zMissionLocaleEffectifOrganismeLogCreate = z.object({
  type: z.literal("ORGANISME_FORMATION"),
  rupture: z.boolean({ description: "Indique si l'effectif est signalé en rupture par le CFA" }).nullish(),
  acc_conjoint: z
    .boolean({ description: "Indique si le CFA souhaite l'accompagnement conjoint pour cet effectif" })
    .nullish(),
  motif: z.array(zAccConjointMotifEnum).nullish(),
  commentaires: z.string().nullish(),
  //reponse_at: z.date({ description: "Date de réponse au formulaire par le CFA" }).nullish(),
  created_by: zObjectId.nullish(),
  mission_locale_effectif_id: zObjectId,
  mission_locale_effectif_2_id: zObjectId.nullish(),
});

const zMissionLocaleEffectifMLLog = zBase.merge(zMissionLocaleEffectifMLLogCreate);
const zMissionLocaleEffectifOrganismeLog = zBase.merge(zMissionLocaleEffectifOrganismeLogCreate);

export const zMissionLocaleEffectifLog = z.discriminatedUnion("type", [
  zMissionLocaleEffectifMLLog,
  zMissionLocaleEffectifOrganismeLog,
]);

export type IMissionLocaleEffectifLog = z.output<typeof zMissionLocaleEffectifLog>;
export default { zod: zMissionLocaleEffectifLog, indexes, collectionName };
