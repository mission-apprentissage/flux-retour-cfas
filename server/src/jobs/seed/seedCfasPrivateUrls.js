const cliProgress = require("cli-progress");
const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const config = require("../../../config");
const { cfasDb } = require("../../common/model/collections");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Script qui crée l'url privée des CFA ayant un token
 */
runScript(async () => {
  logger.info("Seeding CFAs private urls");
  await seedCfaPrivateUrls();
  logger.info("End seeding CFAs private urls");
}, "seed private urls");

const seedCfaPrivateUrls = async () => {
  const cfasWithoutPrivateUrls = await cfasDb()
    .find({ access_token: { $ne: null }, private_url: null })
    .toArray();
  loadingBar.start(cfasWithoutPrivateUrls.length, 0);

  await asyncForEach(cfasWithoutPrivateUrls, async (cfaWithoutAccessToken) => {
    loadingBar.increment();

    const privateUrl = config.publicUrl + "/cfa/" + cfaWithoutAccessToken.access_token;

    await cfasDb().updateOne({ _id: cfaWithoutAccessToken._id }, { $set: { private_url: privateUrl } });
  });

  loadingBar.stop();
};
