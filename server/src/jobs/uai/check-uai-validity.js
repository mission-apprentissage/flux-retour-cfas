const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { validateUai } = require("../../common/domain/uai");
const { jobNames } = require("../../common/model/constants");

/*
    Ce script permet d'identifier les statuts candidats ayant un UAI invalide ou absent
    L'information est ensuite stockée dans le statutCandidat via ces champs boolean uai_etablissement_valid
*/
runScript(async ({ db }) => {
  logger.info("Run Check UAI validity in StatutsCandidats");

  let nbDocumentsUpdated = 0;
  const newUaisValid = new Set();

  const collection = db.collection("statutsCandidats");
  const documentsCount = await collection.countDocuments();
  const cursor = collection.find();
  while (await cursor.hasNext()) {
    const document = await cursor.next();

    const isUaiValid = validateUai(document.uai_etablissement);

    // skip update if no change
    if (isUaiValid !== document.uai_etablissement_valid) {
      newUaisValid.add(document.uai_etablissement);

      await collection.findOneAndUpdate(
        { _id: document._id },
        {
          $set: {
            uai_etablissement_valid: isUaiValid,
          },
        }
      );
      nbDocumentsUpdated++;
    }
  }

  logger.info(`${nbDocumentsUpdated} statutsCandidats updated / ${documentsCount} total`);
  logger.info(`Updated UAIs:`, Array.from(newUaisValid));
  logger.info("End Check UAI validity in StatutsCandidats");
}, jobNames.checkUaiValidity);
