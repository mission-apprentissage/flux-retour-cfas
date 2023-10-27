import { z } from "zod";

import { IModelDescriptor, zObjectId } from "./common";

export const romeSchema = z
  .object({
    code: z.string().describe("Code ROME"),
    label_fiche: z.string().describe("Label fiche métier"),
    label_domaine: z.string().describe("Label domaine professionnel"),
    label_famille: z.string().describe("Label famille de métier"),
  })
  .strict();

export type IRome = z.output<typeof romeSchema>;

export default {
  collectionName: "rome",
  indexes: [[{ code: 1 }, { unique: true }]],
  zod: romeSchema.merge(z.object({ _id: zObjectId })).strict(),
} as IModelDescriptor;
