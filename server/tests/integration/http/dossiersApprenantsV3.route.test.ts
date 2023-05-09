import { strict as assert } from "assert";

import { AxiosInstance } from "axiosist";

import { createUserLegacy } from "@/common/actions/legacy/users.legacy.actions";
import { createOrganisme } from "@/common/actions/organismes/organismes.actions";
import { effectifsV3QueueDb, usersDb } from "@/common/model/collections";
import { apiRoles } from "@/common/roles";
import { createRandomDossierApprenantApiV3Input, createRandomOrganisme } from "@tests/data/randomizedSample";
import { initTestApp } from "@tests/utils/testUtils";

const user = {
  name: "userApi",
  password: "password",
};

const API_ENDPOINT_URL = "/api/v3/dossiers-apprenants";

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

describe("Dossiers Apprenants Route V3", () => {
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

  it("La route fonctionne avec un tableau vide", async () => {
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

  it("La route renvoie une 401 pour un user non authentifié", async () => {
    const response = await httpClient.post(API_ENDPOINT_URL, [], {
      headers: {
        Authorization: "",
      },
    });

    expect(response.status).toBe(401);
  });

  it("La route renvoie une 403 pour un user n'ayant pas la permission", async () => {
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

  it("L'erreur d'ajout via route pour un trop grande nb de données randomisées (>100)", async () => {
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    const nbItemsToTest = 200;

    // Create input list with uai / siret for organisme created
    let inputList: any[] = [];
    for (let index = 0; index < nbItemsToTest; index++) {
      inputList.push(
        createRandomDossierApprenantApiV3Input({
          etablissement_responsable: {
            uai,
            siret,
          },
        })
      );
    }

    // Call Api Route
    const response = await httpClient.post(API_ENDPOINT_URL, inputList, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Check Api Route data & Data not added
    expect(response.status).toBe(413);
    assert.equal(await effectifsV3QueueDb().countDocuments({}), 0);
  });

  it("L'ajout via route de 20 données randomisées", async function () {
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);
    const nbItemsToTest = 20;

    // Create input list with uai / siret for organisme created
    let inputList: any[] = [];
    for (let index = 0; index < nbItemsToTest; index++) {
      const dossier = createRandomDossierApprenantApiV3Input({
        etablissement_responsable: {
          uai,
          siret,
        },
      });
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
    assert.deepEqual(await effectifsV3QueueDb().countDocuments({}), nbItemsToTest);
    // Check source is set
    assert.deepEqual((await effectifsV3QueueDb().findOne({}))?.source, "userApi");
  });

  it("L'ajout via route de dossiers contenant des erreurs", async function () {
    await createApiUser();
    const accessToken = await getJwtForUser(httpClient);

    // Create input list with uai / siret for organisme created
    const dossier = createRandomDossierApprenantApiV3Input({
      etablissement_responsable: { uai, siret },
      employeur: { code_naf: "test", code_commune_insee: "test" },
      apprenant: {
        telephone: "invalide",
        date_de_naissance: "invalid date",
        sexe: "invalid sexe",
        date_rqth: "invalid date",
      },
    });

    // Call Api Route
    const response = await httpClient.post(API_ENDPOINT_URL, [dossier], {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    // Check Api Response
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      status: "OK",
      message: "Queued",
      detail: "Some data are invalid",
      data: [
        {
          ...dossier,
          source: "userApi",
          validation_errors: [
            {
              message: "Format invalide",
              path: ["apprenant", "date_de_naissance"],
            },
            {
              message: "Format invalide",
              path: ["apprenant", "telephone"],
            },
            {
              message: "Format invalide",
              path: ["apprenant", "date_rqth"],
            },
            {
              message: "Format invalide",
              path: ["employeur", "code_commune_insee"],
            },
            {
              message: "Format invalide",
              path: ["employeur", "code_naf"],
            },
          ],
          _id: response.data.data[0]._id,
          updated_at: expect.any(String),
          created_at: expect.any(String),
          processed_at: expect.any(String),
        },
      ],
    });

    // Check Nb Items added
    expect(await effectifsV3QueueDb().countDocuments({})).toBe(1);
  });
});
