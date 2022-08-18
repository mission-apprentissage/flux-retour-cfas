const cliProgress = require("cli-progress");
const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { FormationModel } = require("../../common/model");
const { getCfdInfo } = require("../../common/apis/apiTablesCorrespondances");

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
  await FormationModel.updateMany({}, { $set: { rncps: [] } });
  logger.info("All RNCPs cleared in formations !");
};

/**
 * Seed all empty rncps in formation collection
 */
const seedEmptyFormationsRncp = async () => {
  // Find all formations with empty rncps but cfd present
  const formationWithEmptyRncps = await FormationModel.find({ rncps: [], cfd: { $nin: [null, ""] } });
  logger.info(`Found ${formationWithEmptyRncps.length} Formations with empty RNCPs, seeding them...`);

  loadingBar.start(formationWithEmptyRncps.length, 0);

  await asyncForEach(formationWithEmptyRncps, async (currentFormationWithEmptyRncps) => {
    loadingBar.increment();

    // Find formationInfo from API TCO
    const formationInfo = await getCfdInfo(currentFormationWithEmptyRncps.cfd);

    if (formationInfo !== null) {
      // Update current formation with these current formation rncps
      await FormationModel.findOneAndUpdate(
        { _id: currentFormationWithEmptyRncps._id },
        { $set: { rncps: formationInfo?.rncps?.map((item) => item.code_rncp) } }
      );
    }
  });

  loadingBar.stop();
};
