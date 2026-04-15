import { z } from "zod";

import { zAccConjointMotifEnum, zVerifiedInfo } from "../../../data/missionLocaleEffectif.model";

export const updateMissionLocaleEffectifOrganismeApi = {
  rupture: z.boolean(),
  acc_conjoint: z.boolean().optional(),
  motif: z.array(zAccConjointMotifEnum).optional(),
  commentaires: z.string().optional(),
  still_at_cfa: z.boolean().optional(),
  commentaires_par_motif: z.record(zAccConjointMotifEnum, z.string()).optional(),
  cause_rupture: z.string().optional(),
  referent_type: z.enum(["me", "other"]).optional(),
  referent_coordonnees: z.string().optional(),
  note_complementaire: z.string().optional(),
  verified_info: zVerifiedInfo.optional(),
};

export type IUpdateMissionLocaleEffectifOrganisme = z.output<
  z.ZodObject<typeof updateMissionLocaleEffectifOrganismeApi>
>;
