const path = require("path");
const config = require("config");

const logger = require("../../logger");
const { UserEvent } = require("../../model");
const createFtp = require("../../ftp");
const GestiImportStatutsCandidatsService = require("../gesti-import-statuts-candidats");

const fileUploadedHandlers = {
  [config.users.gesti.name]: async (uploadedFilePath, components) => {
    const service = new GestiImportStatutsCandidatsService(components.statutsCandidats);
    return service.importCsvStatutsCandidats(uploadedFilePath);
  },
};

/* This function will listen to different events on our FTP server and handle upload according to users */
const watchFtpActivity = async (components) => {
  const ftp = createFtp();
  await ftp.ensureReady();
  let watcher = await ftp.createFtpWatcher();

  watcher.onLogin((username) => {
    const event = new UserEvent({ type: "ftp", action: "login", username });
    event.save();
    logger.info(`${username} logged into FTP`);
  });

  watcher.onFileUploaded(async (username, fileName) => {
    const event = new UserEvent({ type: "ftp", action: "upload", username, data: fileName });
    event.save();

    logger.info(`${fileName} has been uploaded by user ${username}`);

    const uploadedFilePath = path.join(ftp.getHome(username), fileName);
    const handler = fileUploadedHandlers[username];

    if (handler) {
      await handler(uploadedFilePath, components);
    }
  });

  watcher.onFileDownloaded((username, fileName) => {
    const event = new UserEvent({ type: "ftp", action: "download", username, data: fileName });
    event.save();
    logger.info(`File ${fileName} has been downloaded by ${username}`);
  });

  return watcher.stop;
};

module.exports = watchFtpActivity;
