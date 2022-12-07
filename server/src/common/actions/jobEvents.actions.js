import { jobEventsDb } from "../model/collections.js";

/**
 * Création d'un user event
 * @param {*} param0
 * @returns
 */
export const createJobEvent = async ({ jobname, action, data }) => {
  await jobEventsDb().insertOne({
    jobname,
    action,
    ...(data ? { data } : {}),
    date: new Date(),
  });

  return;
};

/**
 * Vérification si le job est dans l'action spécifiée
 * @param {*} jobname
 * @param {*} action
 * @returns
 */
export const isJobInAction = async (jobname, action) => {
  const [lastJobEvent] = await jobEventsDb().find({ jobname }).limit(1).sort({ date: "desc" }).toArray();
  if (!lastJobEvent) return false;
  return lastJobEvent.action === action;
};
