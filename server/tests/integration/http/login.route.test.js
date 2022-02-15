const assert = require("assert").strict;
const config = require("../../../config");
const jwt = require("jsonwebtoken");
const httpTests = require("../../utils/httpTests");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie qu'on peut se connecter", async () => {
    const { httpClient, components } = await startServer();
    await components.users.createUser({ username: "user", password: "password" });

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
    assert.deepEqual(decoded.permissions, []);
  });

  it("Vérifie qu'un mot de passe invalide est rejeté", async () => {
    const { httpClient, components } = await startServer();
    await components.users.createUser({ username: "user", password: "password" });

    const response = await httpClient.post("/api/login", {
      username: "user",
      password: "INVALID",
    });

    assert.equal(response.status, 401);
  });

  it("Vérifie qu'un login invalide est rejeté", async () => {
    const { httpClient, components } = await startServer();
    await components.users.createUser({ username: "user", password: "password" });

    const response = await httpClient.post("/api/login", {
      username: "INVALID",
      password: "password",
    });

    assert.equal(response.status, 401);
  });
});
