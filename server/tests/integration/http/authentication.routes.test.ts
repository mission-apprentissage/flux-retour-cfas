import { strict as assert } from "assert";
import { id, initTestApp } from "../../utils/testUtils.js";
import { AxiosInstance } from "axiosist";
import { organisationsDb, usersMigrationDb } from "../../../src/common/model/collections.js";
import { UsersMigration } from "../../../src/common/model/@types/UsersMigration.js";
import { ObjectId } from "mongodb";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;

const date = "2022-10-10T00:00:00.000Z";

const commonUserAttributes: Omit<UsersMigration, "organisation_id"> = {
  account_status: "CONFIRMED",
  invalided_token: false,
  password_updated_at: new Date(date),
  connection_history: [],
  emails: [],
  created_at: new Date(date),
  civility: "Madame",
  nom: "Dupont",
  prenom: "Jean",
  fonction: "Responsable administratif",
  email: "user@test.local.fr",
  telephone: "",
  password:
    "$6$rounds=10000$c41a72eab295ea9b$6cMipCc33XlnZh8/rdraqeFq5Y4WhqtshSSoZJIv/WS3mJ6VayZxdYQW0.Nm2J53oklb8HfFSxypLwMTOtWh//", // MDP-azerty123
  has_accept_cgu_version: "v0.1",
};

describe("Authentification", () => {
  before(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
  });

  beforeEach(async () => {
    await Promise.all([
      await organisationsDb().insertOne({
        _id: new ObjectId(id(1)),
        created_at: new Date(date),
        type: "DREETS",
        code_region: "53",
      }),
      await usersMigrationDb().insertOne({
        _id: new ObjectId(id(1)),
        ...commonUserAttributes,
        organisation_id: new ObjectId(id(1)),
      }),
    ]);
  });

  describe("POST /v1/auth/login - authentification", () => {
    it("", async () => {
      let response = await httpClient.post("/api/v1/auth/login", {
        email: "user@test.local.fr",
        password: "MDP-azerty123",
      });

      assert.strictEqual(response.status, 200);
      const cookie = response.headers["set-cookie"][0];
      assert.match(cookie, /^flux-retour-cfas-/);

      response = await httpClient.get("/api/v1/session", {
        headers: {
          cookie: cookie,
        },
      });
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data, {
        _id: id(1),
        account_status: "CONFIRMED",
        civility: "Madame",
        created_at: date,
        email: "user@test.local.fr",
        fonction: "Responsable administratif",
        has_accept_cgu_version: "v0.1",
        invalided_token: false,
        last_connection: date, // = now, il faudrait figer le temsp global pour les tests
        nom: "Dupont",
        organisation: {
          _id: id(1),
          code_region: "53",
          created_at: date,
          type: "DREETS",
        },
        organisation_id: "643d2653769080b44b3149cd",
        password_updated_at: date,
        prenom: "Jean",
        telephone: "",
      });
    });
    it("Erreur si mauvais mot de passe", async () => {
      let response = await httpClient.post("/api/v1/auth/login", {
        email: "user@test.local.fr",
        password: "wrong password",
      });

      assert.strictEqual(response.status, 401);
    });
    it("Erreur si compte inconnu", async () => {
      let response = await httpClient.post("/api/v1/auth/login", {
        email: "missing-user@test.local.fr",
        password: "MDP-azerty123",
      });

      assert.strictEqual(response.status, 401);
    });
    // it("Erreur si compte non confirmé", async () => {
    //   await usersMigrationDb().updateOne({
    //     email:
    //   })
    //   let response = await httpClient.post("/api/v1/auth/login", {
    //     email: "user@test.local.fr",
    //     password: "MDP-azerty123",
    //   });

    //   assert.strictEqual(response.status, 4001);
    // });
  });
});
