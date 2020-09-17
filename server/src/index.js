const server = require("./http/server");
const logger = require("./common/logger");
const config = require("config");
const createComponents = require("./common/components/components");

process.on("unhandledRejection", (e) => logger.error("An unexpected error occurred", e));
process.on("uncaughtException", (e) => logger.error("An unexpected error occurred", e));

(async function () {
  const components = await createComponents();
  const http = await server(components);
  http.listen(5000, () => logger.info(`${config.appName} - Server ready and listening on port ${5000}`));
})();
