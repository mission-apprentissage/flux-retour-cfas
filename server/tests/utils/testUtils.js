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
  };
};

module.exports = {
  startServer,
};
