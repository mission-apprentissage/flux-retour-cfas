import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ formation_id: 1, "_computed.nom": 1, "_computed.prenom": 1, "_computed.date_de_naissance": 1 }, {}],
];

const collectionName = "effectifV2";

const zEffectifV2 = z.object({
  _id: zObjectId,
});

export type IEffectifV2 = z.output<typeof zEffectifV2>;
export default { zod: zEffectifV2, collectionName, indexes };
