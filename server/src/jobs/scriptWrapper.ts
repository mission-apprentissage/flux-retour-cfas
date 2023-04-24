import { formatDuration, intervalToDuration } from "date-fns";

import { createJobEvent, updateJobEvent } from "@/common/actions/jobEvents.actions";
import { jobEventStatuts } from "@/common/constants/jobs";
import logger from "@/common/logger";
import { closeMongodbConnection } from "@/common/mongodb";

/**
 * Wrapper pour l'exécution de jobs avec création de JobEvents en base
 * pour sauvegarder le résultat du job
 */
export const runJob = (jobFunc: (...args: any[]) => Promise<any>) => {
  return async function actionFunc(args: any, options: any) {
    const startDate = new Date();
    const jobEventId = await createJobEvent({ jobname: options._name, action: jobEventStatuts.started });
    let error: Error | undefined = undefined;
    let result = undefined;

    try {
      result = await jobFunc(args);
    } catch (e: any) {
      console.error(e);
      error = e?.toString();
      await updateJobEvent(jobEventId, {
        action: jobEventStatuts.error,
        data: { error: e?.toString() },
      });
    }

    const endDate = new Date();
    const duration = formatDuration(intervalToDuration({ start: startDate, end: endDate }));
    await updateJobEvent(jobEventId, {
      action: error ? jobEventStatuts.error : jobEventStatuts.ended,
      data: { startDate, endDate, duration, result, error },
    });

    if (error) {
      logger.error(error.constructor.name === "EnvVarError" ? error.message : error);
    }

    //Waiting logger to flush all logs (MongoDB)
    setTimeout(async () => {
      try {
        await closeMongodbConnection();
      } catch (err) {
        logger.error({ err }, "close mongodb connection error");
      }
      process.exit(error ? 1 : 0); // eslint-disable-line no-process-exit
    }, 500);
  };
};
