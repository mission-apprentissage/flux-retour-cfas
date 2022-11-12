import { strict as assert } from "assert";
import dossiersApprenants from "../../../../src/common/components/dossiersApprenants.js";
import { createRandomDossierApprenant } from "../../../data/randomizedSample.js";
import { historySequenceApprentiToAbandon } from "../../../data/historySequenceSamples.js";
import { dossiersApprenantsDb } from "../../../../src/common/model/collections.js";

describe("Randomize Statuts test", () => {
  describe("createRandomDossierApprenant", () => {
    it("Vérifie l'existence d'un DossierApprenant randomisé", async () => {
      const { getDossierApprenant, createDossierApprenant } = await dossiersApprenants();

      const randomDossierApprenantProps = createRandomDossierApprenant();
      const result = await createDossierApprenant(randomDossierApprenantProps);

      // Checks creation
      assert.equal(result.ine_apprenant, randomDossierApprenantProps.ine_apprenant);
      assert.equal(result.nom_apprenant, randomDossierApprenantProps.nom_apprenant.toUpperCase());
      assert.equal(result.prenom_apprenant, randomDossierApprenantProps.prenom_apprenant.toUpperCase());
      assert.equal(
        result.date_de_naissance_apprenant.getTime(),
        randomDossierApprenantProps.date_de_naissance_apprenant.getTime()
      );

      assert.equal(result.email_contact, randomDossierApprenantProps.email_contact);
      assert.equal(result.formation_cfd, randomDossierApprenantProps.formation_cfd);
      assert.equal(result.libelle_long_formation, randomDossierApprenantProps.libelle_long_formation);
      assert.equal(result.uai_etablissement, randomDossierApprenantProps.uai_etablissement);
      assert.equal(result.siret_etablissement, randomDossierApprenantProps.siret_etablissement);
      assert.equal(result.nom_etablissement, randomDossierApprenantProps.nom_etablissement);
      assert.equal(result.source, randomDossierApprenantProps.source);
      assert.equal(result.annee_formation, randomDossierApprenantProps.annee_formation);
      assert.deepEqual(result.periode_formation, randomDossierApprenantProps.periode_formation);
      assert.equal(result.annee_scolaire, randomDossierApprenantProps.annee_scolaire);

      // Checks exists method
      const found = await getDossierApprenant({
        ine_apprenant: result.ine_apprenant,
        nom_apprenant: result.nom_apprenant,
        prenom_apprenant: result.prenom_apprenant,
        date_de_naissance_apprenant: result.date_de_naissance_apprenant,
        email_contact: result.email_contact,
        formation_cfd: result.formation_cfd,
        uai_etablissement: result.uai_etablissement,
        annee_scolaire: result.annee_scolaire,
      });
      assert.ok(found);
    });

    it("Vérifie l'existence d'un DossierApprenant randomisé avec params", async () => {
      const randomStatut = createRandomDossierApprenant({
        historique_statut_apprenant: historySequenceApprentiToAbandon,
      });

      const { insertedId } = await dossiersApprenantsDb().insertOne(randomStatut);
      const result = await dossiersApprenantsDb().findOne({ _id: insertedId });

      // Checks creation
      assert.deepEqual(result.ine_apprenant, randomStatut.ine_apprenant);
      assert.deepEqual(result.nom_apprenant, randomStatut.nom_apprenant);
      assert.deepEqual(result.prenom_apprenant, randomStatut.prenom_apprenant);
      assert.deepEqual(
        result.date_de_naissance_apprenant.getTime(),
        randomStatut.date_de_naissance_apprenant.getTime()
      );
      assert.deepEqual(result.email_contact, randomStatut.email_contact);
      assert.deepEqual(result.formation_cfd, randomStatut.formation_cfd);
      assert.deepEqual(result.libelle_long_formation, randomStatut.libelle_long_formation);
      assert.deepEqual(result.uai_etablissement, randomStatut.uai_etablissement);
      assert.deepEqual(result.siret_etablissement, randomStatut.siret_etablissement);
      assert.deepEqual(result.nom_etablissement, randomStatut.nom_etablissement);
      assert.deepEqual(result.source, randomStatut.source);
      assert.deepEqual(result.annee_formation, randomStatut.annee_formation);
      assert.deepEqual(result.periode_formation, randomStatut.periode_formation);
      assert.deepEqual(result.historique_statut_apprenant, randomStatut.historique_statut_apprenant);

      // Checks exists method
      const found = await dossiersApprenantsDb().countDocuments({
        ine_apprenant: result.ine_apprenant,
        nom_apprenant: result.nom_apprenant,
        prenom_apprenant: result.prenom_apprenant,
        date_de_naissance_apprenant: result.date_de_naissance_apprenant,
        email_contact: result.email_contact,
        formation_cfd: result.formation_cfd,
        uai_etablissement: result.uai_etablissement,
        historique_statut_apprenant: historySequenceApprentiToAbandon,
      });
      assert.equal(found, 1);
    });
  });
});
