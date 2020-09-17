const crypto = require("crypto");
const config = require("config");
const { sha512crypt } = require("sha512crypt-node");

module.exports = {
  hash: (password, rounds = config.auth.passwordHashRounds) => {
    const salt = crypto.randomBytes(16).toString("hex");
    return sha512crypt(password, `$6$rounds=${rounds}$${salt}`);
  },
  compare: (password, hash) => {
    const array = hash.split("$");
    array.pop();

    return sha512crypt(password, array.join("$")) === hash;
  },
  isTooWeak: (hash) => {
    const array = hash.split("$");
    const round = array[2].split("=")[1];
    return round < config.auth.passwordHashRounds;
  },
};
