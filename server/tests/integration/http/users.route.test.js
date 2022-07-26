const assert = require("assert").strict;
// eslint-disable-next-line node/no-unpublished-require
const MockDate = require("mockdate");
const { startServer } = require("../../utils/testUtils");
const { apiRoles, tdbRoles } = require("../../../src/common/roles");
const { differenceInCalendarDays } = require("date-fns");
const config = require("../../../config");
const { UserModel } = require("../../../src/common/model");

describe(__filename, () => {
  afterEach(() => {
    MockDate.reset();
  });

  describe("GET /users", () => {
    it("sends a 401 HTTP response when user is not authenticated", async () => {
      const { httpClient } = await startServer();
      const response = await httpClient.get("/api/users", {});

      assert.equal(response.status, 401);
    });

    it("sends a 403 HTTP response when user is not admin", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.apiStatutsSeeder] });

      const response = await httpClient.get("/api/users", { headers: bearerToken });

      assert.equal(response.status, 403);
    });

    it("sends a 200 HTTP response with list of users", async () => {
      const { httpClient, components, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });

      await components.users.createUser({
        email: "test1@mail.com",
        username: "test1",
        permissions: [apiRoles.administrator],
      });
      await components.users.createUser({
        email: "test2@mail.com",
        username: "test2",
        permissions: [apiRoles.apiStatutsSeeder],
      });
      const response = await httpClient.get("/api/users", { headers: bearerToken });

      assert.equal(response.status, 200);
      assert.equal(response.data.length, 3);
      assert.equal(response.data[0].password, undefined);
      assert.equal(response.data[1].password, undefined);
      assert.equal(response.data[2].password, undefined);
    });
  });

  describe("POST /users", () => {
    it("sends a 401 HTTP response when user is not authenticated", async () => {
      const { httpClient } = await startServer();
      const response = await httpClient.post("/api/users", {});

      assert.equal(response.status, 401);
    });

    it("sends a 403 HTTP response when user is not admin", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.apiStatutsSeeder] });

      const response = await httpClient.post("/api/users", {}, { headers: bearerToken });

      assert.equal(response.status, 403);
    });

    it("sends a 200 HTTP response with created pilot user", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const fakeNowDate = new Date();
      MockDate.set(fakeNowDate);

      const response = await httpClient.post(
        "/api/users",
        { email: "test@mail.com", username: "test", role: tdbRoles.pilot },
        { headers: bearerToken }
      );

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, {
        email: "test@mail.com",
        username: "test",
        permissions: [tdbRoles.pilot],
        network: null,
        created_at: fakeNowDate.toISOString(),
      });
    });

    it("sends a 200 HTTP response with created network user", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const fakeNowDate = new Date();
      MockDate.set(fakeNowDate);

      const response = await httpClient.post(
        "/api/users",
        { email: "test@mail.com", username: "test", role: tdbRoles.network, network: "CMA" },
        { headers: bearerToken }
      );

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, {
        email: "test@mail.com",
        username: "test",
        permissions: [tdbRoles.network],
        network: "CMA",
        created_at: fakeNowDate.toISOString(),
      });
    });
  });

  describe("POST /users/generate-update-password-url", () => {
    it("sends a 401 HTTP response when user is not authenticated", async () => {
      const { httpClient } = await startServer();
      const response = await httpClient.post("/api/users/generate-update-password-url");

      assert.equal(response.status, 401);
    });

    it("sends a 403 HTTP response when user is not admin", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.apiStatutsSeeder] });

      const response = await httpClient.post(
        "/api/users/generate-update-password-url",
        { username: "john-doe" },
        { headers: bearerToken }
      );

      assert.equal(response.status, 403);
    });

    it("sends a 200 HTTP response with password update url", async () => {
      const { httpClient, createAndLogUser, components } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });

      const username = "john-doe";
      await components.users.createUser({ username });

      const response = await httpClient.post(
        "/api/users/generate-update-password-url",
        { username },
        { headers: bearerToken }
      );

      assert.equal(response.status, 200);
      assert.ok(response.data.passwordUpdateUrl);
      assert.equal(response.data.passwordUpdateUrl.startsWith(`${config.publicUrl}/modifier-mot-de-passe`), true);

      const updatedUser = await components.users.getUser(username);
      assert.ok(updatedUser.password_update_token);
      // password token should expire in 48h
      const expiryDate = updatedUser.password_update_token_expiry;
      assert.equal(differenceInCalendarDays(expiryDate, new Date()), 2);
    });
  });

  describe("DELETE /users/delete/:username", () => {
    it("Permet de vérifier qu'on peut supprimer un utilisateur depuis son username en étant connecté en tant qu'administrateur", async () => {
      const { httpClient, components, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const username = "john-doe";
      await components.users.createUser({ username });

      const checkUserBeforeDelete = await UserModel.count({ username });
      assert.equal(checkUserBeforeDelete, 1);

      const response = await httpClient.delete(`/api/users/${username}`, { headers: bearerToken });
      assert.equal(response.status, 200);
      const checkAfterDelete = await UserModel.count({ username });
      assert.equal(checkAfterDelete, 0);
    });

    it("Permet de vérifier qu'on ne peut supprimer un utilisateur depuis son username en étant connecté en tant que non administrateur", async () => {
      const { httpClient, components, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [tdbRoles.pilot] });
      const username = "john-doe";
      await components.users.createUser({ username });

      const checkUserBeforeDelete = await UserModel.count({ username });
      assert.equal(checkUserBeforeDelete, 1);

      const response = await httpClient.delete(`/api/users/${username}`, { headers: bearerToken });

      assert.equal(response.status, 403);
      const checkAfterDelete = await UserModel.count({ username });
      assert.equal(checkAfterDelete, 1);
    });

    it("Permet de vérifier qu'on ne peut supprimer un utilisateur si on fournit un username inexistant en étant connecté en tant qu'administrateur", async () => {
      const { httpClient, components, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const username = "john-doe";
      const badUsername = "john-smith";
      await components.users.createUser({ username });

      const checkUserBeforeDelete = await UserModel.count({ username });
      assert.equal(checkUserBeforeDelete, 1);

      const response = await httpClient.delete(`/api/users/${badUsername}`, { headers: bearerToken });

      assert.equal(response.status, 500);
      const checkAfterDelete = await UserModel.count({ username });
      assert.equal(checkAfterDelete, 1);
    });
  });
});
