import logger from "../../../common/logger.js";
import { fullSampleWithUpdates } from "../../../../tests/data/sample.js";
import { createRandomDossierApprenantList, createRandomOrganisme } from "../../../../tests/data/randomizedSample.js";
import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import { createDossierApprenant } from "../../../common/actions/dossiersApprenants.actions.js";
import { createOrganisme } from "../../../common/actions/organismes.actions.js";

/**
 * Remplissage de données de tests
 * accepte un mode random
 * @param {*} randomMode
 */
export const seedWithSample = async (randomMode = false, nbDossiers = 10) => {
  if (randomMode) {
    logger.info(`Seeding data with ${nbDossiers} random sample...`);
    await seedRandomizedSample(nbDossiers);
    logger.info(`${nbDossiers} dossiersApprenants random inserted !`);
  } else {
    logger.info("Seeding data with sample...");
    await seedSample();
    logger.info(`Sample dossiersApprenants inserted !`);
  }
};

export const seedSample = async () => {
  await asyncForEach(fullSampleWithUpdates, async (currentDossierToAdd) => {
    createDossierApprenant(currentDossierToAdd);
  });
};

export const seedRandomizedSample = async (nbDossiers) => {
  try {
    const randomData = createRandomDossierApprenantList(nbDossiers);
    await asyncForEach(randomData, async (currentDossierToAdd) => {
      const randomOrganisme = createRandomOrganisme();
      const { _id: organisme_id } = await createOrganisme(randomOrganisme);
      await createDossierApprenant({ organisme_id, ...currentDossierToAdd });
    });
  } catch (err) {
    logger.error(err);
  }
};
