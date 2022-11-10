const assert = require("assert").strict;
const demandeIdentifiants = require("../../../../src/common/components/demandeIdentifiants");
const { demandesIdentifiantsDb } = require("../../../../src/common/model/collections");

describe(__filename, () => {
  it("Permet de vérifier la création d'une demande d'identifiants", async () => {
    const { create } = await demandeIdentifiants();

    const testDemande = {
      profil: "TEST-PROFIL",
      region: "RegionTest",
      email: "test@email.fr",
    };

    await create(testDemande);

    const foundDemand = await demandesIdentifiantsDb().findOne({ email: testDemande.email });
    assert.equal(foundDemand.profil, testDemande.profil);
    assert.equal(foundDemand.region, testDemande.region);
    assert.equal(foundDemand.email, testDemande.email);
    assert.notEqual(foundDemand.created_at, null);
  });
});
