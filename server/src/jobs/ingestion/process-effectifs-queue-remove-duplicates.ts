import logger from "@/common/logger";
import { effectifsQueueDb } from "@/common/model/collections";

export const removeDuplicatesEffectifsQueue = async () => {
  logger.info("Find duplicates in effectifs queue...");

  const duplicates = await effectifsQueueDb()
    .aggregate(
      [
        {
          $match: {
            processed_at: { $exists: false },
          },
        },
        {
          $sort: {
            updated_at: -1,
          },
        },
        {
          $group: {
            _id: {
              source: "$source",
              nom_apprenant: "$nom_apprenant",
              prenom_apprenant: "$prenom_apprenant",
              // date_de_naissance_apprenant: "$date_de_naissance_apprenant",
              uai_etablissement: "$uai_etablissement",
              // nom_etablissement: "$nom_etablissement",
              id_formation: "$id_formation",
              /**
               * Année scolaire sur laquelle l'apprenant est enregistré (ex: "2020-2021")
               */
              annee_scolaire: "$annee_scolaire",
              statut_apprenant: "$statut_apprenant",
              date_metier_mise_a_jour_statut: "$date_metier_mise_a_jour_statut",
              /**
               * Identifiant de l'apprenant dans l'erp
               */
              id_erp_apprenant: "$id_erp_apprenant",
              // ine_apprenant: "$ine_apprenant",
              // email_contact: "$email_contact",
              // tel_apprenant: "$tel_apprenant",
              // code_commune_insee_apprenant: "$code_commune_insee_apprenant",
              siret_etablissement: "$siret_etablissement",
              // libelle_long_formation: "$libelle_long_formation",
              // periode_formation: "$periode_formation",
              // /**
              //  * Année de formation
              //  */
              annee_formation: "$annee_formation",
              formation_rncp: "$formation_rncp",
              contrat_date_debut: "$contrat_date_debut",
              contrat_date_fin: "$contrat_date_fin",
              contrat_date_rupture: "$contrat_date_rupture",
            },
            dups: { $addToSet: "$_id" },
            count: { $sum: 1 },
          },
        },
        {
          $match: {
            count: { $gt: 1 },
          },
        },
      ],
      { allowDiskUse: true }
    )
    .toArray();

  logger.info(`Found ${duplicates.length} duplicates in effectifs queue...}`);

  for (const doc of duplicates) {
    logger.info(
      `Found ${doc.count} duplicates for ${[
        doc._id.source,
        doc._id.uai_etablissement,
        doc._id.siret_etablissement,
        doc._id.annee_scolaire,
        doc._id.nom_apprenant,
        doc._id.prenom_apprenant,
      ].join("/")}: ${doc.dups.join(", ")}`
    );
    // First element skipped for deleting
    doc.dups.shift();
    // Delete remaining duplicates
    logger.info(`Delete ${doc.dups.join(", ")}`);
    await effectifsQueueDb().deleteMany({ _id: { $in: doc.dups } });
  }
};
