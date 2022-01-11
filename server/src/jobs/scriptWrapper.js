const { closeMongoConnection } = require("../common/mongodb");
const createComponents = require("../common/components/components");
const logger = require("../common/logger");
const config = require("../../config");
const { access, mkdir } = require("fs").promises;
const { JobEventModel } = require("../common/model");
const { formatDuration, intervalToDuration } = require("date-fns");
const { jobEventStatuts } = require("../common/model/constants");

process.on("unhandledRejection", (e) => console.log(e));
process.on("uncaughtException", (e) => console.log(e));

const ensureOutputDirExists = async () => {
  const outputDir = config.outputDir;
  try {
    await access(outputDir);
  } catch (e) {
    if (e.code !== "EEXIST") {
      await mkdir(outputDir, { recursive: true });
    }
  }
  return outputDir;
};

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

  process.exitCode = error ? 1 : 0;
};

module.exports = {
  runScript: async (job, jobName) => {
    try {
      const startDate = new Date();

      await ensureOutputDirExists();
      const components = await createComponents();
      await new JobEventModel({ jobname: jobName, action: jobEventStatuts.started }).save();
      await job(components);

      const endDate = new Date();
      const duration = formatDuration(intervalToDuration({ start: startDate, end: endDate }));

      await new JobEventModel({
        jobname: jobName,
        action: jobEventStatuts.executed,
        data: { startDate, endDate, duration },
      }).save();

      await exit();
    } catch (e) {
      await exit(e);
    } finally {
      await new JobEventModel({ jobname: jobName, action: jobEventStatuts.ended }).save();
    }
  },
};
