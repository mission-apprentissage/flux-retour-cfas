import { userEventsDb, usersDb } from "../model/collections.js";

/**
 * Création d'un user event
 * @param {*} param0
 * @returns
 */
const create = async ({ username, type, action, data }) => {
  const user = await usersDb().findOne({ username });
  const UNKNOWN_DEFAULT_VALUE = "NC";

  await userEventsDb().insertOne({
    username,
    user_organisme: user?.organisme ?? UNKNOWN_DEFAULT_VALUE,
    user_region: user?.region ?? UNKNOWN_DEFAULT_VALUE,
    user_network: user?.network ?? UNKNOWN_DEFAULT_VALUE,
    type,
    action,
    data,
    date: new Date(),
  });

  return;
};

export default () => ({
  create,
});
