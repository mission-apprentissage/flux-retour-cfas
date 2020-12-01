const path = require("path");
// eslint-disable-next-line node/no-unpublished-require
require("dotenv").config();
const appConfig = require("./config");

const config = {
  mongodb: {
    url: appConfig.mongodb.uri,

    databaseName: "",

    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: path.join(__dirname, "migrations"),

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: "changelog",

  // The file extension to create migrations and search for in migration dir
  migrationFileExtension: ".js",
};

// Return the config as a promise
module.exports = config;
