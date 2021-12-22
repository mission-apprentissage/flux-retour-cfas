const cliProgress = require("cli-progress");
const logger = require("../../../common/logger");
const { runScript } = require("../../scriptWrapper");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/* one shot, to remove */
runScript(async ({ db }) => {
  const cfasCollection = db.collection("cfas");

  const cfasCount = await cfasCollection.countDocuments();
  logger.info(`Found ${cfasCount} cfas`);
  loadingBar.start(cfasCount, 0);

  let cfasModifiedCount = 0;

  const cursor = cfasCollection.find({}, { _id: 1, private_url: 1 });

  while (await cursor.hasNext()) {
    const document = await cursor.next();
    const toReplace = "/cfa/";
    const replaceWith = "/cfas/";

    if (document.private_url?.includes(toReplace)) {
      const fixedPrivateUrl = document.private_url.replace(toReplace, replaceWith);
      const { modifiedCount } = await cfasCollection.updateOne(
        { _id: document._id },
        {
          $set: {
            private_url: fixedPrivateUrl,
          },
        }
      );
      cfasModifiedCount += modifiedCount;
    }
    loadingBar.increment();
  }

  loadingBar.stop();
  logger.info(`Updated ${cfasModifiedCount} cfas`);
}, "fix-cfas-private-url");
