const { User, UserEvent } = require("../model");
const sha512Utils = require("../utils/sha512Utils");
const { ftpAccess } = require("../roles");
const createFtp = require("../ftp");
const logger = require("../../common/logger");
const { readdir } = require("fs-extra");

const rehashPassword = (user, password) => {
  user.password = sha512Utils.hash(password);
  return user.save();
};

module.exports = async () => {
  const ftp = createFtp();
  await ftp.ensureReady();

  return {
    authenticate: async (username, password) => {
      const user = await User.findOne({ username });
      if (!user) {
        return null;
      }

      const current = user.password;
      if (sha512Utils.compare(password, current)) {
        if (sha512Utils.isTooWeak(current)) {
          await rehashPassword(user, password);
        }
        return user.toObject();
      }
      return null;
    },
    getUser: (username) => User.findOne({ username }),
    createUser: async (username, password, options = {}) => {
      const hash = options.hash || sha512Utils.hash(password);
      const permissions = options.permissions || [];
      const apiKey = options.apiKey || null;

      const user = new User({
        username,
        password: hash,
        apiKey,
        permissions: permissions,
      });

      await user.save();

      // would be better to emit a "USER_CREATED" event and do this in another module so the users component is not coupled with ftp
      if (permissions.includes(ftpAccess)) {
        await ftp.addUser(user);
      }

      return user.toObject();
    },
    removeUser: async (username) => {
      const user = await User.findOne({ username });
      if (!user) {
        throw new Error(`Unable to find user ${username}`);
      }

      return await user.deleteOne({ username });
    },
    changePassword: async (username, newPassword) => {
      const user = await User.findOne({ username });
      if (!user) {
        throw new Error(`Unable to find user ${username}`);
      }

      user.password = sha512Utils.hash(newPassword);
      await user.save();

      return user.toObject();
    },
    getFtpFiles: async (username) => readdir(ftp.getHome(username)),
    recordFtpActivity: async () => {
      let watcher = await ftp.createFtpWatcher();

      watcher.onLogin((username) => {
        const event = new UserEvent({ type: "ftp", action: "login", username });
        event.save();
        logger.info(`${username} logged into FTP`);
      });

      watcher.onFileUploaded((username, fileName) => {
        const event = new UserEvent({ type: "ftp", action: "upload", username, data: fileName });
        event.save();
        logger.info(`${fileName} has been uploaded`);
      });

      watcher.onFileDownloaded((username, fileName) => {
        const event = new UserEvent({ type: "ftp", action: "download", username, data: fileName });
        event.save();
        logger.info(`File ${fileName} has been downloaded by ${username}`);
      });

      return watcher.stop;
    },
  };
};
