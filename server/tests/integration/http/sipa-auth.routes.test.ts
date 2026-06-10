import { strict as assert } from "assert";

import { AxiosInstance } from "axiosist";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { it, describe, beforeEach } from "vitest";

import { createSipaUser, deleteSipaUser } from "@/common/actions/sipa.actions";
import { sipaUsersDb } from "@/common/model/collections";
import { createSipaToken } from "@/common/utils/jwtUtils";
import { compare, hash } from "@/common/utils/passwordUtils";
import config from "@/config";
import requireSipaAuthentication from "@/http/middlewares/requireSipaAuthentication";
import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp } from "@tests/utils/testUtils";

const SIPA_USERNAME = "sipa-omogen-test";
const SIPA_PASSWORD = "sipa-test-password";
const SIPA_JWT_SECRET = config.auth.sipa.jwtSecret as string;

const sipaTestPasswordHash = hash(SIPA_PASSWORD);

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;

function runSipaMiddleware(authHeader?: string): Promise<any> {
  return new Promise((resolve) => {
    const req: any = { headers: authHeader ? { authorization: authHeader } : {} };
    requireSipaAuthentication()(req, {} as any, (err?: any) => resolve(err));
  });
}

describe("Authentification SIPA", () => {
  useMongo();
  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    await sipaUsersDb().insertOne({
      _id: new ObjectId(),
      username: SIPA_USERNAME,
      password: sipaTestPasswordHash,
      created_at: new Date(),
    });
  });

  describe("POST /api/v2/auth/login", () => {
    it("Retourne un token JWT et expiresIn sur identifiants valides, et met à jour last_connection", async () => {
      const response = await httpClient.post("/api/v2/auth/login", {
        username: SIPA_USERNAME,
        password: SIPA_PASSWORD,
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.expiresIn, 604800);

      const decoded = jwt.verify(response.data.token, SIPA_JWT_SECRET, { complete: true }) as any;
      assert.strictEqual(decoded.header.alg, "HS256");
      assert.strictEqual(decoded.payload.scope, "sipa");
      assert.strictEqual(decoded.payload.sub, SIPA_USERNAME);
      assert.strictEqual(decoded.payload.iss, config.appName);
      assert.strictEqual(decoded.payload.exp - decoded.payload.iat, 604800);

      const user = await sipaUsersDb().findOne({ username: SIPA_USERNAME });
      assert.ok(user?.last_connection instanceof Date);
    });

    it("Erreur 401 si mauvais mot de passe", async () => {
      const response = await httpClient.post("/api/v2/auth/login", {
        username: SIPA_USERNAME,
        password: "wrong-password",
      });

      assert.strictEqual(response.status, 401);
      assert.strictEqual(response.data.message, "Identifiant ou mot de passe incorrect");
    });

    it("Erreur 401 si username inconnu — même message (pas d'énumération)", async () => {
      const response = await httpClient.post("/api/v2/auth/login", {
        username: "unknown-user",
        password: SIPA_PASSWORD,
      });

      assert.strictEqual(response.status, 401);
      assert.strictEqual(response.data.message, "Identifiant ou mot de passe incorrect");
    });

    it("Erreur 400 si username hors format (caractères non autorisés)", async () => {
      const response = await httpClient.post("/api/v2/auth/login", {
        username: "bad username!",
        password: SIPA_PASSWORD,
      });

      assert.strictEqual(response.status, 400);
    });

    it("Erreur 400 si champ manquant", async () => {
      const response = await httpClient.post("/api/v2/auth/login", { username: SIPA_USERNAME });

      assert.strictEqual(response.status, 400);
    });

    it("Erreur 400 si body non-JSON", async () => {
      const response = await httpClient.post("/api/v2/auth/login", "{not-json", {
        headers: { "Content-Type": "application/json" },
      });

      assert.strictEqual(response.status, 400);
    });
  });

  describe("Middleware requireSipaAuthentication", () => {
    it("Passe avec un token SIPA valide", async () => {
      const err = await runSipaMiddleware(`Bearer ${createSipaToken(SIPA_USERNAME)}`);
      assert.strictEqual(err, undefined);
    });

    it("401 sans header Authorization", async () => {
      const err = await runSipaMiddleware();
      assert.strictEqual(err.output.statusCode, 401);
    });

    it("401 si schéma non-Bearer", async () => {
      const err = await runSipaMiddleware("Basic dXNlcjpwYXNz");
      assert.strictEqual(err.output.statusCode, 401);
    });

    it("401 si mauvaise signature", async () => {
      const token = jwt.sign({ scope: "sipa" }, "wrong-secret", { issuer: config.appName });
      const err = await runSipaMiddleware(`Bearer ${token}`);
      assert.strictEqual(err.output.statusCode, 401);
    });

    it("401 si token expiré", async () => {
      const token = jwt.sign({ scope: "sipa" }, SIPA_JWT_SECRET, { issuer: config.appName, expiresIn: -10 });
      const err = await runSipaMiddleware(`Bearer ${token}`);
      assert.strictEqual(err.output.statusCode, 401);
    });

    it("401 si mauvais issuer", async () => {
      const token = jwt.sign({ scope: "sipa" }, SIPA_JWT_SECRET, { issuer: "autre-app" });
      const err = await runSipaMiddleware(`Bearer ${token}`);
      assert.strictEqual(err.output.statusCode, 401);
    });

    it("401 si token signé avec le secret user (cloisonnement des tiers)", async () => {
      const token = jwt.sign({ scope: "sipa" }, config.auth.user.jwtSecret, { issuer: config.appName });
      const err = await runSipaMiddleware(`Bearer ${token}`);
      assert.strictEqual(err.output.statusCode, 401);
    });

    it("401 si token valide mais compte supprimé (révocation immédiate)", async () => {
      const token = createSipaToken(SIPA_USERNAME);
      await sipaUsersDb().deleteOne({ username: SIPA_USERNAME });
      const err = await runSipaMiddleware(`Bearer ${token}`);
      assert.strictEqual(err.output.statusCode, 401);
    });

    it("403 si scope absent", async () => {
      const token = jwt.sign({}, SIPA_JWT_SECRET, { issuer: config.appName });
      const err = await runSipaMiddleware(`Bearer ${token}`);
      assert.strictEqual(err.output.statusCode, 403);
    });

    it("403 si scope différent", async () => {
      const token = jwt.sign({ scope: "user" }, SIPA_JWT_SECRET, { issuer: config.appName });
      const err = await runSipaMiddleware(`Bearer ${token}`);
      assert.strictEqual(err.output.statusCode, 403);
    });
  });

  describe("createSipaUser / deleteSipaUser (actions CLI)", () => {
    it("Crée un compte avec le mot de passe hashé (jamais en clair)", async () => {
      await createSipaUser("nouveau-compte", "un-mot-de-passe-de-vingt-caracteres");

      const user = await sipaUsersDb().findOne({ username: "nouveau-compte" });
      assert.ok(user);
      assert.notStrictEqual(user.password, "un-mot-de-passe-de-vingt-caracteres");
      assert.ok(user.password.startsWith("$6$"));
      assert.ok(compare("un-mot-de-passe-de-vingt-caracteres", user.password));
      assert.ok(user.created_at instanceof Date);
    });

    it("Refuse un username en doublon", async () => {
      await assert.rejects(
        createSipaUser(SIPA_USERNAME, "un-mot-de-passe-de-vingt-caracteres"),
        (err: any) => err.output.statusCode === 409
      );
    });

    it("Refuse un mot de passe trop court (RGS : 20 caractères minimum)", async () => {
      await assert.rejects(createSipaUser("autre-compte", "trop-court"), (err: any) => err.output.statusCode === 400);
    });

    it("Refuse un username hors format", async () => {
      await assert.rejects(
        createSipaUser("bad username!", "un-mot-de-passe-de-vingt-caracteres"),
        (err: any) => err.output.statusCode === 400
      );
    });

    it("Supprime un compte existant, erreur si introuvable", async () => {
      await deleteSipaUser(SIPA_USERNAME);
      assert.strictEqual(await sipaUsersDb().findOne({ username: SIPA_USERNAME }), null);

      await assert.rejects(deleteSipaUser(SIPA_USERNAME), (err: any) => err.output.statusCode === 404);
    });
  });

  describe("Rate limiting POST /api/v2/auth/login", () => {
    it("Renvoie 429 après épuisement des 20 tentatives / 15 min", async () => {
      let last: any;
      for (let i = 0; i < 21; i++) {
        last = await httpClient.post("/api/v2/auth/login", {
          username: "unknown-user",
          password: "wrong-password",
        });
      }
      assert.strictEqual(last.status, 429);
      assert.strictEqual(last.data.message, "Trop de tentatives, réessayez plus tard");
    });
  });
});
