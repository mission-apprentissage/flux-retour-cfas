const path = require("path");
const config = require("../../config");
const { ensureDir, ensureFile, emptyDir } = require("fs-extra");
const { connectToMongo } = require("../../src/common/mongodb");

const testDataDir = path.join(__dirname, "../../.local/test");
let mongoHolder = null;

const connectToMongoForTests = async () => {
  if (!mongoHolder) {
    const uri = config.mongodb.uri.split("flux-retour-cfas").join("flux-retour-cfas_test");
    mongoHolder = await connectToMongo(uri);
  }
  return mongoHolder;
};

const createFtpDir = async () => {
  let dir = path.join(testDataDir, "ftp");
  await Promise.all([
    ensureFile(path.join(dir, "ftp.log")),
    ensureFile(path.join(dir, "vsftpd_pam")),
    ensureDir(path.join(dir, "vsftpd_user_conf")),
    ensureDir(path.join(dir, "users")),
  ]);
  return dir;
};

module.exports = {
  connectToMongoForTests: mongoHolder || connectToMongoForTests,
  createFtpDir,
  cleanAll: () => {
    const models = require("../../src/common/model");
    return Promise.all([emptyDir(testDataDir), ...Object.values(models).map((m) => m.deleteMany())]);
  },
};
