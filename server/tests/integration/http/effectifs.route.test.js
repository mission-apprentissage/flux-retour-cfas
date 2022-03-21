const assert = require("assert").strict;
const { startServer } = require("../../utils/testUtils");
const { createRandomDossierApprenant, getRandomSiretEtablissement } = require("../../data/randomizedSample");
const { apiRoles } = require("../../../src/common/roles");
const { EFFECTIF_INDICATOR_NAMES } = require("../../../src/common/constants/dossierApprenantConstants");

const {
  historySequenceInscritToApprentiToAbandon,
  historySequenceApprenti,
  historySequenceInscritToApprenti,
  historySequenceApprentiToInscrit,
} = require("../../data/historySequenceSamples");
const { DossierApprenantModel, CfaModel } = require("../../../src/common/model");
const { parseXlsxHeaderStreamToJson } = require("../../../src/common/utils/exporterUtils");

describe(__filename, () => {
  describe("/api/effectifs route", () => {
    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const { httpClient } = await startServer();

      const response = await httpClient.get("/api/effectifs", {
        params: { date: "2020-10-10T00:00:00.000Z" },
      });

      assert.equal(response.status, 401);
    });

    it("Vérifie qu'on peut récupérer des effectifs via API pour une séquence de statuts sans filtres", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });

      // Add 10 statuts for filter with history sequence - full
      for (let index = 0; index < 10; index++) {
        const randomStatut = createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceInscritToApprentiToAbandon,
          annee_scolaire: "2020-2021",
        });
        const toAdd = new DossierApprenantModel(randomStatut);
        await toAdd.save();
      }

      // Add 5 statuts for filter with history sequence - simple apprenti
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceApprenti,
          annee_scolaire: "2020-2021",
        });
        const toAdd = new DossierApprenantModel(randomStatut);
        await toAdd.save();
      }

      // Add 15 statuts for filter  with history sequence - inscritToApprenti
      for (let index = 0; index < 15; index++) {
        const randomStatut = createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceInscritToApprenti,
          annee_scolaire: "2020-2021",
        });
        const toAdd = new DossierApprenantModel(randomStatut);
        await toAdd.save();
      }

      // this one should be ignored because of annee_scolaire
      await new DossierApprenantModel(
        createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceInscritToApprenti,
          annee_scolaire: "2021-2022",
        })
      ).save();

      // Expected results
      const expectedResults = {
        nbInscrits: 15,
        nbApprentis: 5,
        nbAbandons: 10,
      };

      // Check good api call
      const response = await httpClient.get("/api/effectifs", {
        params: { date: "2020-10-10T00:00:00.000Z" },
        headers: bearerToken,
      });

      assert.equal(response.status, 200);
      const indices = response.data;
      assert.deepEqual(indices.inscritsSansContrat + indices.rupturants, expectedResults.nbInscrits);
      assert.deepEqual(indices.apprentis, expectedResults.nbApprentis);
      assert.deepEqual(indices.abandons, expectedResults.nbAbandons);
    });

    it("Vérifie qu'on peut récupérer des effectifs via API pour une séquence de statuts avec filtres", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const filterQuery = { etablissement_num_region: "84" };

      // Add 10 statuts for filter with history sequence - full
      for (let index = 0; index < 10; index++) {
        const randomStatut = createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceInscritToApprentiToAbandon,
          annee_scolaire: "2020-2021",
          ...filterQuery,
        });
        const toAdd = new DossierApprenantModel(randomStatut);
        await toAdd.save();
      }

      // Add 5 statuts for filter with history sequence - simple apprenti
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceApprenti,
          annee_scolaire: "2020-2021",
          ...filterQuery,
        });
        const toAdd = new DossierApprenantModel(randomStatut);
        await toAdd.save();
      }

      // Add 15 statuts for filter  with history sequence - inscritToApprenti
      for (let index = 0; index < 15; index++) {
        const randomStatut = createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceInscritToApprenti,
          annee_scolaire: "2020-2021",
          ...filterQuery,
        });
        const toAdd = new DossierApprenantModel(randomStatut);
        await toAdd.save();
      }

      // Expected results
      const expectedResults = {
        nbInscrits: 15,
        nbApprentis: 5,
        nbAbandons: 10,
      };

      // Check good api call
      const response = await httpClient.get("/api/effectifs", {
        params: { date: "2020-10-10T00:00:00.000Z", ...filterQuery },
        headers: bearerToken,
      });

      const indices = response.data;
      assert.deepEqual(indices.inscritsSansContrat + indices.rupturants, expectedResults.nbInscrits);
      assert.deepEqual(indices.apprentis, expectedResults.nbApprentis);
      assert.deepEqual(indices.abandons, expectedResults.nbAbandons);

      // Check bad api call
      const badResponse = await httpClient.get("/api/effectifs", {
        params: { date: "2020-10-10T00:00:00.000Z", etablissement_num_region: "99" },
        headers: bearerToken,
      });

      assert.deepStrictEqual(badResponse.status, 200);
      assert.deepStrictEqual(badResponse.data.inscritsSansContrat, 0);
      assert.deepStrictEqual(badResponse.data.rupturants, 0);
      assert.deepStrictEqual(badResponse.data.apprentis, 0);
      assert.deepStrictEqual(badResponse.data.abandons, 0);
    });
  });

  describe("/api/effectifs/export-xlsx-data-lists route", () => {
    const seedDossiersApprenants = async (statutsProps) => {
      const nbAbandons = 10;
      const nbApprentis = 5;

      // Add 10 statuts with history sequence - full
      for (let index = 0; index < nbAbandons; index++) {
        const randomStatut = createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceInscritToApprentiToAbandon,
          ...statutsProps,
        });
        const toAdd = new DossierApprenantModel(randomStatut);
        await toAdd.save();
      }

      // Add 5 statuts with history sequence - simple apprenti
      for (let index = 0; index < nbApprentis; index++) {
        const randomStatut = createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceApprenti,
          ...statutsProps,
        });
        const toAdd = new DossierApprenantModel(randomStatut);
        await toAdd.save();
      }

      // Add 15 statuts with history sequence - inscritToApprenti
      for (let index = 0; index < 15; index++) {
        const randomStatut = createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceInscritToApprenti,
          ...statutsProps,
        });
        const toAdd = new DossierApprenantModel(randomStatut);
        await toAdd.save();
      }

      // Add 8 statuts with history sequence - inscritToApprentiToInscrit (rupturant)
      for (let index = 0; index < 8; index++) {
        const randomStatut = createRandomDossierApprenant({
          historique_statut_apprenant: historySequenceApprentiToInscrit,
          ...statutsProps,
        });
        const toAdd = new DossierApprenantModel(randomStatut);
        await toAdd.save();
      }
    };

    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const { httpClient } = await startServer();

      const response = await httpClient.get("/api/effectifs/export-xlsx-data-lists", {
        headers: {
          Authorization: "",
        },
      });

      assert.equal(response.status, 401);
    });

    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié en tant qu'admin", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", { permissions: [apiRoles.apiStatutsSeeder] });

      const response = await httpClient.get("/api/effectifs/export-xlsx-data-lists", {
        params: { date: "2020-10-10T00:00:00.000Z", effectif_indicateur: EFFECTIF_INDICATOR_NAMES.apprentis },
        headers: authHeader,
      });

      assert.equal(response.status, 403);
    });

    it("Vérifie qu'on peut récupérer des listes de données des apprentis via API pour un admin", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const cfaUai = "9994889A";
      await new CfaModel({ uai_etablissement: cfaUai }).save();

      await seedDossiersApprenants({ annee_scolaire: "2020-2021", uai_etablissement: cfaUai });

      // Check good api call
      const response = await httpClient.get("/api/effectifs/export-xlsx-data-lists", {
        params: { date: "2020-10-10T00:00:00.000Z", effectif_indicateur: EFFECTIF_INDICATOR_NAMES.apprentis },
        responseType: "arraybuffer",
        headers: authHeader,
      });

      const apprentisList = parseXlsxHeaderStreamToJson(response.data, 3);

      assert.equal(response.status, 200);
      assert.equal(apprentisList.length, 5);
    });

    it("Vérifie qu'on peut récupérer des listes de données des inscrits sans contrats via API pour un admin", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const cfaUai = "9994889A";
      await new CfaModel({ uai_etablissement: cfaUai }).save();

      await seedDossiersApprenants({ annee_scolaire: "2020-2021", uai_etablissement: cfaUai });

      // Check good api call
      const response = await httpClient.get("/api/effectifs/export-xlsx-data-lists", {
        params: {
          date: "2020-10-10T00:00:00.000Z",
          effectif_indicateur: EFFECTIF_INDICATOR_NAMES.inscritsSansContrats,
        },
        responseType: "arraybuffer",
        headers: authHeader,
      });

      const inscritsSansContratsList = parseXlsxHeaderStreamToJson(response.data, 3);

      assert.equal(response.status, 200);
      assert.equal(inscritsSansContratsList.length, 15);
    });

    it("Vérifie qu'on peut récupérer des listes de données des abandons via API pour un admin", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const cfaUai = "9994889A";
      await new CfaModel({ uai_etablissement: cfaUai }).save();

      await seedDossiersApprenants({ annee_scolaire: "2020-2021", uai_etablissement: cfaUai });

      // Check good api call
      const response = await httpClient.get("/api/effectifs/export-xlsx-data-lists", {
        params: { date: "2020-10-10T00:00:00.000Z", effectif_indicateur: EFFECTIF_INDICATOR_NAMES.abandons },
        responseType: "arraybuffer",
        headers: authHeader,
      });

      const abandonsList = parseXlsxHeaderStreamToJson(response.data, 3);

      assert.equal(response.status, 200);
      assert.equal(abandonsList.length, 10);
    });

    it("Vérifie qu'on peut récupérer des listes de données des rupturants via API pour un CFA", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const authHeader = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const cfaUai = "9994889A";
      await new CfaModel({ uai_etablissement: cfaUai }).save();

      await seedDossiersApprenants({ annee_scolaire: "2020-2021", uai_etablissement: cfaUai });

      // Check good api call
      const response = await httpClient.get("/api/effectifs/export-xlsx-data-lists", {
        params: { date: "2020-10-10T00:00:00.000Z", effectif_indicateur: EFFECTIF_INDICATOR_NAMES.rupturants },
        responseType: "arraybuffer",
        headers: authHeader,
      });

      const rupturantsList = parseXlsxHeaderStreamToJson(response.data, 3);

      assert.equal(response.status, 200);
      assert.equal(rupturantsList.length, 8);
    });
  });

  describe("/api/effectifs/niveau-formation route", () => {
    it("Vérifie qu'on peut récupérer les effectifs répartis par niveaux de formation via API", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const filterQuery = { etablissement_num_region: "84" };

      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomDossierApprenant({
          ...filterQuery,
          historique_statut_apprenant: historySequenceApprenti,
          annee_scolaire: "2020-2021",
          niveau_formation: "1",
          niveau_formation_libelle: "1 (blabla)",
        });
        const toAdd = new DossierApprenantModel(randomStatut);
        await toAdd.save();
      }

      const randomStatut = createRandomDossierApprenant({
        ...filterQuery,
        historique_statut_apprenant: historySequenceApprenti,
        annee_scolaire: "2020-2021",
        niveau_formation: "2",
        niveau_formation_libelle: "2 (blabla)",
      });
      const toAdd = new DossierApprenantModel(randomStatut);
      await toAdd.save();

      const searchParams = `date=2020-10-10T00:00:00.000Z&etablissement_num_region=${filterQuery.etablissement_num_region}`;
      const response = await httpClient.get(`/api/effectifs/niveau-formation?${searchParams}`, {
        headers: bearerToken,
      });

      assert.equal(response.status, 200);
      assert.equal(response.data.length, 2);
      const sortByNiveauFormation = (a, b) => (Number(a.niveau_formation) > Number(b.niveau_formation) ? 1 : -1);
      assert.deepStrictEqual(response.data.sort(sortByNiveauFormation), [
        {
          niveau_formation: "1",
          niveau_formation_libelle: "1 (blabla)",
          effectifs: { apprentis: 5, abandons: 0, inscritsSansContrat: 0, rupturants: 0 },
        },
        {
          niveau_formation: "2",
          niveau_formation_libelle: "2 (blabla)",
          effectifs: { apprentis: 1, abandons: 0, inscritsSansContrat: 0, rupturants: 0 },
        },
      ]);
    });
  });

  describe("/api/effectifs/total-organismes route", () => {
    it("Vérifie qu'on peut récupérer le nombre d'organismes transmettant de la donnée sur une région", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const regionNumTest = "28";

      // Add 1 statut for region
      await new DossierApprenantModel(
        createRandomDossierApprenant({
          nom_etablissement: "TEST CFA",
          siret_etablissement: "77929544300013",
          uai_etablissement: "0762232N",
          etablissement_num_region: regionNumTest,
        })
      ).save();

      // Check good api call
      const response = await httpClient.get("/api/effectifs/total-organismes", {
        params: {
          etablissement_num_region: regionNumTest,
        },
        headers: bearerToken,
      });

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, { nbOrganismes: 1 });

      const badRegionResponse = await httpClient.get("/api/effectifs/total-organismes", {
        params: {
          etablissement_num_region: "01",
        },
        headers: bearerToken,
      });

      assert.deepStrictEqual(badRegionResponse.status, 200);
      assert.deepEqual(badRegionResponse.data, { nbOrganismes: 0 });
    });

    it("Vérifie qu'on peut récupérer le nombre d'organismes transmettant de la donnée sur une formation", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const formationCfd = "abcd1234";

      // Add 1 statut for formation
      await new DossierApprenantModel(
        createRandomDossierApprenant({
          nom_etablissement: "TEST CFA",
          siret_etablissement: getRandomSiretEtablissement(),
          siret_etablissement_valid: true,
          uai_etablissement: "0762232N",
          formation_cfd: formationCfd,
        })
      ).save();

      // Check good api call
      const response = await httpClient.get("/api/effectifs/total-organismes", {
        params: {
          formation_cfd: formationCfd,
        },
        headers: bearerToken,
      });

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, { nbOrganismes: 1 });
    });
  });
});
