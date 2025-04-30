import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { zSituationEnum } from "./missionLocaleEffectif.model";

const collectionName = "missionLocaleEffectifLog";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [[{ mission_locale_effectif_id: 1 }, {}]];
const zMissionLocaleEffectifLog = z.object({
  _id: zObjectId,
  mission_locale_effectif_id: zObjectId,
  situation: zSituationEnum.nullish(),
  situation_autre: z.string().nullish(),
  deja_connu: z.boolean().nullish(),
  commentaires: z.string().nullish(),
  created_at: z.date(),
  created_by: zObjectId.nullish(),
});

export type IMissionLocaleEffectifLog = z.output<typeof zMissionLocaleEffectifLog>;
export default { zod: zMissionLocaleEffectifLog, indexes, collectionName };
