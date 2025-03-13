import zMissionLocaleEffectif, { zSituationEnum } from "shared/models/data/missionLocaleEffectif.model";
import { z } from "zod";

export const updateMissionLocaleEffectifApi = {
  situation: zSituationEnum,
  situation_autre: zMissionLocaleEffectif.zod.shape.situation_autre.optional(),
  commentaires: zMissionLocaleEffectif.zod.shape.commentaires.optional(),
  deja_connu: z.boolean(),
};

export type IUpdateMissionLocaleEffectif = z.output<z.ZodObject<typeof updateMissionLocaleEffectifApi>>;
