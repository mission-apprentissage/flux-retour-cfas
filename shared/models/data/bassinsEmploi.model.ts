import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";

const collectionName = "bassinsEmploi";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ code_commune: 1 }, { name: "code_commune", unique: true }],
];

const zBassinEmploi = z
  .object({
    code_commune: z.string().describe("Code commune"),
    code_zone_emploi: z.string().describe("Code zone d'emploi"),
  })
  .nonstrict();

export type IBassinEmploi = z.output<typeof zBassinEmploi>;

export default { zod: zBassinEmploi, indexes, collectionName };
