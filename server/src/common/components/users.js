const { addHours, isBefore } = require("date-fns");
const { UserModel } = require("../model");
const { generateRandomAlphanumericPhrase } = require("../utils/miscUtils");
const sha512Utils = require("../utils/sha512Utils");
const { validatePassword } = require("../domain/password");

const rehashPassword = (user, password) => {
  user.password = sha512Utils.hash(password);
  return user.save();
};

const PASSWORD_UPDATE_TOKEN_VALIDITY_HOURS = 24;

const isUserPasswordUpdatedTokenValid = (user) => {
  return Boolean(user.password_update_token_expiry) && isBefore(new Date(), user.password_update_token_expiry);
};

module.exports = async () => {
  return {
    authenticate: async (username, password) => {
      const user = await UserModel.findOne({ username });
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
    getUser: (username) => UserModel.findOne({ username }),
    createUser: async (userProps) => {
      const username = userProps.username;
      const password = userProps.password || generateRandomAlphanumericPhrase(80); // 1 hundred quadragintillion years to crack https://www.security.org/how-secure-is-my-password/
      const passwordHash = sha512Utils.hash(password);
      const permissions = userProps.permissions || [];
      const network = userProps.network || null;
      const email = userProps.email || null;

      const user = new UserModel({
        username,
        password: passwordHash,
        email,
        permissions,
        network,
      });

      await user.save();
      return user.toObject();
    },
    generatePasswordUpdateToken: async (username) => {
      const user = await UserModel.findOne({ username });

      if (!user) {
        throw new Error("User not found");
      }

      const token = generateRandomAlphanumericPhrase(80); // 1 hundred quadragintillion years to crack https://www.security.org/how-secure-is-my-password/

      user.password_update_token = token;
      user.password_update_token_expiry = addHours(new Date(), PASSWORD_UPDATE_TOKEN_VALIDITY_HOURS); // token will only be valid for 24 hours
      await user.save();
      return token;
    },
    updatePassword: async (updateToken, password) => {
      if (!validatePassword(password)) throw new Error("Password must be valid (at least 16 characters)");
      // find user with password_update_token and ensures it exists
      const user = await UserModel.findOne({
        password_update_token: updateToken,
        password_update_token_expiry: { $ne: null },
      });

      // throw if user is not found
      if (!user) throw new Error("User not found");

      // token must be valid
      if (!isUserPasswordUpdatedTokenValid(user)) {
        throw new Error("Password update token has expired");
      }

      // we store password hashes only
      const passwordHash = sha512Utils.hash(password);
      user.password = passwordHash;
      user.password_update_token = null;
      user.password_update_token_expiry = null;

      await user.save();

      return user.toObject();
    },
    removeUser: async (username) => {
      const user = await UserModel.findOne({ username });
      if (!user) {
        throw new Error(`Unable to find user ${username}`);
      }

      return await user.deleteOne({ username });
    },
  };
};
