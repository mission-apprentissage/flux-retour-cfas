import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { zMissionLocaleStatsCompteurs, zMissionLocaleStatsSegments } from "./missionLocaleStats.model";

const collectionName = "missionLocaleStatsPurges";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [[{ mission_locale_id: 1, mois: 1 }, { unique: true }]];

export const zMissionLocaleStatsPurges = z.object({
  _id: zObjectId,
  mission_locale_id: zObjectId.describe("Mission locale des dossiers supprimés"),
  mois: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .describe("Mois, en UTC comme les photos, de la création des dossiers supprimés"),
  stats: zMissionLocaleStatsCompteurs.describe("Contribution des dossiers supprimés aux photos de la mission locale"),
  segments: zMissionLocaleStatsSegments.describe("Contribution des dossiers supprimés aux segments des photos"),
  updated_at: z.date().describe("Date du dernier ajout"),
});

export type IMissionLocaleStatsPurges = z.output<typeof zMissionLocaleStatsPurges>;

export default { zod: zMissionLocaleStatsPurges, indexes, collectionName };
