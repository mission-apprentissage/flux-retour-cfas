import logger from "../../../../common/logger.js";
import { asyncForEach } from "../../../../common/utils/asyncUtils.js";
import { dossiersApprenantsMigrationDb, effectifsDb } from "../../../../common/model/collections.js";
import { sleep } from "../../../../common/utils/miscUtils.js";
import {
  createFormation,
  findFormationById,
  getFormationWithCfd,
} from "../../../../common/actions/formations.actions.js";
import { updateDossierApprenant } from "../../../../common/actions/dossiersApprenants.actions.js";
import { updateEffectif } from "../../../../common/actions/effectifs.actions.js";

const SLEEP_TIME_BETWEEN_CREATION = 100; // 100ms to avoid flooding TCO and LBA APIs

/**
 * Script qui initialise les formations
 */
export const hydrateFormationsFromDossiersApprenants = async () => {
  let createdFormationsTotal = 0;
  let alreadyPresentFormationsTotal = 0;

  let dossiersApprenantUpdatedTotal = 0;
  let effectifsUpdatedTotal = 0;
  let notCreatedFormationsTotal = 0;

  // Récupère tous les CFD distinct dans les dossiersApprenants
  const allCfds = await dossiersApprenantsMigrationDb().distinct("formation_cfd");
  logger.info(allCfds.length, "distinct CFD found in collection DossierApprenant");

  await asyncForEach(allCfds, async (cfd) => {
    const formationFound = await getFormationWithCfd(cfd);

    // Gestion des nouveaux CFD uniquement
    if (!formationFound) {
      try {
        // Crée une formation
        const createdFormationId = await createFormation({ cfd });
        createdFormationsTotal++;

        // MAJ les dossiers liés à cette nouvelle formation créé
        const formationCreated = await findFormationById(createdFormationId);
        const modifiedCount = await updateDossiersApprenantsFormation(formationCreated);
        const modifiedEffectifsCount = await updateEffectifsFormation(formationCreated);

        dossiersApprenantUpdatedTotal += modifiedCount;
        effectifsUpdatedTotal += modifiedEffectifsCount;

        // Wait for api calls
        await sleep(SLEEP_TIME_BETWEEN_CREATION);
      } catch (err) {
        logger.error("error while creating formation for CFD", cfd, err);
        notCreatedFormationsTotal++;
      }
    }
  });

  logger.info(`${createdFormationsTotal} formations created in DB`);
  logger.warn(`${notCreatedFormationsTotal} formations could not be created`);
  logger.info(`${alreadyPresentFormationsTotal} formations already present in DB`);
  logger.info(`${dossiersApprenantUpdatedTotal} dossiers apprenants updated with formation info`);
  logger.info(`${effectifsUpdatedTotal} effectifs updated with formation info`);
};

/**
 * Fonction de maj des dossiersApprenants liés à une formation
 * lier niveau & niveau_libelle pour le moment
 * @param {*} formation
 * @returns
 */
const updateDossiersApprenantsFormation = async (formation) => {
  let updatedDossiersApprenantsCount = 0;
  const dossiersApprenantsForFormation = await dossiersApprenantsMigrationDb()
    .find({ formation_cfd: formation.cfd })
    .toArray();

  await asyncForEach(dossiersApprenantsForFormation, async (currentDossierApprenantToUpdate) => {
    await updateDossierApprenant(currentDossierApprenantToUpdate._id, {
      // TODO add when dispo in TCO : duree: createdFormation.duree,
      // TODO add when dispo in TCO : annee: createdFormation.annee,
      niveau_formation: formation.niveau,
      niveau_formation_libelle: formation.niveau_libelle,
    });
    updatedDossiersApprenantsCount++;
  });

  return updatedDossiersApprenantsCount;
};

/**
 * Fonction de maj des effectifs liés à une formation
 * lier niveau & niveau_libelle pour le moment
 * @param {*} formation
 * @returns
 */
const updateEffectifsFormation = async (formation) => {
  let updatedEffectifsCount = 0;
  const effectifsForFormation = await effectifsDb().find({ "formation.cfd": formation.cfd }).toArray();

  await asyncForEach(effectifsForFormation, async (currentEffectifToUpdate) => {
    const effectifToUpdate = await effectifsDb().findOne({ _id: currentEffectifToUpdate._id });
    await updateEffectif(currentEffectifToUpdate._id, {
      ...effectifToUpdate,
      // TODO add when dispo in TCO : duree: createdFormation.duree,
      // TODO add when dispo in TCO : annee: createdFormation.annee,
      niveau_formation: formation.niveau,
      niveau_formation_libelle: formation.niveau_libelle,
    });
    updatedEffectifsCount++;
  });

  return updatedEffectifsCount;
};
