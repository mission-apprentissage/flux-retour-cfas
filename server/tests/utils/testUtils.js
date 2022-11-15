// eslint-disable-next-line node/no-unpublished-require
const axiosist = require("axiosist");
const createComponents = require("../../src/common/components/components");
const server = require("../../src/http/server");
const { getDatabase, configureDbSchemaValidation } = require("../../src/common/mongodb");
const redisFakeClient = require("./redisClientMock");
const { modelDescriptors } = require("../../src/common/model/collections");

import createComponents from "../../src/common/components/components.js";
import server from "../../src/http/server.js";
import { getDatabase } from "../../src/common/mongodb.js";
import redisFakeClient from "./redisClientMock.js";

export const startServer = async () => {
  const components = await createComponents({
    db: getDatabase(),
    redisClient: redisFakeClient,
    ovhStorage: {},
  });
  const app = await server(components);
  const httpClient = axiosist(app);
  await configureDbSchemaValidation(modelDescriptors);

  return {
    httpClient,
    components,
    createAndLogUser: async (username, password, options) => {
      await components.users.createUser({ username, password, ...options });

      const response = await httpClient.post("/api/login", {
        username: username,
        password: password,
      });

      return {
        Authorization: "Bearer " + response.data.access_token,
      };
    },
  };
};

export const wait = async (time) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};
