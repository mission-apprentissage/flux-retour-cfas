// eslint-disable-next-line node/no-unpublished-require
import axiosist from "axiosist";

import createComponents from "../../src/common/components/components";
import server from "../../src/http/server";
import { getDatabase } from "../../src/common/mongodb";
import redisFakeClient from "./redisClientMock";

export const startServer = async () => {
  const components = await createComponents({
    db: getDatabase(),
    redisClient: redisFakeClient,
    ovhStorage: {},
  });
  const app = await server(components);
  const httpClient = axiosist(app);

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
