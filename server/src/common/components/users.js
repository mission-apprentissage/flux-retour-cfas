const { User } = require("../model");
const sha512Utils = require("../utils/sha512Utils");

const rehashPassword = (user, password) => {
  user.password = sha512Utils.hash(password);
  return user.save();
};

module.exports = async () => {
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
      const permissions = options.permissions || {};

      const user = new User({
        username,
        password: hash,
        isAdmin: !!permissions.isAdmin,
      });

      await user.save();
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
  };
};
