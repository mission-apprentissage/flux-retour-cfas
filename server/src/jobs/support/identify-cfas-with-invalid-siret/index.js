const logger = require("../../../common/logger");
const { runScript } = require("../../scriptWrapper");
const path = require("path");
const { toCsv } = require("../../../common/utils/exporterUtils");
const { jobNames } = require("../../../common/model/constants/index");

/**
 * Ce script permet de créer un export contenant les CFAS sans SIRET
 */
runScript(async ({ db }) => {
  logger.info(`Identifying CFAs with invalid SIRET`);

  const cfasWithoutSiret = await db
    .collection("statutsCandidats")
    .aggregate([
      { $match: { siret_etablissement_valid: false } },
      {
        $group: {
          _id: "$uai_etablissement",
          nom_etablissement: { $addToSet: "$nom_etablissement" },
          siret: { $addToSet: "$siret_etablissement" },
        },
      },
    ])
    .toArray();

  const formattedForExport = cfasWithoutSiret.map((cfaInfo) => ({
    UAI: cfaInfo._id,
    SIRETs: JSON.stringify(cfaInfo.siret),
    nom_etablissement: JSON.stringify(cfaInfo.nom_etablissement),
  }));

  await toCsv(formattedForExport, path.join(__dirname, `/output/cfas_with_invalid_siret.csv`), { delimiter: "," });

  logger.info("Ended !");
}, jobNames.identifyStatutsCandidatsDuplicates);
