import logger from "../../../common/logger.js";
import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import { dossiersApprenantsMigrationDb } from "../../../common/model/collections.js";
import { sleep } from "../../../common/utils/miscUtils.js";
import { createFormation, existsFormation } from "../../../common/actions/formations.actions.js";
import { findOrganismeById, updateOrganisme } from "../../../common/actions/organismes.actions.js";

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

    // TODO MAJ tous les organismes rattachés à cette formation
    await majOrganismesFormationsForFormation(cfd);
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
    const createdFormation = await createFormation(cfd);
    createdFormationsCount++;
    const dossiersApprenantsUpdateResults = await dossiersApprenantsMigrationDb().updateMany(
      { formation_cfd: cfd },
      {
        $set: {
          // TODO add when dispo in TCO : duree: createdFormation.duree,
          // TODO add when dispo in TCO : annee: createdFormation.annee,
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

  return { createdFormationsCount, dossiersApprenantUpdatedCount, notCreatedFormationsCount };
};

/**
 * Fonction de maj de la liste des formations liées à l'organisme
 * @param {*} cfd
 */
const majOrganismesFormationsForFormation = async (cfd) => {
  // Récupération des organismes id liés à ce CFD
  const organismesIdForCfd = await dossiersApprenantsMigrationDb().distinct("organisme_id", {
    formation_cfd: cfd,
  });

  // Parse des organismes et ajout des formations liées
  await asyncForEach(organismesIdForCfd, async (currentOrganismeId) => {
    const organismeToUpdate = await findOrganismeById(currentOrganismeId);

    // TODO Update formations for organisme
    const formationsToAdd = await getFormationsListForOrganismeAndCfd(organismeToUpdate.uai, cfd);
    await updateOrganisme(currentOrganismeId, { organismeToUpdate, ...{ formations: formationsToAdd } });
  });
};

/**
 *
 * @param {*} uai
 * @param {*} cfd
 * @returns
 */
const getFormationsListForOrganismeAndCfd = async (uai, cfd) => {
  // TODO Hardcoded : call Catalogue API
  return [
    {
      formationId: "test",
      organismes: [
        { id_organisme: "OFR1", nature: "responsable" },
        { id_organisme: "OFR2", nature: "formateur" },
      ],
    },
  ];
};
