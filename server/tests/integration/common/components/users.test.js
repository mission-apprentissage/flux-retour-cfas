const assert = require("assert");
const integrationTests = require("../../../utils/integrationTests");
const users = require("../../../../src/common/components/users");
const { User } = require("../../../../src/common/model");
const { administrator } = require("../../../../src/common/roles");

integrationTests(__filename, () => {
  it("Permet de créer un utilisateur", async () => {
    const { createUser } = await users();

    const created = await createUser("user", "password");
    assert.strictEqual(created.username, "user");
    assert.strictEqual(created.permissions.length, 0);
    assert.strictEqual(created.password.startsWith("$6$rounds="), true);

    const found = await User.findOne({ username: "user" });
    assert.strictEqual(found.username, "user");
    assert.strictEqual(found.permissions.length, 0);
    assert.strictEqual(found.password.startsWith("$6$rounds="), true);
  });

  it("Permet de créer un utilisateur avec les droits d'admin", async () => {
    const { createUser } = await users();

    const user = await createUser("userAdmin", "password", { permissions: [administrator] });
    const found = await User.findOne({ username: "userAdmin" });

    assert.strictEqual(user.permissions.includes(administrator), true);
    assert.strictEqual(found.permissions.includes(administrator), true);
  });

  it("Permet de créer un utilisateur avec une clé d'API", async () => {
    const { createUser } = await users();

    const user = await createUser("userAdmin", "password", { permissions: [administrator], apiKey: "12345" });
    const found = await User.findOne({ username: "userAdmin" });

    assert.strictEqual(user.apiKey, "12345");
    assert.strictEqual(found.apiKey, "12345");
  });

  it("Permet de supprimer un utilisateur", async () => {
    const { createUser, removeUser } = await users();

    await createUser("userToDelete", "password", { permissions: [administrator] });
    await removeUser("userToDelete");

    const found = await User.findOne({ username: "userToDelete" });
    assert.strictEqual(found, null);
  });

  it("Vérifie que le mot de passe est valide", async () => {
    const { createUser, authenticate } = await users();

    await createUser("user", "password");
    const user = await authenticate("user", "password");

    assert.strictEqual(user.username, "user");
  });

  it("Vérifie que le mot de passe est invalide", async () => {
    const { createUser, authenticate } = await users();

    await createUser("user", "password");
    const user = await authenticate("user", "INVALID");

    assert.strictEqual(user, null);
  });

  it("Vérifie qu'on peut changer le mot de passe d'un utilisateur", async () => {
    const { createUser, authenticate, changePassword } = await users();

    await createUser("user", "password");
    await changePassword("user", "newPassword");
    const user = await authenticate("user", "newPassword");

    assert.strictEqual(user.username, "user");
  });
});
