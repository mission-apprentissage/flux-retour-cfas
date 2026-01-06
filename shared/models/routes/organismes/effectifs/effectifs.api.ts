import { z } from "zod";

export const zGetEffectifsForOrganismeApi = {
  formation_libelle_long: z.array(z.string()).optional(),
  statut_courant: z.array(z.string()).optional(),
  annee_scolaire: z.array(z.string()).optional(),
  source: z.array(z.string()).optional(),
  search: z.string().optional(),
};
