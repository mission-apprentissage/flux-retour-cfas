import { strict as assert } from "assert";
import { subMinutes, differenceInCalendarDays, differenceInSeconds } from "date-fns";
import mongodb from "mongodb";
import {
  authenticateLegacy,
  createUserLegacy,
  generatePasswordUpdateTokenLegacy,
  getUserLegacyById,
  removeUserLegacy,
  searchUsersLegacy,
  updatePasswordLegacy,
  updateUserLegacy,
} from "../../../../src/common/actions/legacy/users.legacy.actions.js";
import { usersDb } from "../../../../src/common/model/collections.js";
import { apiRoles, tdbRoles } from "../../../../src/common/roles.js";

describe("Components Users Test", () => {
  describe("createUserLegacy", () => {
    it("Permet de créer un utilisateur avec mot de passe", async () => {
      const createdId = await createUserLegacy({ username: "user", password: "password" });
      const found = await usersDb().findOne({ _id: createdId });
      assert.equal(found?.username, "user");
      assert.equal(found?.permissions.length, 0);
      assert.equal(found?.password.startsWith("$6$rounds="), true);
    });

    it("Renvoie une erreur lorsqu'un utilisateur avec le même username existe en base", async () => {
      const username = "user1";

      // first creation
      await createUserLegacy({ username });
      // second creation
      await assert.rejects(() => createUserLegacy({ username }));
    });

    it("Crée un utilisateur avec mot de passe random quand pas de mot de passe fourni", async () => {
      const createdId = await createUserLegacy({ username: "user" });
      const found = await usersDb().findOne({ _id: createdId });
      assert.equal(found?.username, "user");
      assert.equal(found?.permissions.length, 0);
      assert.equal(found?.password.startsWith("$6$rounds="), true);
    });

    it("Permet de créer un utilisateur avec les droits d'admin", async () => {
      const createdId = await createUserLegacy({
        username: "userAdmin",
        password: "password",
        permissions: [apiRoles.administrator],
      });
      const found = await usersDb().findOne({ _id: createdId });
      assert.equal(found?.permissions.includes(apiRoles.administrator), true);
    });

    it("Permet de créer un utilisateur avec un email, les droits de réseau et un réseau", async () => {
      const createdId = await createUserLegacy({
        username: "userAdmin",
        password: "password",
        permissions: [tdbRoles.network],
        email: "email@test.fr",
        network: "test",
      });
      const found = await usersDb().findOne({ _id: createdId });

      assert.equal(found?.permissions.includes(tdbRoles.network), true);
      assert.equal(found?.network === "test", true);
      assert.equal(found?.email === "email@test.fr", true);
    });

    it("Permet de créer un utilisateur avec un email, les droits de réseau et un réseau, une région et un organisme", async () => {
      const createdId = await createUserLegacy({
        username: "userAdmin",
        password: "password",
        permissions: [tdbRoles.network],
        email: "email@test.fr",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });
      const found = await usersDb().findOne({ _id: createdId });

      assert.equal(found?.permissions.includes(tdbRoles.network), true);
      assert.equal(found?.network === "test", true);
      assert.equal(found?.region === "REGION", true);
      assert.equal(found?.organisme === "ORGANISME", true);
      assert.equal(found?.email === "email@test.fr", true);
    });
  });

  describe("removeUser", () => {
    it("Permet de supprimer un utilisateur via son username", async () => {
      await createUserLegacy({
        username: "userToDelete",
        password: "password",
        permissions: [apiRoles.administrator],
      });
      await removeUserLegacy("userToDelete");

      const found = await usersDb().findOne({ username: "userToDelete" });
      assert.equal(found, null);
    });
  });

  describe("authenticate", () => {
    it("Vérifie que le mot de passe est valide", async () => {
      await createUserLegacy({
        username: "user",
        password: "password",
      });
      const user = await authenticateLegacy("user", "password");
      assert.strictEqual(user?.username, "user");
      assert.strictEqual(!!user?.last_connection, true);
    });

    it("Vérifie que le mot de passe est invalide", async () => {
      await createUserLegacy({
        username: "user",
        password: "password",
      });
      const user = await authenticateLegacy("user", "INVALID");

      assert.equal(user, null);
    });
  });

  describe("generatePasswordUpdateToken", () => {
    it("génère un token avec expiration à +48h", async () => {
      // create user
      const createdId = await createUserLegacy({ username: "user" });

      const token = await generatePasswordUpdateTokenLegacy("user");
      const userInDb = await usersDb().findOne({ _id: createdId });

      assert.equal(userInDb?.password_update_token, token);
      // password token should expire in 48h ~ 2880 minutes, ±1 seconds tolerance
      const diffSeconds = differenceInSeconds(userInDb?.password_update_token_expiry, new Date());
      const _48hoursInSeconds = 48 * 60 * 60;
      assert.equal(_48hoursInSeconds - diffSeconds <= 1, true);
      assert.equal(_48hoursInSeconds - diffSeconds >= 0, true);
      assert.equal(differenceInCalendarDays(userInDb?.password_update_token_expiry, new Date()), 2);
    });

    it("renvoie une erreur quand le user n'est pas trouvé", async () => {
      // create user
      await createUserLegacy({ username: "nope" });

      await assert.rejects(
        () => generatePasswordUpdateTokenLegacy("user"),
        (/** @type {Error} */ err: any) => {
          assert.equal(err.message, "User not found");
          return true;
        }
      );
    });
  });

  describe("updatePassword", () => {
    it("modifie le mot de passe d'un user et invalide le token d'update", async () => {
      // create user
      const createdId = await createUserLegacy({ username: "user" });
      const foundBeforeUpdate = await usersDb().findOne({ _id: createdId });

      // generate update token
      const token = await generatePasswordUpdateTokenLegacy("user");

      await updatePasswordLegacy(token, "new-password-strong");
      const foundAfterUpdate = await usersDb().findOne({ _id: createdId });

      assert.notEqual(foundAfterUpdate?.password, foundBeforeUpdate?.password);
      assert.equal(foundAfterUpdate?.password_update_token, null);
      assert.equal(foundAfterUpdate?.password_update_token_expiry, null);
    });

    it("renvoie une erreur quand le token passé ne permet pas de retrouver le user", async () => {
      // create user
      await createUserLegacy({ username: "user" });
      // generate update token
      await generatePasswordUpdateTokenLegacy("user");

      await assert.rejects(
        () => updatePasswordLegacy("wrong token", "new-password-strong"),
        (/** @type {Error} */ err: any) => {
          assert.equal(err.message, "User not found");
          return true;
        }
      );
    });

    it("renvoie une erreur lorsque le nouveau mot de passe est trop court", async () => {
      // create user
      await createUserLegacy({ username: "user" });
      // generate update token
      const token = await generatePasswordUpdateTokenLegacy("user");

      const shortPassword = "hello-world";

      await assert.rejects(
        () => updatePasswordLegacy(token, shortPassword),
        (/** @type {Error} */ err: any) => {
          assert.equal(err.message, "Password must be valid (at least 16 characters)");
          return true;
        }
      );
    });

    it("renvoie une erreur lorsque l'update est fait plus de 24h après la création du token", async () => {
      // create user
      const createdId = await createUserLegacy({ username: "user" });
      // generate update token
      const token = await generatePasswordUpdateTokenLegacy("user");
      // force password_update_token_expiry to 10 minutes ago
      const user = await usersDb().findOne({ _id: createdId });

      await usersDb().updateOne(
        { _id: user?._id },
        { $set: { password_update_token_expiry: subMinutes(new Date(), 10) } }
      );

      await assert.rejects(
        () => updatePasswordLegacy(token, "super-long-strong-password"),
        (/** @type {Error} */ err: any) => {
          assert.equal(err.message, "Password update token has expired");
          return true;
        }
      );
    });

    it("renvoie une erreur lorsque l'update est tenté avec un token null", async () => {
      // create user
      await createUserLegacy({ username: "user" });

      await assert.rejects(
        () => updatePasswordLegacy(null, "super-long-strong-password"),
        (/** @type {Error} */ err: any) => {
          assert.equal(err.message, "User not found");
          return true;
        }
      );
    });

    it("renvoie une erreur lorsque l'update a déjà été fait", async () => {
      // create user
      await createUserLegacy({ username: "user" });

      // generate update token
      const token = await generatePasswordUpdateTokenLegacy("user");

      // update password first time
      await updatePasswordLegacy(token, "new-password-strong");

      // try again
      await assert.rejects(
        () => updatePasswordLegacy(token, "super-long-strong-password"),
        (/** @type {Error} */ err: any) => {
          assert.equal(err.message, "User not found");
          return true;
        }
      );
    });
  });

  describe("searchUsers", () => {
    it("returns results matching username", async () => {
      const searchTerm = "haver";
      const usernameTest = "havertz";

      const userProps = {
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      };

      const createdId = await createUserLegacy(userProps);
      const found = await usersDb().findOne({ _id: createdId });

      assert.equal(found?.permissions.includes(tdbRoles.network), true);
      assert.equal(found?.network === "test", true);
      assert.equal(found?.email === "havertz@rma.es", true);

      const results = await searchUsersLegacy({ searchTerm });

      assert.equal(results.length, 1);
      assert.ok(results[0].username, found?.username);
    });

    it("returns results matching username case insensitive", async () => {
      const searchTerm = "HaVEr";
      const usernameTest = "havertz";

      const createdId = await createUserLegacy({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await usersDb().findOne({ _id: createdId });

      assert.equal(found?.permissions.includes(tdbRoles.network), true);
      assert.equal(found?.network === "test", true);
      assert.equal(found?.email === "havertz@rma.es", true);

      const results = await searchUsersLegacy({ searchTerm });

      assert.equal(results.length, 1);
      assert.ok(results[0].username, usernameTest);
    });

    it("does not returns results without match on username", async () => {
      const searchTerm = "benzema";
      const usernameTest = "havertz";

      const createdId = await createUserLegacy({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await usersDb().findOne({ _id: createdId });

      assert.equal(found?.permissions.includes(tdbRoles.network), true);
      assert.equal(found?.network === "test", true);
      assert.equal(found?.email === "havertz@rma.es", true);

      const results = await searchUsersLegacy({ searchTerm });

      assert.equal(results.length, 0);
    });

    it("returns results matching email", async () => {
      const searchTerm = "rma";
      const usernameTest = "havertz";

      const createdId = await createUserLegacy({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await usersDb().findOne({ _id: createdId });

      assert.equal(found?.permissions.includes(tdbRoles.network), true);
      assert.equal(found?.network === "test", true);
      assert.equal(found?.email === "havertz@rma.es", true);

      const results = await searchUsersLegacy({ searchTerm });

      assert.equal(results.length, 1);
      assert.ok(results[0].username, usernameTest);
    });

    it("returns results matching email case insensitive", async () => {
      const searchTerm = "RMa";
      const usernameTest = "havertz";

      const createdId = await createUserLegacy({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await usersDb().findOne({ _id: createdId });

      assert.equal(found?.permissions.includes(tdbRoles.network), true);
      assert.equal(found?.network === "test", true);
      assert.equal(found?.email === "havertz@rma.es", true);

      const results = await searchUsersLegacy({ searchTerm });

      assert.equal(results.length, 1);
      assert.ok(results[0].username, usernameTest);
    });

    it("does not returns results without match on email", async () => {
      const searchTerm = "fcbarcelona";
      const usernameTest = "havertz";

      const createdId = await createUserLegacy({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await usersDb().findOne({ _id: createdId });

      assert.equal(found?.permissions.includes(tdbRoles.network), true);
      assert.equal(found?.network === "test", true);
      assert.equal(found?.email === "havertz@rma.es", true);

      const results = await searchUsersLegacy({ searchTerm });

      assert.equal(results.length, 0);
    });

    it("returns results matching organisme", async () => {
      const searchTerm = "ORGAN";
      const usernameTest = "havertz";

      const createdId = await createUserLegacy({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await usersDb().findOne({ _id: createdId });

      assert.equal(found?.permissions.includes(tdbRoles.network), true);
      assert.equal(found?.network === "test", true);
      assert.equal(found?.email === "havertz@rma.es", true);

      const results = await searchUsersLegacy({ searchTerm });

      assert.equal(results.length, 1);
      assert.ok(results[0].username, usernameTest);
    });

    it("returns results matching organisme case insensitive", async () => {
      const searchTerm = "organ";
      const usernameTest = "havertz";

      const createdId = await createUserLegacy({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await usersDb().findOne({ _id: createdId });

      assert.equal(found?.permissions.includes(tdbRoles.network), true);
      assert.equal(found?.network === "test", true);
      assert.equal(found?.email === "havertz@rma.es", true);

      const results = await searchUsersLegacy({ searchTerm });

      assert.equal(results.length, 1);
      assert.ok(results[0].username, usernameTest);
    });

    it("does not returns results without match on organisme", async () => {
      const searchTerm = "BAD";
      const usernameTest = "havertz";

      const createdId = await createUserLegacy({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await usersDb().findOne({ _id: createdId });

      assert.equal(found?.permissions.includes(tdbRoles.network), true);
      assert.equal(found?.network === "test", true);
      assert.equal(found?.email === "havertz@rma.es", true);

      const results = await searchUsersLegacy({ searchTerm });

      assert.equal(results.length, 0);
    });

    it("returns results matching region", async () => {
      const searchTerm = "REGI";
      const usernameTest = "havertz";

      const createdId = await createUserLegacy({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await usersDb().findOne({ _id: createdId });

      assert.equal(found?.permissions.includes(tdbRoles.network), true);
      assert.equal(found?.network === "test", true);
      assert.equal(found?.email === "havertz@rma.es", true);

      const results = await searchUsersLegacy({ searchTerm });

      assert.equal(results.length, 1);
      assert.ok(results[0].username, usernameTest);
    });

    it("returns results matching region case insensitive", async () => {
      const searchTerm = "regi";
      const usernameTest = "havertz";

      const createdId = await createUserLegacy({
        username: usernameTest,
        password: "password",
        permissions: [tdbRoles.network],
        email: "havertz@rma.es",
        network: "test",
        region: "REGION",
        organisme: "ORGANISME",
      });

      const found = await usersDb().findOne({ _id: createdId });

      assert.equal(found?.permissions.includes(tdbRoles.network), true);
      assert.equal(found?.network === "test", true);
      assert.equal(found?.email === "havertz@rma.es", true);

      const results = await searchUsersLegacy({ searchTerm });

      assert.equal(results.length, 1);
      assert.ok(results[0].username, usernameTest);
    });
  });

  describe("updateUser", () => {
    it("renvoie une erreur quand l'id passé pour la maj d'un utilisateur n'est pas valide", async () => {
      const usernameTest = "userTest";

      // create user
      await createUserLegacy({ username: usernameTest });

      // find user
      const found = await usersDb().findOne({ username: usernameTest });
      assert.equal(found?.username === usernameTest, true);
      assert.equal(found?._id !== null, true);

      // update user with bad id
      const objectId = new mongodb.ObjectId();
      await assert.rejects(updateUserLegacy(objectId, { username: "UPDATED" }), { message: "Unable to find user" });
    });

    it("Permets la MAJ d'un utilisateur pour son username", async () => {
      const usernameTest = "userTest";

      // create user
      await createUserLegacy({ username: usernameTest });

      // find user
      const found = await usersDb().findOne({ username: usernameTest });
      assert.equal(found?.username === usernameTest, true);
      assert.equal(found?._id !== null, true);

      // update user
      const updatedUserName = "UPDATED";
      await updateUserLegacy(found?._id, { username: updatedUserName });

      // Check update
      const foundAfterUpdate = await usersDb().findOne({ _id: found?._id });
      assert.equal(foundAfterUpdate?.username === updatedUserName, true);
    });

    it("Permets la MAJ d'un utilisateur pour son email", async () => {
      const usernameTest = "userTest";

      // create user
      await createUserLegacy({ username: usernameTest, email: "test@test.fr" });

      // find user
      const found = await usersDb().findOne({ username: usernameTest });
      assert.equal(found?.email === "test@test.fr", true);
      assert.equal(found?._id !== null, true);

      // update user
      const updateValue = "UPDATED@test.fr";
      await updateUserLegacy(found?._id, { email: updateValue });

      // Check update
      const foundAfterUpdate = await usersDb().findOne({ _id: found?._id });
      assert.equal(foundAfterUpdate?.email === updateValue, true);
    });

    it("Permets la MAJ d'un utilisateur pour son réseau", async () => {
      const usernameTest = "userTest";

      // create user
      await createUserLegacy({ username: usernameTest, network: "TEST_RESEAU" });

      // find user
      const found = await usersDb().findOne({ username: usernameTest });
      assert.equal(found?._id !== null, true);
      assert.equal(found?.network === "TEST_RESEAU", true);

      // update user
      const updateValue = "UPDATED_NETWORK";
      await updateUserLegacy(found?._id, { network: updateValue });

      // Check update
      const foundAfterUpdate = await usersDb().findOne({ _id: found?._id });
      assert.equal(foundAfterUpdate?.network === updateValue, true);
    });

    it("Permets la MAJ d'un utilisateur pour sa région", async () => {
      const usernameTest = "userTest";

      // create user
      await createUserLegacy({ username: usernameTest, region: "TEST_REGION" });

      // find user
      const found = await usersDb().findOne({ username: usernameTest });
      assert.equal(found?._id !== null, true);
      assert.equal(found?.region === "TEST_REGION", true);

      // update user
      const updateValue = "UPDATED_REGION";
      await updateUserLegacy(found?._id, { region: updateValue });

      // Check update
      const foundAfterUpdate = await usersDb().findOne({ _id: found?._id });
      assert.equal(foundAfterUpdate?.region === updateValue, true);
    });

    it("Permets la MAJ d'un utilisateur pour son organisme", async () => {
      const usernameTest = "userTest";

      // create user
      await createUserLegacy({ username: usernameTest, organisme: "TEST_ORGANISME" });

      // find user
      const found = await usersDb().findOne({ username: usernameTest });
      assert.equal(found?._id !== null, true);
      assert.equal(found?.organisme === "TEST_ORGANISME", true);

      // update user
      const updateValue = "UPDATED_ORGANISME";
      await updateUserLegacy(found?._id, { organisme: updateValue });

      // Check update
      const foundAfterUpdate = await usersDb().findOne({ _id: found?._id });
      assert.equal(foundAfterUpdate?.organisme === updateValue, true);
    });
  });

  describe("getDetailedUserById", () => {
    it("renvoie une erreur quand l'id passé pour le getDetailedUserById n'est pas valide", async () => {
      const usernameTest = "userTest";

      // create user
      await createUserLegacy({ username: usernameTest });

      // find user
      const found = await usersDb().findOne({ username: usernameTest });
      assert.equal(found?.username === usernameTest, true);
      assert.equal(found?._id !== null, true);

      // get user with bad id
      const objectId = "^pkazd^pkazd";
      await assert.rejects(getUserLegacyById(objectId), { message: "Unable to find user" });
    });

    it("renvoie le bon utilisateur quand l'id passé pour le getDetailedUserById est valide", async () => {
      const usernameTest = "userTest";

      // create user
      await createUserLegacy({ username: usernameTest });

      // find user
      const found = await usersDb().findOne({ username: usernameTest });
      assert.equal(found?.username === usernameTest, true);

      // get user with id
      const gettedUser = await getUserLegacyById(found?._id);
      assert.equal(gettedUser.username === found?.username, true);
    });
  });
});
