import logger from "../../../common/logger.js";
import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import { dossiersApprenantsMigrationDb } from "../../../common/model/collections.js";
import { sleep } from "../../../common/utils/miscUtils.js";
import { createFormation, existsFormation } from "../../../common/actions/formations.actions.js";

const SLEEP_TIME_BETWEEN_CREATION = 100; // 100ms to avoid flooding TCO and LBA APIs

/**
 * Script qui initialise les formations
 */
export const hydrateFormations = async () => {
  let createdFormationsCount = 0;
  let notCreatedFormationsCount = 0;
  let dossiersApprenantUpdatedCount = 0;

  // get all CFDs from dossiers apprenants collection
  const allCfds = await dossiersApprenantsMigrationDb().distinct("formation_cfd");
  logger.info(allCfds.length, "distinct CFD found in collection DossierApprenant");

  // filter out CFD for which we already have a formation in db
  const formationsCfdToCreate = [];
  await asyncForEach(allCfds, async (cfd) => {
    const formationExistsInDb = await existsFormation(cfd);
    if (!formationExistsInDb) formationsCfdToCreate.push(cfd);
  });

  logger.info(formationsCfdToCreate.length, "formations should be created");

  // create a formation for every "new" CFD and update related dossiers apprenants
  await asyncForEach(formationsCfdToCreate, async (cfd) => {
    try {
      const createdFormation = await createFormation(cfd);
      createdFormationsCount++;
      const dossiersApprenantsUpdateResults = await dossiersApprenantsMigrationDb().updateMany(
        { formation_cfd: cfd },
        {
          $set: {
            niveau_formation: createdFormation.niveau,
            niveau_formation_libelle: createdFormation.niveau_libelle,
          },
        }
      );
      dossiersApprenantUpdatedCount += dossiersApprenantsUpdateResults.modifiedCount;
    } catch (err) {
      logger.error("error while creating formation for CFD", cfd, err);
      notCreatedFormationsCount++;
    }
    await sleep(SLEEP_TIME_BETWEEN_CREATION);
  });

  logger.info(`${createdFormationsCount} formations created in DB`);
  logger.warn(`${notCreatedFormationsCount} formations could not be created`);
  logger.info(`${dossiersApprenantUpdatedCount} dossiers apprenants updated with formation info`);
};
