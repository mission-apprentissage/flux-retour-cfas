const assert = require("assert").strict;
const { DonneesApprenantsFactory } = require("../../../../src/common/factory/donneesApprenantsFactory.js");

describe("Factory DonneesApprenants", () => {
  describe("create", () => {
    it("Vérifie la création d'une donnée apprenant valide avec tous les champs obligatoires via sa factory", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        date_inscription: testDateInscription,
      });

      assert.equal(entity.user_email === testUserEmail, true);
      assert.equal(entity.user_uai === testUai, true);
      assert.equal(entity.user_siret === testSiret, true);
      assert.equal(entity.user_nom_etablissement === testNom_etablissement, true);
      assert.equal(entity.cfd === testCfd, true);
      assert.equal(entity.annee_scolaire === testAnneeScolaire, true);
      assert.equal(entity.annee_formation === testAnneeFormation, true);
      assert.equal(entity.nom_apprenant === testNomApprenant, true);
      assert.equal(entity.prenom_apprenant === testPrenomApprenant, true);
      assert.equal(entity.date_de_naissance_apprenant.getTime() === testDateDeNaissance.getTime(), true);
      assert.equal(entity.date_inscription.getTime() === testDateInscription.getTime(), true);

      assert.equal(entity.created_at !== null, true);
      assert.equal(entity.updated_at === null, true);
    });

    it("Vérifie la création d'une donnée apprenant valide avec tous les champs obligatoires et facultatifs via sa factory", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = "RNCP34945";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022-09-01");
      const testDateContrat = new Date("2022-10-01");
      const testDateFinContrat = new Date("2023-10-01");
      const testDateSortieFormation = new Date("2022-10-23");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
        date_inscription: testDateInscription,
        date_debut_contrat: testDateContrat,
        date_fin_contrat: testDateFinContrat,
        date_sortie_formation: testDateSortieFormation,
        date_rupture_contrat: testDateSortieFormation,
      });

      assert.equal(entity.user_email === testUserEmail, true);
      assert.equal(entity.user_uai === testUai, true);
      assert.equal(entity.user_siret === testSiret, true);
      assert.equal(entity.user_nom_etablissement === testNom_etablissement, true);
      assert.equal(entity.cfd === testCfd, true);
      assert.equal(entity.code_rncp === testCodeRncp, true);
      assert.equal(entity.annee_scolaire === testAnneeScolaire, true);
      assert.equal(entity.annee_formation === testAnneeFormation, true);
      assert.equal(entity.nom_apprenant === testNomApprenant, true);
      assert.equal(entity.prenom_apprenant === testPrenomApprenant, true);
      assert.equal(entity.date_de_naissance_apprenant.getTime() === testDateDeNaissance.getTime(), true);
      assert.equal(entity.telephone_apprenant === testTelephoneApprenant, true);
      assert.equal(entity.email_apprenant === testEmailApprenant, true);
      assert.equal(entity.ine_apprenant === testIneApprenant, true);
      assert.equal(entity.code_commune_insee_apprenant === testCodeCommuneInseeApprenant, true);
      assert.equal(entity.date_inscription.getTime() === testDateInscription.getTime(), true);
      assert.equal(entity.date_debut_contrat.getTime() === testDateContrat.getTime(), true);
      assert.equal(entity.date_sortie_formation.getTime() === testDateSortieFormation.getTime(), true);

      assert.equal(entity.created_at !== null, true);
      assert.equal(entity.updated_at === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec user_email au mauvais format", async () => {
      const testUserEmail = "user";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        date_inscription: testDateInscription,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de demande d'activation de compte via sa factory avec user_email manquant", async () => {
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        date_inscription: testDateInscription,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec user_uai au mauvais format", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = 123;
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        date_inscription: testDateInscription,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de demande d'activation de compte via sa factory avec user_uai manquant", async () => {
      const testUserEmail = "user@cfa.fr";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        date_inscription: testDateInscription,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec user_siret au mauvais format", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = 123;
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        date_inscription: testDateInscription,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de demande d'activation de compte via sa factory avec user_siret manquant", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        date_inscription: testDateInscription,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec user_nom_etablissement au mauvais format", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = 123;
      const testCfd = "11111111";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        date_inscription: testDateInscription,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de demande d'activation de compte via sa factory avec user_nom_etablissement manquant", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testCfd = "11111111";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        cfd: testCfd,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        date_inscription: testDateInscription,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec cfd au mauvais format", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = 123;
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        date_inscription: testDateInscription,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de demande d'activation de compte via sa factory avec cfd manquant", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        date_inscription: testDateInscription,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec annee_scolaire au mauvais format", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testAnneeScolaire = 123;
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        date_inscription: testDateInscription,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de demande d'activation de compte via sa factory avec annee_scolaire manquant", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        date_inscription: testDateInscription,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec annee_formation au mauvais format", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = new Date("2002-04-01");
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        date_inscription: testDateInscription,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de demande d'activation de compte via sa factory avec annee_formation manquant", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testAnneeScolaire = "2023-2024";
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        annee_scolaire: testAnneeScolaire,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        date_inscription: testDateInscription,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec nom_apprenant au mauvais format", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = 123;
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        date_inscription: testDateInscription,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de demande d'activation de compte via sa factory avec nom_apprenant manquant", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        date_inscription: testDateInscription,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec prenom_apprenant au mauvais format", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = 123;
      const testDateDeNaissance = new Date("2002-04-01");
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        date_inscription: testDateInscription,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de demande d'activation de compte via sa factory avec prenom_apprenant manquant", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testDateDeNaissance = new Date("2002-04-01");
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        date_inscription: testDateInscription,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec date_de_naissance_apprenant au mauvais format", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = "test";
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        date_inscription: testDateInscription,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de demande d'activation de compte via sa factory avec date_de_naissance_apprenant manquant", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateInscription = new Date("2022-09-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_inscription: testDateInscription,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec code_rncp au mauvais format", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = 123;
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022-09-01");
      const testDateContrat = new Date("2022-10-01");
      const testDateSortieFormation = new Date("2022-10-23");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
        date_inscription: testDateInscription,
        date_debut_contrat: testDateContrat,
        date_sortie_formation: testDateSortieFormation,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec telephone_apprenant au mauvais format", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = "RNCP34945";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = 123;
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022-09-01");
      const testDateContrat = new Date("2022-10-01");
      const testDateSortieFormation = new Date("2022-10-23");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
        date_inscription: testDateInscription,
        date_debut_contrat: testDateContrat,
        date_sortie_formation: testDateSortieFormation,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec email_apprenant au mauvais format", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = "RNCP34945";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "test";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022-09-01");
      const testDateContrat = new Date("2022-10-01");
      const testDateSortieFormation = new Date("2022-10-23");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
        date_inscription: testDateInscription,
        date_debut_contrat: testDateContrat,
        date_sortie_formation: testDateSortieFormation,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec ine_apprenant au mauvais format", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = "RNCP34945";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = 123;
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022-09-01");
      const testDateContrat = new Date("2022-10-01");
      const testDateSortieFormation = new Date("2022-10-23");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
        date_inscription: testDateInscription,
        date_debut_contrat: testDateContrat,
        date_sortie_formation: testDateSortieFormation,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec code_commune_insee_apprenant au mauvais format", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = "RNCP34945";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = 123;
      const testDateInscription = new Date("2022-09-01");
      const testDateContrat = new Date("2022-10-01");
      const testDateSortieFormation = new Date("2022-10-23");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
        date_inscription: testDateInscription,
        date_debut_contrat: testDateContrat,
        date_sortie_formation: testDateSortieFormation,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec date_inscription au mauvais format", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = "RNCP34945";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = "test";
      const testDateContrat = new Date("2022-10-01");
      const testDateSortieFormation = new Date("2022-10-23");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
        date_inscription: testDateInscription,
        date_debut_contrat: testDateContrat,
        date_sortie_formation: testDateSortieFormation,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec date_inscription au manquante", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = "RNCP34945";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec date_debut_contrat au mauvais format", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = "RNCP34945";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022-09-01");
      const testDateContrat = "test";
      const testDateSortieFormation = new Date("2022-10-23");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
        date_inscription: testDateInscription,
        date_debut_contrat: testDateContrat,
        date_sortie_formation: testDateSortieFormation,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec date_sortie_formation au mauvais format", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = "RNCP34945";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022-09-01");
      const testDateContrat = new Date("2022-10-01");
      const testDateSortieFormation = "test";

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
        date_inscription: testDateInscription,
        date_debut_contrat: testDateContrat,
        date_sortie_formation: testDateSortieFormation,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec date_debut_contrat fournie mais date_fin_contrat manquante", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = "RNCP34945";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022-09-01");
      const testDateDebutContrat = new Date("2022-10-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
        date_inscription: testDateInscription,
        date_debut_contrat: testDateDebutContrat,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory avec date_debut_contrat avant date_fin_contrat", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = "RNCP34945";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022-09-01");
      const testDateDebutContrat = new Date("2022-10-01");
      const testDateFinContrat = new Date("2022-06-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
        date_inscription: testDateInscription,
        date_debut_contrat: testDateDebutContrat,
        date_fin_contrat: testDateFinContrat,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory si date_rupture_contrat fournie sans date_debut_contrat", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = "RNCP34945";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022-09-01");
      const testDateRupture = new Date("2022-10-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
        date_inscription: testDateInscription,
        date_rupture_contrat: testDateRupture,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory si date_rupture_contrat et date_debut_contrat fournies sans date_fin_contrat", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = "RNCP34945";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022-09-01");
      const testDateRupture = new Date("2022-10-01");
      const testDateDebutContrat = new Date("2022-09-23");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
        date_inscription: testDateInscription,
        date_debut_contrat: testDateDebutContrat,
        date_rupture_contrat: testDateRupture,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory si date_rupture_contrat avant date_inscription", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = "RNCP34945";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022-09-01");
      const testDateRupture = new Date("2022-08-01");
      const testDateDebutContrat = new Date("2022-07-23");
      const testDateFinContrat = new Date("2023-09-23");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
        date_inscription: testDateInscription,
        date_debut_contrat: testDateDebutContrat,
        date_fin_contrat: testDateFinContrat,
        date_rupture_contrat: testDateRupture,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory si date_rupture_contrat avant date_debut_contrat", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = "RNCP34945";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022-09-01");
      const testDateRupture = new Date("2022-08-01");
      const testDateDebutContrat = new Date("2022-09-23");
      const testDateFinContrat = new Date("2023-09-23");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
        date_inscription: testDateInscription,
        date_debut_contrat: testDateDebutContrat,
        date_fin_contrat: testDateFinContrat,
        date_rupture_contrat: testDateRupture,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory si date_rupture_contrat après date_fin_contrat", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = "RNCP34945";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022-09-01");
      const testDateRupture = new Date("2024-08-01");
      const testDateDebutContrat = new Date("2022-09-23");
      const testDateFinContrat = new Date("2023-09-23");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
        date_inscription: testDateInscription,
        date_debut_contrat: testDateDebutContrat,
        date_fin_contrat: testDateFinContrat,
        date_rupture_contrat: testDateRupture,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory si date_sortie fournie sans date_rupture_contrat", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = "RNCP34945";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022-09-01");
      const testDateSortie = new Date("2022-10-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
        date_inscription: testDateInscription,
        date_sortie_formation: testDateSortie,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory si date_sortie fournie avant la date_inscription", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = "RNCP34945";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022-09-01");
      const testDateDebutContrat = new Date("2022-09-23");
      const testDateFinContrat = new Date("2023-09-23");
      const testDateRupture = new Date("2022-10-01");
      const testDateSortie = new Date("2022-07-01");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
        date_inscription: testDateInscription,
        date_debut_contrat: testDateDebutContrat,
        date_fin_contrat: testDateFinContrat,
        date_rupture_contrat: testDateRupture,
        date_sortie_formation: testDateSortie,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la non création de donnée apprenant via sa factory si date_sortie fournie avant la date_debut_contrat", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = "RNCP34945";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022-09-01");
      const testDateDebutContrat = new Date("2022-09-23");
      const testDateFinContrat = new Date("2023-09-23");
      const testDateRupture = new Date("2022-10-01");
      const testDateSortie = new Date("2022-09-20");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
        date_inscription: testDateInscription,
        date_debut_contrat: testDateDebutContrat,
        date_fin_contrat: testDateFinContrat,
        date_rupture_contrat: testDateRupture,
        date_sortie_formation: testDateSortie,
      });

      assert.equal(entity === null, true);
    });

    it("Vérifie la création de donnée apprenant via sa factory si toutes dates fournies et valides", async () => {
      const testUserEmail = "user@cfa.fr";
      const testUai = "0881529J";
      const testSiret = "13002798000031";
      const testNom_etablissement = "nom_etablissement";
      const testCfd = "11111111";
      const testCodeRncp = "RNCP34945";
      const testAnneeScolaire = "2023-2024";
      const testAnneeFormation = 2;
      const testNomApprenant = "SMITH";
      const testPrenomApprenant = "John";
      const testDateDeNaissance = new Date("2002-04-01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022-09-01");
      const testDateDebutContrat = new Date("2022-09-23");
      const testDateFinContrat = new Date("2023-09-23");
      const testDateFinFormation = new Date("2023-10-30");
      const testDateRupture = new Date("2022-10-01");
      const testDateSortie = new Date("2022-10-02");

      const entity = await DonneesApprenantsFactory.create({
        user_email: testUserEmail,
        user_uai: testUai,
        user_siret: testSiret,
        user_nom_etablissement: testNom_etablissement,
        cfd: testCfd,
        code_rncp: testCodeRncp,
        annee_scolaire: testAnneeScolaire,
        annee_formation: testAnneeFormation,
        nom_apprenant: testNomApprenant,
        prenom_apprenant: testPrenomApprenant,
        date_de_naissance_apprenant: testDateDeNaissance,
        telephone_apprenant: testTelephoneApprenant,
        email_apprenant: testEmailApprenant,
        ine_apprenant: testIneApprenant,
        code_commune_insee_apprenant: testCodeCommuneInseeApprenant,
        date_inscription: testDateInscription,
        date_debut_contrat: testDateDebutContrat,
        date_fin_contrat: testDateFinContrat,
        date_fin_formation: testDateFinFormation,
        date_rupture_contrat: testDateRupture,
        date_sortie_formation: testDateSortie,
      });

      assert.equal(entity.user_email === testUserEmail, true);
      assert.equal(entity.user_uai === testUai, true);
      assert.equal(entity.user_siret === testSiret, true);
      assert.equal(entity.user_nom_etablissement === testNom_etablissement, true);
      assert.equal(entity.cfd === testCfd, true);
      assert.equal(entity.annee_scolaire === testAnneeScolaire, true);
      assert.equal(entity.annee_formation === testAnneeFormation, true);
      assert.equal(entity.nom_apprenant === testNomApprenant, true);
      assert.equal(entity.prenom_apprenant === testPrenomApprenant, true);
      assert.equal(entity.date_de_naissance_apprenant.getTime() === testDateDeNaissance.getTime(), true);
      assert.equal(entity.date_inscription.getTime() === testDateInscription.getTime(), true);
      assert.equal(entity.date_debut_contrat.getTime() === testDateDebutContrat.getTime(), true);
      assert.equal(entity.date_fin_contrat.getTime() === testDateFinContrat.getTime(), true);
      assert.equal(entity.date_fin_formation.getTime() === testDateFinFormation.getTime(), true);
      assert.equal(entity.date_rupture_contrat.getTime() === testDateRupture.getTime(), true);
      assert.equal(entity.date_sortie_formation.getTime() === testDateSortie.getTime(), true);

      assert.equal(entity.created_at !== null, true);
      assert.equal(entity.updated_at === null, true);
    });
  });
});
