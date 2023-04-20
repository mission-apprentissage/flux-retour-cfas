import { formatDuration, intervalToDuration } from "date-fns";

import { closeMongodbConnection, configureDbSchemaValidation, connectToMongodb } from "../common/mongodb.js";
import logger from "../common/logger.js";
import { jobEventStatuts } from "../common/constants/jobsConstants.js";
import { modelDescriptors } from "../common/model/collections.js";
import createGlobalServices from "../services.js";
import config from "../config.js";
import { createJobEvent, updateJobEvent } from "../common/actions/jobEvents.actions.js";

process.on("unhandledRejection", (e) => console.error(e));
process.on("uncaughtException", (e) => console.error(e));

/**
 * Fonction de sortie du script
 * @param {*} rawError
 */
const exit = async (rawError) => {
  let error = rawError;
  if (rawError) {
    logger.error(rawError.constructor.name === "EnvVarError" ? rawError.message : rawError);
  }

  setTimeout(() => {
    //Waiting logger to flush all logs (MongoDB)
    closeMongodbConnection().catch((closeError) => {
      error = closeError;
      console.error(error);
    });
  }, 500);

  process.exitCode = error ? 1 : 0;
};

/**
 * Wrapper pour l'execution de scripts
 * @param {*} job
 * @param {*} jobName
 */
export const runScript = async (job, jobName) => {
  await connectToMongodb(config.mongodb.uri);
  await configureDbSchemaValidation(modelDescriptors);

  const startDate = new Date();
  const jobEventId = await createJobEvent({ jobname: jobName, action: jobEventStatuts.started });
  let error = undefined;
  let result = undefined;
  try {
    const services = await createGlobalServices();
    result = await job(services);
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
  await exit(error);
};
