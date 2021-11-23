const assert = require("assert");
const integrationTests = require("../../../utils/integrationTests");
const demandeLienAcces = require("../../../../src/common/components/demandeLienAcces");
const { DemandeLienAcces } = require("../../../../src/common/model");

integrationTests(__filename, () => {
  it("Permet de vérifier la création d'une demande de lien d'accès", async () => {
    const { create } = await demandeLienAcces();

    const testDemande = {
      nom_organisme: "TEST-ORGA",
      uai_organisme: "0762232N",
      code_postal_organisme: "75010",
      email_demandeur: "test@email.fr",
    };

    await create(testDemande);

    const foundDemand = await DemandeLienAcces.findOne({ nom_organisme: testDemande.nom_organisme }).lean();
    assert.strictEqual(foundDemand.nom_organisme, testDemande.nom_organisme);
    assert.strictEqual(foundDemand.uai_organisme, testDemande.uai_organisme);
    assert.strictEqual(foundDemand.code_postal_organisme, testDemande.code_postal_organisme);
    assert.strictEqual(foundDemand.email_demandeur, testDemande.email_demandeur);
    assert.notStrictEqual(foundDemand.created_at, null);
  });
});
