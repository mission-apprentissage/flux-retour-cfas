import Boom from "boom";
import { MatchKeysAndValues, ObjectId, FindOptions, Filter } from "mongodb";

import { jobsDb } from "../model/collections";
import { IJob, IJobsCron, IJobsCronTask, IJobsSimple } from "../model/job.model";

type CreateJobSimpleParams = Pick<IJobsSimple, "name" | "payload" | "scheduled_for" | "sync">;

export const createJobSimple = async ({
  name,
  payload,
  scheduled_for = new Date(),
  sync = false,
}: CreateJobSimpleParams): Promise<IJobsSimple> => {
  const job: IJobsSimple = {
    _id: new ObjectId(),
    name,
    type: "simple",
    status: sync ? "will_start" : "pending",
    payload,
    updated_at: new Date(),
    created_at: new Date(),
    scheduled_for,
    sync,
  };
  await jobsDb().insertOne(job);
  return job;
};

type CreateJobCronParams = Pick<IJobsCron, "name" | "cron_string" | "scheduled_for" | "sync">;

export const createJobCron = async ({
  name,
  cron_string,
  scheduled_for = new Date(),
  sync = false,
}: CreateJobCronParams): Promise<IJobsCron> => {
  const job: IJobsCron = {
    _id: new ObjectId(),
    name,
    type: "cron",
    status: sync ? "will_start" : "pending",
    cron_string,
    updated_at: new Date(),
    created_at: new Date(),
    scheduled_for,
    sync,
  };
  await jobsDb().insertOne(job);
  return job;
};

export const updateJobCron = async (id: ObjectId, cron_string: IJobsCron["cron_string"]): Promise<IJobsCron> => {
  const data = {
    status: "pending",
    cron_string,
    updated_at: new Date(),
  };
  const job = await jobsDb().findOneAndUpdate(id, data, { returnDocument: "after" });
  if (!job.value || job.value.type !== "cron") {
    throw Boom.internal("Not found");
  }
  return job.value;
};

type CreateJobCronTaskParams = Pick<IJobsCron, "name" | "scheduled_for">;

export const createJobCronTask = async ({ name, scheduled_for }: CreateJobCronTaskParams): Promise<IJobsCronTask> => {
  const job: IJobsCronTask = {
    _id: new ObjectId(),
    name,
    type: "cron_task",
    status: "pending",
    updated_at: new Date(),
    created_at: new Date(),
    scheduled_for,
    sync: false,
  };
  await jobsDb().insertOne(job);
  return job;
};

export const findJob = async (filter: Filter<IJob>, options?: FindOptions): Promise<IJob | null> => {
  return await jobsDb().findOne(filter, options);
};

export const findJobs = async <T extends IJob>(filter: Filter<T>, options?: FindOptions): Promise<T[]> => {
  // @ts-expect-error
  return await jobsDb().find(filter, options).toArray();
};

/**
 * Mise à jour d'un job
 */
export const updateJob = async (_id: ObjectId, data: MatchKeysAndValues<IJob>) => {
  return jobsDb().updateOne({ _id }, { $set: { ...data, updated_at: new Date() } });
};
