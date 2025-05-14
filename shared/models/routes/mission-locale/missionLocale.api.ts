import { z } from "zod";

import { zApiEffectifListeEnum } from "../../data/missionLocaleEffectif.model";

export const effectifsParMoisFiltersMissionLocaleAPISchema = {
  type: z.array(zApiEffectifListeEnum),
};

export const effectifsParMoisFiltersMissionLocaleSchema = {
  type: zApiEffectifListeEnum,
};

export const effectifMissionLocaleListe = {
  nom_liste: zApiEffectifListeEnum,
};

export type IEffectifsParMoisFiltersMissionLocaleAPISchema = z.infer<
  z.ZodObject<typeof effectifsParMoisFiltersMissionLocaleAPISchema>
>;

export type IEffectifsParMoisFiltersMissionLocaleSchema = z.infer<
  z.ZodObject<typeof effectifsParMoisFiltersMissionLocaleSchema>
>;
