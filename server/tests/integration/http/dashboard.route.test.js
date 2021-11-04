const assert = require("assert").strict;
const httpTests = require("../../utils/httpTests");
const { createRandomStatutCandidat, getRandomSiretEtablissement } = require("../../data/randomizedSample");
const { apiRoles } = require("../../../src/common/roles");

const {
  historySequenceInscritToApprentiToAbandon,
  historySequenceApprenti,
  historySequenceInscritToApprenti,
} = require("../../data/historySequenceSamples");
const { StatutCandidat } = require("../../../src/common/model");

httpTests(__filename, ({ startServer }) => {
  describe("/api/dashboard/effectifs route", () => {
    it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
      const { httpClient } = await startServer();

      const response = await httpClient.get("/api/dashboard/effectifs", {
        params: { date: "2020-10-10T00:00:00.000Z" },
      });

      assert.equal(response.status, 401);
    });

    it("Vérifie qu'on peut récupérer des effectifs via API pour une séquence de statuts sans filtres", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });

      // Add 10 statuts for filter with history sequence - full
      for (let index = 0; index < 10; index++) {
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceInscritToApprentiToAbandon,
          annee_scolaire: "2020-2021",
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 5 statuts for filter with history sequence - simple apprenti
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceApprenti,
          annee_scolaire: "2020-2021",
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 15 statuts for filter  with history sequence - inscritToApprenti
      for (let index = 0; index < 15; index++) {
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceInscritToApprenti,
          annee_scolaire: "2020-2021",
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // this one should be ignored because of annee_scolaire
      await new StatutCandidat(
        createRandomStatutCandidat({
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
      const response = await httpClient.get("/api/dashboard/effectifs", {
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
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceInscritToApprentiToAbandon,
          annee_scolaire: "2020-2021",
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 5 statuts for filter with history sequence - simple apprenti
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceApprenti,
          annee_scolaire: "2020-2021",
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 15 statuts for filter  with history sequence - inscritToApprenti
      for (let index = 0; index < 15; index++) {
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceInscritToApprenti,
          annee_scolaire: "2020-2021",
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Expected results
      const expectedResults = {
        nbInscrits: 15,
        nbApprentis: 5,
        nbAbandons: 10,
      };

      // Check good api call
      const response = await httpClient.get("/api/dashboard/effectifs", {
        params: { date: "2020-10-10T00:00:00.000Z", ...filterQuery },
        headers: bearerToken,
      });

      const indices = response.data;
      assert.deepEqual(indices.inscritsSansContrat + indices.rupturants, expectedResults.nbInscrits);
      assert.deepEqual(indices.apprentis, expectedResults.nbApprentis);
      assert.deepEqual(indices.abandons, expectedResults.nbAbandons);

      // Check bad api call
      const badResponse = await httpClient.get("/api/dashboard/effectifs", {
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

  describe("/api/dashboard/effectifs-par-niveau-formation route", () => {
    it("Vérifie qu'on peut récupérer les effectifs répartis par niveaux de formation via API", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const filterQuery = { etablissement_num_region: "84" };

      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...filterQuery,
          historique_statut_apprenant: historySequenceApprenti,
          annee_scolaire: "2020-2021",
          niveau_formation: "1",
          niveau_formation_libelle: "1 (blabla)",
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      const randomStatut = createRandomStatutCandidat({
        ...filterQuery,
        historique_statut_apprenant: historySequenceApprenti,
        annee_scolaire: "2020-2021",
        niveau_formation: "2",
        niveau_formation_libelle: "2 (blabla)",
      });
      const toAdd = new StatutCandidat(randomStatut);
      await toAdd.save();

      const searchParams = `date=2020-10-10T00:00:00.000Z&etablissement_num_region=${filterQuery.etablissement_num_region}`;
      const response = await httpClient.get(`/api/dashboard/effectifs-par-niveau-formation?${searchParams}`, {
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

  describe("/api/dashboard/total-organismes route", () => {
    it("Vérifie qu'on peut récupérer le nombre d'organismes transmettant de la donnée sur une région", async () => {
      const { httpClient, createAndLogUser } = await startServer();
      const bearerToken = await createAndLogUser("user", "password", { permissions: [apiRoles.administrator] });
      const regionNumTest = "28";

      // Add 1 statut for region
      await new StatutCandidat(
        createRandomStatutCandidat({
          nom_etablissement: "TEST CFA",
          siret_etablissement: "77929544300013",
          uai_etablissement: "0762232N",
          uai_etablissement_valid: true,
          etablissement_num_region: regionNumTest,
        })
      ).save();

      // Check good api call
      const response = await httpClient.get("/api/dashboard/total-organismes", {
        params: {
          etablissement_num_region: regionNumTest,
        },
        headers: bearerToken,
      });

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, { nbOrganismes: 1 });

      const badRegionResponse = await httpClient.get("/api/dashboard/total-organismes", {
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
      await new StatutCandidat(
        createRandomStatutCandidat({
          nom_etablissement: "TEST CFA",
          siret_etablissement: getRandomSiretEtablissement(),
          siret_etablissement_valid: true,
          uai_etablissement: "0762232N",
          uai_etablissement_valid: true,
          formation_cfd: formationCfd,
        })
      ).save();

      // Check good api call
      const response = await httpClient.get("/api/dashboard/total-organismes", {
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
