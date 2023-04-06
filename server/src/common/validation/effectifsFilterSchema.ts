import { z } from "zod";
import { ObjectId } from "mongodb";

const effectifsFilterSchema = () =>
  z.object({
    filter: z
      .object({
        organisme_id: z
          .preprocess((v: any) => (ObjectId.isValid(v) ? new ObjectId(v) : v), z.instanceof(ObjectId))
          .optional(),
        id_erp_apprenant: z.string().optional(),
        source: z.string().optional(),
        annee_scolaire: z.string().optional(),
      })
      .optional(),
  });

export default effectifsFilterSchema;
