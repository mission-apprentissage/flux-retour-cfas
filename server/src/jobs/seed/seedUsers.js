const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const config = require("../../../config");
const path = require("path");
const { JOB_NAMES } = require("../../common/constants/jobsConstants");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { readJsonFromCsvFile } = require("../../common/utils/fileUtils");
const { UserModel } = require("../../common/model");
const arg = require("arg");

const usersFileName = config.env === "production" ? "users" : "users-recette";
const usersFromCsvFile = path.join(__dirname, `./assets/${usersFileName}.csv`);
let args = [];

runScript(async ({ users, ovhStorage }) => {
  args = arg({ "--clearCsvFile": Boolean }, { argv: process.argv.slice(2) });

  logger.info("-> Seed Tdb Users from csv...");
  await seedTdbUsers(users, ovhStorage, args["--clearCsvFile"]);

  logger.info("-> All users are successfully created !");
}, JOB_NAMES.seedUsers);

/**
 * Creating Users
 * @param {*} usersModule
 * @param {*} usersList
 */
const createUsers = async (usersModule, usersList) => {
  await asyncForEach(usersList, async (user) => {
    if ((await UserModel.countDocuments({ username: user.name })) !== 0) {
      logger.info(`User ${user.name} already exists - no creation needed`);
    } else {
      logger.info(`Creating user ${user.name}`);
      try {
        await usersModule.createUser({
          username: user.name,
          password: user.password,
          permissions: user.permissions,
          network: user.network ?? null,
          email: user.email ?? null,
        });
      } catch (err) {
        logger.error(err);
        logger.error(`Failed to create user ${user.name}`);
      }
    }
  });
};

/**
 * Seeding Tdb Users
 * @param {*} users
 */
const seedTdbUsers = async (usersModule, ovhStorage, clearCsvFile = false) => {
  await ovhStorage.downloadIfNeededFileTo(`users/${usersFileName}.csv`, usersFromCsvFile, clearCsvFile);
  const usersFromCsv = readJsonFromCsvFile(usersFromCsvFile, "utf8");

  const usersToCreate = usersFromCsv.map((item) => ({
    name: item.name,
    email: item.email,
    password: item.password,
    network: item.network,
    permissions: [item.role],
  }));

  await createUsers(usersModule, usersToCreate);
};
