import zMissionLocaleEffectif from "shared/models/data/missionLocaleEffectif.model";
import { z } from "zod";

export const updateMissionLocaleEffectifApi = {
  effectif_id: z.string().regex(/^[0-9a-f]{24}$/),
  situation: zMissionLocaleEffectif.zod.shape.situation.optional(),
  statut_reel: zMissionLocaleEffectif.zod.shape.statut_reel.optional(),
  statut_reel_text: zMissionLocaleEffectif.zod.shape.statut_reel_text.optional(),
  inscrit_france_travail: zMissionLocaleEffectif.zod.shape.inscrit_france_travail.optional(),
  commentaires: zMissionLocaleEffectif.zod.shape.commentaires.optional(),
  statut_correct: z.boolean().optional(),
};

export type IUpdateMissionLocaleEffectif = z.output<z.ZodObject<typeof updateMissionLocaleEffectifApi>>;