const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { jobNames } = require("../../common/model/constants");

/*
    Ce script récupère tous les CFDs valides présents dans la collection StatutsCandidats et crée une formation en base pour chacun si elle n'existe pas
*/
runScript(async ({ db, formations }) => {
  logger.info("Run Retrieve Formations from CFD");

  let createdFormationsCount = 0;
  let formationsNotCreated = [];

  const collection = db.collection("statutsCandidats");

  // get all valid CFDs
  const allCfds = await collection.distinct("formation_cfd");
  logger.info(`${allCfds.length} distinct CFDs found in collection StatutsCandidats`);

  // for each CFD, if no formation exists in DB, create and store it
  await asyncForEach(allCfds, async (cfd) => {
    const formationExistsInDb = await formations.existsFormation(cfd);
    if (!formationExistsInDb) {
      try {
        const created = await formations.createFormation(cfd);
        created ? createdFormationsCount++ : formationsNotCreated.push(cfd);
      } catch (err) {
        formationsNotCreated.push(cfd);
        logger.error("error while creating formation for CFD", cfd);
        logger.error(err);
      }
    }
  });

  logger.info(`${createdFormationsCount} formations created in DB`);
  logger.warn(`${formationsNotCreated.length} formations could not be created. CFD list: ${formationsNotCreated}`);
  logger.info("End Retrieve Formations from CFD");
}, jobNames.formationRetrieveFromCfd);
