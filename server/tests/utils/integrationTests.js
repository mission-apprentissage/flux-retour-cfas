const { connectToMongoForTests, cleanAll } = require("./testUtils.js");
const createComponents = require("../../src/common/components/components");

module.exports = (desc, cb) => {
  describe(desc, function () {
    let context;

    beforeEach(async () => {
      const { db } = await connectToMongoForTests();
      const components = await createComponents({ db });
      context = { db, components };
    });

    cb({ getContext: () => context });

    afterEach(cleanAll);
  });
};
