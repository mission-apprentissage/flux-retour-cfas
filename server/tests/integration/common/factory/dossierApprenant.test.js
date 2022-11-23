const assert = require("assert").strict;
const { DossierApprenant } = require("../../../../src/common/factory/dossierApprenant");

describe("Factory DossierApprenant", () => {
  describe("createDossierApprenant", () => {
    it("Vérifie qu'on ne peut créer un dossier apprenant avec des espaces en début/fin de prenom_apprenant et nom_apprenant", () => {
      const dossierApprenantProps = {
        prenom_apprenant: " DUPOND ",
        nom_apprenant: " DUPOND      ",
        date_de_naissance_apprenant: new Date(),
        uai_etablissement: "1234567D",
        nom_etablissement: "Etablissement",
        formation_cfd: "11111111",
        annee_scolaire: "2022-2023",
        historique_statut_apprenant: [],
        source: "test",
        id_erp_apprenant: "6eyUjk56kLo",
      };

      const createdDossierApprenantEntity = DossierApprenant.create(dossierApprenantProps);
      assert.equal(createdDossierApprenantEntity.prenom_apprenant, "DUPOND");
      assert.equal(createdDossierApprenantEntity.nom_apprenant, "DUPOND");
    });
  });

  it("Vérifie qu'on ne peut créer un dossier apprenant avec un SIRET invalide", () => {
    const dossierApprenantProps = {
      prenom_apprenant: " DUPOND ",
      nom_apprenant: " DUPOND      ",
      date_de_naissance_apprenant: new Date(),
      uai_etablissement: "1234567D",
      nom_etablissement: "Etablissement",
      formation_cfd: "11111111",
      annee_scolaire: "2022-2023",
      historique_statut_apprenant: [],
      source: "test",
      siret_etablissement: "invalide",
      id_erp_apprenant: "6eyUjk56kLo",
    };

    const createdDossierApprenantEntity = DossierApprenant.create(dossierApprenantProps);
    assert.equal(createdDossierApprenantEntity, null);
  });
});
