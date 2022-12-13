import { strict as assert } from "assert";
import { buildDossierApprenant } from "../../../../src/common/actions/dossiersApprenants.actions.js";
import { createOrganisme, findOrganismeById } from "../../../../src/common/actions/organismes.actions.js";
import { dossiersApprenantsMigrationDb, effectifsDb, organismesDb } from "../../../../src/common/model/collections.js";
import { createRandomDossierApprenant, createRandomOrganisme } from "../../../data/randomizedSample.js";

describe("Tests des actions DossiersApprenants", () => {
  describe("buildDossierApprenant", () => {
    it("Vérifie la création d'un nouveau dossierApprenant avec un nouvel organisme et un effectif lié", async () => {
      const uai = "0802004U";
      const siret = "77937827200016";
      const randomDossierApprenantProps = createRandomDossierApprenant({
        uai_etablissement: uai,
        siret_etablissement: siret,
      });

      const { dossierApprenant: dossierApprenantCreated, effectif: effectifCreated } = await buildDossierApprenant(
        randomDossierApprenantProps
      );

      // Vérification de la création de l'organisme
      const organismeFound = await organismesDb().findOne({ uai });
      assert.ok(organismeFound);
      assert.equal(organismeFound.siret, siret);

      // Vérification de la création du dossierApprenant
      const dossierApprenantFound = await dossiersApprenantsMigrationDb().findOne({ _id: dossierApprenantCreated._id });
      assert.ok(dossierApprenantFound);
      assert.equal(dossierApprenantFound.uai_etablissement, uai);
      assert.equal(dossierApprenantFound.siret_etablissement, siret);
      assert.deepEqual(dossierApprenantFound.organisme_id, organismeFound._id);
      // TODO Test all fields needed

      // Vérification de la création de l'effectif
      const effectifFound = await effectifsDb().findOne({ _id: effectifCreated._id });
      assert.ok(effectifFound);
      assert.equal(effectifFound.apprenant.nom, randomDossierApprenantProps.nom_apprenant.toUpperCase().trim());
      assert.equal(effectifFound.apprenant.prenom, randomDossierApprenantProps.prenom_apprenant.toUpperCase().trim());
      assert.deepEqual(effectifFound.organisme_id, organismeFound._id);
      // TODO Test all fields needed
    });

    it("Vérifie la création d'un nouveau dossierApprenant avec un organisme existant et un effectif lié", async () => {
      const uai = "0802004U";
      const siret = "77937827200016";

      const randomOrganisme = createRandomOrganisme({ uai, siret });
      const { _id } = await createOrganisme(randomOrganisme);
      const organismeExistant = await findOrganismeById(_id);

      const randomDossierApprenantProps = createRandomDossierApprenant({
        uai_etablissement: uai,
        siret_etablissement: siret,
      });

      const { dossierApprenant: dossierApprenantCreated, effectif: effectifCreated } = await buildDossierApprenant(
        randomDossierApprenantProps
      );

      // Vérification de la création de l'organisme
      assert.ok(organismeExistant);
      assert.equal(organismeExistant.uai, uai);
      assert.equal(organismeExistant.siret, siret);

      // Vérification de la création du dossierApprenant
      const dossierApprenantFound = await dossiersApprenantsMigrationDb().findOne({ _id: dossierApprenantCreated._id });
      assert.ok(dossierApprenantFound);
      assert.equal(dossierApprenantFound.uai_etablissement, uai);
      assert.equal(dossierApprenantFound.siret_etablissement, siret);
      assert.deepEqual(dossierApprenantFound.organisme_id, organismeExistant._id);
      // TODO Test all fields needed

      // Vérification de la création de l'effectif
      const effectifFound = await effectifsDb().findOne({ _id: effectifCreated._id });
      assert.ok(effectifFound);
      assert.equal(effectifFound.apprenant.nom, randomDossierApprenantProps.nom_apprenant.toUpperCase().trim());
      assert.equal(effectifFound.apprenant.prenom, randomDossierApprenantProps.prenom_apprenant.toUpperCase().trim());
      assert.deepEqual(effectifFound.organisme_id, organismeExistant._id);
      // TODO Test all fields needed
    });
  });
});
