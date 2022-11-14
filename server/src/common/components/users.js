const { ObjectId } = require("mongodb");
const { addHours, isBefore } = require("date-fns");
const { usersDb } = require("../model/collections");
const { generateRandomAlphanumericPhrase } = require("../utils/miscUtils");
const sha512Utils = require("../utils/sha512Utils");
const { validatePassword } = require("../domain/password");
const { escapeRegExp } = require("../utils/regexUtils");

const PASSWORD_UPDATE_TOKEN_VALIDITY_HOURS = 48;

const isUserPasswordUpdatedTokenValid = (user) => {
  return Boolean(user.password_update_token_expiry) && isBefore(new Date(), user.password_update_token_expiry);
};

module.exports = () => {
  return {
    authenticate: async (username, password) => {
      const user = await usersDb().findOne({ username });
      if (!user) {
        return null;
      }

      const current = user.password;
      if (sha512Utils.compare(password, current)) {
        if (sha512Utils.isTooWeak(current)) {
          await usersDb().updateOne({ _id: user._id }, { password: sha512Utils.hash(password) });
        }
        return user;
      }
      return null;
    },
    // TODO à tester
    getUser: async (username) => {
      return await usersDb().findOne({ username });
    },
    getUserById: async (id) => {
      const _id = new ObjectId(id);
      if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");
      const user = await usersDb().findOne({ _id });

      if (!user) {
        throw new Error(`Unable to find user`);
      }

      return user;
    },
    // TODO à tester
    getAll: async () => {
      return await usersDb().find().toArray();
    },
    createUser: async (userProps) => {
      const username = userProps.username;
      const password = userProps.password || generateRandomAlphanumericPhrase(80); // 1 hundred quadragintillion years to crack https://www.security.org/how-secure-is-my-password/
      const passwordHash = sha512Utils.hash(password);
      const permissions = userProps.permissions || [];
      const network = userProps.network;
      const region = userProps.region;
      const organisme = userProps.organisme;
      const email = userProps.email;

      // check if username is not taken
      const user = await usersDb().findOne({ username });
      if (user) throw new Error("User with this username already exists");

      const { insertedId } = await usersDb().insertOne({
        username,
        password: passwordHash,
        email,
        permissions,
        network,
        region,
        organisme,
        created_at: new Date(),
      });

      // TODO return only the id instead of the created object (single responsibility)
      return await usersDb().findOne({ _id: insertedId });
    },
    generatePasswordUpdateToken: async (username) => {
      const user = await usersDb().findOne({ username });

      if (!user) {
        throw new Error("User not found");
      }

      // 1 hundred quadragintillion years to crack https://www.security.org/how-secure-is-my-password/
      const token = generateRandomAlphanumericPhrase(80);
      // token will only be valid for duration defined in PASSWORD_UPDATE_TOKEN_VALIDITY_HOURS
      const tokenExpiry = addHours(new Date(), PASSWORD_UPDATE_TOKEN_VALIDITY_HOURS);

      await usersDb().updateOne(
        { _id: user._id },
        {
          $set: {
            password_update_token: token,
            password_update_token_expiry: tokenExpiry,
          },
        }
      );

      return token;
    },
    updatePassword: async (updateToken, password) => {
      if (!validatePassword(password)) throw new Error("Password must be valid (at least 16 characters)");
      // find user with password_update_token and ensures it exists
      const user = await usersDb().findOne({
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

      await usersDb().updateOne(
        { _id: user._id },
        {
          $set: {
            password: passwordHash,
            password_update_token: null,
            password_update_token_expiry: null,
          },
        }
      );

      // TODO return nothing (single responsibility)
      return user.username;
    },
    removeUser: async (username) => {
      const user = await usersDb().findOne({ username });
      if (!user) {
        throw new Error(`Unable to find user ${username}`);
      }

      await usersDb().deleteOne({ username });
    },
    searchUsers: async (searchCriteria) => {
      const { searchTerm } = searchCriteria;

      const matchStage = {};
      if (searchTerm) {
        matchStage.$or = [
          { username: new RegExp(escapeRegExp(searchTerm), "i") },
          { email: new RegExp(escapeRegExp(searchTerm), "i") },
          { organisme: new RegExp(escapeRegExp(searchTerm), "i") },
          { region: new RegExp(escapeRegExp(searchTerm), "i") },
        ];
      }

      const sortStage = { username: 1 };

      const found = await usersDb()
        .aggregate([{ $match: matchStage }, { $sort: sortStage }])
        .toArray();

      return found.map((user) => {
        return {
          id: user._id,
          username: user.username,
          email: user.email,
          permissions: user.permissions,
          network: user.network,
          region: user.region,
          organisme: user.organisme,
          created_at: user.created_at,
        };
      });
    },
    updateUser: async (id, { username, email, network, region, organisme }) => {
      const _id = new ObjectId(id);
      if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

      const user = await usersDb().findOne({ _id });

      if (!user) {
        throw new Error(`Unable to find user`);
      }

      await usersDb().updateOne(
        { _id },
        {
          $set: {
            username,
            email,
            network,
            region,
            organisme,
          },
        }
      );
    },
  };
};
