import { z } from "zod";

import { zApiEffectifListeEnum } from "../../data/missionLocaleEffectif.model";

export const effectifsParMoisFiltersMissionLocaleAPISchema = {
  type: z.array(zApiEffectifListeEnum),
  month: z
    .string()
    .regex(/^(\d{4}-\d{2}(-\d{2})?|plus-de-180-j)$/, "Month must be in format YYYY-MM, YYYY-MM-DD or 'plus-de-180-j'")
    .optional(),
};

export const effectifsParMoisFiltersMissionLocaleSchema = {
  type: zApiEffectifListeEnum,
  month: z
    .string()
    .regex(/^(\d{4}-\d{2}(-\d{2})?|plus-de-180-j)$/, "Month must be in format YYYY-MM, YYYY-MM-DD or 'plus-de-180-j'")
    .optional(),
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
