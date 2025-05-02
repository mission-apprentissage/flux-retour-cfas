import { z } from "zod";

import { zApiTypeEnum, zApiEffectifListeEnum } from "../../data/missionLocaleEffectif.model";

export const effectifsParMoisFiltersMissionLocaleSchema = {
  type: zApiTypeEnum,
};

export const effectifMissionLocaleListe = {
  nom_liste: zApiEffectifListeEnum,
};

export type IEffectifsParMoisFiltersMissionLocaleSchema = z.infer<
  z.ZodObject<typeof effectifsParMoisFiltersMissionLocaleSchema>
>;
