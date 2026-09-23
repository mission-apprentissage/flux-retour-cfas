import { z } from "zod";

const organismesFilterSchema = () =>
  z.object({
    filter: z
      .object({
        fiabilisation_statut: z.string().optional(),
        ferme: z.preprocess(
          (v: unknown) => (v === "true" || v === true ? true : v === "false" || v === false ? false : undefined),
          z.boolean().optional()
        ),
        reseaux: z.string().optional(),
        uai: z.string().optional(),
        siret: z.string().optional(),
        nature: z.string().optional(),
      })
      .optional(),
  });

export default organismesFilterSchema;
