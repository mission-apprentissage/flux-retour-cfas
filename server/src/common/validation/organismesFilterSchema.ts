import { z } from "zod";

const organismesFilterSchema = () =>
  z.object({
    filter: z.object({ fiabilisation_statut: z.string().optional() }).optional(),
  });

export default organismesFilterSchema;
