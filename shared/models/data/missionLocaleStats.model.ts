import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "missionLocaleStats";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [[{ mission_locale_id: 1 }, { unique: true }]];
const zMissionLocaleStats = z.object({
  _id: zObjectId,
  created_at: z.date(),
  updated_at: z.date(),
  mission_locale_id: zObjectId,
  stats: z.object({
    a_traiter: z.number().int().default(0),
    traite: z.number().int().default(0),
    rdv_pris: z.number().int().default(0),
    nouveau_projet: z.number().int().default(0),
    deja_accompagne: z.number().int().default(0),
    contacte_sans_retour: z.number().int().default(0),
    coordonnees_incorrectes: z.number().int().default(0),
    autre: z.number().int().default(0),
    total: z.number().int().default(0),
    deja_connu: z.number().int().default(0),
    mineur: z.number().int().default(0),
    abandon: z.number().int().default(0),
  }),
});

export type IMissionLocaleStats = z.output<typeof zMissionLocaleStats>;

export interface IMissionLocaleWithStats {
  _id: string;
  code_postal: string;
  nom: string;
  activated_at?: string;
  stats: {
    a_traiter: number;
    traite: number;
    total: number;
    rdv_pris: number;
    nouveau_projet: number;
    deja_accompagne: number;
    contacte_sans_retour: number;
    coordonnees_incorrectes: number;
    autre: number;
    deja_connu: number;
  };
}

export default { zod: zMissionLocaleStats, indexes, collectionName };
