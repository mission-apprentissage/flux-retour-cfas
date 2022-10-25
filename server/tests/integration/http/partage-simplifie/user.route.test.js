const assert = require("assert").strict;
const { startServer } = require("../../../utils/testUtils");
const { PARTAGE_SIMPLIFIE_ROLES } = require("../../../../src/common/roles.js");
const { dbCollection } = require("../../../../src/common/mongodb.js");
const { COLLECTIONS_NAMES } = require("../../../../src/common/model/collections.js");

describe("API Route User", () => {
  describe("POST /user/update-password", () => {
    it("renvoie une 200 quand le token fourni et le nouveau mot de passe sont corrects", async () => {
      const { httpClient, components } = await startServer();
      // create user
      const email = "user1@test.fr";
      const user = await components.partageSimplifieUsers.createUser({ email, role: PARTAGE_SIMPLIFIE_ROLES.OF });
      // generate password update token
      const token = await components.partageSimplifieUsers.generatePasswordUpdateToken(email);
      const response = await httpClient.post("/api/partage-simplifie/user/update-password", {
        token,
        newPassword: "strong long password 1234",
      });
      assert.equal(response.status, 200);
      const userAfterRequest = await components.partageSimplifieUsers.getUser(email);
      assert.equal(userAfterRequest.password_updated_token_at !== null, true);
      assert.equal(userAfterRequest.password_update_token, null);
      assert.equal(userAfterRequest.password_update_token_expiry, null);
      assert.notEqual(user.password, userAfterRequest.password);
    });

    it("renvoie une 400 quand le nouveau mot de passe est trop court", async () => {
      const { httpClient, components } = await startServer();
      // create user
      const email = "user1@test.fr";
      const insertedId = await components.partageSimplifieUsers.createUser({ email, role: PARTAGE_SIMPLIFIE_ROLES.OF });
      const user = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });

      // generate password update token
      const token = await components.partageSimplifieUsers.generatePasswordUpdateToken(email);
      const response = await httpClient.post("/api/partage-simplifie/user/update-password", {
        token,
        newPassword: "trop court",
      });
      assert.equal(response.status, 400);
      assert.equal(response.data.details.length, 1);
      assert.deepEqual(response.data.details[0].path, ["newPassword"]);
      assert.equal(response.data.details[0].type, "string.min");
      // user password should be unchanged
      const userAfterRequest = await components.partageSimplifieUsers.getUser(email);
      assert.equal(user.password, userAfterRequest.password);
    });

    it("renvoie une 400 quand aucun token n'est fourni", async () => {
      const { httpClient, components } = await startServer();
      // create user
      const email = "user1@test.fr";
      const insertedId = await components.partageSimplifieUsers.createUser({ email, role: PARTAGE_SIMPLIFIE_ROLES.OF });
      const user = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });

      // generate password update token
      await components.partageSimplifieUsers.generatePasswordUpdateToken(email);
      const response = await httpClient.post("/api/partage-simplifie/user/update-password", {
        token: "",
        newPassword: "mot de passe assez long",
      });
      assert.equal(response.status, 400);
      assert.equal(response.data.details.length, 1);
      assert.deepEqual(response.data.details[0].path, ["token"]);
      assert.equal(response.data.details[0].type, "string.empty");
      // user password should be unchanged
      const userAfterRequest = await components.partageSimplifieUsers.getUser(email);
      assert.equal(user.password, userAfterRequest.password);
    });

    it("renvoie une 500 quand le token fourni ne correspond pas à celui généré", async () => {
      const { httpClient, components } = await startServer();
      // create user
      const email = "user1@test.fr";
      const insertedId = await components.partageSimplifieUsers.createUser({ email, role: PARTAGE_SIMPLIFIE_ROLES.OF });
      const user = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });
      // generate password update token
      await components.partageSimplifieUsers.generatePasswordUpdateToken(email);
      const response = await httpClient.post("/api/partage-simplifie/user/update-password", {
        token: "un-autre-token",
        newPassword: "mot de passe assez long",
      });
      assert.equal(response.status, 500);
      // user password should be unchanged
      const userAfterRequest = await components.partageSimplifieUsers.getUser(email);
      assert.equal(user.password, userAfterRequest.password);
    });

    it("renvoie une 500 lorsqu'aucun token de modification de mot de passe n'a été créé", async () => {
      const { httpClient, components } = await startServer();
      // create user
      const email = "user1@test.fr";
      const insertedId = await components.partageSimplifieUsers.createUser({ email, role: PARTAGE_SIMPLIFIE_ROLES.OF });
      const user = await dbCollection(COLLECTIONS_NAMES.PsUsers).findOne({ _id: insertedId });

      const response = await httpClient.post("/api/partage-simplifie/user/update-password", {
        token: "un token qui n'existe pas",
        newPassword: "mot de passe assez long",
      });
      assert.equal(response.status, 500);
      // user password should be unchanged
      const userAfterRequest = await components.partageSimplifieUsers.getUser(email);
      assert.equal(user.password, userAfterRequest.password);
    });
  });

  describe("GET /user/exist", () => {
    it("renvoie une 200 et l'info found à true quand l'email de l'utilisateur existe dans la base", async () => {
      const { httpClient, components } = await startServer();

      // create user
      const email = "user1@test.fr";
      await components.partageSimplifieUsers.createUser({ email, role: PARTAGE_SIMPLIFIE_ROLES.OF });

      const response = await httpClient.get("/api/partage-simplifie/user/exist", { params: { email } });
      assert.equal(response.status, 200);
      assert.equal(response.data.found, true);
    });

    it("renvoie une 200 et l'info found à flase quand l'email de l'utilisateur n'existe pas dans la base", async () => {
      const { httpClient, components } = await startServer();

      // create user
      const email = "user1@test.fr";
      await components.partageSimplifieUsers.createUser({ email, role: PARTAGE_SIMPLIFIE_ROLES.OF });

      const response = await httpClient.get("/api/partage-simplifie/user/exist", {
        params: { email: "badUser@test.fr" },
      });
      assert.equal(response.status, 200);
      assert.equal(response.data.found, false);
    });

    it("renvoie une 400 quand l'email de l'utilisateur n'est pas au bon format", async () => {
      const { httpClient, components } = await startServer();

      // create user
      const email = "user1@test.fr";
      await components.partageSimplifieUsers.createUser({ email, role: PARTAGE_SIMPLIFIE_ROLES.OF });

      const response = await httpClient.get("/api/partage-simplifie/user/exist", { params: { email: "badFormat" } });
      assert.equal(response.status, 400);
      assert.equal(response.data.message, "Erreur de validation");
    });
  });

  describe("GET /user/exist-uai-siret", () => {
    it("renvoie une 200 et l'info found à true quand l'uai et le siret de l'utilisateur existe dans la base", async () => {
      const { httpClient, components } = await startServer();

      // create user
      const email = "user1@test.fr";
      const uai = "0881529J";
      const siret = "13002798000031";
      await components.partageSimplifieUsers.createUser({ email, role: PARTAGE_SIMPLIFIE_ROLES.OF, uai, siret });

      const response = await httpClient.get("/api/partage-simplifie/user/exist-uai-siret", { params: { uai, siret } });
      assert.equal(response.status, 200);
      assert.equal(response.data.found, true);
    });

    it("renvoie une 200 et l'info found à false quand l'uai de l'utilisateur n'existe pas dans la base", async () => {
      const { httpClient, components } = await startServer();

      // create user
      const email = "user1@test.fr";
      const uai = "0881529J";
      const badUai = "9991529J";
      const siret = "13002798000031";
      await components.partageSimplifieUsers.createUser({ email, role: PARTAGE_SIMPLIFIE_ROLES.OF, uai, siret });

      const response = await httpClient.get("/api/partage-simplifie/user/exist-uai-siret", {
        params: { uai: badUai, siret },
      });
      assert.equal(response.status, 200);
      assert.equal(response.data.found, false);
    });

    it("renvoie une 200 et l'info found à false quand le siret de l'utilisateur n'existe pas dans la base", async () => {
      const { httpClient, components } = await startServer();

      // create user
      const email = "user1@test.fr";
      const uai = "0881529J";
      const siret = "13002798000031";
      const badSiret = "99992798000031";

      await components.partageSimplifieUsers.createUser({ email, role: PARTAGE_SIMPLIFIE_ROLES.OF, uai, siret });

      const response = await httpClient.get("/api/partage-simplifie/user/exist-uai-siret", {
        params: { uai, siret: badSiret },
      });
      assert.equal(response.status, 200);
      assert.equal(response.data.found, false);
    });

    it("renvoie une 400 quand l'uai de l'utilisateur n'est pas au bon format", async () => {
      const { httpClient, components } = await startServer();

      // create user
      const email = "user1@test.fr";
      const uai = "0881529J";
      const siret = "13002798000031";

      await components.partageSimplifieUsers.createUser({ email, role: PARTAGE_SIMPLIFIE_ROLES.OF, uai, siret });

      const response = await httpClient.get("/api/partage-simplifie/user/exist-uai-siret", {
        params: { uai: 123, siret },
      });
      assert.equal(response.status, 400);
      assert.equal(response.data.message, "Erreur de validation");
    });

    it("renvoie une 400 quand le siret de l'utilisateur n'est pas au bon format", async () => {
      const { httpClient, components } = await startServer();

      // create user
      const email = "user1@test.fr";
      const uai = "0881529J";
      const siret = "13002798000031";

      await components.partageSimplifieUsers.createUser({ email, role: PARTAGE_SIMPLIFIE_ROLES.OF, uai, siret });

      const response = await httpClient.get("/api/partage-simplifie/user/exist-uai-siret", {
        params: { uai, siret: 123 },
      });
      assert.equal(response.status, 400);
      assert.equal(response.data.message, "Erreur de validation");
    });
  });
});
