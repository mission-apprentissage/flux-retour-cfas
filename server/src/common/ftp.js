const config = require("config");
const path = require("path");
const { appendFile, writeFile, readFile, chown } = require("fs").promises;
const { remove: removeFile, ensureFile, ensureDir } = require("fs-extra");
const { removeLine } = require("./utils/fileUtils");
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
    addUser: (user) => {
      let home = getHome(user.username);

      return Promise.all([
        ensureDir(home),
        appendFile(passwdFile, `${user.username}:${user.password}\n`),
        writeFile(path.join(permissionsDir, user.username), "write_enable=YES"),
      ]).then(() => chown(home, FTP_FILES_OWNER.uid, FTP_FILES_OWNER.gid));
    },
    removeUser: async (user) => {
      let passwd = await readFile(passwdFile, "utf8");
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
