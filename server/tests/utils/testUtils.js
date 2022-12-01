import axiosist from "axiosist";
import createComponents from "../../src/common/components/components.js";
import server from "../../src/http/server.js";
import { getDatabase, configureDbSchemaValidation } from "../../src/common/mongodb.js";
import redisFakeClient from "./redisClientMock.js";
import { modelDescriptors } from "../../src/common/model/collections.js";

export const startServer = async () => {
  getDatabase();
  const components = await createComponents();
  const app = await server(...{ components }, ...{ cache: redisFakeClient });
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
