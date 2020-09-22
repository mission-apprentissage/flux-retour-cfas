const assert = require("assert");
const httpTests = require("../../utils/httpTests");
const users = require("../../../src/common/components/users");
const { apiStatutsSeeder } = require("../../../src/common/roles");
const { StatutCandidat } = require("../../../src/common/model");
const { statutTest } = require("../../utils/fixtures");

httpTests(__filename, ({ startServer }) => {
  it("Vérifie que la route statut-candidats fonctionne avec une bonne clé d'API", async () => {
    const { httpClient } = await startServer();
    const { createUser } = await users();

    const goodApiKey = "12345";

    const created = await createUser("userApi", "password", {
      permissions: [apiStatutsSeeder],
      apiKey: goodApiKey,
    });
    assert.strictEqual(created.username, "userApi");
    assert.strictEqual(created.permissions.length > 0, true);
    assert.strictEqual(created.apiKey, goodApiKey);

    const response = await httpClient.post("/api/statut-candidats", statutTest, {
      headers: {
        "x-api-key": goodApiKey,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.ok(response.data);
    const foundStatut = await StatutCandidat.findOne({ ine_apprenant: `${statutTest.ine_apprenant}` });

    assert.strictEqual(response.status, 200);
    assert.ok(response.data);

    assert.strictEqual(foundStatut.nom_apprenant, statutTest.nom_apprenant);
    assert.strictEqual(foundStatut.prenom_apprenant, statutTest.prenom_apprenant);
    assert.strictEqual(foundStatut.prenom2_apprenant, null);
    assert.strictEqual(foundStatut.prenom3_apprenant, null);
    assert.strictEqual(foundStatut.ne_pas_solliciter, statutTest.ne_pas_solliciter);
    assert.strictEqual(foundStatut.email_contact, statutTest.email_contact);
    assert.strictEqual(foundStatut.nom_representant_legal, statutTest.nom_representant_legal);
    assert.strictEqual(foundStatut.tel_representant_legal, statutTest.tel_representant_legal);
    assert.strictEqual(foundStatut.tel2_representant_legal, statutTest.tel2_representant_legal);
    assert.strictEqual(foundStatut.id_formation_souhait, statutTest.id_formation_souhait);
    assert.strictEqual(foundStatut.libelle_court_formation_souhait, statutTest.libelle_court_formation_souhait);
    assert.strictEqual(foundStatut.libelle_long_formation_souhait, statutTest.libelle_long_formation_souhait);
    assert.strictEqual(foundStatut.uai_etablissement_origine, statutTest.uai_etablissement_origine);
    assert.strictEqual(foundStatut.nom_etablissement_origine, statutTest.nom_etablissement_origine);
    assert.strictEqual(foundStatut.statut_apprenant, statutTest.statut_apprenant);
    assert.ok(foundStatut.date_entree_statut);
    assert.ok(foundStatut.date_saisie_statut);
    assert.ok(foundStatut.date_mise_a_jour_statut);
  });

  it("Vérifie que la route statut-candidats ne fonctionne pas avec une mauvaise clé d'API", async () => {
    const { httpClient } = await startServer();
    const { createUser } = await users();

    const badApiKey = "BADAPIKEY";

    const created = await createUser("userApi", "password", {
      permissions: [apiStatutsSeeder],
      apiKey: badApiKey,
    });
    assert.strictEqual(created.username, "userApi");
    assert.strictEqual(created.permissions.length > 0, true);
    assert.strictEqual(created.apiKey, badApiKey);

    const response = await httpClient.post("/api/statut-candidats", statutTest, {
      headers: {
        "x-api-key": badApiKey,
      },
    });

    assert.strictEqual(response.status, 200);
    assert.ok(response.data);
  });
});
