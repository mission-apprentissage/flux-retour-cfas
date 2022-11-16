// In this file you can configure migrate-mongo
// eslint-disable-next-line node/no-unpublished-import
import "dotenv/config.js";
import { config as appConfig } from "./config/index.js";

const config = {
  mongodb: {
    url: appConfig.mongodb.uri,
    databaseName: "",
    options: {
      useNewUrlParser: true, // removes a deprecation warning when connecting
      useUnifiedTopology: true, // removes a deprecating warning when connecting
      //   connectTimeoutMS: 3600000, // increase connection timeout to 1 hour
      //   socketTimeoutMS: 3600000, // increase socket timeout to 1 hour
    },
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: "migrations",

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: "changelog",

  // The file extension to create migrations and search for in migration dir
  migrationFileExtension: ".js",

  // Don't change this, unless you know what you're doing
  moduleSystem: "esm",
};

export default config;
