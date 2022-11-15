import { jobEventsDb } from "../model/collections.js";

/**
 * Vérification si le job est dans l'action spécifiée
 * @param {*} jobname
 * @param {*} action
 * @returns
 */
const isJobInAction = async (jobname, action) => {
  const [lastJobEvent] = await jobEventsDb().find({ jobname }).limit(1).sort({ date: "desc" }).toArray();

  if (!lastJobEvent) return false;
  return lastJobEvent.action === action;
};

export default () => ({ isJobInAction });
