const { createFtpDir, connectToMongoForTests, cleanAll } = require("./testUtils.js");
const createComponents = require("../../src/common/components/components");
const nockTablesCo = require("./nockApis/nock-tablesCorrespondances");

module.exports = (desc, cb) => {
  describe(desc, function () {
    let context;

    beforeEach(async () => {
      let [{ db }, ftpDir] = await Promise.all([connectToMongoForTests(), createFtpDir()]);
      const components = await createComponents({ db });
      context = { db, components, ftpDir };
      nockApis();
    });

    cb({ getContext: () => context });

    afterEach(cleanAll);
  });
};

const nockApis = () => {
  nockTablesCo();
};
