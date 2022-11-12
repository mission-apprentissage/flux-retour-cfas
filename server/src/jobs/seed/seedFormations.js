import { runScript } from "../scriptWrapper.js";
import logger from "../../common/logger.js";
import { asyncForEach } from "../../common/utils/asyncUtils.js";
import { sleep } from "../../common/utils/miscUtils.js";

const SLEEP_TIME_BETWEEN_CREATION = 100; // 100ms to avoid flooding TCO and LBA APIs

/*
    Ce script récupère tous les CFDs valides présents dans la collection DossierApprenant, crée une formation en base
    pour chacun si elle n'existe pas et ajoute les infos de la formation aux dossiers apprenants correspondant
*/
runScript(async ({ db, formations }) => {
  let createdFormationsCount = 0;
  let notCreatedFormationsCount = 0;
  let dossiersApprenantUpdatedCount = 0;

  // get all CFDs from dossiers apprenants collection
  const allCfds = await db.collection("dossiersApprenants").distinct("formation_cfd");
  logger.info(allCfds.length, "distinct CFD found in collection DossierApprenant");

  // filter out CFD for which we already have a formation in db
  const formationsCfdToCreate = [];
  await asyncForEach(allCfds, async (cfd) => {
    const formationExistsInDb = await formations.existsFormation(cfd);
    if (!formationExistsInDb) formationsCfdToCreate.push(cfd);
  });

  logger.info(formationsCfdToCreate.length, "formations should be created");

  // create a formation for every "new" CFD and update related dossiers apprenants
  await asyncForEach(formationsCfdToCreate, async (cfd) => {
    try {
      const createdFormation = await formations.createFormation(cfd);
      createdFormationsCount++;

      const { result: dossierApprenantsUpdateResult } = await db.collection("dossiersApprenants").updateMany(
        { formation_cfd: cfd },
        {
          $set: {
            niveau_formation: createdFormation.niveau,
            niveau_formation_libelle: createdFormation.niveau_libelle,
          },
        }
      );
      dossiersApprenantUpdatedCount += dossierApprenantsUpdateResult.nModified;
    } catch (err) {
      logger.error("error while creating formation for CFD", cfd, err);
      notCreatedFormationsCount++;
    }
    await sleep(SLEEP_TIME_BETWEEN_CREATION);
  });

  logger.info(`${createdFormationsCount} formations created in DB`);
  logger.warn(`${notCreatedFormationsCount} formations could not be created`);
  logger.info(`${dossiersApprenantUpdatedCount} dossiers apprenants updated with formation info`);
}, "seed:formations");
