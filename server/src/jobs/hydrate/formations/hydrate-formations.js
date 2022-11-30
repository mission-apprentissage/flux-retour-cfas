import logger from "../../../common/logger.js";
import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import { dossiersApprenantsMigrationDb } from "../../../common/model/collections.js";
import { sleep } from "../../../common/utils/miscUtils.js";
import { createFormation, findFormationById, getFormationWithCfd } from "../../../common/actions/formations.actions.js";

const SLEEP_TIME_BETWEEN_CREATION = 100; // 100ms to avoid flooding TCO and LBA APIs

/**
 * Script qui initialise les formations
 */
export const hydrateFormations = async () => {
  let createdFormationsTotal = 0;
  let alreadyPresentFormationsTotal = 0;

  let dossiersApprenantUpdatedTotal = 0;
  let notCreatedFormationsTotal = 0;

  // Récupère tous les CFD distinct dans les dossiersApprenants
  const allCfds = await dossiersApprenantsMigrationDb().distinct("formation_cfd");
  logger.info(allCfds.length, "distinct CFD found in collection DossierApprenant");

  await asyncForEach(allCfds, async (cfd) => {
    const formationFound = await getFormationWithCfd(cfd);

    // Gestion des nouveaux CFD
    if (!formationFound) {
      try {
        // Crée une formation
        const createdFormationId = await createFormation(cfd);
        createdFormationsTotal++;

        // MAJ les dossiers liés à cette nouvelle formation créé
        const formationCreated = await findFormationById(createdFormationId);
        const modifiedCount = await updateDossiersApprenantsFormation(formationCreated);
        dossiersApprenantUpdatedTotal += modifiedCount;

        // Wait for api calls
        await sleep(SLEEP_TIME_BETWEEN_CREATION);
      } catch (err) {
        logger.error("error while creating formation for CFD", cfd, err);
        notCreatedFormationsTotal++;
      }
    } else {
      alreadyPresentFormationsTotal++;

      // Gestion des CFD existants on update les dossiersApprenants liés
      const modifiedCount = await updateDossiersApprenantsFormation(formationFound);
      dossiersApprenantUpdatedTotal += modifiedCount;
    }
  });

  logger.info(`${createdFormationsTotal} formations created in DB`);
  logger.warn(`${notCreatedFormationsTotal} formations could not be created`);
  logger.info(`${alreadyPresentFormationsTotal} formations already present in DB`);
  logger.info(`${dossiersApprenantUpdatedTotal} dossiers apprenants updated with formation info`);
};

/**
 * Fonction de maj des dossiersApprenants lié à une formation
 * va lier l'ID est les infos de formation (niveau & niveau_libelle pour le moment)
 * @param {*} formation
 * @returns
 */
const updateDossiersApprenantsFormation = async (formation) => {
  const { modifiedCount } = await dossiersApprenantsMigrationDb().updateMany(
    { formation_cfd: formation.cfd },
    {
      $set: {
        formation_id: formation._id, // Added formation id in dossierApprenant
        // TODO add when dispo in TCO : duree: createdFormation.duree,
        // TODO add when dispo in TCO : annee: createdFormation.annee,
        niveau_formation: formation.niveau,
        niveau_formation_libelle: formation.niveau_libelle,
      },
    }
  );
  return modifiedCount;
};
