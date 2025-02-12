import { zSiret, zUai } from "api-alternance-sdk";
import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [
    {
      "certification.cfd": 1,
      "certification.rncp": 1,
      "responsable.siret": 1,
      "responsable.uai": 1,
      "formateur.siret": 1,
      "formateur.uai": 1,
    },
    {},
  ],
  [{ cle_ministere_educatif: 1 }, { unique: true, partialFilterExpression: { cle_ministere_educatif: { $ne: null } } }],
];

// TODO: unique cle_me
// TODO: unique cfd + rncp + formateur + responsable + code_postal

const collectionName = "formationV2";

const zFormationV2 = z.object({
  _id: zObjectId,
  cle_ministere_educatif: z.string().nullable(),

  responsable: z
    .object({
      siret: zSiret,
      uai: zUai.nullable(),
    })
    .nullable(),

  formateur: z
    .object({
      siret: zSiret,
      uai: zUai.nullable(),
    })
    .nullable(),

  certification: z.object({
    rncp: z.string().nullable(),
    cfd: z.string().nullable(),
  }),

  created_at: z.date(),
  updated_at: z.date(),
});

export type IFormationV2 = z.output<typeof zFormationV2>;
export default { zod: zFormationV2, collectionName, indexes };
