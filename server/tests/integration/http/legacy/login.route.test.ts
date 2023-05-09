import { strict as assert } from "assert";

import { AxiosInstance } from "axiosist";
import jwt from "jsonwebtoken";

import { createUserLegacy } from "@/common/actions/legacy/users.legacy.actions";
import config from "@/config";
import { initTestApp } from "@tests/utils/testUtils";

let httpClient: AxiosInstance;

describe("POST /login - Login [LEGACY]", () => {
  beforeEach(async () => {
    const app = await initTestApp();
    httpClient = app.httpClient;
  });
  beforeEach(async () => {
    await createUserLegacy({ username: "user", password: "password" });
  });

  it("Vérifie qu'on peut se connecter", async () => {
    const response = await httpClient.post("/api/login", {
      username: "user",
      password: "password",
    });

    expect(response.status).toBe(200);
    const decoded = jwt.verify(response.data.access_token, config.auth.user.jwtSecret);
    assert.ok(decoded.iat);
    assert.ok(decoded.exp);
    assert.equal(decoded.sub, "user");
    assert.equal(decoded.iss, config.appName);
  });

  it("Vérifie qu'un mot de passe invalide est rejeté", async () => {
    const response = await httpClient.post("/api/login", {
      username: "user",
      password: "INVALID",
    });

    assert.equal(response.status, 401);
  });

  it("Vérifie qu'un login invalide est rejeté", async () => {
    const response = await httpClient.post("/api/login", {
      username: "INVALID",
      password: "password",
    });

    assert.equal(response.status, 401);
  });
});
