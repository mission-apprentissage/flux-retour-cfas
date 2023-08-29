import { captureException, getCurrentHub, runWithAsyncContext } from "@sentry/node";
import { formatDuration, intervalToDuration } from "date-fns";

import logger from "@/common/logger";
import { jobsDb } from "@/common/model/collections";
import { IJob } from "@/common/model/job.model";
import { sleep } from "@/common/utils/asyncUtils";

import { createJob, updateJob } from "../common/actions/job.actions";

import { runJob } from "./jobs";

export async function addJob(
  {
    name,
    type = "simple",
    payload = {},
    scheduled_for = new Date(),
    sync = false,
  }: Pick<IJob, "name"> & Partial<Pick<IJob, "type" | "payload" | "scheduled_for" | "sync">>,
  options: { runningLogs: boolean } = {
    runningLogs: true,
  }
): Promise<number> {
  const job = await createJob({
    name,
    type,
    payload,
    scheduled_for,
    sync,
  });

  if (sync && job) {
    return runJob(job, options);
  }

  return 0;
}

export async function processor(signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return;
  }

  logger.debug(`Process jobs queue - looking for a job to execute`);
  const { value: nextJob } = await jobsDb().findOneAndUpdate(
    {
      type: { $in: ["simple", "cron_task"] },
      status: "pending",
      scheduled_for: { $lte: new Date() },
    },
    { $set: { status: "will_start" } },
    { sort: { scheduled_for: 1 } }
  );

  if (nextJob) {
    logger.info(`Process jobs queue - job ${nextJob.name} will start`);
    await runJob(nextJob);
  } else {
    await sleep(45_000, signal); // 45 secondes
  }

  return processor(signal);
}

const runner = async (
  job: IJob,
  jobFunc: () => Promise<unknown>,
  options: { runningLogs: boolean } = {
    runningLogs: true,
  }
): Promise<number> => {
  if (options.runningLogs) logger.info(`Job: ${job.name} Started`);
  const startDate = new Date();
  await updateJob(job._id, {
    status: "running",
    started_at: startDate,
  });
  let error: Error | undefined = undefined;
  let result: unknown = undefined;

  try {
    result = await jobFunc();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    captureException(err);
    if (options.runningLogs) logger.error({ err, writeErrors: err.writeErrors, error: err }, "job error");
    error = err?.toString();
  }

  const endDate = new Date();
  const duration = formatDuration(intervalToDuration({ start: startDate, end: endDate }));
  await updateJob(job._id, {
    status: error ? "errored" : "finished",
    output: { duration, result, error },
    ended_at: endDate,
  });
  if (options.runningLogs) logger.info(`Job: ${job.name} Ended`);

  if (error) {
    if (options.runningLogs) logger.error(error.constructor.name === "EnvVarError" ? error.message : error);
  }

  return error ? 1 : 0;
};

export function executeJob(
  job: IJob,
  jobFunc: () => Promise<unknown>,
  options: { runningLogs: boolean } = {
    runningLogs: true,
  }
) {
  return runWithAsyncContext(async () => {
    const hub = getCurrentHub();
    const transaction = hub.startTransaction({
      name: `JOB: ${job.name}`,
      op: "processor.job",
    });
    hub.configureScope((scope) => {
      scope.setSpan(transaction);
      scope.setTag("job", job.name);
      scope.setContext("job", job);
    });
    const start = Date.now();
    try {
      return await runner(job, jobFunc, options);
    } finally {
      transaction.setMeasurement("job.execute", Date.now() - start, "millisecond");
      transaction.finish();
    }
  });
}
