import axiosist from "axiosist";
import server from "../../src/http/server";
import { configureDbSchemaValidation } from "../../src/common/mongodb";
import redisFakeClient from "./redisClientMock";
import { modelDescriptors } from "../../src/common/model/collections";
import { createUserLegacy } from "../../src/common/actions/legacy/users.legacy.actions";
import { createUser } from "../../src/common/actions/users.actions";

export const startServer = async () => {
  const services = { cache: redisFakeClient };
  const app = await server(services);

  const httpClient = axiosist(app);

  await configureDbSchemaValidation(modelDescriptors);

  return {
    httpClient,
    // Legacy auth jwt
    createAndLogUserLegacy: async (username, password, options) => {
      await createUserLegacy({ username, password, ...options });

      const response = await httpClient.post("/api/login", {
        username: username,
        password: password,
      });

      return {
        Authorization: `Bearer ${response.data.access_token}`,
      };
    },
    // New auth cookie log user method
    logUser: async (email, password) => {
      const response = await httpClient.post("/api/v1/auth/login", { email, password });
      return { cookie: response.headers["set-cookie"].join(";") };
    },
  };
};

export const createSimpleUser = async () => {
  const data = { email: "test@test.beta.gouv.fr", password: "password" };
  await createUser(data, {
    permissions: { is_admin: false, is_cross_organismes: true },
  });
  return data;
};

export const createAdminUser = async () => {
  const data = { email: "admin@test.beta.gouv.fr", password: "password" };
  await createUser(data, {
    permissions: { is_admin: true, is_cross_organismes: true },
  });
  return data;
};
