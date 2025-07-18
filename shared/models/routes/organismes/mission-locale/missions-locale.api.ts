import { z } from "zod";

import { zAccConjointMotifEnum } from "../../../data/missionLocaleEffectif.model";

export const updateMissionLocaleEffectifOrganismeApi = {
  rupture: z.boolean(),
  acc_conjoint: z.boolean().optional(),
  motif: z.array(zAccConjointMotifEnum).optional(),
  commentaires: z.string().optional(),
};

export type IUpdateMissionLocaleEffectifOrganisme = z.output<
  z.ZodObject<typeof updateMissionLocaleEffectifOrganismeApi>
>;
