import jwt from "jsonwebtoken";

import { strict as assert } from "assert";
import config from "../../../src/config.js";
import { startServer } from "../../utils/testUtils.js";
import { createUserLegacy } from "../../../src/common/actions/legacy/users.legacy.actions.js";

describe("Login Route", () => {
  it("Vérifie qu'on peut se connecter", async () => {
    const { httpClient } = await startServer();
    await createUserLegacy({ username: "user", password: "password" });

    const response = await httpClient.post("/api/login", {
      username: "user",
      password: "password",
    });

    assert.equal(response.status, 200);
    const decoded = jwt.verify(response.data.access_token, config.auth.user.jwtSecret);
    assert.ok(decoded.iat);
    assert.ok(decoded.exp);
    assert.equal(decoded.sub, "user");
    assert.equal(decoded.iss, config.appName);
  });

  it("Vérifie qu'un mot de passe invalide est rejeté", async () => {
    const { httpClient } = await startServer();
    await createUserLegacy({ username: "user", password: "password" });

    const response = await httpClient.post("/api/login", {
      username: "user",
      password: "INVALID",
    });

    assert.equal(response.status, 401);
  });

  it("Vérifie qu'un login invalide est rejeté", async () => {
    const { httpClient } = await startServer();
    await createUserLegacy({ username: "user", password: "password" });

    const response = await httpClient.post("/api/login", {
      username: "INVALID",
      password: "password",
    });

    assert.equal(response.status, 401);
  });
});
