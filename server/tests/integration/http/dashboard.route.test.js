const assert = require("assert").strict;
const httpTests = require("../../utils/httpTests");
const { createRandomStatutCandidat, getRandomSiretEtablissement } = require("../../data/randomizedSample");
const {
  historySequenceProspectToInscritToApprentiToAbandon,
  historySequenceApprenti,
  historySequenceInscritToApprenti,
} = require("../../data/historySequenceSamples");
const { StatutCandidat } = require("../../../src/common/model");
const {
  getStatutsSamplesInscrits,
  getStatutsSamplesApprentis,
  getStatutsSamplesAbandons,
  expectedDetailResultList,
} = require("../../data/effectifDetailSamples");
const { asyncForEach } = require("../../../src/common/utils/asyncUtils");

httpTests(__filename, ({ startServer }) => {
  describe("/api/dashboard/etablissements-stats route", () => {
    it("Vérifie qu'on peut récupérer des statistiques d'établissements via API", async () => {
      const { httpClient } = await startServer();

      const response = await httpClient.get("/api/dashboard/etablissements-stats");

      assert.deepStrictEqual(response.status, 200);
      assert.deepStrictEqual(response.data.nbEtablissements, 0);
    });
  });

  describe("/api/dashboard/effectifs route", () => {
    it("Vérifie qu'on peut récupérer des effectifs via API pour une séquence de statuts sans filtres", async () => {
      const { httpClient } = await startServer();

      // Add 10 statuts for filter with history sequence - full
      for (let index = 0; index < 10; index++) {
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceProspectToInscritToApprentiToAbandon,
          siret_etablissement_valid: true,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 5 statuts for filter with history sequence - simple apprenti
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceApprenti,
          siret_etablissement_valid: true,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 15 statuts for filter  with history sequence - inscritToApprenti
      for (let index = 0; index < 15; index++) {
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceInscritToApprenti,
          siret_etablissement_valid: true,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Expected results
      const expectedResults = {
        nbInscrits: 15,
        nbApprentis: 5,
        nbAbandons: 10,
        nbAbandonsProspects: 0,
      };

      // Check good api call
      const response = await httpClient.post("/api/dashboard/effectifs", {
        startDate: "2020-09-15T00:00:00.000Z",
        endDate: "2020-10-10T00:00:00.000Z",
      });

      assert.equal(response.status, 200);
      assert.deepEqual(response.data.inscrits, expectedResults.nbInscrits);
      assert.deepEqual(response.data.apprentis, expectedResults.nbApprentis);
      assert.deepEqual(response.data.abandons, expectedResults.nbAbandons);
      assert.deepEqual(response.data.abandons, expectedResults.nbAbandons);
      assert.deepEqual(response.data.abandonsProspects, expectedResults.nbAbandonsProspects);
    });

    it("Vérifie qu'on peut récupérer des effectifs via API pour une séquence de statuts avec filtres", async () => {
      const { httpClient } = await startServer();
      const filterQuery = { etablissement_num_region: "84" };

      // Add 10 statuts for filter with history sequence - full
      for (let index = 0; index < 10; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{
            historique_statut_apprenant: historySequenceProspectToInscritToApprentiToAbandon,
            siret_etablissement_valid: true,
          },
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 5 statuts for filter with history sequence - simple apprenti
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{
            historique_statut_apprenant: historySequenceApprenti,
            siret_etablissement_valid: true,
          },
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 15 statuts for filter  with history sequence - inscritToApprenti
      for (let index = 0; index < 15; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{
            historique_statut_apprenant: historySequenceInscritToApprenti,
            siret_etablissement_valid: true,
          },
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
        nbAbandonsProspects: 0,
      };

      // Check good api call
      const response = await httpClient.post("/api/dashboard/effectifs", {
        startDate: "2020-09-15T00:00:00.000Z",
        endDate: "2020-10-10T00:00:00.000Z",
        ...filterQuery,
      });

      assert.deepStrictEqual(response.status, 200);
      assert.deepStrictEqual(response.data.inscrits, expectedResults.nbInscrits);
      assert.deepStrictEqual(response.data.apprentis, expectedResults.nbApprentis);
      assert.deepStrictEqual(response.data.abandons, expectedResults.nbAbandons);
      assert.deepStrictEqual(response.data.abandonsProspects, expectedResults.nbAbandonsProspects);

      // Check bad api call
      const badResponse = await httpClient.post("/api/dashboard/effectifs", {
        startDate: "2020-09-15T00:00:00.000Z",
        endDate: "2020-10-10T00:00:00.000Z",
        etablissement_num_region: "99",
      });

      assert.deepStrictEqual(badResponse.status, 200);
      assert.deepStrictEqual(badResponse.data.inscrits, 0);
      assert.deepStrictEqual(badResponse.data.apprentis, 0);
      assert.deepStrictEqual(badResponse.data.abandons, 0);
      assert.deepStrictEqual(badResponse.data.abandonsProspects, 0);
    });
  });

  describe("/api/dashboard/effectifs-par-niveau-et-annee-formation route", () => {
    it("Vérifie qu'on peut récupérer les effectifs répartis par niveaux/année de formation via API", async () => {
      const { httpClient } = await startServer();
      const siretToTest = "77929544300013";

      // Build sample statuts
      const statutsSamplesInscrits = await getStatutsSamplesInscrits(siretToTest);
      const statutsSamplesApprentis = await getStatutsSamplesApprentis(siretToTest);
      const statutsSamplesAbandons = await getStatutsSamplesAbandons(siretToTest);

      // Save all statuts to database
      const sampleStatutsListToSave = [
        ...statutsSamplesInscrits,
        ...statutsSamplesApprentis,
        ...statutsSamplesAbandons,
      ];
      await asyncForEach(sampleStatutsListToSave, async (currentStatut) => {
        await currentStatut.save();
      });

      const searchParams = `date=2020-10-10T00:00:00.000Z&siret_etablissement=${siretToTest}&page=1&limit=100`;
      const response = await httpClient.get(`/api/dashboard/effectifs-par-niveau-et-annee-formation?${searchParams}`);

      assert.equal(response.status, 200);
      assert.equal(response.data.data.length, 2);
      assert.deepStrictEqual(response.data.data, expectedDetailResultList);
    });
  });

  describe("/api/dashboard/total-organismes route", () => {
    it("Vérifie qu'on peut récupérer le nombre d'organismes transmettant de la donnée sur une région", async () => {
      const { httpClient } = await startServer();

      const regionNumTest = "28";

      // Add 1 statut for region
      await new StatutCandidat(
        createRandomStatutCandidat({
          nom_etablissement: "TEST CFA",
          siret_etablissement: getRandomSiretEtablissement(),
          siret_etablissement_valid: true,
          uai_etablissement: "0762232N",
          etablissement_num_region: regionNumTest,
        })
      ).save();

      // Check good api call
      const response = await httpClient.post("/api/dashboard/total-organismes", {
        etablissement_num_region: regionNumTest,
      });

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, { nbOrganismes: 1 });

      const badRegionResponse = await httpClient.post("/api/dashboard/total-organismes", {
        etablissement_num_region: "01",
      });

      assert.deepStrictEqual(badRegionResponse.status, 200);
      assert.deepEqual(badRegionResponse.data, { nbOrganismes: 0 });
    });

    it("Vérifie qu'on peut récupérer le nombre d'organismes transmettant de la donnée sur une formation", async () => {
      const { httpClient } = await startServer();

      const formationCfd = "abcd1234";

      // Add 1 statut for region
      await new StatutCandidat(
        createRandomStatutCandidat({
          nom_etablissement: "TEST CFA",
          siret_etablissement: getRandomSiretEtablissement(),
          siret_etablissement_valid: true,
          uai_etablissement: "0762232N",
          formation_cfd: formationCfd,
        })
      ).save();

      // Check good api call
      const response = await httpClient.post("/api/dashboard/total-organismes", {
        formation_cfd: formationCfd,
      });

      assert.equal(response.status, 200);
      assert.deepEqual(response.data, { nbOrganismes: 1 });
    });
  });
});
