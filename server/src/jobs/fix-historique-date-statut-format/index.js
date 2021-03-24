const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { jobNames } = require("../../common/model/constants");

/*
    Ce script permet de nettoyer certains historique_statut_apprenant ayant un champ date_statut au format string
*/
runScript(async ({ db }) => {
  logger.info("Running Fix historique_statut_apprenant");

  let nbDocumentsUpdated = 0;

  const collection = db.collection("statutsCandidats");
  const count = await collection.countDocuments({ "historique_statut_apprenant.date_statut": { $type: "string" } });
  logger.info(`${count} statuts candidats to fix`);

  const cursor = await db
    .collection("statutsCandidats")
    .find({ "historique_statut_apprenant.date_statut": { $type: "string" } });
  while (await cursor.hasNext()) {
    const document = await cursor.next();

    const { result: updateResult } = await collection.updateOne(
      { _id: document._id },
      {
        $set: {
          "historique_statut_apprenant.0.date_statut": new Date(document.historique_statut_apprenant[0].date_statut),
        },
      }
    );
    nbDocumentsUpdated += updateResult.nModified;
  }

  logger.info(`${nbDocumentsUpdated} documents updated`);
  logger.info("Ending Fix historique_statut_apprenant");
}, jobNames.fixHistoriqueStatutApprenant);
