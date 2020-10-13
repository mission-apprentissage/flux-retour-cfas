const assert = require("assert");
const httpTests = require("../../utils/httpTests");
const users = require("../../../src/common/components/users");
const { apiStatutsSeeder } = require("../../../src/common/roles");
const { StatutCandidat } = require("../../../src/common/model");
const { statutsTest } = require("../../utils/fixtures");

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

    const response = await httpClient.post(
      "/api/statut-candidats",
      [
        {
          ine_apprenant: "12345",
          nom_apprenant: "testNom",
          prenom_apprenant: "testPrenom",
          ne_pas_solliciter: false,
          email_contact: "testemail_contact@test.fr",
          nom_representant_legal: "testnom_representant_legal",
          tel_representant_legal: "testtel_representant_legal",
          tel2_representant_legal: "testtel2_representant_legal",
          id_formation: "testid_formation",
          libelle_court_formation: "testlibelle_court_formation",
          libelle_long_formation: "testlibelle_long_formation",
          uai_etablissement: "testuai_etablissement",
          nom_etablissement: "testnom_etablissement",
          statut_apprenant: 2,
        },
        {
          ine_apprenant: "6789",
          nom_apprenant: "test2Nom",
          prenom_apprenant: "test2Prenom",
          ne_pas_solliciter: true,
          email_contact: "test2Email_contact",
          id_formation: "test2id_formation",
          uai_etablissement: "testuai_etablissement",
          nom_etablissement: "testnom_etablissement",
          statut_apprenant: 4,
        },
      ],
      {
        headers: {
          "x-api-key": goodApiKey,
        },
      }
    );

    assert.strictEqual(response.status, 200);
    assert.ok(response.data.status);
    assert.ok(response.data.message);
    assert.strictEqual(response.data.status, "OK");
    const foundStatut = await StatutCandidat.findOne({ ine_apprenant: `${statutsTest[0].ine_apprenant}` });

    assert.strictEqual(foundStatut.nom_apprenant, statutsTest[0].nom_apprenant);
    assert.strictEqual(foundStatut.prenom_apprenant, statutsTest[0].prenom_apprenant);
    assert.strictEqual(foundStatut.prenom2_apprenant, null);
    assert.strictEqual(foundStatut.prenom3_apprenant, null);
    assert.strictEqual(foundStatut.ne_pas_solliciter, statutsTest[0].ne_pas_solliciter);
    assert.strictEqual(foundStatut.email_contact, statutsTest[0].email_contact);
    assert.strictEqual(foundStatut.nom_representant_legal, statutsTest[0].nom_representant_legal);
    assert.strictEqual(foundStatut.tel_representant_legal, statutsTest[0].tel_representant_legal);
    assert.strictEqual(foundStatut.tel2_representant_legal, statutsTest[0].tel2_representant_legal);
    assert.strictEqual(foundStatut.id_formation, statutsTest[0].id_formation);
    assert.strictEqual(foundStatut.libelle_court_formation, statutsTest[0].libelle_court_formation);
    assert.strictEqual(foundStatut.libelle_long_formation, statutsTest[0].libelle_long_formation);
    assert.strictEqual(foundStatut.uai_etablissement, statutsTest[0].uai_etablissement);
    assert.strictEqual(foundStatut.nom_etablissement, statutsTest[0].nom_etablissement);
    assert.strictEqual(foundStatut.statut_apprenant, statutsTest[0].statut_apprenant);
  });

  it("Vérifie que la route statut-candidats ne fonctionne pas avec une mauvaise clé d'API", async () => {
    const { httpClient } = await startServer();
    const { createUser } = await users();

    const goodApiKey = "12345";
    const badApiKey = "BADAPIKEY";

    const created = await createUser("userApi", "password", {
      permissions: [apiStatutsSeeder],
      apiKey: goodApiKey,
    });
    assert.strictEqual(created.username, "userApi");
    assert.strictEqual(created.permissions.length > 0, true);
    assert.strictEqual(created.apiKey, goodApiKey);

    const response = await httpClient.post("/api/statut-candidats", statutsTest, {
      headers: {
        "x-api-key": badApiKey,
      },
    });

    assert.strictEqual(response.status, 401);
  });
});
