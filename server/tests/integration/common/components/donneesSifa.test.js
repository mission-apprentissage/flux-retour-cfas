const assert = require("assert").strict;
const dossiersApprenants = require("../../../../src/common/components/dossiersApprenants.js");
const donneesSifa = require("../../../../src/common/components/donneesSifa.js");
const { CODES_STATUT_APPRENANT } = require("../../../../src/common/constants/dossierApprenantConstants.js");
const { DossierApprenantModel } = require("../../../../src/common/model/index.js");
const { createRandomDossierApprenant } = require("../../../data/randomizedSample.js");
const { asyncForEach } = require("../../../../src/common/utils/asyncUtils.js");

describe("Composant DonneesSifa", () => {
  describe("getSifaFieldsFromDossiersApprenantsNotInDonneesSifa", () => {
    /**
     * Fonction de création d'une liste de dossiersApprenants
     * @param {*} uai
     */
    const createSampleDossierApprenants = async (uai) => {
      const { createDossierApprenant } = await dossiersApprenants();

      const dossiersApprenantsTest = [
        createRandomDossierApprenant({
          nom_apprenant: "MBAPPE",
          prenom_apprenant: "Kylian",
          statut_apprenant: CODES_STATUT_APPRENANT.abandon,
          uai_etablissement: uai,
        }),
        createRandomDossierApprenant({
          nom_apprenant: "ALONSO",
          prenom_apprenant: "Marcos",
          statut_apprenant: CODES_STATUT_APPRENANT.apprenti,
          uai_etablissement: uai,
        }),
        createRandomDossierApprenant({
          nom_apprenant: "HAVERTZ",
          prenom_apprenant: "Kai",
          statut_apprenant: CODES_STATUT_APPRENANT.inscrit,
          uai_etablissement: uai,
        }),
      ];

      await asyncForEach(dossiersApprenantsTest, async (currentDossierToAdd) => {
        await createDossierApprenant(currentDossierToAdd);
      });

      // Vérification de l'ajout des dossiersApprenants
      const countDossiersApprenants = await DossierApprenantModel.countDocuments({ uai_etablissement: uai });
      assert.equal(countDossiersApprenants, 3);

      return dossiersApprenantsTest;
    };

    it("Permet de vérifier la récupération des champs SIFA pour des dossiers apprenants non présents dans DonneesSifa", async () => {
      const { getSifaFieldsFromDossiersApprenantsNotInDonneesSifa } = await donneesSifa();

      // Création de 3 dossiersApprenants de test pour un OF test
      const testUai = "0000001S";
      const dossiersApprenantsTest = await createSampleDossierApprenants(testUai);

      // Récupération des données Sifa à créer et vérification du bon nombre et de chaque item
      const donneesSifaToCreate = await getSifaFieldsFromDossiersApprenantsNotInDonneesSifa(testUai);
      assert.equal(donneesSifaToCreate.length, dossiersApprenantsTest.length);

      for (const key in donneesSifaToCreate) {
        assert.equal(donneesSifaToCreate[key].uai_etablissement, dossiersApprenantsTest[key].uai_etablissement);
        assert.equal(
          donneesSifaToCreate[key].nom_apprenant.toUpperCase().trim(),
          dossiersApprenantsTest[key].nom_apprenant.toUpperCase().trim()
        );
        assert.equal(
          donneesSifaToCreate[key].prenom_apprenant.toUpperCase().trim(),
          dossiersApprenantsTest[key].prenom_apprenant.toUpperCase().trim()
        );
        assert.equal(
          donneesSifaToCreate[key].date_de_naissance_apprenant.getTime(),
          dossiersApprenantsTest[key].date_de_naissance_apprenant.getTime()
        );
        assert.equal(donneesSifaToCreate[key].formation_rncp, dossiersApprenantsTest[key].formation_rncp);
        assert.equal(
          donneesSifaToCreate[key].code_commune_insee_apprenant,
          dossiersApprenantsTest[key].code_commune_insee_apprenant
        );
        assert.equal(donneesSifaToCreate[key].tel_apprenant, dossiersApprenantsTest[key].tel_apprenant);
        assert.equal(donneesSifaToCreate[key].email_contact, dossiersApprenantsTest[key].email_contact);
        assert.equal(donneesSifaToCreate[key].date_entree_formation, dossiersApprenantsTest[key].date_entree_formation);
        assert.equal(
          donneesSifaToCreate[key].contrat_date_debut?.getTime(),
          dossiersApprenantsTest[key].contrat_date_debut?.getTime()
        );
        assert.equal(
          donneesSifaToCreate[key].contrat_date_rupture?.getTime(),
          dossiersApprenantsTest[key].contrat_date_rupture?.getTime()
        );
      }
    });

    // it("Permet de vérifier la récupération des champs SIFA pour certains dossiers apprenants présents dans DonneesSifa et d'autres non ", async () => {
    //   const { getFieldSifaFromDossiersApprenantsNotInDonneesSifa } = await donneesSifa();
    //   const { createDossierApprenant } = await dossiersApprenants();

    //   // Création de 4 dossiersApprenants de test pour un of
    //   const testUai = "0000001S";
    //   const testUaiEtablissementFormateur = "0000001X";
    //   const createdDossiersId = [];

    //   const dossiersApprenantsTest = [
    //     createRandomDossierApprenant({
    //       nom_apprenant: "MBAPPE",
    //       prenom_apprenant: "Kylian",
    //       statut_apprenant: CODES_STATUT_APPRENANT.abandon,
    //       uai_etablissement: testUai,
    //       etablissement_formateur_uai: testUaiEtablissementFormateur,
    //     }),
    //     createRandomDossierApprenant({
    //       nom_apprenant: "ALONSO",
    //       prenom_apprenant: "Marcos",
    //       statut_apprenant: CODES_STATUT_APPRENANT.apprenti,
    //       uai_etablissement: testUai,
    //       etablissement_formateur_uai: testUaiEtablissementFormateur,
    //     }),
    //     createRandomDossierApprenant({
    //       nom_apprenant: "HAVERTZ",
    //       prenom_apprenant: "Kai",
    //       statut_apprenant: CODES_STATUT_APPRENANT.inscrit,
    //       uai_etablissement: testUai,
    //       etablissement_formateur_uai: testUaiEtablissementFormateur,
    //     }),
    //     createRandomDossierApprenant({
    //       nom_apprenant: "HAALAND",
    //       prenom_apprenant: "Erling",
    //       statut_apprenant: CODES_STATUT_APPRENANT.inscrit,
    //       uai_etablissement: testUai,
    //       etablissement_formateur_uai: testUaiEtablissementFormateur,
    //     }),
    //   ];

    //   await asyncForEach(dossiersApprenantsTest, async (currentDossierToAdd) => {
    //     const created = await createDossierApprenant(currentDossierToAdd);
    //     createdDossiersId.push(created._id);
    //     console.log(created);
    //   });

    //   // Vérification de l'ajout des dossiersApprenants
    //   const countDossiersApprenants = await DossierApprenantModel.countDocuments({ uai_etablissement: testUai });
    //   assert.equal(countDossiersApprenants, 4);

    //   // Ajout de 2 dossiersApprenants à SIFA
    //   const idsToAddToSifa = createdDossiersId.slice(0, 2);
    //   await asyncForEach(idsToAddToSifa, async (currentIdToAdd) => {
    //     const donneeSifaEntity = DonneeSifaFactory.create();
    //   });

    //   // Récupération des données Sifa à créer et vérification du bon nombre et de chaque item (2 sur 4)

    //   // const donneesSifaToCreate = await getFieldSifaFromDossiersApprenantsNotInDonneesSifa(testUai);
    //   // assert.equal(donneesSifaToCreate.length, 3);

    //   // for (const key in donneesSifaToCreate) {
    //   //   assert.equal(donneesSifaToCreate[key].uai_etablissement, dossiersApprenantsTest[key].uai_etablissement);
    //   //   console.log(donneesSifaToCreate[key]);
    //   //   // assert.equal(
    //   //   //   donneesSifaToCreate[key].etablissement_formateur_uai,
    //   //   //   dossiersApprenantsTest[key].etablissement_formateur_uai
    //   //   // ); // TODO Handle
    //   //   // assert.equal(donneesSifaToCreate[key].statut_apprenant, dossiersApprenantsTest[key].statut_apprenant); // TODO Handle
    //   //   assert.equal(
    //   //     donneesSifaToCreate[key].nom_apprenant.toUpperCase().trim(),
    //   //     dossiersApprenantsTest[key].nom_apprenant.toUpperCase().trim()
    //   //   );
    //   //   assert.equal(
    //   //     donneesSifaToCreate[key].prenom_apprenant.toUpperCase().trim(),
    //   //     dossiersApprenantsTest[key].prenom_apprenant.toUpperCase().trim()
    //   //   );
    //   //   assert.equal(
    //   //     donneesSifaToCreate[key].date_de_naissance_apprenant.getTime(),
    //   //     dossiersApprenantsTest[key].date_de_naissance_apprenant.getTime()
    //   //   );
    //   //   assert.equal(donneesSifaToCreate[key].formation_rncp, dossiersApprenantsTest[key].formation_rncp);
    //   //   assert.equal(
    //   //     donneesSifaToCreate[key].code_commune_insee_apprenant,
    //   //     dossiersApprenantsTest[key].code_commune_insee_apprenant
    //   //   );
    //   //   assert.equal(donneesSifaToCreate[key].tel_apprenant, dossiersApprenantsTest[key].tel_apprenant);
    //   //   assert.equal(donneesSifaToCreate[key].email_contact, dossiersApprenantsTest[key].email_contact);
    //   //   assert.equal(donneesSifaToCreate[key].date_entree_formation, dossiersApprenantsTest[key].date_entree_formation);
    //   //   assert.equal(
    //   //     donneesSifaToCreate[key].contrat_date_debut?.getTime(),
    //   //     dossiersApprenantsTest[key].contrat_date_debut?.getTime()
    //   //   );
    //   //   assert.equal(
    //   //     donneesSifaToCreate[key].contrat_date_rupture?.getTime(),
    //   //     dossiersApprenantsTest[key].contrat_date_rupture?.getTime()
    //   //   );
    //   // }
    // });
  });
});
