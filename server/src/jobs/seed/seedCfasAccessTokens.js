const cliProgress = require("cli-progress");
const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { Cfa } = require("../../common/model");
const { jobNames } = require("../../common/model/constants");
const { generatePassword } = require("../../common/utils/miscUtils");
const config = require("../../../config");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Script qui crée un token d'accès pour les CFA n'en ayant pas
 */
runScript(async () => {
  logger.info("Seeding CFAs access tokens");
  await seedCfaAccessTokens();
  logger.info("End seeding CFAs access tokens");
}, jobNames.seedCfasAccessTokens);

const seedCfaAccessTokens = async () => {
  const cfasWithoutAccessToken = await Cfa.find({ access_token: null }).lean();
  loadingBar.start(cfasWithoutAccessToken.length, 0);

  await asyncForEach(cfasWithoutAccessToken, async (cfaWithoutAccessToken) => {
    loadingBar.increment();

    // Generate accesToken & set it with url for cfa
    const accessToken = generatePassword();
    const privateUrl = config.publicUrl + "/cfa/" + accessToken;

    await Cfa.findOneAndUpdate(
      { _id: cfaWithoutAccessToken._id },
      { $set: { access_token: accessToken, private_url: privateUrl } }
    );
  });

  loadingBar.stop();
};
