import axiosist from "axiosist";
import createComponents from "../../src/common/components/components.js";
import server from "../../src/http/server.js";
import { configureDbSchemaValidation } from "../../src/common/mongodb.js";
import redisFakeClient from "./redisClientMock.js";
import { modelDescriptors } from "../../src/common/model/collections.js";
import { createUserLegacy } from "../../src/common/actions/legacy/users.legacy.actions.js";

export const startServer = async () => {
  const components = await createComponents();
  const services = { cache: redisFakeClient };
  const app = await server({ ...components, ...services });

  const httpClient = axiosist(app);

  await configureDbSchemaValidation(modelDescriptors);

  return {
    httpClient,
    components,
    // Legacy auth jwt
    createAndLogUserLegacy: async (username, password, options) => {
      await createUserLegacy({ username, password, ...options });

      const response = await httpClient.post("/api/login", {
        username: username,
        password: password,
      });

      return {
        Authorization: "Bearer " + response.data.access_token,
      };
    },
    // New auth cookie log user method
    logUser: async (email, password) => {
      const response = await httpClient.post("/api/v1/auth/login", { email, password });
      return { cookie: response.headers["set-cookie"].join(";") };
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
