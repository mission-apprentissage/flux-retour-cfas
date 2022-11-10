const assert = require("assert").strict;
const config = require("../../../config");
const jwt = require("jsonwebtoken");
const { startServer } = require("../../utils/testUtils");
const { tdbRoles } = require("../../../src/common/roles");
const { cfasDb } = require("../../../src/common/model/collections");

describe(__filename, () => {
  it("Vérifie qu'on peut se connecter avec un access token cfa", async () => {
    const { httpClient } = await startServer();
    // create cfa in db
    const token = "eyP33IyEAisoErO";
    await cfasDb().insertOne({
      uai: "0594889A",
      access_token: token,
    });

    const response = await httpClient.post("/api/login-cfa", {
      cfaAccessToken: token,
    });

    assert.equal(response.status, 200);
    const decoded = jwt.verify(response.data.access_token, config.auth.user.jwtSecret);
    assert.ok(decoded.iat);
    assert.ok(decoded.exp);
    assert.equal(decoded.sub, "0594889A");
    assert.equal(decoded.iss, config.appName);
    assert.deepStrictEqual(decoded.permissions, [tdbRoles.cfa]);
  });

  it("Vérifie que le serveur retourne une 401 lorsqu'un token invalide est envoyé", async () => {
    const { httpClient } = await startServer();
    // create cfa in db
    const token = "eyP33IyEAisoErO";
    await cfasDb().insertOne({ uai: "0594889A", access_token: token });

    const response = await httpClient.post("/api/login-cfa", {
      cfaAccessToken: token.slice(0, -1),
    });

    assert.equal(response.status, 401);
  });

  it("Vérifie que le serveur retourne une 401 lorsqu'aucun token n'est envoyé", async () => {
    const { httpClient } = await startServer();
    // create cfa in db
    const token = "eyP33IyEAisoErO";
    await cfasDb().insertOne({
      uai: "0594889A",
      access_token: token,
    });

    const response = await httpClient.post("/api/login-cfa");

    assert.equal(response.status, 401);
  });
});
