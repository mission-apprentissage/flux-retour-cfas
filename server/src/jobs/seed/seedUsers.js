const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const config = require("../../../config");
const path = require("path");
const { downloadIfNeeded } = require("./utils/seedUtils");
const { jobNames } = require("../../common/model/constants");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { readJsonFromCsvFile } = require("../../common/utils/fileUtils");
const { User } = require("../../common/model");

const usersFileName = config.env === "production" ? "users" : "users-recette";
const usersFromCsvFile = path.join(__dirname, `./assets/${usersFileName}.csv`);

runScript(async ({ users }) => {
  logger.info("-> Seed API Users from config...");
  await seedApiUsers(users);

  logger.info("-> Seed Tdb Users from csv...");
  await seedusers(users);

  logger.info("-> All users are successfully created !");
}, jobNames.seedUsers);

/**
 * Creating Users
 * @param {*} usersModule
 * @param {*} usersList
 */
const createUsers = async (usersModule, usersList) => {
  await asyncForEach(usersList, async (user) => {
    if ((await User.countDocuments({ username: user.name })) !== 0) {
      logger.info(`User ${user.name} already exists - no creation needed`);
    } else {
      logger.info(`Creating user ${user.name}`);
      try {
        await usersModule.createUser(user.name, user.password, {
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
 * Seeding API Users
 */
const seedApiUsers = async (usersModule) => {
  const usersListFromConfig = Object.values(config.users);
  await createUsers(usersModule, usersListFromConfig);
};

/**
 * Seeding Tdb Users
 * @param {*} users
 */
const seedusers = async (usersModule) => {
  await downloadIfNeeded(`users/${usersFileName}.csv`, usersFromCsvFile);
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
