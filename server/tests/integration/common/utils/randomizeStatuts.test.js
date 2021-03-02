const assert = require("assert");
const statutsCandidats = require("../../../../src/common/components/statutsCandidats");
const { createRandomStatutCandidat } = require("../../../data/randomizedSample");
const { historySequenceApprentiToAbandon } = require("../../../data/historySequenceSamples");
const { StatutCandidat } = require("../../../../src/common/model");

describe("createRandomStatutCandidat", () => {
  it("Vérifie l'existence d'un statut de candidat randomisé", async () => {
    const { existsStatut } = await statutsCandidats();

    const randomStatut = createRandomStatutCandidat();

    const toAdd = new StatutCandidat(randomStatut);
    await toAdd.save();
    const result = toAdd.toJSON();

    // Checks creation
    assert.strictEqual(result.ine_apprenant, randomStatut.ine_apprenant);
    assert.strictEqual(result.nom_apprenant, randomStatut.nom_apprenant);
    assert.strictEqual(result.prenom_apprenant, randomStatut.prenom_apprenant);
    assert.strictEqual(result.prenom2_apprenant, randomStatut.prenom2_apprenant);
    assert.strictEqual(result.prenom3_apprenant, randomStatut.prenom3_apprenant);
    assert.strictEqual(result.ne_pas_solliciter, randomStatut.ne_pas_solliciter);
    assert.strictEqual(result.email_contact, randomStatut.email_contact);
    assert.strictEqual(result.nom_representant_legal, randomStatut.nom_representant_legal);
    assert.strictEqual(result.tel_representant_legal, randomStatut.tel_representant_legal);
    assert.strictEqual(result.tel2_representant_legal, randomStatut.tel2_representant_legal);
    assert.strictEqual(result.id_formation, randomStatut.id_formation);
    assert.strictEqual(result.libelle_court_formation, randomStatut.libelle_court_formation);
    assert.strictEqual(result.libelle_long_formation, randomStatut.libelle_long_formation);
    assert.strictEqual(result.uai_etablissement, randomStatut.uai_etablissement);
    assert.strictEqual(result.siret_etablissement, randomStatut.siret_etablissement);
    assert.strictEqual(result.nom_etablissement, randomStatut.nom_etablissement);
    assert.strictEqual(result.statut_apprenant, randomStatut.statut_apprenant);
    assert.strictEqual(result.source, randomStatut.source);
    assert.strictEqual(result.annee_formation, randomStatut.annee_formation);
    assert.deepStrictEqual(result.periode_formation, randomStatut.periode_formation);

    // Checks exists method
    const found = await existsStatut({
      ine_apprenant: result.ine_apprenant,
      nom_apprenant: result.nom_apprenant,
      prenom_apprenant: result.prenom_apprenant,
      prenom2_apprenant: result.prenom2_apprenant,
      prenom3_apprenant: result.prenom3_apprenant,
      email_contact: result.email_contact,
      id_formation: result.id_formation,
      uai_etablissement: result.uai_etablissement,
    });
    assert.strictEqual(found, true);
  });

  it("Vérifie l'existence d'un statut de candidat randomisé avec params", async () => {
    const randomStatut = createRandomStatutCandidat({
      historique_statut_apprenant: historySequenceApprentiToAbandon,
    });

    const toAdd = new StatutCandidat(randomStatut);
    await toAdd.save();
    const result = toAdd.toJSON();

    // Checks creation
    assert.deepStrictEqual(result.ine_apprenant, randomStatut.ine_apprenant);
    assert.deepStrictEqual(result.nom_apprenant, randomStatut.nom_apprenant);
    assert.deepStrictEqual(result.prenom_apprenant, randomStatut.prenom_apprenant);
    assert.deepStrictEqual(result.prenom2_apprenant, randomStatut.prenom2_apprenant);
    assert.deepStrictEqual(result.prenom3_apprenant, randomStatut.prenom3_apprenant);
    assert.deepStrictEqual(result.ne_pas_solliciter, randomStatut.ne_pas_solliciter);
    assert.deepStrictEqual(result.email_contact, randomStatut.email_contact);
    assert.deepStrictEqual(result.nom_representant_legal, randomStatut.nom_representant_legal);
    assert.deepStrictEqual(result.tel_representant_legal, randomStatut.tel_representant_legal);
    assert.deepStrictEqual(result.tel2_representant_legal, randomStatut.tel2_representant_legal);
    assert.deepStrictEqual(result.id_formation, randomStatut.id_formation);
    assert.deepStrictEqual(result.libelle_court_formation, randomStatut.libelle_court_formation);
    assert.deepStrictEqual(result.libelle_long_formation, randomStatut.libelle_long_formation);
    assert.deepStrictEqual(result.uai_etablissement, randomStatut.uai_etablissement);
    assert.deepStrictEqual(result.siret_etablissement, randomStatut.siret_etablissement);
    assert.deepStrictEqual(result.nom_etablissement, randomStatut.nom_etablissement);
    assert.deepStrictEqual(result.statut_apprenant, randomStatut.statut_apprenant);
    assert.deepStrictEqual(result.source, randomStatut.source);
    assert.deepStrictEqual(result.annee_formation, randomStatut.annee_formation);
    assert.deepStrictEqual(result.periode_formation, randomStatut.periode_formation);
    assert.deepStrictEqual(result.historique_statut_apprenant, randomStatut.historique_statut_apprenant);

    // Checks exists method
    const found = await StatutCandidat.countDocuments({
      ine_apprenant: result.ine_apprenant,
      nom_apprenant: result.nom_apprenant,
      prenom_apprenant: result.prenom_apprenant,
      prenom2_apprenant: result.prenom2_apprenant,
      prenom3_apprenant: result.prenom3_apprenant,
      email_contact: result.email_contact,
      id_formation: result.id_formation,
      uai_etablissement: result.uai_etablissement,
      historique_statut_apprenant: historySequenceApprentiToAbandon,
    });
    assert.strictEqual(found, 1);
  });
});
