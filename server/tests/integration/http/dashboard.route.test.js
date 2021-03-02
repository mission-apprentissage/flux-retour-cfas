const assert = require("assert");
const httpTests = require("../../utils/httpTests");
const { createRandomStatutCandidat } = require("../../data/randomizedSample");
const {
  historySequenceProspectToInscritToApprentiToAbandon,
  historySequenceApprenti,
  historySequenceInscritToApprenti,
} = require("../../data/historySequenceSamples");
const { StatutCandidat } = require("../../../src/common/model");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie qu'on peut récupérer des statistiques d'établissements via API", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/dashboard/etablissements-stats");

    assert.deepStrictEqual(response.status, 200);
    assert.deepStrictEqual(response.data.nbEtablissements, 0);
  });

  it("Vérifie qu'on peut récupérer des effectifs via API pour une séquence de statuts sans filtres", async () => {
    const { httpClient } = await startServer();

    // Add 10 statuts for filter with history sequence - full
    for (let index = 0; index < 10; index++) {
      const randomStatut = createRandomStatutCandidat({
        historique_statut_apprenant: historySequenceProspectToInscritToApprentiToAbandon,
      });
      const toAdd = new StatutCandidat(randomStatut);
      await toAdd.save();
    }

    // Add 5 statuts for filter with history sequence - simple apprenti
    for (let index = 0; index < 5; index++) {
      const randomStatut = createRandomStatutCandidat({
        historique_statut_apprenant: historySequenceApprenti,
      });
      const toAdd = new StatutCandidat(randomStatut);
      await toAdd.save();
    }

    // Add 15 statuts for filter  with history sequence - inscritToApprenti
    for (let index = 0; index < 15; index++) {
      const randomStatut = createRandomStatutCandidat({
        historique_statut_apprenant: historySequenceInscritToApprenti,
      });
      const toAdd = new StatutCandidat(randomStatut);
      await toAdd.save();
    }

    // Expected results
    const expectedResults = {
      beginDate: {
        nbInscrits: 10,
        nbApprentis: 5,
        nbAbandons: 0,
      },
      endDate: {
        nbInscrits: 15,
        nbApprentis: 5,
        nbAbandons: 10,
      },
    };

    // Check good api call
    const response = await httpClient.post("/api/dashboard/effectifs", {
      beginDate: "2020-09-15T00:00:00.000Z",
      endDate: "2020-10-10T00:00:00.000Z",
    });

    assert.deepStrictEqual(response.status, 200);
    assert.deepStrictEqual(response.data.length, 2);
    assert.deepStrictEqual(response.data[0].inscrits, expectedResults.beginDate.nbInscrits);
    assert.deepStrictEqual(response.data[0].apprentis, expectedResults.beginDate.nbApprentis);
    assert.deepStrictEqual(response.data[0].abandons, expectedResults.beginDate.nbAbandons);
    assert.deepStrictEqual(response.data[1].inscrits, expectedResults.endDate.nbInscrits);
    assert.deepStrictEqual(response.data[1].apprentis, expectedResults.endDate.nbApprentis);
    assert.deepStrictEqual(response.data[1].abandons, expectedResults.endDate.nbAbandons);
  });

  it("Vérifie qu'on peut récupérer des effectifs via API pour une séquence de statuts avec filtres", async () => {
    const { httpClient } = await startServer();
    const filterQuery = { etablissement_num_region: "84" };

    // Add 10 statuts for filter with history sequence - full
    for (let index = 0; index < 10; index++) {
      const randomStatut = createRandomStatutCandidat({
        ...{ historique_statut_apprenant: historySequenceProspectToInscritToApprentiToAbandon },
        ...filterQuery,
      });
      const toAdd = new StatutCandidat(randomStatut);
      await toAdd.save();
    }

    // Add 5 statuts for filter with history sequence - simple apprenti
    for (let index = 0; index < 5; index++) {
      const randomStatut = createRandomStatutCandidat({
        ...{ historique_statut_apprenant: historySequenceApprenti },
        ...filterQuery,
      });
      const toAdd = new StatutCandidat(randomStatut);
      await toAdd.save();
    }

    // Add 15 statuts for filter  with history sequence - inscritToApprenti
    for (let index = 0; index < 15; index++) {
      const randomStatut = createRandomStatutCandidat({
        ...{ historique_statut_apprenant: historySequenceInscritToApprenti },
        ...filterQuery,
      });
      const toAdd = new StatutCandidat(randomStatut);
      await toAdd.save();
    }

    // Expected results
    const expectedResults = {
      beginDate: {
        nbInscrits: 10,
        nbApprentis: 5,
        nbAbandons: 0,
      },
      endDate: {
        nbInscrits: 15,
        nbApprentis: 5,
        nbAbandons: 10,
      },
    };

    // Check good api call
    const response = await httpClient.post("/api/dashboard/effectifs", {
      beginDate: "2020-09-15T00:00:00.000Z",
      endDate: "2020-10-10T00:00:00.000Z",
      filters: filterQuery,
    });

    assert.deepStrictEqual(response.status, 200);
    assert.deepStrictEqual(response.data.length, 2);
    assert.deepStrictEqual(response.data[0].inscrits, expectedResults.beginDate.nbInscrits);
    assert.deepStrictEqual(response.data[0].apprentis, expectedResults.beginDate.nbApprentis);
    assert.deepStrictEqual(response.data[0].abandons, expectedResults.beginDate.nbAbandons);
    assert.deepStrictEqual(response.data[1].inscrits, expectedResults.endDate.nbInscrits);
    assert.deepStrictEqual(response.data[1].apprentis, expectedResults.endDate.nbApprentis);
    assert.deepStrictEqual(response.data[1].abandons, expectedResults.endDate.nbAbandons);

    // Check bad api call
    const badResponse = await httpClient.post("/api/dashboard/effectifs", {
      beginDate: "2020-09-15T00:00:00.000Z",
      endDate: "2020-10-10T00:00:00.000Z",
      filters: { etablissement_num_region: "99" },
    });

    assert.deepStrictEqual(badResponse.status, 200);
    assert.deepStrictEqual(badResponse.data.length, 2);
    assert.deepStrictEqual(badResponse.data[0].inscrits, 0);
    assert.deepStrictEqual(badResponse.data[0].apprentis, 0);
    assert.deepStrictEqual(badResponse.data[0].abandons, 0);
    assert.deepStrictEqual(badResponse.data[1].inscrits, 0);
    assert.deepStrictEqual(badResponse.data[1].apprentis, 0);
    assert.deepStrictEqual(badResponse.data[1].abandons, 0);
  });
});
