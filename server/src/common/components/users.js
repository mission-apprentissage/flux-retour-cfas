const { UserModel } = require("../model");
const { generateRandomAlphanumericPhrase } = require("../utils/miscUtils");
const sha512Utils = require("../utils/sha512Utils");

const rehashPassword = (user, password) => {
  user.password = sha512Utils.hash(password);
  return user.save();
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
    removeUser: async (username) => {
      const user = await UserModel.findOne({ username });
      if (!user) {
        throw new Error(`Unable to find user ${username}`);
      }

      return await user.deleteOne({ username });
    },
    changePassword: async (username, newPassword) => {
      const user = await UserModel.findOne({ username });
      if (!user) {
        throw new Error(`Unable to find user ${username}`);
      }

      user.password = sha512Utils.hash(newPassword);
      await user.save();

      return user.toObject();
    },
  };
};
