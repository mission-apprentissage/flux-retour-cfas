const assert = require("assert").strict;
const config = require("../../../config");
const jwt = require("jsonwebtoken");
const httpTests = require("../../utils/httpTests");
const { UserModel } = require("../../../src/common/model");
const { hash } = require("../../../src/common/utils/sha512Utils");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie qu'on peut se connecter", async () => {
    const { httpClient, components } = await startServer();
    await components.users.createUser("user", "password");

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
    await components.users.createUser("user", "password");

    const response = await httpClient.post("/api/login", {
      username: "user",
      password: "INVALID",
    });

    assert.equal(response.status, 401);
  });

  it("Vérifie qu'un login invalide est rejeté", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.post("/api/login", {
      username: "INVALID",
      password: "INVALID",
    });

    assert.equal(response.status, 401);
  });

  it("Vérifie que le mot de passe est rehashé si trop faible", async () => {
    const { httpClient, components } = await startServer();
    await components.users.createUser("user", "password", { hash: hash("password", 1000) });

    let response = await httpClient.post("/api/login", {
      username: "user",
      password: "password",
    });

    assert.equal(response.status, 200);
    const found = await UserModel.findOne({ username: "user" });
    assert.equal(found.password.startsWith("$6$rounds=1000"), true);

    response = await httpClient.post("/api/login", {
      username: "user",
      password: "password",
    });
    assert.equal(response.status, 200);
  });

  it("Vérifie que le mot de passe n'est pas rehashé si ok", async () => {
    const { httpClient, components } = await startServer();
    await components.users.createUser("user", "password", { hash: hash("password", 1001) });
    const previous = await UserModel.findOne({ username: "user" });

    const response = await httpClient.post("/api/login", {
      username: "user",
      password: "password",
    });

    assert.equal(response.status, 200);
    const found = await UserModel.findOne({ username: "user" });
    assert.equal(previous.password, found.password);
  });

  it("Vérifie que le mot de passe n'est pas rehashé si invalide", async () => {
    const { httpClient, components } = await startServer();
    await components.users.createUser("user", "password", { hash: hash("password", 1000) });
    const previous = await UserModel.findOne({ username: "user" });

    const response = await httpClient.post("/api/login", {
      username: "user",
      password: "invalid",
    });

    assert.equal(response.status, 401);
    const found = await UserModel.findOne({ username: "user" });
    assert.equal(previous.password, found.password);
  });
});
