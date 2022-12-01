import { closeMongodbConnection, configureDbSchemaValidation, connectToMongodb } from "../common/mongodb.js";
import createComponents from "../common/components/components.js";
import logger from "../common/logger.js";
import { formatDuration, intervalToDuration } from "date-fns";
import { jobEventStatuts } from "../common/constants/jobsConstants.js";
import { modelDescriptors } from "../common/model/collections.js";
import createServices from "../services.js";
import config from "../config.js";
import { createJobEvent } from "../common/actions/jobEvents.actions.js";

process.on("unhandledRejection", (e) => console.log(e));
process.on("uncaughtException", (e) => console.log(e));

let redisClient;

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
    closeMongodbConnection()
      .then(() => {})
      .catch((closeError) => {
        error = closeError;
        console.log(error);
      });
  }, 500);

  await redisClient.quit();

  process.exitCode = error ? 1 : 0;
};

/**
 * Wrapper pour l'execution de scripts
 * @param {*} job
 * @param {*} jobName
 */
export const runScript = async (job, jobName) => {
  try {
    const startDate = new Date();

    await connectToMongodb(config.mongodb.uri);
    await configureDbSchemaValidation(modelDescriptors);

    const components = await createComponents();
    const services = await createServices();
    redisClient = services.cache;

    await createJobEvent({ jobname: jobName, action: jobEventStatuts.started, date: new Date() });
    await job({ ...components, ...services });

    const endDate = new Date();
    const duration = formatDuration(intervalToDuration({ start: startDate, end: endDate }));

    await createJobEvent({
      jobname: jobName,
      date: new Date(),
      action: jobEventStatuts.executed,
      data: { startDate, endDate, duration },
    });

    await exit();
  } catch (e) {
    await exit(e);
  } finally {
    await createJobEvent({ jobname: jobName, action: jobEventStatuts.ended, date: new Date() });
  }
};
