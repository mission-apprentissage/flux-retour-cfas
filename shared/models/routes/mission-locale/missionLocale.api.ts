import { z } from "zod";

import { STATUT_APPRENANT } from "../../../constants";
import { zApiSituationEnum, zApiTypeEnum } from "../../data/missionLocaleEffectif.model";
import { zBooleanStringSchema } from "../../parts/zodPrimitives";

export const effectifsFiltersMissionLocaleSchema = {
  statut: z
    .array(z.enum([STATUT_APPRENANT.ABANDON, STATUT_APPRENANT.RUPTURANT, STATUT_APPRENANT.INSCRIT]).optional())
    .optional(),
  rqth: zBooleanStringSchema.optional(),
  mineur: zBooleanStringSchema.optional(),
  niveaux: z.array(z.string()).optional(),
  code_adresse: z.array(z.string().regex(/^([0-9]{1}[0-9A-Z]{1}[0-9]{3})-([0-9]{5})$/)).optional(),
  search: z.string().optional(),
  situation: z.array(zApiSituationEnum.optional()).optional(),
  a_risque: zBooleanStringSchema.optional(),
  last_update_value: z.coerce.number().int().positive().optional(),
  last_update_order: z.enum(["BEFORE", "AFTER"]).optional(),
};

export type IEffectifsFiltersMissionLocale = z.infer<z.ZodObject<typeof effectifsFiltersMissionLocaleSchema>>;

export const effectifsParMoisFiltersMissionLocaleSchema = {
  type: zApiTypeEnum,
};

export type IEffectifsParMoisFiltersMissionLocaleSchema = z.infer<
  z.ZodObject<typeof effectifsParMoisFiltersMissionLocaleSchema>
>;
