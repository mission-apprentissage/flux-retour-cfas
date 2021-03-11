const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { validateSiret } = require("../../common/domain/siret");
const { jobNames } = require("../../common/model/constants");

/*
    Ce script permet de nettoyer certains SIRET contenant des espaces ou des points
    "800 800 800 00012" => "80080080000012"
    "800.800.800.00012" => "80080080000012"
*/
runScript(async ({ db }) => {
  logger.info("Running Sanitize SIRETs");

  let nbDocumentsUpdated = 0;

  const collection = db.collection("statutsCandidats");
  const cursor = collection.find({ siret_etablissement_valid: false });
  while (await cursor.hasNext()) {
    const document = await cursor.next();
    // if siret exists and escaping spaces and dots makes it valid, update statutCandidat
    const sanitizedSiret = document.siret_etablissement?.replace(/(\s|\.)/g, "");
    const isSanitizedSiretValid = validateSiret(sanitizedSiret);

    if (isSanitizedSiretValid) {
      await collection.findOneAndUpdate(
        { _id: document._id },
        {
          $set: {
            siret_etablissement: sanitizedSiret,
            siret_etablissement_valid: true,
          },
        }
      );
      nbDocumentsUpdated++;
    }
  }

  logger.info(`${nbDocumentsUpdated} statutsCandidats updated with valid SIRET`);
  logger.info("Ending Sanitize SIRET");
}, jobNames.sanitizeSirets);
