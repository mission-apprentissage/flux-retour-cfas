const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const UNKNOWN_DEFAULT_VALUE = "NC";

/**
 * Ce script permet de fixer une valeur default pour les champs liés au user (user_organisme / user_region / user_network)
 * dans la collection userEvents pour lesquels ces champs sont nuls ou vides.
 */
runScript(async ({ db }) => {
  const userEventsCollection = db.collection("userEvents");
  logger.info(`Setting user_organisme default for all userEvents without user_organisme...`);
  await updateUserEventsDefaultUserOrganisme(userEventsCollection);

  logger.info(`Setting user_region default for all userEvents without user_region...`);
  await updateUserEventsDefaultUserRegion(userEventsCollection);

  logger.info(`Setting user_network default for all userEvents without user_network...`);
  await updateUserEventsDefaultUserNetwork(userEventsCollection);
}, "userEvents-set-default-userFields");

/**
 * Update des userEvents ayant des user_organisme vides ou nuls
 */
const updateUserEventsDefaultUserOrganisme = async (userEventsCollection) => {
  const { modifiedCount } = await userEventsCollection.updateMany(
    { user_organisme: { $in: [null, ""] } },
    { $set: { user_organisme: UNKNOWN_DEFAULT_VALUE } }
  );
  logger.info(`${modifiedCount} userEvents updated with default user_organisme...`);
};

/**
 * Update des userEvents ayant des user_region vides ou nuls
 */
const updateUserEventsDefaultUserRegion = async (userEventsCollection) => {
  const { modifiedCount } = await userEventsCollection.updateMany(
    { user_region: { $in: [null, ""] } },
    { $set: { user_region: UNKNOWN_DEFAULT_VALUE } }
  );
  logger.info(`${modifiedCount} userEvents updated with default user_region...`);
};

/**
 * Update des userEvents ayant des user_network vides ou nuls
 */
const updateUserEventsDefaultUserNetwork = async (userEventsCollection) => {
  const { modifiedCount } = await userEventsCollection.updateMany(
    { user_network: { $in: [null, ""] } },
    { $set: { user_network: UNKNOWN_DEFAULT_VALUE } }
  );
  logger.info(`${modifiedCount} userEvents updated with default user_network...`);
};
