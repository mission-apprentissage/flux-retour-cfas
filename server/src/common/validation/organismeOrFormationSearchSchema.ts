import { z } from "zod";

const organismeOrFormationSearchSchema = () =>
  z.object({
    searchTerm: z.string().min(3).optional(),
    etablissement_num_region: z.string().optional(),
    etablissement_num_departement: z.string().optional(),
    etablissement_reseaux: z.string().optional(),
  });

export default organismeOrFormationSearchSchema;
