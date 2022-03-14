const assert = require("assert").strict;
const dossiersApprenants = require("../../../../src/common/components/dossiersApprenants");
const { createRandomDossierApprenant } = require("../../../data/randomizedSample");
const { historySequenceApprentiToAbandon } = require("../../../data/historySequenceSamples");
const { DossierApprenantModel } = require("../../../../src/common/model");

describe(__filename, () => {
  describe("createRandomDossierApprenant", () => {
    it("Vérifie l'existence d'un statut de candidat randomisé", async () => {
      const { getDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const randomStatutProps = createRandomDossierApprenant();
      const result = await (await createDossierApprenant(randomStatutProps)).toJSON();

      // Checks creation
      assert.equal(result.ine_apprenant, randomStatutProps.ine_apprenant);
      assert.equal(result.nom_apprenant, randomStatutProps.nom_apprenant.toUpperCase());
      assert.equal(result.prenom_apprenant, randomStatutProps.prenom_apprenant.toUpperCase());
      assert.equal(result.email_contact, randomStatutProps.email_contact);
      assert.equal(result.formation_cfd, randomStatutProps.formation_cfd);
      assert.equal(result.libelle_court_formation, randomStatutProps.libelle_court_formation);
      assert.equal(result.libelle_long_formation, randomStatutProps.libelle_long_formation);
      assert.equal(result.uai_etablissement, randomStatutProps.uai_etablissement);
      assert.equal(result.siret_etablissement, randomStatutProps.siret_etablissement);
      assert.equal(result.nom_etablissement, randomStatutProps.nom_etablissement);
      assert.equal(result.source, randomStatutProps.source);
      assert.equal(result.annee_formation, randomStatutProps.annee_formation);
      assert.deepEqual(result.periode_formation, randomStatutProps.periode_formation);
      assert.equal(result.annee_scolaire, randomStatutProps.annee_scolaire);

      // Checks exists method
      const found = await getDossierApprenant({
        ine_apprenant: result.ine_apprenant,
        nom_apprenant: result.nom_apprenant,
        prenom_apprenant: result.prenom_apprenant,
        email_contact: result.email_contact,
        formation_cfd: result.formation_cfd,
        uai_etablissement: result.uai_etablissement,
        annee_scolaire: result.annee_scolaire,
      });
      assert.ok(found);
    });

    it("Vérifie l'existence d'un statut de candidat randomisé avec params", async () => {
      const randomStatut = createRandomDossierApprenant({
        historique_statut_apprenant: historySequenceApprentiToAbandon,
      });

      const toAdd = new DossierApprenantModel(randomStatut);
      await toAdd.save();
      const result = toAdd.toJSON();

      // Checks creation
      assert.deepEqual(result.ine_apprenant, randomStatut.ine_apprenant);
      assert.deepEqual(result.nom_apprenant, randomStatut.nom_apprenant);
      assert.deepEqual(result.prenom_apprenant, randomStatut.prenom_apprenant);
      assert.deepEqual(result.email_contact, randomStatut.email_contact);
      assert.deepEqual(result.formation_cfd, randomStatut.formation_cfd);
      assert.deepEqual(result.libelle_court_formation, randomStatut.libelle_court_formation);
      assert.deepEqual(result.libelle_long_formation, randomStatut.libelle_long_formation);
      assert.deepEqual(result.uai_etablissement, randomStatut.uai_etablissement);
      assert.deepEqual(result.siret_etablissement, randomStatut.siret_etablissement);
      assert.deepEqual(result.nom_etablissement, randomStatut.nom_etablissement);
      assert.deepEqual(result.source, randomStatut.source);
      assert.deepEqual(result.annee_formation, randomStatut.annee_formation);
      assert.deepEqual(result.periode_formation, randomStatut.periode_formation);
      assert.deepEqual(result.historique_statut_apprenant, randomStatut.historique_statut_apprenant);

      // Checks exists method
      const found = await DossierApprenantModel.countDocuments({
        ine_apprenant: result.ine_apprenant,
        nom_apprenant: result.nom_apprenant,
        prenom_apprenant: result.prenom_apprenant,
        email_contact: result.email_contact,
        formation_cfd: result.formation_cfd,
        uai_etablissement: result.uai_etablissement,
        historique_statut_apprenant: historySequenceApprentiToAbandon,
      });
      assert.equal(found, 1);
    });
  });
});
