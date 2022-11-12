import { connectToMongodb, closeMongodbConnection } from "../common/mongodb.js";
import createComponents from "../common/components/components.js";
import logger from "../common/logger.js";
import { initRedis } from "../common/infra/redis/index.js";
import { formatDuration, intervalToDuration } from "date-fns";
import { jobEventStatuts } from "../common/constants/jobsConstants.js";
import config from "../../config/index.js";
import { jobEventsDb } from "../common/model/collections.js";

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

    redisClient = await initRedis({
      uri: config.redis.uri,
      onError: (err) => logger.error("Redis client error", err),
      onReady: () => logger.info("Redis client ready!"),
    });

    const mongodbClient = await connectToMongodb(config.mongodb.uri);

    const components = await createComponents({ redisClient, db: mongodbClient });
    await jobEventsDb().insertOne({ jobname: jobName, action: jobEventStatuts.started, date: new Date() });
    await job(components);

    const endDate = new Date();
    const duration = formatDuration(intervalToDuration({ start: startDate, end: endDate }));

    await jobEventsDb().insertOne({
      jobname: jobName,
      created_at: new Date(),
      action: jobEventStatuts.executed,
      data: { startDate, endDate, duration },
    });

    await exit();
  } catch (e) {
    await exit(e);
  } finally {
    await jobEventsDb().insertOne({ jobname: jobName, action: jobEventStatuts.ended, date: new Date() });
  }
};
