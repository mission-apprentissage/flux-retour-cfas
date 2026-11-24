import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "missionLocaleEffectifsPurgesStats";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [
    { type: 1, mission_locale_id: 1, organisme_id: 1, region: 1, departement: 1, mois: 1 },
    { unique: true, name: "dimensions" },
  ],
];

export const COMPTEURS_PURGES_ML = {
  suivi: ["dossiers", "v2_dossiers"],
  collab: [
    "envoyes",
    "contactes",
    "traitees",
    "resultat_rdv_pris",
    "resultat_projet_pro_securise",
    "resultat_ne_souhaite_pas_accompagnement",
    "resultat_injoignable",
    "resultat_autre",
    "repondus",
    "deja_connus",
    "delai_total",
    "delai_count",
    "situation_rupture",
    "situation_abandon",
    "situation_prevention_inevitable",
    "situation_prevention_tres_eleve",
    "situation_prevention_modere",
    "situation_besoin_aide_hors_rupture",
    "objectif_mobilite",
    "objectif_logement",
    "objectif_sante",
    "objectif_finance",
    "objectif_administratif",
    "objectif_social_familial",
    "objectif_reorientation",
    "objectif_recherche_emploi",
    "objectif_autre",
    "ages_ml_envoyes",
    "ages_ml_objectif_mobilite",
    "ages_ml_objectif_logement",
    "ages_ml_objectif_sante",
    "ages_ml_objectif_finance",
    "ages_ml_objectif_administratif",
    "ages_ml_objectif_social_familial",
    "ages_ml_objectif_reorientation",
    "ages_ml_objectif_recherche_emploi",
    "ages_ml_objectif_autre",
    "nps_reponses",
    "nps_somme",
    "v2_envoyes",
    "v2_traites",
    "v2_repondus",
    "v2_rdv",
  ],
  whatsapp: [
    "envoyes",
    "rappel",
    "sans_aide",
    "sans_reponse",
    "opt_out",
    "echec",
    "rappel_rdv_pris",
    "rappel_nouveau_projet",
    "rappel_deja_accompagne",
    "rappel_injoignable",
    "rappel_coordonnees_incorrect",
    "rappel_autre",
    "prequalif_envoyes",
    "prequalif_backfill",
    "prequalif_daily",
    "prequalif_echec",
    "prequalif_opt_out",
    "prequalif_oui",
    "prequalif_non",
    "prequalif_reponse_auto",
    "prequalif_liens",
    "prequalif_clics",
    "prequalif_cliqueurs",
  ],
} as const;

export type TypePurgeMl = keyof typeof COMPTEURS_PURGES_ML;
export type CompteursPurgeMl<T extends TypePurgeMl> = Record<(typeof COMPTEURS_PURGES_ML)[T][number], number>;

const zCompteurs = <T extends TypePurgeMl>(type: T) =>
  z.object(
    Object.fromEntries(COMPTEURS_PURGES_ML[type].map((champ) => [champ, z.number().int()])) as {
      [K in (typeof COMPTEURS_PURGES_ML)[T][number]]: z.ZodNumber;
    }
  );

const zDimensions = {
  _id: zObjectId,
  mission_locale_id: zObjectId.describe("Mission locale du dossier supprimé"),
  organisme_id: zObjectId.nullable().describe("CFA du dossier supprimé"),
  region: z.string().nullable().describe("Région du CFA au moment de la suppression"),
  departement: z.string().nullable().describe("Département du CFA au moment de la suppression"),
  mois: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .describe("Mois, heure de Paris, de la création du dossier, de l'envoi par le CFA ou du dernier message WhatsApp"),
  cfa_active_le: z
    .date()
    .optional()
    .describe("Plus ancienne date d'activation du CFA pour les ML connue à la suppression de ses dossiers"),
  updated_at: z.date().describe("Date du dernier ajout"),
};

export const zMissionLocaleEffectifsPurgesStats = z.discriminatedUnion("type", [
  z.object({ ...zDimensions, type: z.literal("suivi"), compteurs: zCompteurs("suivi") }),
  z.object({ ...zDimensions, type: z.literal("collab"), compteurs: zCompteurs("collab") }),
  z.object({ ...zDimensions, type: z.literal("whatsapp"), compteurs: zCompteurs("whatsapp") }),
]);

export type IMissionLocaleEffectifsPurgesStats = z.output<typeof zMissionLocaleEffectifsPurgesStats>;

export default { zod: zMissionLocaleEffectifsPurgesStats, indexes, collectionName };
