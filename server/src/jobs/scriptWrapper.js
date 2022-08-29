const { closeMongoConnection } = require("../common/mongodb");
const createComponents = require("../common/components/components");
const logger = require("../common/logger");
const { JobEventModel } = require("../common/model");
const { initRedis } = require("../common/infra/redis");
const { formatDuration, intervalToDuration } = require("date-fns");
const { jobEventStatuts } = require("../common/constants/jobsConstants");
const config = require("../../config");

process.on("unhandledRejection", (e) => console.log(e));
process.on("uncaughtException", (e) => console.log(e));

let redisClient;

const exit = async (rawError) => {
  let error = rawError;
  if (rawError) {
    logger.error(rawError.constructor.name === "EnvVarError" ? rawError.message : rawError);
  }

  setTimeout(() => {
    //Waiting logger to flush all logs (MongoDB)
    closeMongoConnection()
      .then(() => {})
      .catch((closeError) => {
        error = closeError;
        console.log(error);
      });
  }, 500);

  await redisClient.quit();

  process.exitCode = error ? 1 : 0;
};

module.exports = {
  runScript: async (job, jobName) => {
    try {
      const startDate = new Date();

      redisClient = await initRedis({
        uri: config.redis.uri,
        onError: (err) => logger.error("Redis client error", err),
        onReady: () => logger.info("Redis client ready!"),
      });

      const components = await createComponents({ redisClient });
      await new JobEventModel({ jobname: jobName, action: jobEventStatuts.started, date: new Date() }).save();
      await job(components);

      const endDate = new Date();
      const duration = formatDuration(intervalToDuration({ start: startDate, end: endDate }));

      await new JobEventModel({
        jobname: jobName,
        created_at: new Date(),
        action: jobEventStatuts.executed,
        data: { startDate, endDate, duration },
      }).save();

      await exit();
    } catch (e) {
      await exit(e);
    } finally {
      await new JobEventModel({ jobname: jobName, action: jobEventStatuts.ended, date: new Date() }).save();
    }
  },
};
