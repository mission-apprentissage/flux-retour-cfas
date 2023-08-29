import { Filter, FindOptions, MatchKeysAndValues, ObjectId, WithoutId } from "mongodb";

import { jobsDb } from "../model/collections";
import { IJob } from "../model/job.model";
import { getDbCollection } from "../mongodb";

type CreateJobParam = Pick<IJob, "name" | "type" | "cron_string" | "payload" | "scheduled_for" | "sync">;

/**
 * Création d'un job
 */
export const createJob = async ({
  name,
  type = "simple",
  payload,
  scheduled_for = new Date(),
  sync = false,
  cron_string,
}: CreateJobParam): Promise<IJob> => {
  const job: WithoutId<IJob> = {
    name,
    type,
    status: sync ? "will_start" : "pending",
    ...(payload ? { payload } : {}),
    ...(cron_string ? { cron_string } : {}),
    updated_at: new Date(),
    created_at: new Date(),
    scheduled_for,
    sync,
  };
  const { insertedId: _id } = await getDbCollection("jobs").insertOne(job);
  return { ...job, _id };
};

export const findJob = async (filter: Filter<IJob>, options?: FindOptions<IJob>): Promise<IJob | null> => {
  return await jobsDb().findOne(filter, options);
};

export const findJobs = async (filter: Filter<IJob>, options?: FindOptions<IJob>): Promise<IJob[]> => {
  return await jobsDb().find<IJob>(filter, options).toArray();
};

/**
 * Mise à jour d'un job
 */
export const updateJob = async (_id: ObjectId, data: MatchKeysAndValues<IJob>) => {
  return getDbCollection("jobs").updateOne({ _id }, { $set: { ...data, updated_at: new Date() } });
};
