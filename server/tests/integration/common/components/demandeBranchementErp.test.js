const assert = require("assert").strict;
const integrationTests = require("../../../utils/integrationTests");
const demandeBranchementErp = require("../../../../src/common/components/demandeBranchementErp");
const { DemandeBranchementErpModel } = require("../../../../src/common/model");

integrationTests(__filename, () => {
  it("Permet de vérifier la création d'une demande de branchement ERP en cours d'interfacage", async () => {
    const { create } = await demandeBranchementErp();

    const testDemande = {
      erp: "TEST-ERP",
      nom_organisme: "TEST-ORGA",
      uai_organisme: "0762232N",
      email_demandeur: "test@email.fr",
    };

    await create(testDemande);

    const foundDemand = await DemandeBranchementErpModel.findOne({ erp: testDemande.erp }).lean();
    assert.equal(foundDemand.erp, testDemande.erp);
    assert.equal(foundDemand.nom_organisme, testDemande.nom_organisme);
    assert.equal(foundDemand.uai_organisme, testDemande.uai_organisme);
    assert.equal(foundDemand.email_demandeur, testDemande.email_demandeur);
    assert.notEqual(foundDemand.created_at, null);
  });

  it("Permet de vérifier la création d'une demande de branchement ERP pas encore interfacé", async () => {
    const { create } = await demandeBranchementErp();

    const testDemande = {
      erp: "TEST-ERP",
      nom_organisme: "TEST-ORGA",
      uai_organisme: "0762232N",
      email_demandeur: "test@email.fr",
      nb_apprentis: "100",
    };

    await create(testDemande);

    const foundDemand = await DemandeBranchementErpModel.findOne({ erp: testDemande.erp }).lean();
    assert.equal(foundDemand.erp, testDemande.erp);
    assert.equal(foundDemand.nom_organisme, testDemande.nom_organisme);
    assert.equal(foundDemand.uai_organisme, testDemande.uai_organisme);
    assert.equal(foundDemand.email_demandeur, testDemande.email_demandeur);
    assert.equal(foundDemand.nb_apprentis, testDemande.nb_apprentis);
    assert.notEqual(foundDemand.created_at, null);
  });
});
