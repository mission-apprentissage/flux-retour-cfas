const assert = require("assert");
const faker = require("faker/locale/fr");
const httpTests = require("../../utils/httpTests");
const statutsCandidats = require("../../../src/common/components/statutsCandidats");
const { createRandomStatutCandidat, getRandomPeriodeFormation } = require("../../data/randomizedSample");
const { administrator } = require("../../../src/common/roles");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie qu'on peut récupérer les doublons de statutsCandidats via API", async () => {
    const { httpClient, createAndLogUser } = await startServer();
    const bearerToken = await createAndLogUser("user", "password", { permissions: [administrator] });

    const { addOrUpdateStatuts } = await statutsCandidats();

    const uaiToTest = "0762518Z";
    const idFormationToTest = "01022103";
    const duplicates = [];

    // Create 10 random duplicates for uai & idFormation
    const firstRandomStatut = await createRandomStatutCandidat();
    for (let index = 0; index < 10; index++) {
      duplicates.push({
        ...firstRandomStatut,
        ...{
          id_formation: idFormationToTest,
          uai_etablissement: uaiToTest,
          periode_formation: getRandomPeriodeFormation(),
          date_metier_mise_a_jour_statut: faker.random.boolean() ? faker.date.past() : null,
        },
      });
    }

    // Create 10 others random duplicates for uai & idFormation
    const secondRandomStatut = await createRandomStatutCandidat();
    for (let index = 0; index < 10; index++) {
      duplicates.push({
        ...secondRandomStatut,
        ...{
          id_formation: idFormationToTest,
          uai_etablissement: uaiToTest,
          periode_formation: getRandomPeriodeFormation(),
          date_metier_mise_a_jour_statut: faker.random.boolean() ? faker.date.past() : null,
        },
      });
    }

    await addOrUpdateStatuts(duplicates);

    const response = await httpClient.post(
      "/api/support/statutsCandidats/duplicates",
      {
        filters: { uai_etablissement: uaiToTest },
        page: 1,
        limit: 50,
      },
      {
        headers: bearerToken,
      }
    );

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.duplicates);
    assert.ok(response.data.pagination);
  });
});
