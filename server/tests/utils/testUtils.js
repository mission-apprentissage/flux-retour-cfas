// eslint-disable-next-line node/no-unpublished-require
const axiosist = require("axiosist");
const createComponents = require("../../src/common/components/components");
const server = require("../../src/http/server");
const { mongooseInstance } = require("../../src/common/mongodb");
const redisFakeClient = require("./redisClientMock");

const startServer = async () => {
  const components = await createComponents({
    db: mongooseInstance.connection,
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
    createAndLogPsUser: async (email, password, role, options) => {
      await components.partageSimplifieUsers.createUser({ email, password, role, ...options });

      const response = await httpClient.post("/api/partage-simplifie/login", { email, password });

      return {
        Authorization: "Bearer " + response.data.access_token,
      };
    },
  };
};

const wait = async (time) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

module.exports = {
  startServer,
  wait,
};
