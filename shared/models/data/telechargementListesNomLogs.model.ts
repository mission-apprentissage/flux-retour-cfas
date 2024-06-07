import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { typesEffectifNominatif } from "../../constants";

const collectionName = "telechargementListeNomLogs";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [];

export const zTelechargementListeNomLogs = z.object({
  _id: zObjectId.describe("Identifiant MongoDB du log"),
  type: z.enum(typesEffectifNominatif),
  effectifs: z.array(zObjectId),
  telechargement_date: z.date(),
  user_id: zObjectId,
  organisme_id: zObjectId.nullish(),
  organisation_id: zObjectId.nullish(),
});

export type ITelechargementListeNomLogs = z.output<typeof zTelechargementListeNomLogs>;
export default { zod: zTelechargementListeNomLogs, indexes, collectionName };
