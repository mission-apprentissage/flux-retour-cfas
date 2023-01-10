import cliProgress from "cli-progress";
import logger from "../../common/logger.js";
import { runScript } from "../scriptWrapper.js";
import { asyncForEach } from "../../common/utils/asyncUtils.js";
import { getCfdInfo } from "../../common/apis/apiTablesCorrespondances.js";
import { formationsDb } from "../../common/model/collections.js";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Script qui seed les RNCPs vides de formations
 */
runScript(async () => {
  logger.info("Start seeding empty formations RNCP");
  await emptyFormationRncp();
  await seedEmptyFormationsRncp();
  logger.info("End seeding empty formations RNCP");
}, "seed empty rncp formations");

/**
 * Empty all rncps in formations collection
 */
const emptyFormationRncp = async () => {
  await formationsDb().updateMany({}, { $set: { rncps: [] } });
  logger.info("All RNCPs cleared in formations !");
};

/**
 * Seed all empty rncps in formation collection
 */
const seedEmptyFormationsRncp = async () => {
  // Find all formations with empty rncps but cfd present
  const formationWithEmptyRncps = await formationsDb()
    .find({ rncps: [], cfd: { $nin: [null, ""] } })
    .toArray();
  logger.info(`Found ${formationWithEmptyRncps.length} Formations with empty RNCPs, seeding them...`);

  loadingBar.start(formationWithEmptyRncps.length, 0);

  await asyncForEach(formationWithEmptyRncps, async (currentFormationWithEmptyRncps) => {
    loadingBar.increment();

    // Find formationInfo from API TCO
    const formationInfo = await getCfdInfo(currentFormationWithEmptyRncps.cfd);

    if (formationInfo !== null) {
      // Update current formation with these current formation rncps
      await formationsDb().updateOne(
        { _id: currentFormationWithEmptyRncps._id },
        { $set: { rncps: formationInfo?.rncps?.map((item) => item.code_rncp) } }
      );
    }
  });

  loadingBar.stop();
};
