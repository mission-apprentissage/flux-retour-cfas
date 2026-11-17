import { Db, MongoServerError } from "mongodb";

const UNIQUE_5_KEYS = "organisme_id_1_annee_scolaire_1_id_erp_apprenant_1_formation.cfd_1_formation.rncp_1";

export const REDUNDANT_INDEXES: Record<string, string[]> = {
  effectifs: [
    UNIQUE_5_KEYS,
    "organisme_id",
    "_computed.organisme.fiable_1",
    "date_de_naissance",
    "_computed.organisme.enseigne_1",
    "_computed.organisme.raison_sociale_1",
    "apprenant.nir_1",
  ],
  effectifsDECA: [UNIQUE_5_KEYS, "date_de_naissance", "source_organisme_id", "annee_scolaire"],
  personV2: ["date_de_naissance_1_nom_1_prenom_1"],
  formationV2: ["cfd_1_rncp_1_organisme_formateur_id_1_organisme_responsable_id_1"],
  missionLocaleStats: ["computed_day_asc", "computed_day_-1"],
  voeuxAffelnet: ["voeu_id_1", "revision_-1"],
};

export const up = async (db: Db) => {
  for (const [collectionName, indexNames] of Object.entries(REDUNDANT_INDEXES)) {
    for (const indexName of indexNames) {
      try {
        await db.collection(collectionName).dropIndex(indexName);
      } catch (error) {
        if (error instanceof MongoServerError && (error.code === 26 || error.code === 27)) {
          continue;
        }
        throw error;
      }
    }
  }
};
