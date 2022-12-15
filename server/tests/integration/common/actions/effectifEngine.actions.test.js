import { strict as assert } from "assert";
import { buildDossierApprenant } from "../../../../src/common/actions/dossiersApprenants.actions.js";
import { hydrateEngine } from "../../../../src/common/actions/engine/effectifsEngine.actions.js";
import { dossiersApprenantsMigrationDb, effectifsDb, organismesDb } from "../../../../src/common/model/collections.js";
import { createRandomDossierApprenant } from "../../../data/randomizedSample.js";

describe("Tests des actions Effectif Engine", () => {
  describe("hydrateEngine", () => {
    it("Vérifie le remplissage d'une liste pour un dossierApprenant avec création d'organisme et création d'un effectif lié", async () => {
      const uai = "0802004U";
      const siret = "77937827200016";
      const randomDossierApprenantProps = createRandomDossierApprenant({
        uai_etablissement: uai,
        siret_etablissement: siret,
      });

      const { organismes, dossiersApprenantsMigration, effectifs } = await hydrateEngine([randomDossierApprenantProps]);

      // // Vérification de la création de l'organisme
      // const organismeFound = await organismesDb().findOne({ uai });
      // assert.ok(organismeFound);
      // assert.equal(organismeFound.siret, siret);

      // // Vérification de la création du dossierApprenant
      // const dossierApprenantFound = await dossiersApprenantsMigrationDb().findOne({ _id: dossierApprenantCreated._id });
      // assert.ok(dossierApprenantFound);
      // assert.equal(dossierApprenantFound.uai_etablissement, uai);
      // assert.equal(dossierApprenantFound.siret_etablissement, siret);
      // assert.deepEqual(dossierApprenantFound.organisme_id, organismeFound._id);
      // // TODO Test all fields needed

      // // Vérification de la création de l'effectif
      // const effectifFound = await effectifsDb().findOne({ _id: effectifCreated._id });
      // assert.ok(effectifFound);
      // assert.equal(effectifFound.apprenant.nom, randomDossierApprenantProps.nom_apprenant.toUpperCase().trim());
      // assert.equal(effectifFound.apprenant.prenom, randomDossierApprenantProps.prenom_apprenant.toUpperCase().trim());
      // assert.deepEqual(effectifFound.organisme_id, organismeFound._id);
      // // TODO Test all fields needed
    });

    it("Vérifie la création d'une liste pour un dossierApprenant avec un organisme existant et création d'un effectif lié", async () => {
      // TODO
    });

    it("Vérifie la création d'une liste pour plusieurs dossierApprenants avec création d'organismes et création d'un effectif lié", async () => {
      // TODO
    });

    it("Vérifie la création d'une liste pour plusieurs dossierApprenants avec un mix création d'organismes et existants et création d'un effectif lié", async () => {
      // TODO
    });

    it("Vérifie la maj d'une liste pour un dossierApprenant existant avec organisme existant et maj d'un effectif lié", async () => {
      // TODO
    });

    it("Vérifie la maj d'une liste pour un dossierApprenant existant avec organisme existant et maj d'un effectif lié", async () => {
      // TODO
    });
  });
});
