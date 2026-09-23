import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "missionLocaleStats";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ mission_locale_id: 1, computed_day: 1 }, { unique: true }],
  [{ computed_day: -1 }, {}],
  [{ computed_day: 1 }, { name: "computed_day_asc" }],
  [{ computed_day: -1, mission_locale_id: 1 }, { name: "computed_day_ml_id_desc" }],
  [{ mission_locale_id: 1, computed_day: -1 }, { name: "ml_id_computed_day_desc" }],
];
export const zSegmentStats = z.object({
  total: z.number().int(),
  a_traiter: z.number().int(),
  traite: z.number().int(),
  repondu: z.number().int(),
  rdv_pris: z.number().int(),
  rdv_pris_decouverts: z.number().int(),
  projet_pro_securise: z.number().int(),
  ne_souhaite_pas_accompagnement: z.number().int(),
  a_recontacter: z.number().int(),
  injoignable: z.number().int(),
  autre: z.number().int(),
  autre_avec_contact: z.number().int(),
  deja_connu_accompagne: z.number().int(),
});

export const zCollabSegmentStats = zSegmentStats.extend({
  situation_rupture: z.number().int(),
  situation_abandon: z.number().int(),
  situation_prevention_inevitable: z.number().int(),
  situation_prevention_tres_eleve: z.number().int(),
  situation_prevention_modere: z.number().int(),
  situation_besoin_aide_hors_rupture: z.number().int(),
  delai_premiere_activite_jours_total: z.number().int(),
  delai_premiere_activite_count: z.number().int(),
});

export const zMissionLocaleStatsSegments = z.object({
  rupture: zSegmentStats,
  collab: zCollabSegmentStats,
});

export type ISegmentStats = z.output<typeof zSegmentStats>;
export type ICollabSegmentStats = z.output<typeof zCollabSegmentStats>;
export type IMissionLocaleStatsSegments = z.output<typeof zMissionLocaleStatsSegments>;

const zMissionLocaleStats = z.object({
  _id: zObjectId,
  created_at: z.date(),
  updated_at: z.date().optional(),
  computed_day: z.date(),
  mission_locale_id: zObjectId,
  stats: z.object({
    a_traiter: z.number().int().default(0),
    traite: z.number().int().default(0),
    rdv_pris: z.number().int().default(0),
    rdv_pris_decouverts: z.number().int().default(0),
    nouveau_projet: z.number().int().default(0),
    deja_accompagne: z.number().int().default(0),
    contacte_sans_retour: z.number().int().default(0),
    injoignables: z.number().int().default(0),
    coordonnees_incorrectes: z.number().int().default(0),
    autre: z.number().int().default(0),
    cherche_contrat: z.number().int().default(0),
    reorientation: z.number().int().default(0),
    ne_veut_pas_accompagnement: z.number().int().default(0),
    ne_souhaite_pas_etre_recontacte: z.number().int().default(0),
    autre_avec_contact: z.number().int().default(0),
    total: z.number().int().default(0),
    deja_connu: z.number().int().default(0),
    mineur: z.number().int().default(0),
    mineur_a_traiter: z.number().int().default(0),
    mineur_traite: z.number().int().default(0),
    mineur_rdv_pris: z.number().int().default(0),
    mineur_nouveau_projet: z.number().int().default(0),
    mineur_deja_accompagne: z.number().int().default(0),
    mineur_contacte_sans_retour: z.number().int().default(0),
    mineur_injoignables: z.number().int().default(0),
    mineur_coordonnees_incorrectes: z.number().int().default(0),
    mineur_autre: z.number().int().default(0),
    mineur_cherche_contrat: z.number().int().default(0),
    mineur_reorientation: z.number().int().default(0),
    mineur_ne_veut_pas_accompagnement: z.number().int().default(0),
    mineur_ne_souhaite_pas_etre_recontacte: z.number().int().default(0),
    mineur_autre_avec_contact: z.number().int().default(0),
    rqth: z.number().int().default(0),
    rqth_a_traiter: z.number().int().default(0),
    rqth_traite: z.number().int().default(0),
    rqth_rdv_pris: z.number().int().default(0),
    rqth_nouveau_projet: z.number().int().default(0),
    rqth_deja_accompagne: z.number().int().default(0),
    rqth_contacte_sans_retour: z.number().int().default(0),
    rqth_injoignables: z.number().int().default(0),
    rqth_coordonnees_incorrectes: z.number().int().default(0),
    rqth_autre: z.number().int().default(0),
    rqth_cherche_contrat: z.number().int().default(0),
    rqth_reorientation: z.number().int().default(0),
    rqth_ne_veut_pas_accompagnement: z.number().int().default(0),
    rqth_ne_souhaite_pas_etre_recontacte: z.number().int().default(0),
    rqth_autre_avec_contact: z.number().int().default(0),
    abandon: z.number().int().default(0),
  }),
  segments: zMissionLocaleStatsSegments.optional(),
});

export type IMissionLocaleStats = z.output<typeof zMissionLocaleStats>;

export default { zod: zMissionLocaleStats, indexes, collectionName };
