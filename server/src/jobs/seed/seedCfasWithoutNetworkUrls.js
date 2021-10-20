const cliProgress = require("cli-progress");
const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { Cfa } = require("../../common/model");
const { jobNames } = require("../../common/model/constants");
const { generatePassword } = require("../../common/utils/miscUtils");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Script qui initialise la collection CFAs de référence
 */
runScript(async () => {
  logger.info("Seeding CFAs without network URLs");
  await seedCfasWithoutNetworkTdbUrl();
  logger.info("End seeding CFAS without network URLs");
}, jobNames.seedCfasWithoutNetworkUrls);

/**
 * Seed des urls TDB pour tous les CFAs sans réseau.x
 */
const seedCfasWithoutNetworkTdbUrl = async () => {
  logger.info(`Seeding Tdb URL for CFAs without networks`);

  const allCfasWithoutNetworksWithoutUrls = await Cfa.find({
    reseaux: { $size: 0 },
    url_access_token: { $exists: false },
  });
  loadingBar.start(allCfasWithoutNetworksWithoutUrls.length, 0);

  await asyncForEach(allCfasWithoutNetworksWithoutUrls, async (currentCfaWithoutNetworks) => {
    loadingBar.increment();

    // Generate accesToken & set it with url for cfa
    const urlAccessToken = generatePassword();
    await Cfa.findOneAndUpdate({ _id: currentCfaWithoutNetworks._id }, { $set: { url_access_token: urlAccessToken } });
  });

  loadingBar.stop();
  logger.info(`End seeding Tdb URL for CFAs without networks`);
};
