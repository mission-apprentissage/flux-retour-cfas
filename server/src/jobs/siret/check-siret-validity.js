const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { validateSiret } = require("../../common/domain/siret");
const { jobNames } = require("../../common/model/constants");

/*
    Ce script permet d'identifier les statuts candidats ayant un SIRET invalide ou absent
    L'information est ensuite stockée dans le statutCandidat via le champs boolean siret_etablissement_valid
*/
runScript(async ({ db }) => {
  logger.info("Run Check SIRET validity in StatutsCandidats");

  let nbDocumentsUpdated = 0;
  const newSiretsValid = new Set();

  const collection = db.collection("statutsCandidats");
  const documentsCount = await collection.countDocuments();
  const cursor = collection.find();
  while (await cursor.hasNext()) {
    const document = await cursor.next();

    const isSiretValid = validateSiret(document.siret_etablissement);

    // skip update if no change
    if (isSiretValid !== document.siret_etablissement_valid) {
      newSiretsValid.add(document.siret_etablissement);

      await collection.findOneAndUpdate(
        { _id: document._id },
        {
          $set: {
            siret_etablissement_valid: isSiretValid,
          },
        }
      );
      nbDocumentsUpdated++;
    }
  }

  logger.info(`${nbDocumentsUpdated} statutsCandidats updated / ${documentsCount} total`);
  logger.info(`Updated SIRETs:`, Array.from(newSiretsValid));
  logger.info("End Check SIRET validity in StatutsCandidats");
}, jobNames.checkSiretValidity);
