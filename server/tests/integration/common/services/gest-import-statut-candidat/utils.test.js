const assert = require("assert").strict;
const config = require("../../../../../config");
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
        id_formation: "50321405",
        libelle_court_formation: "CAPA JARDINIER PAYSAGISTE",
        libelle_long_formation: "JARDINIER PAYSAGISTE (CAPA)",
        uai_etablissement: "0011074M",
        siret_etablissement: "111 112 222.23333",
        nom_etablissement: "MFR DE BAGE LE CHATEL - 01380 BAGE LE CHATEL",
        statut_apprenant: "3",
        date_metier_mise_a_jour_statut: "07/09/2020",
        periode_formation: "2020-2021",
        annee_formation: "1",
        annee_scolaire: "2021-2022",
      };

      const expectedOutput = {
        ine_apprenant: "123456789AB",
        nom_apprenant: "DUPONT-DURAND",
        prenom_apprenant: "Jean-Luc",
        prenom2_apprenant: "Jacques",
        prenom3_apprenant: "Pierre",
        ne_pas_solliciter: false,
        email_contact: "jeanluc@mail.com",
        formation_cfd: "50321405",
        libelle_court_formation: "CAPA JARDINIER PAYSAGISTE",
        libelle_long_formation: "JARDINIER PAYSAGISTE (CAPA)",
        uai_etablissement: "0011074M",
        siret_etablissement: "11111222223333",
        nom_etablissement: "MFR DE BAGE LE CHATEL - 01380 BAGE LE CHATEL",
        statut_apprenant: 3,
        date_metier_mise_a_jour_statut: new Date(2020, 9, 7),
        source: config.users.gesti.name,
        periode_formation: [2020, 2021],
        annee_formation: 1,
        annee_scolaire: "2021-2022",
      };
      assert.deepEqual(adaptGestiStatutCandidat(gestiInput), expectedOutput);
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
        id_formation: "50321405",
        libelle_court_formation: "",
        libelle_long_formation: "",
        uai_etablissement: "0011074M",
        siret_etablissement: "",
        nom_etablissement: "MFR DE BAGE LE CHATEL - 01380 BAGE LE CHATEL",
        statut_apprenant: "3",
        date_metier_mise_a_jour_statut: "",
        annee_scolaire: "2022-2023",
      };

      const expectedOutput = {
        ine_apprenant: "",
        nom_apprenant: "DUPONT-DURAND",
        prenom_apprenant: "Jean-Luc",
        prenom2_apprenant: "",
        prenom3_apprenant: "",
        ne_pas_solliciter: true,
        email_contact: "",
        formation_cfd: "50321405",
        libelle_court_formation: "",
        libelle_long_formation: "",
        uai_etablissement: "0011074M",
        siret_etablissement: "",
        nom_etablissement: "MFR DE BAGE LE CHATEL - 01380 BAGE LE CHATEL",
        statut_apprenant: 3,
        date_metier_mise_a_jour_statut: "",
        source: config.users.gesti.name,
        periode_formation: null,
        annee_formation: null,
        annee_scolaire: "2022-2023",
      };
      assert.deepEqual(adaptGestiStatutCandidat(gestiInput), expectedOutput);
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
          formation_cfd: "50321405",
          libelle_court_formation: "CAPA JARDINIER PAYSAGISTE",
          libelle_long_formation: "JARDINIER PAYSAGISTE (CAPA)",
          uai_etablissement: "0011074M",
          siret_etablissement: "11111222223333",
          nom_etablissement: "MFR DE BAGE LE CHATEL - 01380 BAGE LE CHATEL",
          statut_apprenant: 3,
          date_metier_mise_a_jour_statut: new Date("07/09/2020"),
          source: config.users.gesti.name,
          annee_scolaire: "2022-2023",
        },
        {
          ine_apprenant: "",
          nom_apprenant: "DUPONT",
          prenom_apprenant: "Jean-Marc",
          prenom2_apprenant: "",
          prenom3_apprenant: "",
          ne_pas_solliciter: false,
          email_contact: "",
          formation_cfd: "50321405",
          libelle_court_formation: "",
          libelle_long_formation: "",
          uai_etablissement: "0011074M",
          siret_etablissement: "11111222223333",
          nom_etablissement: "MFR DE BAGE LE CHATEL - 01380 BAGE LE CHATEL",
          statut_apprenant: 3,
          date_metier_mise_a_jour_statut: "",
          source: config.users.gesti.name,
          annee_scolaire: "2021-2022",
        },
      ];
      const expectedOutput = {
        valid: input,
        errors: [],
      };
      assert.deepEqual(validateInput(input), expectedOutput);
    });
    it("Vérifie qu'un tableau avec statuts invalides est retourné filtré et avec erreurs", async () => {
      const adaptedInput = [
        {
          ine_apprenant: "123456789AB",
          nom_apprenant: "DUPONT-DURAND",
          prenom_apprenant: "Jean-Luc",
          prenom2_apprenant: "Jacques",
          prenom3_apprenant: "Pierre",
          ne_pas_solliciter: false,
          email_contact: "jeanluc@mail.com",
          formation_cfd: "50321405",
          libelle_court_formation: "CAPA JARDINIER PAYSAGISTE",
          libelle_long_formation: "JARDINIER PAYSAGISTE (CAPA)",
          uai_etablissement: "0011074M",
          siret_etablissement: "11111222223333",
          nom_etablissement: "MFR DE BAGE LE CHATEL - 01380 BAGE LE CHATEL",
          statut_apprenant: 3,
          date_metier_mise_a_jour_statut: new Date("07/09/2020"),
          source: config.users.gesti.name,
          annee_scolaire: "2022-2023",
        },
        {
          ine_apprenant: "",
          nom_apprenant: "",
          prenom_apprenant: "",
          prenom2_apprenant: "",
          prenom3_apprenant: "",
          ne_pas_solliciter: false,
          email_contact: "",
          formation_cfd: "",
          libelle_court_formation: "",
          libelle_long_formation: "",
          uai_etablissement: "",
          siret_etablissement: "",
          nom_etablissement: "MFR DE BAGE LE CHATEL - 01380 BAGE LE CHATEL",
          statut_apprenant: 3,
          date_metier_mise_a_jour_statut: "",
          source: config.users.gesti.name,
          annee_scolaire: "",
        },
        {},
      ];
      const output = validateInput(adaptedInput);
      assert.deepEqual(output.valid, [adaptedInput[0]]);
      assert.equal(output.errors.length, 2);

      // statutCandidat at index 1 has 5 missing fields: nom_apprenant, prenom_apprenant, formation_cfd, uai_etablissement, annee_scolaire
      const firstElementErrors = output.errors[0];
      assert.equal(firstElementErrors.index, 1);
      assert.equal(firstElementErrors.details.length, 5);
      assert.deepEqual(
        firstElementErrors.details.map((detail) => detail.path[0]),
        ["nom_apprenant", "prenom_apprenant", "uai_etablissement", "formation_cfd", "annee_scolaire"]
      );

      // statutCandidat at index 2 is empty
      const secondElementErrors = output.errors[1];
      assert.equal(secondElementErrors.index, 2);
      assert.equal(secondElementErrors.details.length, 8);
      assert.deepEqual(
        secondElementErrors.details.map((detail) => detail.path[0]),
        [
          "nom_apprenant",
          "prenom_apprenant",
          "uai_etablissement",
          "nom_etablissement",
          "formation_cfd",
          "statut_apprenant",
          "ne_pas_solliciter",
          "annee_scolaire",
        ]
      );
    });
  });
});
