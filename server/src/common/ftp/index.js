const config = require("config");
const path = require("path");
const { appendFile, writeFile, readFile, chown } = require("fs").promises;
const { remove: removeFile, ensureFile, ensureDir } = require("fs-extra");
const { removeLine } = require("../utils/fileUtils");
const ftpWatcher = require("./ftpWatcher");

const FTP_FILES_OWNER = { uid: 1000, gid: 1000 };

module.exports = (ftpDir = config.ftpDir) => {
  const passwdFile = path.join(ftpDir, "vsftpd_pam");
  const permissionsDir = path.join(ftpDir, "vsftpd_user_conf");
  const getHome = (username) => path.join(ftpDir, "users", username);

  return {
    ensureReady: async () => {
      await Promise.all([
        ensureFile(path.join(ftpDir, "ftp.log")),
        ensureFile(path.join(ftpDir, "vsftpd_pam")),
        ensureDir(path.join(ftpDir, "vsftpd_user_conf")),
        ensureDir(path.join(ftpDir, "users")),
      ]);
    },
    getHome,
    getFilesOwner: () => FTP_FILES_OWNER,
    addUser: async (user) => {
      const home = getHome(user.username);
      const processedFilesPath = path.join(home, "processed");

      await ensureDir(home);
      await ensureDir(processedFilesPath);
      await appendFile(passwdFile, `${user.username}:${user.password}\n`);

      await writeFile(path.join(permissionsDir, user.username), "write_enable=YES");

      await chown(home, FTP_FILES_OWNER.uid, FTP_FILES_OWNER.gid);
      await chown(processedFilesPath, FTP_FILES_OWNER.uid, FTP_FILES_OWNER.gid);
    },
    removeUser: async (user) => {
      const passwd = await readFile(passwdFile, "utf8");
      return Promise.all([
        removeFile(getHome(user.username)),
        writeFile(passwdFile, removeLine(passwd, new RegExp(`^${user.username}:\\$`)), "utf8"),
        removeFile(path.join(permissionsDir, user.username)),
      ]);
    },
    createFtpWatcher: () => {
      return ftpWatcher(path.join(ftpDir, "ftp.log"));
    },
  };
};
