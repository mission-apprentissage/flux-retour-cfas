import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { zAdresse } from "../parts/adresseSchema";

import { zEffectif, zStatutApprenantEnum } from "./effectifs.model";

const collectionName = "franceTravailEffectif";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ code_region: 1 }, { name: "code_region" }],
  [{ code_region: 1, effectif_id: 1 }, { name: "code_region_effectif_id" }],
  [{ effectif_id: 1 }, { name: "effectif_id" }],
  [{ "current_status.value": 1, "current_status.date": 1 }, { name: "current_status" }],
];

export enum FRANCE_TRAVAIL_SITUATION_ENUM {
  REORIENTATION = "REORIENTATION",
  ENTREPRISE = "ENTREPRISE",
  PAS_DE_RECONTACT = "PAS_DE_RECONTACT",
  EVENEMENT = "EVENEMENT",
  MISSION_LOCALE = "MISSION_LOCALE",
  ERROR = "ERROR",
  FT_SERVICES = "FT_SERVICES",
}

export const zFranceTravailSituationEnum = z.nativeEnum(FRANCE_TRAVAIL_SITUATION_ENUM);

const franceTravailData = z.object({
  situation: zFranceTravailSituationEnum,
  created_at: z.date(),
  commentaire: z.string().nullable(),
  created_by: zObjectId,
});

const zFranceTravailEffectif = z.object({
  _id: zObjectId,
  soft_deleted: z.boolean().optional(),
  created_at: z.date(),
  updated_at: z.date().optional(),
  effectif_id: zObjectId,
  person_id: zObjectId.nullish(),
  effectif_snapshot: zEffectif,
  effectif_snapshot_date: z.date().optional(),
  code_region: zAdresse.shape.region.optional(),
  date_inscription: z.date().nullable().optional(),
  romes: z.object({
    code: z.array(z.string()),
    secteur_activites: z
      .array(
        z.object({
          code_secteur: z.number(),
          libelle_secteur: z.string(),
        })
      )
      .optional(),
  }),
  current_status: z.object({
    value: zStatutApprenantEnum.nullish(),
    date: z.date().nullish(),
  }),
  ft_data: z.record(z.string(), franceTravailData.nullable()),
});

export type IFranceTravailEffectif = z.output<typeof zFranceTravailEffectif>;
export default { zod: zFranceTravailEffectif, indexes, collectionName };
