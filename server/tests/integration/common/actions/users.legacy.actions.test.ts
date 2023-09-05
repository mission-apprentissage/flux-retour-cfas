import { strict as assert } from "assert";

import { subMinutes, differenceInCalendarDays, differenceInSeconds } from "date-fns";

import {
  authenticateLegacy,
  createUserLegacy,
  generatePasswordUpdateTokenLegacy,
  updatePasswordLegacy,
} from "@/common/actions/legacy/users.legacy.actions";
import { usersDb } from "@/common/model/collections";
import { apiRoles } from "@/common/roles";
import { useMongo } from "@tests/jest/setupMongo";

describe("Components Users Test", () => {
  useMongo();
  describe("createUserLegacy", () => {
    it("Permet de créer un utilisateur avec mot de passe", async () => {
      const createdId = await createUserLegacy({ username: "user", password: "password" });
      const found = await usersDb().findOne({ _id: createdId });
      assert.equal(found?.username, "user");
      assert.equal(found?.permissions?.length, 0);
      assert.equal(found?.password?.startsWith("$6$rounds="), true);
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
      assert.equal(found?.permissions?.length, 0);
      assert.equal(found?.password?.startsWith("$6$rounds="), true);
    });

    it("Permet de créer un utilisateur avec les droits d'admin", async () => {
      const createdId = await createUserLegacy({
        username: "userAdmin",
        password: "password",
        permissions: [apiRoles.administrator],
      });
      const found = await usersDb().findOne({ _id: createdId });
      assert.equal(found?.permissions?.includes(apiRoles.administrator), true);
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
      // @ts-expect-error
      const diffSeconds = differenceInSeconds(userInDb?.password_update_token_expiry, new Date());
      const _48hoursInSeconds = 48 * 60 * 60;
      assert.equal(_48hoursInSeconds - diffSeconds <= 1, true);
      assert.equal(_48hoursInSeconds - diffSeconds >= 0, true);
      // @ts-expect-error
      assert.equal(differenceInCalendarDays(userInDb?.password_update_token_expiry, new Date()), 2);
    });

    it("renvoie une erreur quand le user n'est pas trouvé", async () => {
      // create user
      await createUserLegacy({ username: "nope" });

      await assert.rejects(
        () => generatePasswordUpdateTokenLegacy("user"),
        (err: any) => {
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
      await usersDb().updateOne(
        { _id: createdId },
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
});
