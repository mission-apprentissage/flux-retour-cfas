const assert = require("assert").strict;
const integrationTests = require("../../../utils/integrationTests");
const users = require("../../../../src/common/components/users");
const { UserModel } = require("../../../../src/common/model");
const { apiRoles, tdbRoles } = require("../../../../src/common/roles");

integrationTests(__filename, () => {
  it("Permet de créer un utilisateur avec mot de passe", async () => {
    const { createUser } = await users();

    const created = await createUser({ username: "user", password: "password" });
    assert.equal(created.username, "user");
    assert.equal(created.permissions.length, 0);
    assert.equal(created.password.startsWith("$6$rounds="), true);

    const found = await UserModel.findOne({ username: "user" });
    assert.equal(found.username, "user");
    assert.equal(found.permissions.length, 0);
    assert.equal(found.password.startsWith("$6$rounds="), true);
  });

  it("Crée un utilisateur avec mot de passe random quand pas de mot de passe fourni", async () => {
    const { createUser } = await users();

    const created = await createUser({ username: "user" });
    assert.equal(created.username, "user");
    assert.equal(created.permissions.length, 0);
    assert.equal(created.password.startsWith("$6$rounds="), true);

    const found = await UserModel.findOne({ username: "user" });
    assert.equal(found.username, "user");
  });

  it("Permet de créer un utilisateur avec les droits d'admin", async () => {
    const { createUser } = await users();

    const user = await createUser({
      username: "userAdmin",
      password: "password",
      permissions: [apiRoles.administrator],
    });
    const found = await UserModel.findOne({ username: "userAdmin" });

    assert.equal(user.permissions.includes(apiRoles.administrator), true);
    assert.equal(found.permissions.includes(apiRoles.administrator), true);
  });

  it("Permet de créer un utilisateur avec un email, les droits de réseau et un réseau", async () => {
    const { createUser } = await users();

    const user = await createUser({
      username: "userAdmin",
      password: "password",
      permissions: [tdbRoles.network],
      email: "email@test.fr",
      network: "test",
    });
    const found = await UserModel.findOne({ username: "userAdmin" });

    assert.equal(user.permissions.includes(tdbRoles.network), true);
    assert.equal(user.network === "test", true);
    assert.equal(user.email === "email@test.fr", true);

    assert.equal(found.permissions.includes(tdbRoles.network), true);
    assert.equal(found.network === "test", true);
    assert.equal(found.email === "email@test.fr", true);
  });

  it("Permet de supprimer un utilisateur", async () => {
    const { createUser, removeUser } = await users();

    await createUser({
      username: "userToDelete",
      password: "password",
      permissions: [apiRoles.administrator],
    });
    await removeUser("userToDelete");

    const found = await UserModel.findOne({ username: "userToDelete" });
    assert.equal(found, null);
  });

  it("Vérifie que le mot de passe est valide", async () => {
    const { createUser, authenticate } = await users();

    await createUser({
      username: "user",
      password: "password",
    });
    const user = await authenticate("user", "password");

    assert.equal(user.username, "user");
  });

  it("Vérifie que le mot de passe est invalide", async () => {
    const { createUser, authenticate } = await users();

    await createUser({
      username: "user",
      password: "password",
    });
    const user = await authenticate("user", "INVALID");

    assert.equal(user, null);
  });

  it("Vérifie qu'on peut changer le mot de passe d'un utilisateur", async () => {
    const { createUser, authenticate, changePassword } = await users();

    await createUser({
      username: "user",
      password: "password",
    });
    await changePassword("user", "newPassword");
    const user = await authenticate("user", "newPassword");

    assert.equal(user.username, "user");
  });
});
