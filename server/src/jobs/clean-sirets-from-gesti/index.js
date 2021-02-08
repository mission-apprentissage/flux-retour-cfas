const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { validateSiret } = require("../../common/domain/siret");

/*
    Ce script permet de nettoyer certains SIRET envoyés par Gesti contenant des espaces
    "800 800 800 00012" => "80080080000012"
*/
runScript(async ({ db }) => {
  logger.info("Clean SIRET from Gesti");

  let nbDocumentsUpdated = 0;

  const collection = db.collection("statutsCandidats");
  const cursor = collection.find({ source: "gesti", siret_etablissement_valid: false });
  while (await cursor.hasNext()) {
    const document = await cursor.next();
    // if siret exists and escaping spaces would make it valid, update statutCandidat
    const siretWithoutSpaces = document.siret_etablissement?.split(" ").join("");
    const isSiretWithoutSpacesValid = validateSiret(siretWithoutSpaces);

    if (isSiretWithoutSpacesValid) {
      await collection.findOneAndUpdate(
        { _id: document._id },
        {
          $set: {
            siret_etablissement: siretWithoutSpaces,
            siret_etablissement_valid: true,
          },
        }
      );
      nbDocumentsUpdated++;
    }
  }

  logger.info(`${nbDocumentsUpdated} statutsCandidats from Gesti updated`);
  logger.info("End Clean SIRET from Gesti");
});
