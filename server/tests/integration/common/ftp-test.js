// const assert = require("assert");
const integrationTests = require("../../utils/integrationTests");
// const users = require("../../../src/common/components/users");
// const { User } = require("../../../src/common/model");
// const { ftpAccess } = require("../../../src/common/roles");

integrationTests(__filename, () => {
  it("Permet de créer un utilisateur avec le droit d'accès FTP", async () => {
    // const { ftpDir } = await getContext();
    // const { createUser } = await users(ftpDir);
    // const createdUser = await createUser("userWithFtp", "password", { permissions: [ftpAccess] });
    // // Check creation
    // assert.strictEqual(createdUser.username, "userWithFtp");
    // assert.strictEqual(createdUser.permissions.length, 1);
    // assert.strictEqual(createdUser.permissions.includes(ftpAccess), true);
    // assert.strictEqual(createdUser.password.startsWith("$6$rounds=1001"), true);
    // // Check find in db
    // const found = await User.findOne({ username: "userWithFtp" });
    // assert.strictEqual(found.username, "userWithFtp");
    // assert.strictEqual(found.permissions.length, 1);
    // assert.strictEqual(found.permissions.includes(ftpAccess), true);
    // assert.strictEqual(found.password.startsWith("$6$rounds=1001"), true);
  });

  it("Permet de créer un utilisateur avec le droit d'accès FTP et d'accéder au serveur", async () => {
    // const { ftpDir } = await getContext();
    // const { createUser } = await users(ftpDir);
    // const createdUser = await createUser("userWithFtp", "password", { permissions: [ftpAccess] });
    // // Check creation
    // assert.strictEqual(createdUser.username, "userWithFtp");
    // assert.strictEqual(createdUser.permissions.length, 1);
    // assert.strictEqual(createdUser.permissions.includes(ftpAccess), true);
    // assert.strictEqual(createdUser.password.startsWith("$6$rounds=1001"), true);
    // // Check find in db
    // const found = await User.findOne({ username: "userWithFtp" });
    // assert.strictEqual(found.username, "userWithFtp");
    // assert.strictEqual(found.permissions.length, 1);
    // assert.strictEqual(found.permissions.includes(ftpAccess), true);
    // assert.strictEqual(found.password.startsWith("$6$rounds=1001"), true);
    // // Ftp access
    // // TODO
  });
});
