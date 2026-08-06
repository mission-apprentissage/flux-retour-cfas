import { strict as assert } from "assert";

import { AxiosInstance } from "axiosist";
import { ObjectId } from "mongodb";
import { IUsersMigration } from "shared/models/data/usersMigration.model";
import { it, describe, beforeEach, vi } from "vitest";

import { organisationsDb, usersMigrationDb } from "@/common/model/collections";
import { setTime } from "@/common/utils/timeUtils";
import { useMongo } from "@tests/jest/setupMongo";
import { id, initTestApp, testPasswordHash } from "@tests/utils/testUtils";

vi.mock("@/common/services/mailer/mailer");

const date = "2022-10-10T00:00:00.000Z";

const testUser: IUsersMigration = {
  _id: new ObjectId(id(1)),
  account_status: "CONFIRMED",
  password_updated_at: new Date(date),
  connection_history: [],
  emails: [],
  created_at: new Date(date),
  civility: "Madame",
  nom: "Dupont",
  prenom: "Jean",
  fonction: "Responsable administratif",
  email: "user@tdb.local",
  telephone: "",
  password: testPasswordHash,
  has_accept_cgu_version: "v0.1",
  organisation_id: new ObjectId(id(1)),
};

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;

describe("Authentification", () => {
  useMongo();
  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    setTime(new Date(date));
  });

  describe("POST /v1/auth/login - authentification", () => {
    beforeEach(async () => {
      await Promise.all([
        organisationsDb().insertOne({
          _id: new ObjectId(id(1)),
          created_at: new Date(date),
          type: "DREETS",
          code_region: "53",
        }),
        usersMigrationDb().insertOne(testUser),
      ]);
    });

    it("Retourne un cookie de session", async () => {
      let response = await httpClient.post("/api/v1/auth/login", {
        email: "user@tdb.local",
        password: "MDP-azerty123",
      });

      assert.strictEqual(response.status, 200);
      const cookie = response.headers["set-cookie"]?.[0];
      assert.ok(cookie);
      assert.match(cookie, /^flux-retour-cfas-/);

      response = await httpClient.get("/api/v1/session", {
        headers: { cookie },
      });
      assert.strictEqual(response.status, 200);
      assert.deepStrictEqual(response.data, {
        _id: id(1),
        account_status: "CONFIRMED",
        civility: "Madame",
        created_at: date,
        email: "user@tdb.local",
        fonction: "Responsable administratif",
        has_accept_cgu_version: "v0.1",
        last_connection: date,
        nom: "Dupont",
        organisation: {
          _id: id(1),
          code_region: "53",
          created_at: date,
          type: "DREETS",
        },
        organisation_id: id(1),
        password_updated_at: date,
        prenom: "Jean",
        telephone: "",
        acl: {
          configurerModeTransmission: false,
          effectifsNominatifs: {
            abandon: {
              region: {
                $in: ["53"],
              },
            },
            apprenant: false,
            apprenti: false,
            inconnu: false,
            inscritSansContrat: {
              region: {
                $in: ["53"],
              },
            },
            rupturant: {
              region: {
                $in: ["53"],
              },
            },
          },
          indicateursEffectifs: {
            region: {
              $in: ["53"],
            },
          },
          infoTransmissionEffectifs: true,
          manageEffectifs: false,
          viewContacts: {
            region: {
              $in: ["53"],
            },
          },
        },
      });
    });

    it("Erreur si mauvais mot de passe", async () => {
      const response = await httpClient.post("/api/v1/auth/login", {
        email: "user@tdb.local",
        password: "wrong password",
      });

      assert.strictEqual(response.status, 401);
    });

    it("Erreur si compte inconnu", async () => {
      const response = await httpClient.post("/api/v1/auth/login", {
        email: "missing-user@tdb.local",
        password: "MDP-azerty123",
      });

      assert.strictEqual(response.status, 401);
    });

    it("Erreur si compte en attente de validation email", async () => {
      await usersMigrationDb().insertOne({
        ...testUser,
        _id: new ObjectId(id(2)),
        email: "user2@tdb.local",
        account_status: "PENDING_EMAIL_VALIDATION",
      });
      const response = await httpClient.post("/api/v1/auth/login", {
        email: "user2@tdb.local",
        password: "MDP-azerty123",
      });

      assert.strictEqual(response.status, 403);
      assert.deepStrictEqual(response.data, {
        error: "Forbidden",
        message: "Votre compte n'est pas encore validé.",
      });
    });

    it("Erreur si compte en attente de confirmation", async () => {
      await usersMigrationDb().insertOne({
        ...testUser,
        _id: new ObjectId(id(2)),
        email: "user2@tdb.local",
        account_status: "PENDING_ADMIN_VALIDATION",
      });
      const response = await httpClient.post("/api/v1/auth/login", {
        email: "user2@tdb.local",
        password: "MDP-azerty123",
      });

      assert.strictEqual(response.status, 403);
      assert.deepStrictEqual(response.data, {
        error: "Forbidden",
        message: "Votre compte n'est pas encore validé.",
      });
    });
  });

  describe("POST /v1/auth/register - règles de mot de passe", () => {
    const registrationBody = (password: string, organisation: object = { type: "DREETS", code_region: "53" }) => ({
      user: {
        email: "nouveau@tdb.local",
        civility: "Madame",
        nom: "Dupont",
        prenom: "Jeanne",
        fonction: "Responsable administratif",
        telephone: "0102030405",
        password,
        has_accept_cgu_version: "v0.4",
      },
      organisation,
    });

    it.each([
      ["trop court", "Abcdef1!"],
      ["sans majuscule", "abcdefghijk1!"],
      ["sans minuscule", "ABCDEFGHIJK1!"],
      ["sans chiffre", "Abcdefghijkl!"],
      ["sans caractère spécial", "Abcdefghijk12"],
    ])("Refuse un mot de passe %s", async (_label, password) => {
      const response = await httpClient.post("/api/v1/auth/register", registrationBody(password));

      assert.strictEqual(response.status, 400);
      assert.strictEqual(await usersMigrationDb().countDocuments({}), 0);
    });

    it("Accepte un mot de passe conforme", async () => {
      const response = await httpClient.post("/api/v1/auth/register", registrationBody("Abcdefghijk1!"));

      assert.strictEqual(response.status, 200);
      assert.strictEqual(await usersMigrationDb().countDocuments({ email: "nouveau@tdb.local" }), 1);
    });

    it("Exige 20 caractères pour une organisation ADMINISTRATEUR", async () => {
      const response = await httpClient.post(
        "/api/v1/auth/register",
        registrationBody("Abcdefghijk1!", { type: "ADMINISTRATEUR" })
      );

      assert.strictEqual(response.status, 400);
      assert.strictEqual(await usersMigrationDb().countDocuments({}), 0);
    });
  });
});
