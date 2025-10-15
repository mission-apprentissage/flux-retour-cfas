import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { zEffectif, zStatutApprenantEnum } from "./effectifs.model";
import { zAdresse } from "../parts/adresseSchema";

const collectionName = "franceTravailEffectif";

const indexes: [IndexSpecification, CreateIndexesOptions][] = []

export enum FRANCE_TRAVAIL_SITUATION_ENUM {
    REORIENTATION = "REORIENTATION",
    ENTREPRISE = "ENTREPRISE",
    PAS_DE_RECONTACT = "PAS_DE_RECONTACT",
    EVENEMENT = "EVENEMENT",
    MISSION_LOCALE = "MISSION_LOCALE",
}

export const zFranceTravailSituationEnum = z.nativeEnum(FRANCE_TRAVAIL_SITUATION_ENUM);

const zFranceTravailEffectif = z.object({
    _id: zObjectId,
    created_at: z.date(),
    updated_at: z.date().optional(),
    effectif_id: zObjectId,
    effectif_snapshot: zEffectif,
    effectif_snapshot_date: z.date().optional(),
    code_region: zAdresse.shape.region.optional(),
    current_status: z.object({
        value: zStatutApprenantEnum.nullish(),
        date: z.date().nullish(),
    }),
    ft_data: z.record(z.string(), z.object({
        situation: zFranceTravailSituationEnum,
        created_at: z.date(),
        commentaire: z.string().nullable(),
        created_by: zObjectId,
    }).nullable())
})

export type IFranceTravailEffectif = z.output<typeof zFranceTravailEffectif>;
export default { zod: zFranceTravailEffectif, indexes, collectionName };
