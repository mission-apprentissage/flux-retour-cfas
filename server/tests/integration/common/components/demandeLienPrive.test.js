const assert = require("assert").strict;
const integrationTests = require("../../../utils/integrationTests");
const demandeLienPrive = require("../../../../src/common/components/demandeLienPrive");
const { DemandeLienPriveModel, Cfa } = require("../../../../src/common/model");

integrationTests(__filename, () => {
  it("Permet de vérifier la création d'une demande de lien privé avec un CFA non présent en base", async () => {
    const { create } = await demandeLienPrive();

    const testDemande = {
      nom_organisme: "TEST-ORGA",
      uai_organisme: "0762232N",
      code_postal_organisme: "75010",
      email_demandeur: "test@email.fr",
    };

    await create(testDemande);

    const foundDemand = await DemandeLienPriveModel.findOne({ nom_organisme: testDemande.nom_organisme }).lean();
    assert.equal(foundDemand.nom_organisme, testDemande.nom_organisme);
    assert.equal(foundDemand.uai_organisme, testDemande.uai_organisme);
    assert.equal(foundDemand.code_postal_organisme, testDemande.code_postal_organisme);
    assert.equal(foundDemand.email_demandeur, testDemande.email_demandeur);
    assert.notEqual(foundDemand.created_at, null);
  });

  it("Permet de vérifier la création d'une demande de lien privé avec un CFA sans lien privé", async () => {
    const { create } = await demandeLienPrive();

    const testUai = "0762290X";
    const testNom = "TEST-ORGA";
    const testCodePostal = "75010";

    await new Cfa({
      uai: testUai,
      nom: testNom,
    }).save();

    const testDemande = {
      nom_organisme: "TEST-ORGA",
      uai_organisme: "0762232N",
      code_postal_organisme: testCodePostal,
      email_demandeur: "test@email.fr",
    };

    await create(testDemande);

    const foundDemand = await DemandeLienPriveModel.findOne({ nom_organisme: testDemande.nom_organisme }).lean();
    assert.equal(foundDemand.nom_organisme, testDemande.nom_organisme);
    assert.equal(foundDemand.uai_organisme, testDemande.uai_organisme);
    assert.equal(foundDemand.code_postal_organisme, testDemande.code_postal_organisme);
    assert.equal(foundDemand.email_demandeur, testDemande.email_demandeur);
    assert.notEqual(foundDemand.created_at, null);
  });

  it("Permet de vérifier la création d'une demande de lien privé avec un CFA ayant un lien privé", async () => {
    const { create } = await demandeLienPrive();

    const testUai = "0762290X";
    const testNom = "TEST-ORGA";
    const testCodePostal = "75010";

    await new Cfa({
      uai: testUai,
      nom: testNom,
    }).save();

    const testDemande = {
      nom_organisme: testNom,
      uai_organisme: testUai,
      code_postal_organisme: testCodePostal,
      email_demandeur: "test@email.fr",
    };

    await create(testDemande);

    const foundDemand = await DemandeLienPriveModel.findOne({ nom_organisme: testDemande.nom_organisme }).lean();
    assert.equal(foundDemand.nom_organisme, testDemande.nom_organisme);
    assert.equal(foundDemand.uai_organisme, testDemande.uai_organisme);
    assert.equal(foundDemand.code_postal_organisme, testDemande.code_postal_organisme);
    assert.equal(foundDemand.email_demandeur, testDemande.email_demandeur);

    assert.notEqual(foundDemand.created_at, null);
  });
});
