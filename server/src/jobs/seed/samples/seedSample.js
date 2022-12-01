import logger from "../../../common/logger.js";
import { fullSampleWithUpdates } from "../../../../tests/data/sample.js";
import { createRandomDossierApprenantList } from "../../../../tests/data/randomizedSample.js";
import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import { createDossierApprenant } from "../../../common/actions/dossiersApprenants.actions.js";

/**
 * Remplissage de données de tests
 * accepte un mode random
 * @param {*} randomMode
 */
export const seedWithSample = async (randomMode = false) => {
  if (randomMode) {
    logger.info("Seeding data with random sample...");
    await seedRandomizedSample();
  } else {
    logger.info("Seeding data with sample...");
    await seedSample();
  }

  logger.info("End seeding data with Sample !");
};

export const seedSample = async () => {
  await asyncForEach(fullSampleWithUpdates, async (currentDossierToAdd) => {
    createDossierApprenant(currentDossierToAdd);
  });
};

export const seedRandomizedSample = async (nbStatuts = 10) => {
  const randomData = createRandomDossierApprenantList(nbStatuts);
  await asyncForEach(randomData, async (currentDossierToAdd) => {
    logger.info(JSON.stringify(currentDossierToAdd));
    createDossierApprenant(currentDossierToAdd);
  });
};
