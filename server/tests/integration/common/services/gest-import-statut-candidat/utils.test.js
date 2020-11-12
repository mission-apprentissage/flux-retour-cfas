const assert = require("assert");
const config = require("config");
const {
  adaptGestiStatutCandidat,
  validateInput,
} = require("../../../../../src/common/services/gesti-import-statuts-candidats/utils.js");

describe("gesti-import-statut-candidat utils", () => {
  describe("adaptGestiStatutCandidat", () => {
    it("Vérifie qu'on convertit un statut candidat provenant de Gesti au format attendu par l'import", async () => {
      const gestiInput = {
        ine_apprenant: "123456789AB",
        nom_apprenant: "DUPONT-DURAND",
        prenom_apprenant: "Jean-Luc",
        prenom2_apprenant: "Jacques",
        prenom3_apprenant: "Pierre",
        ne_pas_solliciter: "false",
        email_contact: "jeanluc@mail.com",
        nom_representant_legal: "DUPONT-DURAND",
        tel_representant_legal: "",
        tel2_representant_legal: "0610203040",
        id_formation: "50321405",
        libelle_court_formation: "CAPA JARDINIER PAYSAGISTE",
        libelle_long_formation: "JARDINIER PAYSAGISTE (CAPA)",
        uai_etablissement: "0011074M",
        nom_etablissement: "MFR DE BAGE LE CHATEL - 01380 BAGE LE CHATEL",
        statut_apprenant: "3",
        date_metier_mise_a_jour_statut: "07/09/2020",
      };

      const expectedOutput = {
        ine_apprenant: "123456789AB",
        nom_apprenant: "DUPONT-DURAND",
        prenom_apprenant: "Jean-Luc",
        prenom2_apprenant: "Jacques",
        prenom3_apprenant: "Pierre",
        ne_pas_solliciter: false,
        email_contact: "jeanluc@mail.com",
        nom_representant_legal: "DUPONT-DURAND",
        tel_representant_legal: "",
        tel2_representant_legal: "0610203040",
        id_formation: "50321405",
        libelle_court_formation: "CAPA JARDINIER PAYSAGISTE",
        libelle_long_formation: "JARDINIER PAYSAGISTE (CAPA)",
        uai_etablissement: "0011074M",
        nom_etablissement: "MFR DE BAGE LE CHATEL - 01380 BAGE LE CHATEL",
        statut_apprenant: 3,
        date_metier_mise_a_jour_statut: new Date(2020, 9, 7),
        source: config.users.gesti.name,
      };
      assert.deepStrictEqual(adaptGestiStatutCandidat(gestiInput), expectedOutput);
    });

    it("Vérifie qu'on convertit un statut candidat provenant de Gesti au format attendu par l'import avec le minimum d'infos", async () => {
      const gestiInput = {
        ine_apprenant: "",
        nom_apprenant: "DUPONT-DURAND",
        prenom_apprenant: "Jean-Luc",
        prenom2_apprenant: "",
        prenom3_apprenant: "",
        ne_pas_solliciter: "true",
        email_contact: "",
        nom_representant_legal: "",
        tel_representant_legal: "",
        tel2_representant_legal: "",
        id_formation: "50321405",
        libelle_court_formation: "",
        libelle_long_formation: "",
        uai_etablissement: "0011074M",
        nom_etablissement: "MFR DE BAGE LE CHATEL - 01380 BAGE LE CHATEL",
        statut_apprenant: "3",
        date_metier_mise_a_jour_statut: "",
      };

      const expectedOutput = {
        ine_apprenant: "",
        nom_apprenant: "DUPONT-DURAND",
        prenom_apprenant: "Jean-Luc",
        prenom2_apprenant: "",
        prenom3_apprenant: "",
        ne_pas_solliciter: true,
        email_contact: "",
        nom_representant_legal: "",
        tel_representant_legal: "",
        tel2_representant_legal: "",
        id_formation: "50321405",
        libelle_court_formation: "",
        libelle_long_formation: "",
        uai_etablissement: "0011074M",
        nom_etablissement: "MFR DE BAGE LE CHATEL - 01380 BAGE LE CHATEL",
        statut_apprenant: 3,
        date_metier_mise_a_jour_statut: "",
        source: config.users.gesti.name,
      };
      assert.deepStrictEqual(adaptGestiStatutCandidat(gestiInput), expectedOutput);
    });
  });

  describe("validateInput", () => {
    it("Vérifie qu'un tableau de statuts valides renvoie zéro erreurs", async () => {
      const input = [
        {
          ine_apprenant: "123456789AB",
          nom_apprenant: "DUPONT-DURAND",
          prenom_apprenant: "Jean-Luc",
          prenom2_apprenant: "Jacques",
          prenom3_apprenant: "Pierre",
          ne_pas_solliciter: false,
          email_contact: "jeanluc@mail.com",
          nom_representant_legal: "DUPONT-DURAND",
          tel_representant_legal: "",
          tel2_representant_legal: "0610203040",
          id_formation: "50321405",
          libelle_court_formation: "CAPA JARDINIER PAYSAGISTE",
          libelle_long_formation: "JARDINIER PAYSAGISTE (CAPA)",
          uai_etablissement: "0011074M",
          nom_etablissement: "MFR DE BAGE LE CHATEL - 01380 BAGE LE CHATEL",
          statut_apprenant: 3,
          date_metier_mise_a_jour_statut: new Date("07/09/2020"),
          source: config.users.gesti.name,
        },
        {
          ine_apprenant: "",
          nom_apprenant: "DUPONT",
          prenom_apprenant: "Jean-Marc",
          prenom2_apprenant: "",
          prenom3_apprenant: "",
          ne_pas_solliciter: false,
          email_contact: "",
          nom_representant_legal: "",
          tel_representant_legal: "",
          tel2_representant_legal: "",
          id_formation: "50321405",
          libelle_court_formation: "",
          libelle_long_formation: "",
          uai_etablissement: "0011074M",
          nom_etablissement: "MFR DE BAGE LE CHATEL - 01380 BAGE LE CHATEL",
          statut_apprenant: 3,
          date_metier_mise_a_jour_statut: "",
          source: config.users.gesti.name,
        },
      ];
      const expectedOutput = {
        valid: input,
        errors: 0,
      };
      assert.deepStrictEqual(validateInput(input), expectedOutput);
    });
    it("Vérifie qu'un tableau avec statuts invalides est retourné filtré et avec erreurs", async () => {
      const input = [
        {
          ine_apprenant: "123456789AB",
          nom_apprenant: "DUPONT-DURAND",
          prenom_apprenant: "Jean-Luc",
          prenom2_apprenant: "Jacques",
          prenom3_apprenant: "Pierre",
          ne_pas_solliciter: false,
          email_contact: "jeanluc@mail.com",
          nom_representant_legal: "DUPONT-DURAND",
          tel_representant_legal: "",
          tel2_representant_legal: "0610203040",
          id_formation: "50321405",
          libelle_court_formation: "CAPA JARDINIER PAYSAGISTE",
          libelle_long_formation: "JARDINIER PAYSAGISTE (CAPA)",
          uai_etablissement: "0011074M",
          nom_etablissement: "MFR DE BAGE LE CHATEL - 01380 BAGE LE CHATEL",
          statut_apprenant: 3,
          date_metier_mise_a_jour_statut: new Date("07/09/2020"),
          source: config.users.gesti.name,
        },
        {
          ine_apprenant: "",
          nom_apprenant: "",
          prenom_apprenant: "",
          prenom2_apprenant: "",
          prenom3_apprenant: "",
          ne_pas_solliciter: false,
          email_contact: "",
          nom_representant_legal: "",
          tel_representant_legal: "",
          tel2_representant_legal: "",
          id_formation: "",
          libelle_court_formation: "",
          libelle_long_formation: "",
          uai_etablissement: "",
          nom_etablissement: "MFR DE BAGE LE CHATEL - 01380 BAGE LE CHATEL",
          statut_apprenant: 3,
          date_metier_mise_a_jour_statut: "",
          source: config.users.gesti.name,
        },
        {},
      ];
      const expectedOutput = {
        valid: [input[0]],
        errors: 2,
      };
      assert.deepStrictEqual(validateInput(input), expectedOutput);
    });
  });
});
