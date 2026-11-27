import { Db, ObjectId } from "mongodb";

import logger from "@/common/logger";

const DEFAULT_BATCH_SIZE = 10_000;
const WRITE_CONCERN = { w: "majority", wtimeoutMS: 60_000 } as const;

const COLONNES_RETIREES = [
  "telephone",
  "telephone_pro",
  "telephone_portable",
  "mnemonique_mef_origine",
  "code_mef_origine",
  "libelle_formation_origine",
  "code_origine_1",
  "libelle_option_1",
  "code_origine_2",
  "libelle_option_2",
  "code_lv1",
  "libelle_lv1",
  "code_lv2",
  "libelle_lv2",
  "code_uai_etab_origine",
  "code_uai_cio_origine",
  "libelle_cio_origine",
  "rang",
  "code_offre_formation",
  "code_mef",
  "bareme",
  "mnemonique_mef_offre_formation",
  "code_specialite_offre_formation",
  "libelle_formation",
  "code_enseignement",
  "libelle_enseignement",
  "candidature_internat",
  "demande_code_lv1",
  "demande_libelle_lv1",
  "demande_code_lv2",
  "demande_libelle_lv2",
  "code_uai_etab_accueil",
  "ville_etab_accueil",
  "siret_uai_gestionnaire",
];

const UNSET = Object.fromEntries(COLONNES_RETIREES.map((colonne) => [`raw.${colonne}`, ""]));

export const unsetAffelnetUnreadColumns = async (db: Db, batchSize = DEFAULT_BATCH_SIZE) => {
  const voeux = db.collection("voeuxAffelnet");

  let modified = 0;
  let lastId: ObjectId | null = null;
  for (;;) {
    const page = await voeux
      .find(lastId ? { _id: { $gt: lastId } } : {}, { projection: { _id: 1 } })
      .sort({ _id: 1 })
      .limit(batchSize)
      .toArray();
    if (page.length === 0) break;
    lastId = page[page.length - 1]._id;

    const result = await voeux.updateMany(
      { _id: { $in: page.map(({ _id }) => _id) } },
      { $unset: UNSET },
      { writeConcern: WRITE_CONCERN, bypassDocumentValidation: true }
    );
    modified += result.modifiedCount;
  }

  logger.info({ modified, colonnes: COLONNES_RETIREES.length }, "[Migration] Colonnes Affelnet non lues retirées");
};

export const up = async (db: Db) => {
  await unsetAffelnetUnreadColumns(db);
};
