const assert = require("assert");
const config = require("config");
const omit = require("lodash").omit;
const jwt = require("jsonwebtoken");
const httpTests = require("../../utils/httpTests");
const { createPasswordToken } = require("../../../src/common/utils/jwtUtils");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie qu'un utilisateur peut faire une demande de réinitialisation de mot de passe", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    await createAndLogUser("user", "password", { permissions: { isAdmin: true } });

    const response = await httpClient.post("/api/password/forgotten-password", {
      username: "user",
    });

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.url);
  });

  it("Vérifie qu'on ne peut pas demander la réinitialisation du mot de passe pour un utilisateur inconnu", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    await createAndLogUser("admin", "password", { permissions: { isAdmin: true } });

    const response = await httpClient.post("/api/password/forgotten-password", {
      username: "inconnu",
    });

    assert.strictEqual(response.status, 400);
  });

  it("Vérifie qu'on ne peut pas demander la réinitialisation du mot de passe pour un utilisateur invalide", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    await createAndLogUser("user123", "password");

    const response = await httpClient.post("/api/password/forgotten-password", {
      type: "cfa",
      username: "user123456",
    });

    assert.strictEqual(response.status, 400);
  });

  it("Vérifie qu'un utilisateur peut changer son mot de passe", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    await createAndLogUser("admin", "password", { permissions: { isAdmin: true } });

    const response = await httpClient.post("/api/password/reset-password", {
      passwordToken: createPasswordToken("admin"),
      newPassword: "Password!123456",
    });

    assert.strictEqual(response.status, 200);
    const decoded = jwt.verify(response.data.token, config.auth.user.jwtSecret);
    assert.ok(decoded.iat);
    assert.ok(decoded.exp);
    assert.deepStrictEqual(omit(decoded, ["iat", "exp"]), {
      sub: "admin",
      iss: config.appName,
      permissions: {
        isAdmin: true,
      },
    });
  });

  it("Vérifie qu'on doit spécifier un mot de passe valide", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    await createAndLogUser("admin", "password", { permissions: { isAdmin: true } });

    const response = await httpClient.post("/api/password/reset-password", {
      passwordToken: createPasswordToken("admin"),
      newPassword: "invalid",
    });

    assert.strictEqual(response.status, 400);
    assert.deepStrictEqual(response.data, {
      statusCode: 400,
      error: "Bad Request",
      message: "Erreur de validation",
      details: [
        {
          message:
            '"newPassword" with value "invalid" fails to match the required pattern: /^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$/',
          path: ["newPassword"],
          type: "string.pattern.base",
          context: { regex: {}, value: "invalid", label: "newPassword", key: "newPassword" },
        },
      ],
    });
  });
});
