const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");

/*
    Ce script récupère tous les CFDs valides présents dans la collection StatutsCandidats et crée une formation en base pour chacun si elle n'existe pas
*/
runScript(async ({ db, formations }) => {
  logger.info("Run Retrieve Formations from CFD");

  let createdFormationsCount = 0;
  let formationsNotFoundInTablesCorrespondances = 0;
  let formationsError = 0;

  const collection = db.collection("statutsCandidats");

  // get all valid CFDs
  const allCfds = await collection.distinct("id_formation", { id_formation_valid: true });

  logger.info(`${allCfds.length} distinct CFDs found in collection StatutsCandidats`);

  // for each CFD, if no formation exists in DB, create and store it
  await asyncForEach(allCfds, async (cfd) => {
    const formationExistsInDb = await formations.existsFormation(cfd);
    if (!formationExistsInDb) {
      try {
        const created = await formations.createFormation(cfd);
        created ? createdFormationsCount++ : formationsNotFoundInTablesCorrespondances++;
      } catch (err) {
        logger.error(err);
        formationsError++;
      }
    }
  });

  logger.info(`${createdFormationsCount} formations created in DB`);
  logger.warn(`${formationsNotFoundInTablesCorrespondances} formations not found in Tables de Correspondances API`);
  logger.warn(`${formationsError} CFD with error while fetching Tables de Correspondances API`);
  logger.info("End Retrieve Formations from CFD");
});
