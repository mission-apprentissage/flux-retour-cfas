const path = require("path");
// eslint-disable-next-line node/no-unpublished-require
const nock = require("nock");
const config = require("../../config");
const { emptyDir } = require("fs-extra");
const { connectToMongo } = require("../../src/common/mongodb");
const { createIndexes } = require("../../src/common/indexes");

const testDataDir = path.join(__dirname, "../../.local/test");
let mongoHolder = null;

const connectToMongoForTests = async () => {
  if (!mongoHolder) {
    const uri = config.mongodb.uri.split("flux-retour-cfas").join("flux-retour-cfas_test");
    mongoHolder = await connectToMongo(uri);
  }
  await createIndexes(mongoHolder.db);
  return mongoHolder;
};

module.exports = {
  connectToMongoForTests: mongoHolder || connectToMongoForTests,
  cleanAll: () => {
    nock.cleanAll();
    const models = require("../../src/common/model");
    return Promise.all([emptyDir(testDataDir), ...Object.values(models).map((m) => m.deleteMany())]);
  },
};
