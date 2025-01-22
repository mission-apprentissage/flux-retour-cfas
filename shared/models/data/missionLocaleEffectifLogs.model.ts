import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import zEffectifMissionLocale from "./missionLocaleEffectif.model";

const collectionName = "missionLocaleEffectifLogs";
const indexes: [IndexSpecification, CreateIndexesOptions][] = [];

const zMissionLocaleEffectifLogs = z.object({
  _id: zObjectId,
  created_at: z.date(),
  mission_locale_effectif_id: zObjectId,
  payload: zEffectifMissionLocale.zod.pick({
    situation: true,
    statut_correct: true,
    statut_reel: true,
    statut_reel_text: true,
    inscrit_france_travail: true,
    commentaires: true,
  }),
});

export type IMissionLocaleEffectifLogs = z.output<typeof zMissionLocaleEffectifLogs>;
export default { zod: zMissionLocaleEffectifLogs, indexes, collectionName };
