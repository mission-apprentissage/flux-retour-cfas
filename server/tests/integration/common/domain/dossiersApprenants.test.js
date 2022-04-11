const assert = require("assert").strict;
const {
  getUnicityFieldsFromDossiersApprenantsList,
  getUnicityFieldsFromDossierApprenant,
} = require("../../../../src/common/domain/dossiersApprenants");
const { createRandomDossierApprenantList, createRandomDossierApprenant } = require("../../../data/randomizedSample");

describe("Domain DossiersApprenants", () => {
  describe("getUnicityFieldsFromDossiersApprenantsList", () => {
    it("Vérifie qu'on peut récupérer les champs de clé d'unicité pour une liste de dossiers apprenants", async () => {
      const randomDossiersApprenantsList = createRandomDossierApprenantList();
      const uncityFieldsList = getUnicityFieldsFromDossiersApprenantsList(randomDossiersApprenantsList);

      assert.equal(randomDossiersApprenantsList.length, uncityFieldsList.length);

      for (let index = 0; index < uncityFieldsList.length; index++) {
        assert.equal(uncityFieldsList[index].nom_apprenant !== undefined, true);
        assert.equal(uncityFieldsList[index].prenom_apprenant !== undefined, true);
        assert.equal(uncityFieldsList[index].date_de_naissance_apprenant !== undefined, true);
        assert.equal(uncityFieldsList[index].formation_cfd !== undefined, true);
        assert.equal(uncityFieldsList[index].uai_etablissement !== undefined, true);
        assert.equal(uncityFieldsList[index].annee_scolaire !== undefined, true);
      }
    });
  });

  describe("getUnicityFieldsFromDossierApprenant", () => {
    it("Vérifie qu'on peut récupérer les champs de clé d'unicité pour un dossier d'apprenant", () => {
      const randomDossierApprenant = createRandomDossierApprenant();
      const uncityFields = getUnicityFieldsFromDossierApprenant(randomDossierApprenant);

      assert.equal(uncityFields.nom_apprenant !== undefined, true);
      assert.equal(uncityFields.prenom_apprenant !== undefined, true);
      assert.equal(uncityFields.date_de_naissance_apprenant !== undefined, true);
      assert.equal(uncityFields.formation_cfd !== undefined, true);
      assert.equal(uncityFields.uai_etablissement !== undefined, true);
      assert.equal(uncityFields.annee_scolaire !== undefined, true);
    });
  });
});
