const cliProgress = require("cli-progress");
const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { FormationModel } = require("../../common/model");
const { getCfdInfo } = require("../../common/apis/apiTablesCorrespondances");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Script qui seed les RNCP vides de formations
 */
runScript(async () => {
  logger.info("Start seeding empty formations RNCP");
  await emptyFormationRncp();
  await seedEmptyFormationsRncp();
  logger.info("End seeding empty formations RNCP");
}, "seed empty rncp formations");

/**
 * Empty all rncp in formations collection
 */
const emptyFormationRncp = async () => {
  await FormationModel.updateMany({}, { $set: { rncp: "" } });
  logger.info("All RNCP cleared in formations !");
};

/**
 * Seed all empty rncp field in formation collection
 */
const seedEmptyFormationsRncp = async () => {
  // Find all formations with empty rncp but cfd present
  const formationWithEmptyRncp = await FormationModel.find({ rncp: "", cfd: { $nin: [null, ""] } });
  logger.info(`Found ${formationWithEmptyRncp.length} Formations with empty RNCP, seeding them...`);

  loadingBar.start(formationWithEmptyRncp.length, 0);

  await asyncForEach(formationWithEmptyRncp, async (currentFormationWithEmptyRncp) => {
    loadingBar.increment();

    // Find formationInfo from API TCO
    const formationInfo = await getCfdInfo(currentFormationWithEmptyRncp.cfd);

    if (formationInfo !== null) {
      // Update current formation with this current formation rncp
      await FormationModel.findOneAndUpdate(
        { _id: currentFormationWithEmptyRncp._id },
        { $set: { rncp: formationInfo?.rncp?.code_rncp } }
      );
    }
  });

  loadingBar.stop();
};
