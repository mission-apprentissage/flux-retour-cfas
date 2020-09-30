const { runScript } = require("../scriptWrapper");
const createUsers = require("./createUsers");

runScript(async ({ users }) => {
  await createUsers(users);
});
