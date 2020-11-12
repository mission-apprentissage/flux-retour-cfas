const fs = require("fs");
const Tail = require("tail").Tail;
const logger = require("../logger");

const getUserFromLog = (data) => {
  let array = data.split(" ");
  return array[7].replace(/["[\],]/g, "");
};

const getFileNameFromLog = (data) => {
  let array = data.split(" ");
  return array[12].replace(/["[\],]/g, "");
};

const getLogWatcher = async (logFile) => {
  return new Promise((resolve, reject) => {
    let retries = 0;

    const retry = (delay, maxRetries) => {
      fs.access(logFile, fs.F_OK, (err) => {
        if (err) {
          if (retries > maxRetries) {
            reject(err);
          }
          logger.warn(`${logFile} does not exist yet - retrying in ${delay}ms (${maxRetries} left)`, err.message);
          retries++;
          setTimeout(() => retry(delay, --maxRetries), delay);
        } else {
          logger.info(`Watching log file ${logFile}`);
          const logWatcher = new Tail(logFile, { follow: true });
          logWatcher.on("error", (error) => logger.error(error));
          resolve(logWatcher);
        }
      });
    };

    retry(1000, 120);
  });
};

const createWatcher = async (logFile) => {
  let logWatcher = await getLogWatcher(logFile);

  return {
    onLogin: (callback) => {
      logWatcher.on("line", (data) => {
        if (data && data.indexOf("OK LOGIN") !== -1) {
          callback(getUserFromLog(data));
        }
      });
    },
    onFileUploaded: (callback) => {
      logWatcher.on("line", (data) => {
        if (data && data.indexOf("OK UPLOAD") !== -1) {
          callback(getUserFromLog(data), getFileNameFromLog(data));
        }
      });
    },
    onFileDownloaded: (callback) => {
      logWatcher.on("line", (data) => {
        if (data && data.indexOf("OK DOWNLOAD") !== -1) {
          callback(getUserFromLog(data), getFileNameFromLog(data));
        }
      });
    },
    stop: () => logWatcher.unwatch(),
  };
};

module.exports = createWatcher;
