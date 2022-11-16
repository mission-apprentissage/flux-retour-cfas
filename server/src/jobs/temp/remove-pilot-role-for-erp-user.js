const { runScript } = require("../scriptWrapper");
const { apiRoles } = require("../../common/roles");

runScript(async ({ db }) => {
  await db
    .collection("users")
    .updateMany({ permissions: apiRoles.apiStatutsSeeder }, { $set: { permissions: [apiRoles.apiStatutsSeeder] } });
}, "remove-pilot-role-for-erp-user");
