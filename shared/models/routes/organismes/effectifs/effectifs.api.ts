import { z } from "zod";

export const zGetEffectifsForOrganismeApi = {
  sifa: z.coerce.boolean().optional(),
  only_sifa_missing_fields: z.coerce.boolean().optional(),
  formation_libelle_long: z.array(z.string()).optional(),
  statut_courant: z.array(z.string()).optional(),
  annee_scolaire: z.array(z.string()).optional(),
  source: z.array(z.string()).optional(),
  search: z.string().optional(),
};

export type IGetEffectifsForOrganismeApi = z.infer<z.ZodObject<typeof zGetEffectifsForOrganismeApi>>;
