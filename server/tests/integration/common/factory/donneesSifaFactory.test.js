const assert = require("assert").strict;
const { DonneeSifaFactory } = require("../../../../src/common/factory/donneeSifa.js");
var mongoose = require("mongoose");

describe("Factory DonnéesSifa", () => {
  describe("create", () => {
    const testDossierApprenantId = "685aa89e32da58070798a6e7";
    const testUai = "0000001S";
    const testEtablissement_formateur_uai = "0000001X";
    const testStatutApprenant = "1";
    const testNomApprenant = "SMITH";
    const testPrenomApprenant = "John";
    const testDateDeNaissanceApprenant = new Date("1990-09-20T00:00:00.000+0000");

    const mandatoryProps = {
      dossierApprenant_id: testDossierApprenantId,
      uai_etablissement: testUai,
      etablissement_formateur_uai: testEtablissement_formateur_uai,
      statut_apprenant: testStatutApprenant,
      nom_apprenant: testNomApprenant,
      prenom_apprenant: testPrenomApprenant,
      date_de_naissance_apprenant: testDateDeNaissanceApprenant,
    };

    const testCodeRncp = "RNCP34945";
    const testCodeCommuneInsee = "31555";
    const testTelApprenant = "0632115588";
    const testEmailContact = "test@email.fr";
    const testDateEntreeFormation = new Date("2022-09-12T00:00:00.000+0000");
    const testContratDateDebut = new Date("2022-09-23T00:00:00.000+0000");
    const testContratDateRupture = new Date("2022-09-30T00:00:00.000+0000");

    const fullProps = {
      ...mandatoryProps,
      formation_rncp: testCodeRncp,
      code_commune_insee_apprenant: testCodeCommuneInsee,
      tel_apprenant: testTelApprenant,
      email_contact: testEmailContact,
      date_entree_formation: testDateEntreeFormation,
      contrat_date_debut: testContratDateDebut,
      contrat_date_rupture: testContratDateRupture,
    };

    it("Vérifie la création d'une donnée SIFA valide avec tous les champs obligatoires", () => {
      const donneesSifaProps = { ...mandatoryProps };
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.date_de_naissance_apprenant, testDateDeNaissanceApprenant);

      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, true);
    });

    it("Vérifie la création d'une donnée SIFA valide avec tous les champs optionnels", () => {
      const donneesSifaProps = { ...fullProps };
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.date_de_naissance_apprenant, testDateDeNaissanceApprenant);
      assert.deepEqual(createdCfaEntity.formation_rncp, testCodeRncp);
      assert.deepEqual(createdCfaEntity.code_commune_insee_apprenant, testCodeCommuneInsee);
      assert.deepEqual(createdCfaEntity.tel_apprenant, testTelApprenant);
      assert.deepEqual(createdCfaEntity.email_contact, testEmailContact);
      assert.deepEqual(createdCfaEntity.date_entree_formation, testDateEntreeFormation);
      assert.deepEqual(createdCfaEntity.contrat_date_debut, testContratDateDebut);
      assert.deepEqual(createdCfaEntity.contrat_date_rupture, testContratDateRupture);

      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, true);
    });

    it("Vérifie la création d'une donnée SIFA non valide sans dossierApprenant_id", () => {
      const donneesSifaProps = { ...mandatoryProps };
      delete donneesSifaProps.dossierApprenant_id;
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.date_de_naissance_apprenant, testDateDeNaissanceApprenant);

      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });

    it("Vérifie la création d'une donnée SIFA non valide avec dossierApprenant_id au mauvais format", () => {
      const donneesSifaProps = { ...mandatoryProps, dossierApprenant_id: 123 };
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.date_de_naissance_apprenant, testDateDeNaissanceApprenant);

      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });

    it("Vérifie la création d'une donnée SIFA non valide sans uai_etablissement", () => {
      const donneesSifaProps = { ...mandatoryProps };
      delete donneesSifaProps.uai_etablissement;
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.date_de_naissance_apprenant, testDateDeNaissanceApprenant);

      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });

    it("Vérifie la création d'une donnée SIFA non valide avec uai_etablissement au mauvais format", () => {
      const donneesSifaProps = { ...mandatoryProps, uai_etablissement: 123 };
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.date_de_naissance_apprenant, testDateDeNaissanceApprenant);

      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });

    it("Vérifie la création d'une donnée SIFA non valide sans etablissement_formateur_uai", () => {
      const donneesSifaProps = { ...mandatoryProps };
      delete donneesSifaProps.etablissement_formateur_uai;
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.date_de_naissance_apprenant, testDateDeNaissanceApprenant);

      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });

    it("Vérifie la création d'une donnée SIFA non valide avec etablissement_formateur_uai au mauvais format", () => {
      const donneesSifaProps = { ...mandatoryProps, etablissement_formateur_uai: 123 };
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.date_de_naissance_apprenant, testDateDeNaissanceApprenant);

      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });

    it("Vérifie la création d'une donnée SIFA non valide sans statut_apprenant", () => {
      const donneesSifaProps = { ...mandatoryProps };
      delete donneesSifaProps.statut_apprenant;
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.date_de_naissance_apprenant, testDateDeNaissanceApprenant);
      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });

    it("Vérifie la création d'une donnée SIFA non valide avec statut_apprenant au mauvais format", () => {
      const donneesSifaProps = { ...mandatoryProps, statut_apprenant: new Date() };
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.date_de_naissance_apprenant, testDateDeNaissanceApprenant);
      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });

    it("Vérifie la création d'une donnée SIFA non valide sans nom_apprenant", () => {
      const donneesSifaProps = { ...mandatoryProps };
      delete donneesSifaProps.nom_apprenant;
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.date_de_naissance_apprenant, testDateDeNaissanceApprenant);
      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });

    it("Vérifie la création d'une donnée SIFA non valide avec nom_apprenant au mauvais format", () => {
      const donneesSifaProps = { ...mandatoryProps, nom_apprenant: 123 };
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.date_de_naissance_apprenant, testDateDeNaissanceApprenant);
      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });

    it("Vérifie la création d'une donnée SIFA non valide sans prenom_apprenant", () => {
      const donneesSifaProps = { ...mandatoryProps };
      delete donneesSifaProps.prenom_apprenant;
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.date_de_naissance_apprenant, testDateDeNaissanceApprenant);
      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });

    it("Vérifie la création d'une donnée SIFA non valide avec prenom_apprenant au mauvais format", () => {
      const donneesSifaProps = { ...mandatoryProps, prenom_apprenant: 123 };
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.date_de_naissance_apprenant, testDateDeNaissanceApprenant);
      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });

    it("Vérifie la création d'une donnée SIFA non valide sans date_de_naissance_apprenant", () => {
      const donneesSifaProps = { ...mandatoryProps };
      delete donneesSifaProps.date_de_naissance_apprenant;
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });

    it("Vérifie la création d'une donnée SIFA non valide avec date_de_naissance_apprenant au mauvais format", () => {
      const donneesSifaProps = { ...mandatoryProps, date_de_naissance_apprenant: new Int16Array() };
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });

    it("Vérifie la création d'une donnée SIFA non valide avec formation_rncp au mauvais format", () => {
      const donneesSifaProps = { ...mandatoryProps, formation_rncp: new Int16Array() };
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });

    it("Vérifie la création d'une donnée SIFA non valide avec code_commune_insee_apprenant au mauvais format", () => {
      const donneesSifaProps = { ...mandatoryProps, code_commune_insee_apprenant: new Int16Array() };
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });

    it("Vérifie la création d'une donnée SIFA non valide avec tel_apprenant au mauvais format", () => {
      const donneesSifaProps = { ...mandatoryProps, tel_apprenant: new Int16Array() };
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });

    it("Vérifie la création d'une donnée SIFA non valide avec email_contact au mauvais format", () => {
      const donneesSifaProps = { ...mandatoryProps, email_contact: new Int16Array() };
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });

    it("Vérifie la création d'une donnée SIFA non valide avec date_entree_formation au mauvais format", () => {
      const donneesSifaProps = { ...mandatoryProps, date_entree_formation: new Int16Array() };
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });

    it("Vérifie la création d'une donnée SIFA non valide avec contrat_date_debut au mauvais format", () => {
      const donneesSifaProps = { ...mandatoryProps, contrat_date_debut: new Int16Array() };
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });

    it("Vérifie la création d'une donnée SIFA non valide avec contrat_date_rupture au mauvais format", () => {
      const donneesSifaProps = { ...mandatoryProps, contrat_date_rupture: new Int16Array() };
      const createdCfaEntity = DonneeSifaFactory.create(donneesSifaProps);

      assert.deepEqual(createdCfaEntity.dossierApprenant_id, new mongoose.Types.ObjectId("685aa89e32da58070798a6e7"));
      assert.deepEqual(createdCfaEntity.uai_etablissement, testUai);
      assert.deepEqual(createdCfaEntity.etablissement_formateur_uai, testEtablissement_formateur_uai);
      assert.deepEqual(createdCfaEntity.statut_apprenant, testStatutApprenant);
      assert.deepEqual(createdCfaEntity.nom_apprenant, testNomApprenant.toUpperCase().trim());
      assert.deepEqual(createdCfaEntity.prenom_apprenant, testPrenomApprenant.toUpperCase().trim());
      assert.equal(createdCfaEntity.created_at !== null, true);
      assert.equal(createdCfaEntity.updated_at, null);
      assert.equal(createdCfaEntity.is_valid, false);
    });
  });
});
