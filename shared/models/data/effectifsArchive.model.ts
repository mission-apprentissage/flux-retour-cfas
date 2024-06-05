import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { MOTIF_SUPPRESSION } from "../../constants";

import { zEffectif } from "./effectifs.model";

const collectionName = "effectifsArchive";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [];

export const zEffectifArchive = zEffectif.extend({
  suppression: z.object({
    user_id: zObjectId.describe("Identifiant MongoDB de l'utilisateur responsable de la suppression").nullish(),
    motif: z.nativeEnum(MOTIF_SUPPRESSION),
    description: z.string().max(150).nullish(),
    date: z.date({ description: "Date de suppression" }),
  }),
});

export type IEffectifArchive = z.output<typeof zEffectifArchive>;

export default { zod: zEffectifArchive, indexes, collectionName };
