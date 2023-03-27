import { strict as assert } from "assert";

import { startServer } from "../../utils/testUtils.js";
import { apiRoles, tdbRoles } from "../../../src/common/roles.js";
import { createRandomDossierApprenantApiInput, createRandomOrganisme } from "../../data/randomizedSample.js";
import { effectifsQueueDb, usersDb } from "../../../src/common/model/collections.js";
import { createUserLegacy } from "../../../src/common/actions/legacy/users.legacy.actions.js";
import { createOrganisme } from "../../../src/common/actions/organismes/organismes.actions.js";

const user = {
  name: "userApi",
  password: "password",
};

const createApiUser = () =>
  createUserLegacy({
    username: user.name,
    password: user.password,
    permissions: [apiRoles.apiStatutsSeeder],
  });

const getJwtForUser = async (httpClient) => {
  const { data } = await httpClient.post("/api/login", {
    username: user.name,
    password: user.password,
  });
  return data.access_token;
};

describe("Dossiers Apprenants Route", () => {
  const uai = "0802004U";
  const siret = "77937827200016";
  let randomOrganisme;
  beforeEach(async () => {
    // Create organisme
    randomOrganisme = createRandomOrganisme({ uai, siret });

    try {
      const { _id } = await createOrganisme(randomOrganisme, {
        buildFormationTree: false,
        buildInfosFromSiret: false,
        callLbaApi: false,
      });
    } catch (/** @type {any}*/ err: any) {
      console.error("Error with the following randomOrganisme", randomOrganisme);
      throw new Error(err);
    }
  });

  describe("POST dossiers-apprenants/test", () => {
    it("Vérifie que la route /dossiers-apprenants/test fonctionne avec un jeton JWT", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      // Call Api Route
      const response = await httpClient.post(
        "/api/dossiers-apprenants/test",
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Check Api Route data
      assert.deepEqual(response.status, 200);
      assert.deepEqual(response.data.msg, "ok");
    });
  });

  describe("POST dossiers-apprenants/", () => {
    it("Vérifie que la route /dossiers-apprenants fonctionne avec un tableau vide", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      // Call Api Route
      const response = await httpClient.post("/api/dossiers-apprenants", [], {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Check Api Route data
      assert.equal(response.status, 200);
      assert.equal(response.data.status, "OK");
    });

    it("Vérifie que la route /dossiers-apprenants renvoie une 401 pour un user non authentifié", async () => {
      const { httpClient } = await startServer();

      const response = await httpClient.post("/api/dossiers-apprenants", [], {
        headers: {
          Authorization: "",
        },
      });

      assert.deepEqual(response.status, 401);
    });

    it("Vérifie que la route /dossiers-apprenants renvoie une 403 pour un user n'ayant pas la permission", async () => {
      const { httpClient } = await startServer();

      // Create a normal user
      const createdId = await createUserLegacy({
        username: "normal-user",
        password: "password",
        permissions: [tdbRoles.cfa, tdbRoles.network, tdbRoles.pilot],
      });

      const userWithoutPermission = await usersDb().findOne({ _id: createdId });

      const { data } = await httpClient.post("/api/login", {
        username: userWithoutPermission?.username,
        password: "password",
      });

      // Call Api Route
      const response = await httpClient.post("/api/dossiers-apprenants", [], {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      assert.deepEqual(response.status, 403);
    });

    it("Vérifie l'erreur d'ajout via route /dossiers-apprenants pour un trop grande nb de données randomisées (>100)", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      const nbItemsToTest = 200;

      // Create input list with uai / siret for organisme created
      let inputList: any[] = [];
      for (let index = 0; index < nbItemsToTest; index++) {
        inputList.push(createRandomDossierApprenantApiInput({ uai_etablissement: uai, siret_etablissement: siret }));
      }

      // Call Api Route
      const response = await httpClient.post("/api/dossiers-apprenants", inputList, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Check Api Route data & Data not added
      assert.deepEqual(response.status, 413);
      assert.equal(await effectifsQueueDb().countDocuments({}), 0);
    });

    it("Vérifie l'ajout via route /dossiers-apprenants de 20 données randomisées", async function () {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);
      const nbItemsToTest = 20;

      // Create input list with uai / siret for organisme created
      let inputList: any[] = [];
      for (let index = 0; index < nbItemsToTest; index++) {
        const dossier = createRandomDossierApprenantApiInput({ uai_etablissement: uai, siret_etablissement: siret });
        inputList.push(dossier);
      }

      // Call Api Route
      const response = await httpClient.post("/api/dossiers-apprenants", inputList, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      // Check Api Response
      assert.equal(response.status, 200);
      assert.equal(response.data.status, "OK");
      assert.equal(response.data.message, "Queued");
      assert.equal(response.data.data.length, 20);

      // Check Nb Items added
      assert.deepEqual(await effectifsQueueDb().countDocuments({}), nbItemsToTest);
      // Check source is set
      assert.deepEqual((await effectifsQueueDb().findOne({}))?.source, "userApi");
    });
  });
});
