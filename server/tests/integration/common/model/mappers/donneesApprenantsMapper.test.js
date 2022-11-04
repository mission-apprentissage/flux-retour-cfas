const assert = require("assert").strict;
const { format } = require("date-fns");

const { parseFormattedDate } = require("../../../../../src/common/domain/date.js");
const { DONNEES_APPRENANT_XLSX_FIELDS } = require("../../../../../src/common/domain/donneesApprenants.js");
const { DonneesApprenantsFactory } = require("../../../../../src/common/factory/donneesApprenantsFactory.js");
const {
  CODES_STATUT_APPRENANT,
  toDonneesApprenantsFromXlsx,
  toDossiersApprenantsList,
} = require("../../../../../src/common/model/mappers/donneesApprenantsMapper.js");
const { createRandomXlsxDonneesApprenant } = require("../../../../data/createRandomDonneesApprenants.js");

describe("Mapper DonneesApprenants", () => {
  describe("toDonneesApprenantsFromXlsx", () => {
    it("Vérifie le mapping d'un objet XLSX avec tous les champs obligatoires et facultatifs vers DonneesApprenants", async () => {
      const dataFields = {};
      dataFields[DONNEES_APPRENANT_XLSX_FIELDS.CodeRNCP] = "RNCP12345";
      dataFields[DONNEES_APPRENANT_XLSX_FIELDS.TelephoneApprenant] = "0618224455";
      dataFields[DONNEES_APPRENANT_XLSX_FIELDS.EmailApprenant] = "test@email.fr";
      dataFields[DONNEES_APPRENANT_XLSX_FIELDS.IneApprenant] = "111111111XX";
      dataFields[DONNEES_APPRENANT_XLSX_FIELDS.CodeCommuneInseeApprenant] = "31555";

      const DATE_FORMAT = "dd/MM/yyyy";

      dataFields[DONNEES_APPRENANT_XLSX_FIELDS.DateInscription] = format(
        new Date("2022/10/01"),
        DATE_FORMAT
      ).toString();

      dataFields[DONNEES_APPRENANT_XLSX_FIELDS.DateDebutContrat] = format(
        new Date("2022/10/05"),
        DATE_FORMAT
      ).toString();

      dataFields[DONNEES_APPRENANT_XLSX_FIELDS.DateFinContrat] = format(new Date("2023/10/05"), DATE_FORMAT).toString();

      dataFields[DONNEES_APPRENANT_XLSX_FIELDS.DateFinFormation] = format(
        new Date("2023/09/10"),
        DATE_FORMAT
      ).toString();

      dataFields[DONNEES_APPRENANT_XLSX_FIELDS.DateRuptureContrat] = format(
        new Date("2022/12/10"),
        DATE_FORMAT
      ).toString();

      dataFields[DONNEES_APPRENANT_XLSX_FIELDS.DateSortieFormation] = format(
        new Date("2022/12/12"),
        DATE_FORMAT
      ).toString();

      // Vérification de la génération
      const randomXlsxDonneesApprenant = createRandomXlsxDonneesApprenant(dataFields);

      assert.equal(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.CFD] !== undefined, true);
      assert.equal(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.AnneeScolaire] !== undefined, true);
      assert.equal(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.AnneeFormation] !== undefined, true);
      assert.equal(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.NomApprenant] !== undefined, true);
      assert.equal(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.PrenomApprenant] !== undefined, true);
      assert.equal(
        randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.DateDeNaissanceApprenant] !== undefined,
        true
      );
      assert.equal(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.CodeRNCP] !== undefined, true);
      assert.equal(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.TelephoneApprenant] !== undefined, true);
      assert.equal(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.EmailApprenant] !== undefined, true);
      assert.equal(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.IneApprenant] !== undefined, true);
      assert.equal(
        randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.CodeCommuneInseeApprenant] !== undefined,
        true
      );
      assert.equal(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.DateInscription] !== undefined, true);
      assert.equal(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.DateDebutContrat] !== undefined, true);
      assert.equal(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.DateFinContrat] !== undefined, true);
      assert.equal(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.DateFinFormation] !== undefined, true);
      assert.equal(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.DateRuptureContrat] !== undefined, true);
      assert.equal(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.DateSortieFormation] !== undefined, true);

      // Vérification du mapping
      const mappedDonneesApprenant = toDonneesApprenantsFromXlsx(randomXlsxDonneesApprenant);

      assert.equal(mappedDonneesApprenant.cfd === randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.CFD], true);
      assert.equal(
        mappedDonneesApprenant.annee_scolaire ===
          randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.AnneeScolaire],
        true
      );
      assert.equal(
        mappedDonneesApprenant.annee_formation ===
          randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.AnneeFormation],
        true
      );
      assert.equal(
        mappedDonneesApprenant.nom_apprenant === randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.NomApprenant],
        true
      );
      assert.equal(
        mappedDonneesApprenant.prenom_apprenant ===
          randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.PrenomApprenant],
        true
      );
      assert.equal(
        mappedDonneesApprenant.date_de_naissance_apprenant.getTime() ===
          parseFormattedDate(
            randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.DateDeNaissanceApprenant]
          ).getTime(),
        true
      );

      assert.equal(
        mappedDonneesApprenant.code_rncp === randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.CodeRNCP],
        true
      );
      assert.equal(
        mappedDonneesApprenant.telephone_apprenant ===
          randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.TelephoneApprenant],
        true
      );
      assert.equal(
        mappedDonneesApprenant.email_apprenant ===
          randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.EmailApprenant],
        true
      );
      assert.equal(
        mappedDonneesApprenant.ine_apprenant === randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.IneApprenant],
        true
      );
      assert.equal(
        mappedDonneesApprenant.code_commune_insee_apprenant ===
          randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.CodeCommuneInseeApprenant],
        true
      );

      assert.equal(
        mappedDonneesApprenant.date_inscription.getTime() ===
          parseFormattedDate(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.DateInscription]).getTime(),
        true
      );
      assert.equal(
        mappedDonneesApprenant.date_debut_contrat.getTime() ===
          parseFormattedDate(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.DateDebutContrat]).getTime(),
        true
      );
      assert.equal(
        mappedDonneesApprenant.date_fin_contrat.getTime() ===
          parseFormattedDate(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.DateFinContrat]).getTime(),
        true
      );
      assert.equal(
        mappedDonneesApprenant.date_fin_formation.getTime() ===
          parseFormattedDate(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.DateFinFormation]).getTime(),
        true
      );
      assert.equal(
        mappedDonneesApprenant.date_rupture_contrat.getTime() ===
          parseFormattedDate(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.DateRuptureContrat]).getTime(),
        true
      );
      assert.equal(
        mappedDonneesApprenant.date_sortie_formation.getTime() ===
          parseFormattedDate(randomXlsxDonneesApprenant[DONNEES_APPRENANT_XLSX_FIELDS.DateSortieFormation]).getTime(),
        true
      );
    });
  });

  describe("toDossiersApprenantsList", () => {
    it("Vérifie le mapping d'un objet donneesApprenants pour un inscrit simple avec tous les champs optionnels vers une liste de DossierApprenants", async () => {
      // Création d'une donneeApprenant test
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
      const testDateDeNaissance = new Date("2002/04/01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022/09/01");

      const donneeApprenantTest = await DonneesApprenantsFactory.create({
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
      });

      // Mapping
      const dossierApprenantListFromDonneeApprenant = toDossiersApprenantsList(donneeApprenantTest);

      assert.equal(dossierApprenantListFromDonneeApprenant.length === 1, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].nom_apprenant === testNomApprenant, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].prenom_apprenant === testPrenomApprenant, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[0].date_de_naissance_apprenant === testDateDeNaissance,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[0].uai_etablissement === testUai, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].nom_etablissement === testNom_etablissement, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[0].statut_apprenant === CODES_STATUT_APPRENANT.inscrit,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[0].id_formation === testCfd, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].annee_scolaire === testAnneeScolaire, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[0].date_metier_mise_a_jour_statut === testDateInscription,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[0].ine_apprenant === testIneApprenant, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].id_erp_apprenant === donneeApprenantTest._id, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].email_contact === testEmailApprenant, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].tel_apprenant === testTelephoneApprenant, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[0].code_commune_insee_apprenant === testCodeCommuneInseeApprenant,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[0].siret_etablissement === testSiret, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].libelle_long_formation === undefined, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].formation_rncp === testCodeRncp, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].periode_formation === undefined, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].annee_formation === testAnneeFormation, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].contrat_date_debut === undefined, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].contrat_date_fin === undefined, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].contrat_date_rupture === undefined, true);
    });

    it("Vérifie le mapping d'un objet donneesApprenants pour un apprenti (séquence inscrit / apprenti) avec tous les champs optionnels vers une liste de DossierApprenants", async () => {
      // Création d'une donneeApprenant test
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
      const testDateDeNaissance = new Date("2002/04/01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022/08/01");
      const testDateContrat = new Date("2022/09/01");
      const testDateFinContrat = new Date("2023/09/01");

      const donneeApprenantTest = await DonneesApprenantsFactory.create({
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
      });

      // Mapping
      const dossierApprenantListFromDonneeApprenant = toDossiersApprenantsList(donneeApprenantTest);

      assert.equal(dossierApprenantListFromDonneeApprenant.length === 2, true);

      // Premier élément = inscrit
      assert.equal(dossierApprenantListFromDonneeApprenant[0].nom_apprenant === testNomApprenant, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].prenom_apprenant === testPrenomApprenant, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[0].date_de_naissance_apprenant === testDateDeNaissance,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[0].uai_etablissement === testUai, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].nom_etablissement === testNom_etablissement, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[0].statut_apprenant === CODES_STATUT_APPRENANT.inscrit,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[0].id_formation === testCfd, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].annee_scolaire === testAnneeScolaire, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[0].date_metier_mise_a_jour_statut === testDateInscription,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[0].ine_apprenant === testIneApprenant, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].id_erp_apprenant === donneeApprenantTest._id, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].email_contact === testEmailApprenant, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].tel_apprenant === testTelephoneApprenant, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[0].code_commune_insee_apprenant === testCodeCommuneInseeApprenant,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[0].siret_etablissement === testSiret, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].libelle_long_formation === undefined, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].formation_rncp === testCodeRncp, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].periode_formation === undefined, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].annee_formation === testAnneeFormation, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].contrat_date_debut === testDateContrat, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].contrat_date_fin === testDateFinContrat, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].contrat_date_rupture === undefined, true);

      // Deuxième élément = apprenti
      assert.equal(dossierApprenantListFromDonneeApprenant[1].nom_apprenant === testNomApprenant, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].prenom_apprenant === testPrenomApprenant, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[1].date_de_naissance_apprenant === testDateDeNaissance,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[1].uai_etablissement === testUai, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].nom_etablissement === testNom_etablissement, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[1].statut_apprenant === CODES_STATUT_APPRENANT.apprenti,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[1].id_formation === testCfd, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].annee_scolaire === testAnneeScolaire, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].date_metier_mise_a_jour_statut === testDateContrat, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].ine_apprenant === testIneApprenant, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].id_erp_apprenant === donneeApprenantTest._id, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].email_contact === testEmailApprenant, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].tel_apprenant === testTelephoneApprenant, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[1].code_commune_insee_apprenant === testCodeCommuneInseeApprenant,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[1].siret_etablissement === testSiret, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].libelle_long_formation === undefined, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].formation_rncp === testCodeRncp, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].periode_formation === undefined, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].annee_formation === testAnneeFormation, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].contrat_date_debut === testDateContrat, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].contrat_date_fin === testDateFinContrat, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].contrat_date_rupture === undefined, true);
    });

    it("Vérifie le mapping d'un objet donneesApprenants pour un abandon (séquence inscrit puis apprenti puis abandon) avec tous les champs optionnels vers une liste de DossierApprenants", async () => {
      // Création d'une donneeApprenant test
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
      const testDateDeNaissance = new Date("2002/04/01");
      const testTelephoneApprenant = "0638444989";
      const testEmailApprenant = "kevin@adams.fr";
      const testIneApprenant = "111111111AA";
      const testCodeCommuneInseeApprenant = "59122";
      const testDateInscription = new Date("2022/07/01");
      const testDateContrat = new Date("2022/09/01");
      const testDateFinContrat = new Date("2023/09/01");
      const testDateSortie = new Date("2022/09/12");
      const testDateRupture = new Date("2022/09/11");

      const donneeApprenantTest = await DonneesApprenantsFactory.create({
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
        date_rupture_contrat: testDateRupture,
        date_sortie_formation: testDateSortie,
      });

      // Mapping
      const dossierApprenantListFromDonneeApprenant = toDossiersApprenantsList(donneeApprenantTest);
      assert.equal(dossierApprenantListFromDonneeApprenant.length === 3, true);

      // Premier élément - inscrit
      assert.equal(dossierApprenantListFromDonneeApprenant[0].nom_apprenant === testNomApprenant, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].prenom_apprenant === testPrenomApprenant, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[0].date_de_naissance_apprenant === testDateDeNaissance,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[0].uai_etablissement === testUai, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].nom_etablissement === testNom_etablissement, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[0].statut_apprenant === CODES_STATUT_APPRENANT.inscrit,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[0].id_formation === testCfd, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].annee_scolaire === testAnneeScolaire, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[0].date_metier_mise_a_jour_statut === testDateInscription,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[0].ine_apprenant === testIneApprenant, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].id_erp_apprenant === donneeApprenantTest._id, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].email_contact === testEmailApprenant, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].tel_apprenant === testTelephoneApprenant, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[0].code_commune_insee_apprenant === testCodeCommuneInseeApprenant,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[0].siret_etablissement === testSiret, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].libelle_long_formation === undefined, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].formation_rncp === testCodeRncp, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].periode_formation === undefined, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].annee_formation === testAnneeFormation, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].contrat_date_debut === testDateContrat, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].contrat_date_fin === testDateFinContrat, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[0].contrat_date_rupture === testDateRupture, true);

      // Deuxième élément - apprenti
      assert.equal(dossierApprenantListFromDonneeApprenant[1].nom_apprenant === testNomApprenant, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].prenom_apprenant === testPrenomApprenant, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[1].date_de_naissance_apprenant === testDateDeNaissance,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[1].uai_etablissement === testUai, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].nom_etablissement === testNom_etablissement, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[1].statut_apprenant === CODES_STATUT_APPRENANT.apprenti,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[1].id_formation === testCfd, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].annee_scolaire === testAnneeScolaire, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].date_metier_mise_a_jour_statut === testDateContrat, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].ine_apprenant === testIneApprenant, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].id_erp_apprenant === donneeApprenantTest._id, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].email_contact === testEmailApprenant, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].tel_apprenant === testTelephoneApprenant, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[1].code_commune_insee_apprenant === testCodeCommuneInseeApprenant,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[1].siret_etablissement === testSiret, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].libelle_long_formation === undefined, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].formation_rncp === testCodeRncp, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].periode_formation === undefined, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].annee_formation === testAnneeFormation, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].contrat_date_debut === testDateContrat, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].contrat_date_fin === testDateFinContrat, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[1].contrat_date_rupture === testDateRupture, true);

      // Troisième élément - abandon
      assert.equal(dossierApprenantListFromDonneeApprenant[2].nom_apprenant === testNomApprenant, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[2].prenom_apprenant === testPrenomApprenant, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[2].date_de_naissance_apprenant === testDateDeNaissance,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[2].uai_etablissement === testUai, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[2].nom_etablissement === testNom_etablissement, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[2].statut_apprenant === CODES_STATUT_APPRENANT.abandon,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[2].id_formation === testCfd, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[2].annee_scolaire === testAnneeScolaire, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[2].date_metier_mise_a_jour_statut === testDateSortie, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[2].ine_apprenant === testIneApprenant, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[2].id_erp_apprenant === donneeApprenantTest._id, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[2].email_contact === testEmailApprenant, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[2].tel_apprenant === testTelephoneApprenant, true);
      assert.equal(
        dossierApprenantListFromDonneeApprenant[2].code_commune_insee_apprenant === testCodeCommuneInseeApprenant,
        true
      );
      assert.equal(dossierApprenantListFromDonneeApprenant[2].siret_etablissement === testSiret, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[2].libelle_long_formation === undefined, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[2].formation_rncp === testCodeRncp, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[2].periode_formation === undefined, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[2].annee_formation === testAnneeFormation, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[2].contrat_date_debut === testDateContrat, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[2].contrat_date_fin === testDateFinContrat, true);
      assert.equal(dossierApprenantListFromDonneeApprenant[2].contrat_date_rupture === testDateRupture, true);
    });
  });
});
