const { runScript } = require("../scriptWrapper");
const seedSample = require("./seed");
const createUsers = require("./createUsers");

runScript(async ({ users, db }) => {
  await seedSample(db);
  await createUsers(users);
});
