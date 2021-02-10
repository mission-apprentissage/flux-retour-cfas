const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { validateUai } = require("../../common/domain/uai");
const { validateSiret } = require("../../common/domain/siret");

/*
    Ce script permet d'identifier les statuts candidats ayant un UAI ou un SIRET invalide ou absent
    L'information est ensuite stockée dans le statutCandidat via ces champs boolean :
     - uai_etablissement_valid
     - siret_etablissement_valid
*/
runScript(async ({ db }) => {
  logger.info("Run Check SIRET and UAI validity in StatutsCandidats");

  let nbDocumentsUpdated = 0;

  const collection = db.collection("statutsCandidats");
  const documentsCount = await collection.countDocuments();
  const cursor = collection.find();
  while (await cursor.hasNext()) {
    const document = await cursor.next();

    const isUaiValid = validateUai(document.uai_etablissement);
    const isSiretValid = validateSiret(document.siret_etablissement);

    // skip update if no change
    if (isUaiValid !== document.uai_etablissement_valid || isSiretValid !== document.siret_etablissement_valid) {
      await collection.findOneAndUpdate(
        { _id: document._id },
        {
          $set: {
            uai_etablissement_valid: isUaiValid,
            siret_etablissement_valid: isSiretValid,
          },
        }
      );
      nbDocumentsUpdated++;
    }
  }

  logger.info(`${nbDocumentsUpdated} statutsCandidats updated / ${documentsCount} total`);
  logger.info("End Check SIRET and UAI validity in StatutsCandidats");
});
