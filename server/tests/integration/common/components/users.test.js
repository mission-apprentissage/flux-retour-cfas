const assert = require("assert").strict;
const { subMinutes, differenceInCalendarDays, differenceInHours } = require("date-fns");
const mongoose = require("mongoose");
const users = require("../../../../src/common/components/users");
const { UserModel } = require("../../../../src/common/model");
const { apiRoles, tdbRoles } = require("../../../../src/common/roles");

describe(__filename, () => {
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

  it("Permet de créer un utilisateur avec un email, les droits de réseau et un réseau, une région et un organisme", async () => {
    const { createUser } = await users();

    const user = await createUser({
      username: "userAdmin",
      password: "password",
      permissions: [tdbRoles.network],
      email: "email@test.fr",
      network: "test",
      region: "REGION",
      organisme: "ORGANISME",
    });
    const found = await UserModel.findOne({ username: "userAdmin" });

    assert.equal(user.permissions.includes(tdbRoles.network), true);
    assert.equal(user.network === "test", true);
    assert.equal(user.email === "email@test.fr", true);

    assert.equal(found.permissions.includes(tdbRoles.network), true);
    assert.equal(found.network === "test", true);
    assert.equal(found.region === "REGION", true);
    assert.equal(found.organisme === "ORGANISME", true);
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

  describe("generatePasswordUpdateToken", () => {
    it("génère un token avec expiration à +48h", async () => {
      const { createUser, generatePasswordUpdateToken } = await users();

      // create user
      const user = await createUser({ username: "user" });

      const token = await generatePasswordUpdateToken("user");
      const userInDb = await UserModel.findOne({ _id: user._id });

      assert.equal(userInDb.password_update_token, token);
      // password token should expire in 48h
      assert.equal(differenceInHours(userInDb.password_update_token_expiry, new Date()), 47);
      assert.equal(differenceInCalendarDays(userInDb.password_update_token_expiry, new Date()), 2);
    });

    it("renvoie une erreur quand le user n'est pas trouvé", async () => {
      const { createUser, generatePasswordUpdateToken } = await users();

      // create user
      await createUser({ username: "nope" });

      await assert.rejects(
        () => generatePasswordUpdateToken("user"),
        (err) => {
          assert.equal(err.message, "User not found");
          return true;
        }
      );
    });
  });

  describe("updatePassword", () => {
    it("modifie le mot de passe d'un user et invalide le token d'update", async () => {
      const { createUser, updatePassword, generatePasswordUpdateToken } = await users();

      // create user
      const user = await createUser({ username: "user" });
      // generate update token
      const token = await generatePasswordUpdateToken("user");

      await updatePassword(token, "new-password-strong");
      const foundAfterUpdate = await UserModel.findOne({ _id: user._id });

      assert.notEqual(foundAfterUpdate.password, user.password);
      assert.equal(foundAfterUpdate.password_update_token, null);
      assert.equal(foundAfterUpdate.password_update_token_expiry, null);
    });

    it("renvoie une erreur quand le token passé ne permet pas de retrouver le user", async () => {
      const { createUser, updatePassword, generatePasswordUpdateToken } = await users();

      // create user
      await createUser({ username: "user" });
      // generate update token
      await generatePasswordUpdateToken("user");

      await assert.rejects(
        () => updatePassword("wrong token", "new-password-strong"),
        (err) => {
          assert.equal(err.message, "User not found");
          return true;
        }
      );
    });

    it("renvoie une erreur lorsque le nouveau mot de passe est trop court", async () => {
      const { createUser, updatePassword, generatePasswordUpdateToken } = await users();

      // create user
      await createUser({ username: "user" });
      // generate update token
      const token = await generatePasswordUpdateToken("user");

      const shortPassword = "hello-world";

      await assert.rejects(
        () => updatePassword(token, shortPassword),
        (err) => {
          assert.equal(err.message, "Password must be valid (at least 16 characters)");
          return true;
        }
      );
    });

    it("renvoie une erreur lorsque l'update est fait plus de 24h après la création du token", async () => {
      const { createUser, updatePassword, generatePasswordUpdateToken } = await users();

      // create user
      await createUser({ username: "user" });
      // generate update token
      const token = await generatePasswordUpdateToken("user");
      // force password_update_token_expiry to 10 minutes ago
      const user = await UserModel.findOne({ username: "user" });
      user.password_update_token_expiry = subMinutes(new Date(), 10);
      await user.save();

      await assert.rejects(
        () => updatePassword(token, "super-long-strong-password"),
        (err) => {
          assert.equal(err.message, "Password update token has expired");
          return true;
        }
      );
    });

    it("renvoie une erreur lorsque l'update est tenté avec un token null", async () => {
      const { createUser, updatePassword } = await users();

      // create user
      await createUser({ username: "user" });

      await assert.rejects(
        () => updatePassword(null, "super-long-strong-password"),
        (err) => {
          assert.equal(err.message, "User not found");
          return true;
        }
      );
    });

    it("renvoie une erreur lorsque l'update a déjà été fait", async () => {
      const { createUser, updatePassword, generatePasswordUpdateToken } = await users();

      // create user
      await createUser({ username: "user" });

      // generate update token
      const token = await generatePasswordUpdateToken("user");

      // update password first time
      await updatePassword(token, "new-password-strong");

      // try again
      await assert.rejects(
        () => updatePassword(token, "super-long-strong-password"),
        (err) => {
          assert.equal(err.message, "User not found");
          return true;
        }
      );
    });
  });

  describe("searchUsers", async () => {
    const { searchUsers, createUser } = await users();

    it("returns results matching username", async () => {
      const searchTerm = "haver";
      const usernameTest = "havertz";

      const user = await createUser({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await UserModel.findOne({ username: usernameTest });

      assert.equal(found.permissions.includes(tdbRoles.network), true);
      assert.equal(found.network === user.network, true);
      assert.equal(found.email === user.email, true);

      const results = await searchUsers({ searchTerm });

      assert.equal(results.length, 1);
      assert.ok(results[0].username, user.username);
    });

    it("returns results matching username case insensitive", async () => {
      const searchTerm = "HaVEr";
      const usernameTest = "havertz";

      const user = await createUser({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await UserModel.findOne({ username: usernameTest });

      assert.equal(found.permissions.includes(tdbRoles.network), true);
      assert.equal(found.network === user.network, true);
      assert.equal(found.email === user.email, true);

      const results = await searchUsers({ searchTerm });

      assert.equal(results.length, 1);
      assert.ok(results[0].username, user.username);
    });

    it("does not returns results without match on username", async () => {
      const searchTerm = "benzema";
      const usernameTest = "havertz";

      const user = await createUser({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await UserModel.findOne({ username: usernameTest });

      assert.equal(found.permissions.includes(tdbRoles.network), true);
      assert.equal(found.network === user.network, true);
      assert.equal(found.email === user.email, true);

      const results = await searchUsers({ searchTerm });

      assert.equal(results.length, 0);
    });

    it("returns results matching email", async () => {
      const searchTerm = "rma";
      const usernameTest = "havertz";

      const user = await createUser({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await UserModel.findOne({ username: usernameTest });

      assert.equal(found.permissions.includes(tdbRoles.network), true);
      assert.equal(found.network === user.network, true);
      assert.equal(found.email === user.email, true);

      const results = await searchUsers({ searchTerm });

      assert.equal(results.length, 1);
      assert.ok(results[0].username, user.username);
    });

    it("returns results matching email case insensitive", async () => {
      const searchTerm = "RMa";
      const usernameTest = "havertz";

      const user = await createUser({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await UserModel.findOne({ username: usernameTest });

      assert.equal(found.permissions.includes(tdbRoles.network), true);
      assert.equal(found.network === user.network, true);
      assert.equal(found.email === user.email, true);

      const results = await searchUsers({ searchTerm });

      assert.equal(results.length, 1);
      assert.ok(results[0].username, user.username);
    });

    it("does not returns results without match on email", async () => {
      const searchTerm = "fcbarcelona";
      const usernameTest = "havertz";

      const user = await createUser({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await UserModel.findOne({ username: usernameTest });

      assert.equal(found.permissions.includes(tdbRoles.network), true);
      assert.equal(found.network === user.network, true);
      assert.equal(found.email === user.email, true);

      const results = await searchUsers({ searchTerm });

      assert.equal(results.length, 0);
    });

    it("returns results matching organisme", async () => {
      const searchTerm = "ORGAN";
      const usernameTest = "havertz";

      const user = await createUser({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await UserModel.findOne({ username: usernameTest });

      assert.equal(found.permissions.includes(tdbRoles.network), true);
      assert.equal(found.network === user.network, true);
      assert.equal(found.email === user.email, true);

      const results = await searchUsers({ searchTerm });

      assert.equal(results.length, 1);
      assert.ok(results[0].username, user.username);
    });

    it("returns results matching organisme case insensitive", async () => {
      const searchTerm = "organ";
      const usernameTest = "havertz";

      const user = await createUser({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await UserModel.findOne({ username: usernameTest });

      assert.equal(found.permissions.includes(tdbRoles.network), true);
      assert.equal(found.network === user.network, true);
      assert.equal(found.email === user.email, true);

      const results = await searchUsers({ searchTerm });

      assert.equal(results.length, 1);
      assert.ok(results[0].username, user.username);
    });

    it("does not returns results without match on organisme", async () => {
      const searchTerm = "BAD";
      const usernameTest = "havertz";

      const user = await createUser({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await UserModel.findOne({ username: usernameTest });

      assert.equal(found.permissions.includes(tdbRoles.network), true);
      assert.equal(found.network === user.network, true);
      assert.equal(found.email === user.email, true);

      const results = await searchUsers({ searchTerm });

      assert.equal(results.length, 0);
    });

    it("returns results matching region", async () => {
      const searchTerm = "REGI";
      const usernameTest = "havertz";

      const user = await createUser({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await UserModel.findOne({ username: usernameTest });

      assert.equal(found.permissions.includes(tdbRoles.network), true);
      assert.equal(found.network === user.network, true);
      assert.equal(found.email === user.email, true);

      const results = await searchUsers({ searchTerm });

      assert.equal(results.length, 1);
      assert.ok(results[0].username, user.username);
    });

    it("returns results matching region case insensitive", async () => {
      const searchTerm = "regi";
      const usernameTest = "havertz";

      const user = await createUser({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await UserModel.findOne({ username: usernameTest });

      assert.equal(found.permissions.includes(tdbRoles.network), true);
      assert.equal(found.network === user.network, true);
      assert.equal(found.email === user.email, true);

      const results = await searchUsers({ searchTerm });

      assert.equal(results.length, 1);
      assert.ok(results[0].username, user.username);
    });
  });

  describe("updateUser", () => {
    it("renvoie une erreur quand l'id passé pour la maj d'un utilisateur n'est pas valide", async () => {
      const { createUser, updateUser } = await users();

      const usernameTest = "userTest";

      // create user
      await createUser({ username: usernameTest });

      // find user
      const found = await UserModel.findOne({ username: usernameTest });
      assert.equal(found.username === usernameTest, true);
      assert.equal(found._id !== null, true);

      // update user with bad id
      const objectId = new mongoose.Types.ObjectId();
      await assert.rejects(updateUser(objectId, { username: "UPDATED" }), { message: "Unable to find user" });
    });

    it("Permets la MAJ d'un utilisateur pour son username", async () => {
      const { createUser, updateUser } = await users();

      const usernameTest = "userTest";

      // create user
      await createUser({ username: usernameTest });

      // find user
      const found = await UserModel.findOne({ username: usernameTest });
      assert.equal(found.username === usernameTest, true);
      assert.equal(found._id !== null, true);

      // update user
      const updatedUserName = "UPDATED";
      await updateUser(found._id, { username: updatedUserName });

      // Check update
      const foundAfterUpdate = await UserModel.findById(found._id);
      assert.equal(foundAfterUpdate.username === updatedUserName, true);
    });

    it("Permets la MAJ d'un utilisateur pour son email", async () => {
      const { createUser, updateUser } = await users();

      const usernameTest = "userTest";

      // create user
      await createUser({ username: usernameTest, email: "test@test.fr" });

      // find user
      const found = await UserModel.findOne({ username: usernameTest });
      assert.equal(found.email === "test@test.fr", true);
      assert.equal(found._id !== null, true);

      // update user
      const updateValue = "UPDATED@test.fr";
      await updateUser(found._id, { email: updateValue });

      // Check update
      const foundAfterUpdate = await UserModel.findById(found._id);
      assert.equal(foundAfterUpdate.email === updateValue, true);
    });

    it("Permets la MAJ d'un utilisateur pour ses permissions", async () => {
      const { createUser, updateUser } = await users();

      const usernameTest = "userTest";

      // create user
      await createUser({ username: usernameTest, permissions: [tdbRoles.network] });

      // find user
      const found = await UserModel.findOne({ username: usernameTest });
      assert.equal(found.permissions.length === 1, true);
      assert.equal(found.permissions[0] === tdbRoles.network, true);
      assert.equal(found._id !== null, true);

      // update user
      const updateValue = [tdbRoles.cfa, tdbRoles.pilot];
      await updateUser(found._id, { permissions: updateValue });

      // Check update
      const foundAfterUpdate = await UserModel.findById(found._id);
      assert.equal(foundAfterUpdate.permissions.length === 2, true);
      assert.equal(foundAfterUpdate.permissions[0] === tdbRoles.cfa, true);
      assert.equal(foundAfterUpdate.permissions[1] === tdbRoles.pilot, true);
    });

    it("Permets la MAJ d'un utilisateur pour son réseau", async () => {
      const { createUser, updateUser } = await users();

      const usernameTest = "userTest";

      // create user
      await createUser({ username: usernameTest, network: "TEST_RESEAU" });

      // find user
      const found = await UserModel.findOne({ username: usernameTest });
      assert.equal(found._id !== null, true);
      assert.equal(found.network === "TEST_RESEAU", true);

      // update user
      const updateValue = "UPDATED_NETWORK";
      await updateUser(found._id, { network: updateValue });

      // Check update
      const foundAfterUpdate = await UserModel.findById(found._id);
      assert.equal(foundAfterUpdate.network === updateValue, true);
    });

    it("Permets la MAJ d'un utilisateur pour sa région", async () => {
      const { createUser, updateUser } = await users();

      const usernameTest = "userTest";

      // create user
      await createUser({ username: usernameTest, region: "TEST_REGION" });

      // find user
      const found = await UserModel.findOne({ username: usernameTest });
      assert.equal(found._id !== null, true);
      assert.equal(found.region === "TEST_REGION", true);

      // update user
      const updateValue = "UPDATED_REGION";
      await updateUser(found._id, { region: updateValue });

      // Check update
      const foundAfterUpdate = await UserModel.findById(found._id);
      assert.equal(foundAfterUpdate.region === updateValue, true);
    });

    it("Permets la MAJ d'un utilisateur pour son organisme", async () => {
      const { createUser, updateUser } = await users();

      const usernameTest = "userTest";

      // create user
      await createUser({ username: usernameTest, organisme: "TEST_ORGANISME" });

      // find user
      const found = await UserModel.findOne({ username: usernameTest });
      assert.equal(found._id !== null, true);
      assert.equal(found.organisme === "TEST_ORGANISME", true);

      // update user
      const updateValue = "UPDATED_ORGANISME";
      await updateUser(found._id, { organisme: updateValue });

      // Check update
      const foundAfterUpdate = await UserModel.findById(found._id);
      assert.equal(foundAfterUpdate.organisme === updateValue, true);
    });
  });

  describe("getUserById", () => {
    it("renvoie une erreur quand l'id passé pour le getUserById n'est pas valide", async () => {
      const { createUser, getUserById } = await users();

      const usernameTest = "userTest";

      // create user
      await createUser({ username: usernameTest });

      // find user
      const found = await UserModel.findOne({ username: usernameTest });
      assert.equal(found.username === usernameTest, true);
      assert.equal(found._id !== null, true);

      // get user with bad id
      const objectId = new mongoose.Types.ObjectId();
      await assert.rejects(getUserById(objectId), { message: "Unable to find user" });
    });

    it("renvoie le bon utilisateur quand l'id passé pour le getUserById est pas valide", async () => {
      const { createUser, getUserById } = await users();

      const usernameTest = "userTest";

      // create user
      await createUser({ username: usernameTest });

      // find user
      const found = await UserModel.findOne({ username: usernameTest });
      assert.equal(found.username === usernameTest, true);
      assert.equal(found._id !== null, true);

      // get user with id
      const gettedUser = await getUserById(found._id);
      assert.equal(gettedUser.username === found.username, true);
    });
  });
});
