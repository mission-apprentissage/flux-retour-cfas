import logger from "../../../common/logger.js";
import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import { dossiersApprenantsMigrationDb } from "../../../common/model/collections.js";
import { sleep } from "../../../common/utils/miscUtils.js";
import { createFormation, existsFormation, findFormationById } from "../../../common/actions/formations.actions.js";

const SLEEP_TIME_BETWEEN_CREATION = 100; // 100ms to avoid flooding TCO and LBA APIs

/**
 * Script qui initialise les formations
 */
export const hydrateFormations = async () => {
  let createdFormationsTotal = 0;
  let dossiersApprenantUpdatedTotal = 0;
  let notCreatedFormationsTotal = 0;

  // Récupère tous les CFD distinct dans les dossiersApprenants
  const allCfds = await dossiersApprenantsMigrationDb().distinct("formation_cfd");
  logger.info(allCfds.length, "distinct CFD found in collection DossierApprenant");

  await asyncForEach(allCfds, async (cfd) => {
    const formationExistsInDb = await existsFormation(cfd);

    // Gestion des nouveaux CFD
    if (!formationExistsInDb) {
      // Crée une formation pour chaque nouveau code CFD et maj les dossiers apprenants liés
      const { createdFormationsCount, dossiersApprenantUpdatedCount, notCreatedFormationsCount } =
        await createFormationInReferentielAndUpdateDossiersApprenants(cfd);

      createdFormationsTotal += createdFormationsCount;
      dossiersApprenantUpdatedTotal += dossiersApprenantUpdatedCount;
      notCreatedFormationsTotal += notCreatedFormationsCount;

      await sleep(SLEEP_TIME_BETWEEN_CREATION);
    }
  });

  logger.info(`${createdFormationsTotal} formations created in DB`);
  logger.warn(`${notCreatedFormationsTotal} formations could not be created`);
  logger.info(`${dossiersApprenantUpdatedTotal} dossiers apprenants updated with formation info`);
};

/**
 * Fonction de création des formations dans le référentiel et MAJ des dossiers rattachés
 * @param {*} cfd
 * @returns
 */
const createFormationInReferentielAndUpdateDossiersApprenants = async (cfd) => {
  let createdFormationsCount = 0;
  let dossiersApprenantUpdatedCount = 0;
  let notCreatedFormationsCount = 0;

  try {
    const createdFormationId = await createFormation(cfd);
    createdFormationsCount++;
    const formationCreated = await findFormationById(createdFormationId);
    const dossiersApprenantsUpdateResults = await dossiersApprenantsMigrationDb().updateMany(
      { formation_cfd: cfd },
      {
        $set: {
          formation_id: createdFormationId, // Added formation id in dossierApprenant
          // TODO add when dispo in TCO : duree: createdFormation.duree,
          // TODO add when dispo in TCO : annee: createdFormation.annee,
          niveau_formation: formationCreated.niveau,
          niveau_formation_libelle: formationCreated.niveau_libelle,
        },
      }
    );
    dossiersApprenantUpdatedCount += dossiersApprenantsUpdateResults.modifiedCount;
  } catch (err) {
    logger.error("error while creating formation for CFD", cfd, err);
    notCreatedFormationsCount++;
  }

  await sleep(SLEEP_TIME_BETWEEN_CREATION);

  return { createdFormationsCount, dossiersApprenantUpdatedCount, notCreatedFormationsCount };
};
