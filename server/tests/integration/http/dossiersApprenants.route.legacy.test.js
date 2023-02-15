import { strict as assert } from "assert";
import nock from "nock";

import { startServer } from "../../utils/testUtils.js";
import { apiRoles, tdbRoles } from "../../../src/common/roles.js";
import {
  createRandomDossierApprenantApiInput,
  createRandomDossierApprenant,
  createRandomOrganisme,
} from "../../data/randomizedSample.js";
import { cfdRegex } from "../../../src/common/utils/validationsUtils/cfd.js";
import { dossiersApprenantsMigrationDb, usersDb } from "../../../src/common/model/collections.js";
import { createUserLegacy } from "../../../src/common/actions/legacy/users.legacy.actions.js";
import { createOrganisme, findOrganismeById } from "../../../src/common/actions/organismes/organismes.actions.js";
import { insertDossierApprenant } from "../../../src/common/actions/dossiersApprenants.actions.js";

const user = {
  name: "userApi",
  password: "password",
};

const createApiUser = async () => {
  return await createUserLegacy({
    username: user.name,
    password: user.password,
    permissions: [apiRoles.apiStatutsSeeder],
  });
};

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
  let createdOrganisme;
  beforeEach(async () => {
    // Create organisme
    randomOrganisme = createRandomOrganisme({ uai, siret });

    try {
      const { _id } = await createOrganisme(randomOrganisme);
      createdOrganisme = await findOrganismeById(_id);
    } catch (err) {
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
      nock("https://entreprise.api.gouv.fr:443");

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
        username: userWithoutPermission.username,
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

    const requiredFields = [
      "prenom_apprenant",
      "nom_apprenant",
      "date_de_naissance_apprenant",
      "id_formation",
      "uai_etablissement",
      "statut_apprenant",
      "annee_scolaire",
      "date_metier_mise_a_jour_statut",
      "id_erp_apprenant",
    ];
    requiredFields.forEach((requiredField) => {
      it(`Vérifie qu'on ne crée pas de donnée et renvoie une 200 + WARNING lorsque le champ obligatoire '${requiredField}' n'est pas renseigné`, async () => {
        const { httpClient } = await startServer();
        await createApiUser();
        const accessToken = await getJwtForUser(httpClient);

        // set required field as undefined
        const input = [createRandomDossierApprenantApiInput({ [requiredField]: undefined })];
        // perform request
        const response = await httpClient.post("/api/dossiers-apprenants", input, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        // check response
        assert.equal(response.status, 200);
        assert.equal(response.data.status, "WARNING");
        assert.equal(response.data.message.includes("Warning : 1 items not valid"), true);
        assert.equal(response.data.ok, 0);
        assert.equal(response.data.ko, 1);
        assert.equal(response.data.validationErrors.length, 1);
        assert.equal(response.data.validationErrors[0].errors.length, 1);
        assert.equal(
          response.data.validationErrors[0].errors[0].message.includes(`${requiredField}" is required`),
          true
        );

        // check that no data was created
        assert.equal(await dossiersApprenantsMigrationDb().countDocuments({}), 0);
      });
    });

    it("Vérifie qu'on ne crée pas de donnée et renvoie une 400 lorsque le champ annee_scolaire ne respecte pas le format", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      // set required field as undefined
      const input = [createRandomDossierApprenantApiInput({ annee_scolaire: "2021,2022" })];
      // perform request
      const response = await httpClient.post("/api/dossiers-apprenants", input, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      // check response
      assert.equal(response.data.status, "WARNING");
      assert.equal(response.data.validationErrors.length, 1);
      assert.equal(
        response.data.validationErrors[0].errors[0].message.includes(
          '"annee_scolaire" with value "2021,2022" fails to match the required pattern'
        ),
        true
      );
      // check that no data was created
      assert.equal(await dossiersApprenantsMigrationDb().countDocuments({}), 0);
    });

    it("Vérifie qu'on ne crée pas de donnée et renvoie une 400 lorsque le champ uai_etablissement ne respecte pas le format", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      const input = [createRandomDossierApprenantApiInput({ uai_etablissement: "invalide" })];
      // perform request
      const response = await httpClient.post("/api/dossiers-apprenants", input, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      // check response
      assert.equal(response.data.status, "WARNING");
      assert.equal(response.data.validationErrors.length, 1);
      assert.equal(
        response.data.validationErrors[0].errors[0].message.includes(
          '"uai_etablissement" with value "invalide" fails to match the required pattern'
        ),
        true
      );
      // check that no data was created
      assert.equal(await dossiersApprenantsMigrationDb().countDocuments({}), 0);
    });

    const invalidDates = ["2020", "2020-10", "2020-10-", "2020-10-1", "13/11/2020", "abc", true];
    invalidDates.forEach((invalidDate) => {
      it(`Vérifie qu'on ne crée pas de donnée et renvoie une 400 lorsque les champs date ne sont pas iso (${invalidDate})`, async () => {
        const { httpClient } = await startServer();
        await createApiUser();
        const accessToken = await getJwtForUser(httpClient);

        // set required field as undefined
        const input = [
          createRandomDossierApprenantApiInput({
            date_metier_mise_a_jour_statut: invalidDate,
          }),
        ];
        // perform request
        const response = await httpClient.post("/api/dossiers-apprenants", input, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        // check response
        assert.equal(response.data.status, "WARNING");
        assert.equal(response.data.validationErrors.length, 1);
        assert.equal(
          response.data.validationErrors[0].errors[0].message.includes("date_metier_mise_a_jour_statut"),
          true
        );
        // check that no data was created
        assert.equal(await dossiersApprenantsMigrationDb().countDocuments({}), 0);
      });
    });

    it("Vérifie l'ajout via route /dossiers-apprenants de 20 données randomisées", async function () {
      this.timeout(20000);
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);
      const nbItemsToTest = 20;

      // Create input list with uai / siret for organisme created
      let inputList = [];
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
      assert.equal(response.data.message, "Success");
      assert.equal(response.data.error, undefined);

      // Check Nb Items added
      assert.deepEqual(await dossiersApprenantsMigrationDb().countDocuments({}), nbItemsToTest);
    });

    it("Vérifie l'erreur d'ajout via route /dossiers-apprenants pour un trop grande nb de données randomisées (>100)", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      const nbItemsToTest = 200;

      // Create input list with uai / siret for organisme created
      let inputList = [];
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
      assert.equal(await dossiersApprenantsMigrationDb().countDocuments({}), 0);
    });

    it("Vérifie l'ajout via route /dossiers-apprenants de 10 statuts valides et 3 statuts invalides", async function () {
      this.timeout(10000);
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      // Generate random valid & invalid data
      const nbValidItems = 10;

      // Create valid & invalid list
      let validData = [];
      for (let index = 0; index < nbValidItems; index++) {
        validData.push(createRandomDossierApprenantApiInput({ uai_etablissement: uai, siret_etablissement: siret }));
      }

      let invalidData = [
        createRandomDossierApprenantApiInput({ prenom_apprenant: null }),
        createRandomDossierApprenantApiInput({ date_metier_mise_a_jour_statut: true }),
        createRandomDossierApprenantApiInput({ id_formation: 72 }),
      ];

      const randomValidAndInvalidData = [...validData, ...invalidData];

      // Call Api Route
      const response = await httpClient.post("/api/dossiers-apprenants", randomValidAndInvalidData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Check Api Route data
      assert.deepEqual(response.status, 200);
      assert.equal(response.data.status, "WARNING");
      assert.equal(response.data.message.includes("Warning : 3 items not valid"), true);
      assert.deepEqual(response.data.ok, 10);
      assert.deepEqual(response.data.ko, 3);
      assert.equal(response.data.validationErrors.length, 3);

      // Check Nb Items added
      assert.deepEqual(await dossiersApprenantsMigrationDb().countDocuments({}), nbValidItems);
    });

    it("Vérifie l'ajout via route /dossiers-apprenants pour un statut avec bon code CFD (id_formation)", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      const goodCfd = "50033610";

      // Generate random data with good cfd
      const simpleStatutWithGoodCfd = {
        ...createRandomDossierApprenantApiInput({ uai_etablissement: uai, siret_etablissement: siret }),
        id_formation: goodCfd,
      };

      const response = await httpClient.post("/api/dossiers-apprenants", [simpleStatutWithGoodCfd], {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Check data added
      assert.deepEqual(response.status, 200);
      assert.ok(response.data.status);
      assert.ok(response.data.message);
      assert.deepEqual(response.data.status, "OK");

      // Check Nb Items added
      assert.deepEqual(await dossiersApprenantsMigrationDb().countDocuments({}), 1);
    });

    it("Vérifie qu'on ne peut créer un dossier apprenant avec des espaces en début/fin de prenom_apprenant et nom_apprenant", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      // Generate random data with good cfd
      const simpleStatutWithGoodCfd = {
        ...createRandomDossierApprenantApiInput({ uai_etablissement: uai, siret_etablissement: siret }),
        nom_apprenant: "Test    ",
        prenom_apprenant: "     Test",
      };

      const responsePost = await httpClient.post("/api/dossiers-apprenants", [simpleStatutWithGoodCfd], {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseGet = await httpClient.get(
        `/api/dossiers-apprenants?limit=1&uai_etablissement=${simpleStatutWithGoodCfd.uai_etablissement}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Check data added
      assert.deepEqual(responsePost.status, 200);
      assert.ok(responsePost.data.status);
      assert.ok(responsePost.data.message);
      assert.deepEqual(responsePost.data.status, "OK");
      assert.deepEqual(responseGet.data.dossiersApprenants[0].nom_apprenant, "TEST");
      assert.deepEqual(responseGet.data.dossiersApprenants[0].prenom_apprenant, "TEST");

      // Check Nb Items added
      assert.deepEqual(await dossiersApprenantsMigrationDb().countDocuments({}), 1);
    });

    it("Vérifie l'erreur d'ajout via route /dossiers-apprenants pour un statut avec mauvais code CFD (id_formation)", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      const badCfd = "abc123456";

      // Generate random data with bad cfd
      const simpleStatutWithBadCfd = {
        ...createRandomDossierApprenantApiInput({ uai_etablissement: uai, siret_etablissement: siret }),
        id_formation: badCfd,
      };

      const response = await httpClient.post("/api/dossiers-apprenants", [simpleStatutWithBadCfd], {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // check response & validation errors
      assert.equal(response.data.status, "WARNING");
      assert.equal(response.data.validationErrors.length, 1);
      assert.equal(
        response.data.validationErrors[0].errors[0].message.includes(
          `"id_formation" with value "${badCfd}" fails to match the required pattern: ${cfdRegex}`
        ),
        true
      );
      assert.equal(await dossiersApprenantsMigrationDb().countDocuments({}), 0);
    });

    it("Vérifie l'erreur d'ajout via route /dossiers-apprenants pour un statut avec un SIRET au mauvais format", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      const badSiret = "abc123456";

      // Generate random data with bad siret
      const simpleStatutWithBadSiret = {
        ...createRandomDossierApprenantApiInput({ uai_etablissement: uai }),
        siret_etablissement: badSiret,
      };

      const response = await httpClient.post("/api/dossiers-apprenants", [simpleStatutWithBadSiret], {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // check response & validation errors
      assert.equal(response.data.status, "WARNING");
      assert.equal(response.data.validationErrors.length, 1);
      assert.equal(await dossiersApprenantsMigrationDb().countDocuments({}), 0);
    });
  });

  describe("GET dossiers-apprenants/", () => {
    it("Vérifie que la récupération via GET /dossiers-apprenants renvoie une 401 pour un user non authentifié", async () => {
      const { httpClient } = await startServer();

      const response = await httpClient.get("/api/dossiers-apprenants", {
        headers: { Authorization: "" },
      });

      assert.deepEqual(response.status, 401);
    });

    it("Vérifie que la récupération via GET /dossiers-apprenants renvoie une 403 pour un user n'ayant pas la permission", async () => {
      const { httpClient } = await startServer();

      // Create a normal user

      const createdId = await createUserLegacy({
        username: "normal-user",
        password: "password",
        permissions: [],
      });
      const userWithoutPermission = await usersDb().findOne({ _id: createdId });
      assert.deepEqual(userWithoutPermission.permissions.length, 0);

      const { data } = await httpClient.post("/api/login", {
        username: userWithoutPermission.username,
        password: "password",
      });

      // Call Api Route
      const response = await httpClient.get("/api/dossiers-apprenants", {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      assert.deepEqual(response.status, 403);
    });

    it("Vérifie que la récupération via GET /dossiers-apprenants renvoie tous les dossiersApprenants ayant pour source le username d'un user appelant", async () => {
      const { httpClient } = await startServer();

      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      // Create random dossiers for fixed uai & user.name as source
      const nbRandomDossiers = 10;
      for (let index = 0; index < nbRandomDossiers; index++) {
        await insertDossierApprenant(
          createRandomDossierApprenant({
            uai_etablissement: createdOrganisme.uai,
            siret_etablissement: createdOrganisme.siret,
            organisme_id: createdOrganisme._id,
            source: user.name,
          })
        );
      }

      // Call Api Route with limit 2 elements
      const response = await httpClient.get("/api/dossiers-apprenants?limit=2", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Check Api Route data
      assert.deepEqual(response.status, 200);
      assert.equal(response.data.dossiersApprenants.length, 2);
      assert.equal(response.data.pagination.page, 1);
      assert.equal(response.data.pagination.nombre_de_page, nbRandomDossiers / 2);
      assert.equal(response.data.pagination.total, nbRandomDossiers);
    });

    it("Vérifie que la récupération via GET /dossiers-apprenants/ ne renvoie aucun dossiersApprenants si aucun n'a pour source le username du user appelant", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      // Create random dossiers for fixed uai & OTHER_ERP as source
      const nbRandomDossiers = 10;
      const currentUai = "0762232N";
      for (let index = 0; index < nbRandomDossiers; index++) {
        await insertDossierApprenant(
          createRandomDossierApprenant({
            uai_etablissement: currentUai,
            siret_etablissement: createdOrganisme.siret,
            organisme_id: createdOrganisme._id,
            source: "OTHER_ERP", // Source not linked to username
          })
        );
      }

      // Call Api Route with limit 2 elements
      const response = await httpClient.get("/api/dossiers-apprenants?limit=2", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Check Api Route data
      assert.deepEqual(response.status, 200);
      assert.equal(response.data.dossiersApprenants.length, 0);
      assert.equal(response.data.pagination.page, 1);
      assert.equal(response.data.pagination.nombre_de_page, 1);
      assert.equal(response.data.pagination.total, 0);
    });

    it("Vérifie que la récupération via GET /dossiers-apprenants/ renvoie uniquement les bons dossiersApprenants pour un user ayant la permission", async () => {
      const { httpClient } = await startServer();
      await createApiUser();
      const accessToken = await getJwtForUser(httpClient);

      // Create random dossiers for fixed uai & user.name as source
      const nbRandomDossiersForUser = 20;
      const currentUai = "0762232N";

      for (let index = 0; index < nbRandomDossiersForUser; index++) {
        await insertDossierApprenant(
          createRandomDossierApprenant({
            uai_etablissement: currentUai,
            source: user.name,
            organisme_id: createdOrganisme._id,
            siret_etablissement: createdOrganisme.siret,
          })
        );
      }

      // Create random dossiers for fixed uai & OTHER_ERP as source
      const nbRandomDossiersForOtherErp = 50;
      for (let index = 0; index < nbRandomDossiersForOtherErp; index++) {
        await insertDossierApprenant(
          createRandomDossierApprenant({
            uai_etablissement: currentUai,
            source: "OTHER_ERP",
            organisme_id: createdOrganisme._id,
            siret_etablissement: createdOrganisme.siret,
          })
        );
      }

      // Call Api Route with limit 2 elements
      const response = await httpClient.get("/api/dossiers-apprenants?limit=2", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Check Api Route data
      assert.deepEqual(response.status, 200);
      assert.equal(response.data.dossiersApprenants.length, 2);
      assert.equal(response.data.pagination.page, 1);
      assert.equal(response.data.pagination.nombre_de_page, nbRandomDossiersForUser / 2);
      assert.equal(response.data.pagination.total, nbRandomDossiersForUser);
    });
  });
});
