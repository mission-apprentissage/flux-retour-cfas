import { userEventsDb } from "../model/collections.js";

/**
 * Création d'un user event
 * @param {*} param0
 * @returns
 */
export const createUserEvent = async ({ username, user_email, type, action, data }: any) => {
  await userEventsDb().insertOne({
    username, // Todo remove une fois migration faite
    user_email,
    type,
    action,
    data,
    date: new Date(),
  });

  return;
};
