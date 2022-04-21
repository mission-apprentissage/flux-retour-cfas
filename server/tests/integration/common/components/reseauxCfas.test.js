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
});
