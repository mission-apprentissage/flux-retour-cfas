import axiosist from "axiosist";
import sinon from "sinon";

import server from "../../src/http/server.js";
import { configureDbSchemaValidation } from "../../src/common/mongodb.js";
import { modelDescriptors } from "../../src/common/model/collections.js";
import { createUserLegacy } from "../../src/common/actions/legacy/users.legacy.actions.js";

export const startServer = async () => {
  const mailer = { sendEmail: sinon.spy() };

  // FIXME revoir l'initialisation de l'application (1 point d'entrée, avec config pour savoir si démarrer services ou pas)
  // const services = { cache: redisFakeClient, mailer, clamav: { scan: () => {} } };
  const app = await server();

  const httpClient = axiosist(app);

  await configureDbSchemaValidation(modelDescriptors);

  return {
    httpClient,
    mailer,
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

// FIXME définir une API pour mettre au bons statuts directement
// export const createSimpleUser = async () => {
//   const data = { email: "test@test.beta.gouv.fr", password: "password" };
//   const createdUser = await createUser(data, {
//     is_admin: false,
//     is_cross_organismes: true,
//   });
//   return { ...createdUser, ...data };
// };

// export const createAdminUser = async () => {
//   const data = { email: "admin@test.beta.gouv.fr", password: "password" };
//   const createdUser = await createUser(data, {
//     is_admin: true,
//     is_cross_organismes: true,
//   });

//   return { ...createdUser, ...data };
// };
