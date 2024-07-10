import { strict as assert } from "assert";

import { AxiosInstance } from "axiosist";
import { SOURCE_APPRENANT } from "shared/constants";

import { createUserLegacy } from "@/common/actions/legacy/users.legacy.actions";
import { createOrganisme } from "@/common/actions/organismes/organismes.actions";
import { effectifsQueueDb, usersDb } from "@/common/model/collections";
import { apiRoles } from "@/common/roles";
import { createRandomDossierApprenantApiInput, createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp } from "@tests/utils/testUtils";

const user = {
  name: "userApi",
  password: "password",
};

const API_ENDPOINT_URL = "/api/dossiers-apprenants";

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

let httpClient: AxiosInstance;

describe("Dossiers Apprenants Route", () => {
  useMongo();
  beforeEach(async () => {
    const app = await initTestApp();
    httpClient = app.httpClient;
  });

  const uai = "0802004U";
  const siret = "77937827200016";
  let randomOrganisme;

  beforeEach(async () => {
    // Create organisme
    randomOrganisme = createRandomOrganisme({ uai, siret });

    try {
      await createOrganisme(randomOrganisme);
    } catch (err: any) {
      console.error("Error with the following randomOrganisme", randomOrganisme);
      throw new Error(err);
    }
  });

  describe("POST dossiers-apprenants/test", () => {
    it("Vérifie que la route /dossiers-apprenants/test fonctionne avec un jeton JWT", async () => {
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      // Call Api Route
      const response = await httpClient.post(
        `${API_ENDPOINT_URL}/test`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Check Api Route data
      expect(response.status).toBe(200);
      assert.deepEqual(response.data.msg, "ok");
    });
  });

  describe("POST dossiers-apprenants/", () => {
    it("Vérifie que la route /dossiers-apprenants fonctionne avec un tableau vide", async () => {
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      // Call Api Route
      const response = await httpClient.post(API_ENDPOINT_URL, [], {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Check Api Route data
      expect(response.status).toBe(200);
      assert.equal(response.data.status, "OK");
    });

    it("Vérifie que la route /dossiers-apprenants renvoie une 401 pour un user non authentifié", async () => {
      const response = await httpClient.post(API_ENDPOINT_URL, [], {
        headers: {
          Authorization: "",
        },
      });

      expect(response.status).toBe(401);
    });

    it("Vérifie que la route /dossiers-apprenants renvoie une 403 pour un user n'ayant pas la permission", async () => {
      // Create a normal user
      const createdId = await createUserLegacy({
        username: "normal-user",
        password: "password",
        permissions: ["cfa", "network", "pilot"],
      });

      const userWithoutPermission = await usersDb().findOne({ _id: createdId });

      const { data } = await httpClient.post("/api/login", {
        username: userWithoutPermission?.username,
        password: "password",
      });

      // Call Api Route
      const response = await httpClient.post(API_ENDPOINT_URL, [], {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      expect(response.status).toBe(403);
    });

    it("Vérifie l'erreur d'ajout via route /dossiers-apprenants pour un trop grande nb de données randomisées (>100)", async () => {
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      const nbItemsToTest = 200;

      // Create input list with uai / siret for organisme created
      let inputList: any[] = [];
      for (let index = 0; index < nbItemsToTest; index++) {
        inputList.push(createRandomDossierApprenantApiInput({ uai_etablissement: uai, siret_etablissement: siret }));
      }

      // Call Api Route
      const response = await httpClient.post(API_ENDPOINT_URL, inputList, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Check Api Route data & Data not added
      expect(response.status).toBe(413);
      assert.equal(await effectifsQueueDb().countDocuments({}), 0);
    });

    it("Vérifie l'ajout via route /dossiers-apprenants de 20 données randomisées", async function () {
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
      const response = await httpClient.post(API_ENDPOINT_URL, inputList, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Check Api Response
      expect(response.status).toBe(200);
      assert.equal(response.data.status, "OK");
      assert.equal(response.data.message, "Queued");
      assert.equal(response.data.data.length, 20);

      // Check Nb Items added
      assert.deepEqual(await effectifsQueueDb().countDocuments({}), nbItemsToTest);
      // Check source is set
      assert.deepEqual((await effectifsQueueDb().findOne({}))?.source, "ERP");
    });

    it("Vérifie l'ajout via route /dossiers-apprenants de dossiers contenant des erreurs", async function () {
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      // Create input list with uai / siret for organisme created
      const dossier = {
        ...createRandomDossierApprenantApiInput({ uai_etablissement: uai, siret_etablissement: siret }),
        date_de_naissance_apprenant: "invalid date",
        tel_apprenant: "invalid phone",
      };

      // Call Api Route
      const response = await httpClient.post(API_ENDPOINT_URL, [dossier], {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      // Check Api Response
      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual({
        status: "OK",
        message: "Queued",
        detail: "Some data are invalid",
        data: [
          {
            ...dossier,
            source: SOURCE_APPRENANT.ERP,
            user_erp_id: response.data.data[0].user_erp_id,
            has_nir: false,
            validation_errors: [
              {
                message: "Date invalide",
                path: ["date_de_naissance_apprenant"],
              },
              {
                message: "Format invalide",
                path: ["tel_apprenant"],
              },
            ],
            _id: response.data.data[0]._id,
            updated_at: response.data.data[0].updated_at,
            created_at: response.data.data[0].created_at,
            processed_at: response.data.data[0].processed_at,
          },
        ],
      });

      // Check Nb Items added
      await expect(effectifsQueueDb().countDocuments({})).resolves.toBe(1);
    });
  });
});
