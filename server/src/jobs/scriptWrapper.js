const moment = require("moment");
const { closeMongoConnection } = require("../common/mongodb");
const createComponents = require("../common/components/components");
const logger = require("../common/logger");
const config = require("../../config");
const { access, mkdir } = require("fs").promises;
const { JobEvent } = require("../common/model");

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
      const launchDate = new Date();

      await ensureOutputDirExists();
      const components = await createComponents();
      await job(components);

      const jobEventStop = new JobEvent({
        jobname: jobName,
        action: "Run Job",
        data: {
          startDate: launchDate,
          endDate: new Date(),
          duration: moment.utc(new Date().getTime() - launchDate).format("HH:mm:ss.SSS"),
        },
      });
      await jobEventStop.save();

      await exit();
    } catch (e) {
      await exit(e);
    }
  },
};
