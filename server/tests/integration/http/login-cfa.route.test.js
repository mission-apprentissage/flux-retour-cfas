import { strict as assert } from "assert";
import config from "../../../config/index.js";
import jwt from "jsonwebtoken";
import { startServer } from "../../utils/testUtils.js";
import { tdbRoles } from "../../../src/common/roles.js";
import { cfasDb } from "../../../src/common/model/collections.js";
import { Cfa } from "../../../src/common/factory/cfa.js";

describe("LoginCFA Route", () => {
  it("Vérifie qu'on peut se connecter avec un access token cfa", async () => {
    const { httpClient } = await startServer();
    // create cfa in db
    const cfaProps = { uai: "0594889A", nom: "aaa" };
    await cfasDb().insertOne(Cfa.create(cfaProps));
    const { access_token } = await cfasDb().findOne({ uai: cfaProps.uai });

    const response = await httpClient.post("/api/login-cfa", {
      cfaAccessToken: access_token,
    });

    assert.equal(response.status, 200);
    const decoded = jwt.verify(response.data.access_token, config.auth.user.jwtSecret);
    assert.ok(decoded.iat);
    assert.ok(decoded.exp);
    assert.equal(decoded.sub, cfaProps.uai);
    assert.equal(decoded.iss, config.appName);
    assert.deepStrictEqual(decoded.permissions, [tdbRoles.cfa]);
  });

  it("Vérifie que le serveur retourne une 401 lorsqu'un token invalide est envoyé", async () => {
    const { httpClient } = await startServer();
    // create cfa in db
    const cfaProps = { uai: "0594889A", nom: "aaa" };
    await cfasDb().insertOne(Cfa.create(cfaProps));
    const { access_token } = await cfasDb().findOne({ uai: cfaProps.uai });

    const response = await httpClient.post("/api/login-cfa", {
      cfaAccessToken: access_token.slice(0, -1),
    });

    assert.equal(response.status, 401);
  });

  it("Vérifie que le serveur retourne une 401 lorsqu'aucun token n'est envoyé", async () => {
    const { httpClient } = await startServer();
    // create cfa in db
    const cfaProps = { uai: "0594889A", nom: "aaa" };
    await cfasDb().insertOne(Cfa.create(cfaProps));

    const response = await httpClient.post("/api/login-cfa");

    assert.equal(response.status, 401);
  });
});
