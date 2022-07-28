const assert = require("assert").strict;
const reseauxCfas = require("../../../../src/common/components/reseauxCfas");
const { ReseauCfaModel } = require("../../../../src/common/model");

describe(__filename, () => {
  it("Permet de vérifier la création d'un cfa de réseau", async () => {
    const { create } = await reseauxCfas();

    const testCfaReseau = {
      nom_reseau: "TEST-RESEAU",
      nom_etablissement: "Etablissement de test",
      uai: "0670141P",
      siret: "19880153200047",
    };

    await create(testCfaReseau);

    const found = await ReseauCfaModel.findOne({ uai: testCfaReseau.uai }).lean();
    assert.equal(found.nom_reseau, testCfaReseau.nom_reseau);
    assert.equal(found.nom_etablissement, testCfaReseau.nom_etablissement);
    assert.equal(found.siret, testCfaReseau.siret);
    assert.notEqual(found.created_at, null);
  });

  describe("searchReseauxCfas", async () => {
    const { searchReseauxCfas, create } = await reseauxCfas();

    it("returns results matching uai", async () => {
      const searchTerm = "067";

      // Create
      const testCfaReseau = {
        nom_reseau: "TEST-RESEAU",
        nom_etablissement: "Etablissement de test",
        uai: "0670141P",
        siret: "19880153200047",
      };

      await create(testCfaReseau);

      // Check created
      const found = await ReseauCfaModel.findOne({ uai: testCfaReseau.uai }).lean();
      assert.equal(found.nom_reseau, testCfaReseau.nom_reseau);
      assert.equal(found.nom_etablissement, testCfaReseau.nom_etablissement);
      assert.equal(found.siret, testCfaReseau.siret);
      assert.notEqual(found.created_at, null);

      // Search
      const results = await searchReseauxCfas({ searchTerm });

      // Check results
      assert.equal(results.length, 1);
      assert.ok(results[0].nom_reseau, testCfaReseau.nom_reseau);
      assert.ok(results[0].nom_etablissement, testCfaReseau.nom_etablissement);
      assert.ok(results[0].siret, testCfaReseau.siret);
      assert.ok(results[0].uai, testCfaReseau.uai);
    });

    it("returns results matching siret", async () => {
      const searchTerm = "1988";

      // Create
      const testCfaReseau = {
        nom_reseau: "TEST-RESEAU",
        nom_etablissement: "Etablissement de test",
        uai: "0670141P",
        siret: "19880153200047",
      };

      await create(testCfaReseau);

      // Check created
      const found = await ReseauCfaModel.findOne({ uai: testCfaReseau.uai }).lean();
      assert.equal(found.nom_reseau, testCfaReseau.nom_reseau);
      assert.equal(found.nom_etablissement, testCfaReseau.nom_etablissement);
      assert.equal(found.siret, testCfaReseau.siret);
      assert.notEqual(found.created_at, null);

      // Search
      const results = await searchReseauxCfas({ searchTerm });

      // Check results
      assert.equal(results.length, 1);
      assert.ok(results[0].nom_reseau, testCfaReseau.nom_reseau);
      assert.ok(results[0].nom_etablissement, testCfaReseau.nom_etablissement);
      assert.ok(results[0].siret, testCfaReseau.siret);
      assert.ok(results[0].uai, testCfaReseau.uai);
    });

    it("does not returns results with no match", async () => {
      const searchTerm = "XXXXX";

      // Create
      const testCfaReseau = {
        nom_reseau: "TEST-RESEAU",
        nom_etablissement: "Etablissement de test",
        uai: "0670141P",
        siret: "19880153200047",
      };

      await create(testCfaReseau);

      // Check created
      const found = await ReseauCfaModel.findOne({ uai: testCfaReseau.uai }).lean();
      assert.equal(found.nom_reseau, testCfaReseau.nom_reseau);
      assert.equal(found.nom_etablissement, testCfaReseau.nom_etablissement);
      assert.equal(found.siret, testCfaReseau.siret);
      assert.notEqual(found.created_at, null);

      // Search
      const results = await searchReseauxCfas({ searchTerm });
      assert.equal(results.length, 0);
    });

    it("returns results matching nom_reseau", async () => {
      const searchTerm = "TEST-R";

      // Create
      const testCfaReseau = {
        nom_reseau: "TEST-RESEAU",
        nom_etablissement: "Etablissement de test",
        uai: "0670141P",
        siret: "19880153200047",
      };

      await create(testCfaReseau);

      // Check created
      const found = await ReseauCfaModel.findOne({ uai: testCfaReseau.uai }).lean();
      assert.equal(found.nom_reseau, testCfaReseau.nom_reseau);
      assert.equal(found.nom_etablissement, testCfaReseau.nom_etablissement);
      assert.equal(found.siret, testCfaReseau.siret);
      assert.notEqual(found.created_at, null);

      // Search
      const results = await searchReseauxCfas({ searchTerm });

      // Check results
      assert.equal(results.length, 1);
      assert.ok(results[0].nom_reseau, testCfaReseau.nom_reseau);
      assert.ok(results[0].nom_etablissement, testCfaReseau.nom_etablissement);
      assert.ok(results[0].siret, testCfaReseau.siret);
      assert.ok(results[0].uai, testCfaReseau.uai);
    });

    it("returns results matching nom_reseau case insensitive", async () => {
      const searchTerm = "tesT-R";

      // Create
      const testCfaReseau = {
        nom_reseau: "TEST-RESEAU",
        nom_etablissement: "Etablissement de test",
        uai: "0670141P",
        siret: "19880153200047",
      };

      await create(testCfaReseau);

      // Check created
      const found = await ReseauCfaModel.findOne({ uai: testCfaReseau.uai }).lean();
      assert.equal(found.nom_reseau, testCfaReseau.nom_reseau);
      assert.equal(found.nom_etablissement, testCfaReseau.nom_etablissement);
      assert.equal(found.siret, testCfaReseau.siret);
      assert.notEqual(found.created_at, null);

      // Search
      const results = await searchReseauxCfas({ searchTerm });

      // Check results
      assert.equal(results.length, 1);
      assert.ok(results[0].nom_reseau, testCfaReseau.nom_reseau);
      assert.ok(results[0].nom_etablissement, testCfaReseau.nom_etablissement);
      assert.ok(results[0].siret, testCfaReseau.siret);
      assert.ok(results[0].uai, testCfaReseau.uai);
    });
  });
});
