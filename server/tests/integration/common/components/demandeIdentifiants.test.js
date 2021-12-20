const assert = require("assert").strict;
const integrationTests = require("../../../utils/integrationTests");
const demandeIdentifiants = require("../../../../src/common/components/demandeIdentifiants");
const { DemandeIdentifiantsModel } = require("../../../../src/common/model");

integrationTests(__filename, () => {
  it("Permet de vérifier la création d'une demande d'identifiants", async () => {
    const { create } = await demandeIdentifiants();

    const testDemande = {
      profil: "TEST-PROFIL",
      region: "RegionTest",
      email: "test@email.fr",
    };

    await create(testDemande);

    const foundDemand = await DemandeIdentifiantsModel.findOne({ email: testDemande.email }).lean();
    assert.equal(foundDemand.profil, testDemande.profil);
    assert.equal(foundDemand.region, testDemande.region);
    assert.equal(foundDemand.email, testDemande.email);
    assert.notEqual(foundDemand.created_at, null);
  });
});
