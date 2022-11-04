const assert = require("assert").strict;
const { startServer } = require("../../../utils/testUtils");
const jwt = require("jsonwebtoken");
const { dbCollection } = require("../../../../src/common/mongodb.js");
const { COLLECTIONS_NAMES } = require("../../../../src/common/model/collections.js");
const { USER_EVENTS_ACTIONS, USER_EVENTS_TYPES } = require("../../../../src/common/constants/userEventsConstants.js");
const { PARTAGE_SIMPLIFIE_ROLES } = require("../../../../src/common/roles.js");
const config = require("../../../../config/index.js");

describe("API Route Login", () => {
  it("Vérifie qu'on peut se connecter en tant qu'OF", async () => {
    const { httpClient, components } = await startServer();

    const userEmail = "user@test.fr";

    await components.partageSimplifieUsers.createUser({
      email: userEmail,
      password: "password",
      role: PARTAGE_SIMPLIFIE_ROLES.OF,
    });

    const response = await httpClient.post("/api/partage-simplifie/login", {
      email: userEmail,
      password: "password",
    });

    assert.equal(response.status, 200);
    const decoded = jwt.verify(response.data.access_token, config.auth.user.jwtSecret);
    assert.ok(decoded.iat);
    assert.ok(decoded.exp);
    assert.equal(decoded.sub, userEmail);
    assert.equal(decoded.iss, config.appName);
    assert.deepEqual(decoded.role, PARTAGE_SIMPLIFIE_ROLES.OF);

    const userEventFoundInDb = await dbCollection(COLLECTIONS_NAMES.UserEvents).findOne({ username: userEmail });
    assert.equal(userEventFoundInDb.type, USER_EVENTS_TYPES.POST);
    assert.equal(userEventFoundInDb.action, USER_EVENTS_ACTIONS.LOGIN_EVENT.SUCCESS);
  });

  it("Vérifie qu'on peut se connecter en tant qu'administrateur", async () => {
    const { httpClient, components } = await startServer();

    const userEmail = "user@test.fr";

    await components.partageSimplifieUsers.createUser({
      email: userEmail,
      password: "password",
      role: PARTAGE_SIMPLIFIE_ROLES.ADMINISTRATOR,
    });

    const response = await httpClient.post("/api/partage-simplifie/login", {
      email: userEmail,
      password: "password",
    });

    assert.equal(response.status, 200);
    const decoded = jwt.verify(response.data.access_token, config.auth.user.jwtSecret);
    assert.ok(decoded.iat);
    assert.ok(decoded.exp);
    assert.equal(decoded.sub, userEmail);
    assert.equal(decoded.iss, config.appName);
    assert.deepEqual(decoded.role, PARTAGE_SIMPLIFIE_ROLES.ADMINISTRATOR);

    const userEventFoundInDb = await dbCollection(COLLECTIONS_NAMES.UserEvents).findOne({ username: userEmail });
    assert.equal(userEventFoundInDb.type, USER_EVENTS_TYPES.POST);
    assert.equal(userEventFoundInDb.action, USER_EVENTS_ACTIONS.LOGIN_EVENT.SUCCESS);
  });

  it("Vérifie qu'un mot de passe invalide est rejeté", async () => {
    const { httpClient, components } = await startServer();

    await components.partageSimplifieUsers.createUser({
      email: "user@test.fr",
      password: "password",
      role: PARTAGE_SIMPLIFIE_ROLES.ADMINISTRATOR,
    });

    const response = await httpClient.post("/api/partage-simplifie/login", {
      email: "user@test.fr",
      password: "INVALID",
    });

    assert.equal(response.status, 401);
  });

  it("Vérifie qu'un login invalide est rejeté", async () => {
    const { httpClient, components } = await startServer();

    await components.partageSimplifieUsers.createUser({
      email: "user@test.fr",
      password: "password",
      role: PARTAGE_SIMPLIFIE_ROLES.ADMINISTRATOR,
    });

    const response = await httpClient.post("/api/partage-simplifie/login", {
      email: "INVALID",
      password: "password",
    });

    assert.equal(response.status, 401);
  });
});
