import { jobEventsDb } from "@/common/model/collections";

/**
 * Création d'un job event
 * @param {*} data
 * @returns
 */
export const createJobEvent = async ({ jobname, action, data, date = new Date() }: any) => {
  const { insertedId } = await jobEventsDb().insertOne({
    jobname,
    action,
    ...(data ? { data } : {}),
    date,
  });
  return insertedId;
};

/**
 * Mise à jour d'un job event
 * @param {*} _id
 * @param {Object} data
 * @returns
 */
export const updateJobEvent = async (_id, data) => {
  return jobEventsDb().updateOne({ _id }, { $set: data });
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
