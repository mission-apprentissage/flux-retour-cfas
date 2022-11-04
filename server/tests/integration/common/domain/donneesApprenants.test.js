const assert = require("assert").strict;
const { subDays, addMonths, addDays } = require("date-fns");
const {
  getValidationResult,
  DONNEES_APPRENANT_XLSX_FIELDS,
  getValidationResultFromList,
  getFormattedErrors,
} = require("../../../../src/common/domain/donneesApprenants.js");
const { toDonneesApprenantsFromXlsx } = require("../../../../src/common/model/mappers/donneesApprenantsMapper.js");
const {
  createRandomXlsxDonneesApprenant,
  createValidRandomXlsxDonneesApprenants,
} = require("../../../data/createRandomDonneesApprenants.js");

describe("Domain DonneesApprenants", () => {
  describe("validate", () => {
    it("Vérifie qu'une donnée apprenant de valeur null est invalide", () => {
      const input = null;
      const result = getValidationResult(input);
      assert.ok(result.error);
    });

    it("Vérifie qu'une donnée apprenant de valeur undefined est invalide", () => {
      const input = undefined;
      const result = getValidationResult(input);
      assert.ok(result.error);
    });

    it("Vérifie qu'une donnée apprenant de valeur objet vide est invalide", () => {
      const input = {};
      const result = getValidationResult(input);
      assert.ok(result.error);
    });

    it("Vérifie qu'une donnée apprenant random mappée sans données du user est invalide", () => {
      const input = createRandomXlsxDonneesApprenant();
      const mappedInput = toDonneesApprenantsFromXlsx(input);
      const result = getValidationResult(mappedInput);
      assert.ok(result.error);
    });

    it("Vérifie qu'une donnée apprenant random mappée avec données du user mais sans CFD est invalide", () => {
      const input = createRandomXlsxDonneesApprenant();
      const mappedInput = toDonneesApprenantsFromXlsx(input);
      const mappedInputWithoutCfd = { ...mappedInput, cfd: undefined };
      const userFields = {
        user_email: "test@test.fr",
        user_uai: "0000001X",
        user_siret: "00000000000002",
        user_nom_etablissement: "Super Etablissement",
      };
      const mappedInputWithUserFields = { ...mappedInputWithoutCfd, ...userFields };
      const result = getValidationResult(mappedInputWithUserFields);
      assert.ok(result.error);
    });

    it("Vérifie qu'une donnée apprenant random mappée avec données du user mais avec date de naissance invalide est invalide", () => {
      const paramWithDateDeNaissanceInvalid = {};
      paramWithDateDeNaissanceInvalid[DONNEES_APPRENANT_XLSX_FIELDS.DateDeNaissanceApprenant] = "2004-01-10";
      const input = createRandomXlsxDonneesApprenant(paramWithDateDeNaissanceInvalid);

      const userFields = {
        user_email: "test@test.fr",
        user_uai: "0000001X",
        user_siret: "00000000000002",
        user_nom_etablissement: "Super Etablissement",
      };
      const mappedInputWithUserFields = { ...toDonneesApprenantsFromXlsx(input), ...userFields };
      const result = getValidationResult(mappedInputWithUserFields);
      assert.ok(result.error);
    });

    it("Vérifie qu'une donnée apprenant random mappée avec données du user mais sans date d'inscription est invalide", () => {
      const input = createRandomXlsxDonneesApprenant();
      const userFields = {
        user_email: "test@test.fr",
        user_uai: "0000001X",
        user_siret: "00000000000002",
        user_nom_etablissement: "Super Etablissement",
      };
      const mappedData = { ...toDonneesApprenantsFromXlsx(input), ...userFields };
      delete mappedData.date_inscription;
      const result = getValidationResult(mappedData);
      assert.ok(result.error);
    });

    it("Vérifie qu'une donnée apprenant random mappée avec données du user avec date_debut_contrat mais sans date_fin_contrat est invalide", () => {
      const input = createRandomXlsxDonneesApprenant();

      const userFields = {
        user_email: "test@test.fr",
        user_uai: "0000001X",
        user_siret: "00000000000002",
        user_nom_etablissement: "Super Etablissement",
      };

      const mappedData = {
        ...toDonneesApprenantsFromXlsx(input),
        ...userFields,
        date_inscription: new Date(),
        date_debut_contrat: addDays(new Date(), 5),
      };

      delete mappedData.date_fin_contrat;
      delete mappedData.date_fin_formation;
      delete mappedData.date_rupture_contrat;
      delete mappedData.date_sortie_formation;

      const result = getValidationResult(mappedData);

      assert.ok(result.error);
      assert.equal(result.error.details[0].message, '"date_fin_contrat" is required');
    });

    it("Vérifie qu'une donnée apprenant random mappée avec données du user avec date_debut_contrat après la date_fin_contrat est invalide", () => {
      const input = createRandomXlsxDonneesApprenant();

      const userFields = {
        user_email: "test@test.fr",
        user_uai: "0000001X",
        user_siret: "00000000000002",
        user_nom_etablissement: "Super Etablissement",
      };

      const mappedData = {
        ...toDonneesApprenantsFromXlsx(input),
        ...userFields,
        date_inscription: new Date(),
        date_debut_contrat: new Date(),
        date_fin_contrat: subDays(new Date(), 2),
      };

      delete mappedData.date_fin_formation;
      delete mappedData.date_rupture_contrat;
      delete mappedData.date_sortie_formation;

      const result = getValidationResult(mappedData);

      assert.ok(result.error);
      assert.equal(result.error.details[0].message, '"date_fin_contrat" is not allowed');
    });

    it("Vérifie qu'une donnée apprenant random mappée avec données du user avec date_debut_contrat avant la date_fin_contrat est valide", () => {
      const input = createRandomXlsxDonneesApprenant();

      const userFields = {
        user_email: "test@test.fr",
        user_uai: "0000001X",
        user_siret: "00000000000002",
        user_nom_etablissement: "Super Etablissement",
      };

      const mappedData = {
        ...toDonneesApprenantsFromXlsx(input),
        ...userFields,
        date_inscription: new Date(),
        date_debut_contrat: addDays(new Date(), 5),
        date_fin_contrat: addMonths(new Date(), 12),
      };

      delete mappedData.date_fin_formation;
      delete mappedData.date_rupture_contrat;
      delete mappedData.date_sortie_formation;

      const result = getValidationResult(mappedData);

      assert.ok(!result.error);
    });

    it("Vérifie qu'une donnée apprenant random mappée avec données du user avec date_rupture_contrat mais sans date_debut_contrat est invalide", () => {
      const input = createRandomXlsxDonneesApprenant();

      const userFields = {
        user_email: "test@test.fr",
        user_uai: "0000001X",
        user_siret: "00000000000002",
        user_nom_etablissement: "Super Etablissement",
      };

      const mappedData = {
        ...toDonneesApprenantsFromXlsx(input),
        ...userFields,
        date_inscription: new Date(),
        date_rupture_contrat: addDays(new Date(), 6),
      };

      delete mappedData.date_debut_contrat;
      delete mappedData.date_fin_contrat;
      delete mappedData.date_fin_formation;
      delete mappedData.date_sortie_formation;

      const result = getValidationResult(mappedData);

      assert.ok(result.error);
      assert.equal(result.error?.details[0]?.message === '"date_debut_contrat" is required', true);
    });

    it("Vérifie qu'une donnée apprenant random mappée avec données du user avec date_rupture_contrat mais sans date_fin_contrat est invalide", () => {
      const input = createRandomXlsxDonneesApprenant();

      const userFields = {
        user_email: "test@test.fr",
        user_uai: "0000001X",
        user_siret: "00000000000002",
        user_nom_etablissement: "Super Etablissement",
      };

      const mappedData = {
        ...toDonneesApprenantsFromXlsx(input),
        ...userFields,
        date_inscription: new Date(),
        date_debut_contrat: addDays(new Date(), 10),
        date_rupture_contrat: addDays(new Date(), 20),
      };

      delete mappedData.date_fin_contrat;
      delete mappedData.date_fin_formation;
      delete mappedData.date_sortie_formation;

      const result = getValidationResult(mappedData);

      assert.ok(result.error);
      assert.equal(result.error?.details[0]?.message === '"date_fin_contrat" is required', true);
    });

    it("Vérifie qu'une donnée apprenant random mappée avec données du user avec date_rupture_contrat mais < date_inscription est invalide", () => {
      const input = createRandomXlsxDonneesApprenant();

      const userFields = {
        user_email: "test@test.fr",
        user_uai: "0000001X",
        user_siret: "00000000000002",
        user_nom_etablissement: "Super Etablissement",
      };

      const mappedData = {
        ...toDonneesApprenantsFromXlsx(input),
        ...userFields,
        date_inscription: new Date(),
        date_debut_contrat: addDays(new Date(), 5),
        date_fin_contrat: addMonths(new Date(), 12),
        date_rupture_contrat: subDays(new Date(), 10),
      };

      delete mappedData.date_fin_formation;
      delete mappedData.date_sortie_formation;

      const result = getValidationResult(mappedData);

      assert.ok(result.error);
      assert.equal(result.error?.details[0]?.message === '"date_rupture_contrat" is not allowed', true);
    });

    it("Vérifie qu'une donnée apprenant random mappée avec données du user avec date_rupture_contrat mais < date_debut_contrat est invalide", () => {
      const input = createRandomXlsxDonneesApprenant();

      const userFields = {
        user_email: "test@test.fr",
        user_uai: "0000001X",
        user_siret: "00000000000002",
        user_nom_etablissement: "Super Etablissement",
      };

      const mappedData = {
        ...toDonneesApprenantsFromXlsx(input),
        ...userFields,
        date_inscription: new Date(),
        date_debut_contrat: addDays(new Date(), 5),
        date_fin_contrat: addMonths(new Date(), 12),
        date_rupture_contrat: addDays(new Date(), 1),
      };

      delete mappedData.date_fin_formation;
      delete mappedData.date_sortie_formation;

      const result = getValidationResult(mappedData);

      assert.ok(result.error);
      assert.equal(result.error?.details[0]?.message === '"date_rupture_contrat" is not allowed', true);
    });

    it("Vérifie qu'une donnée apprenant random mappée avec données du user avec date_rupture_contrat mais > date_fin_contrat est invalide", () => {
      const input = createRandomXlsxDonneesApprenant();

      const userFields = {
        user_email: "test@test.fr",
        user_uai: "0000001X",
        user_siret: "00000000000002",
        user_nom_etablissement: "Super Etablissement",
      };

      const mappedData = {
        ...toDonneesApprenantsFromXlsx(input),
        ...userFields,
        date_inscription: new Date(),
        date_debut_contrat: addDays(new Date(), 5),
        date_fin_contrat: addMonths(new Date(), 12),
        date_rupture_contrat: addMonths(new Date(), 24),
      };

      delete mappedData.date_fin_formation;
      delete mappedData.date_sortie_formation;

      const result = getValidationResult(mappedData);

      assert.ok(result.error);
      assert.equal(result.error?.details[0]?.message === '"date_rupture_contrat" is not allowed', true);
    });

    it("Vérifie qu'une donnée apprenant random mappée avec données du user et date_sortie_formation mais sans date_rupture_contrat est invalide", () => {
      const input = createValidRandomXlsxDonneesApprenants();

      const userFields = {
        user_email: "test@test.fr",
        user_uai: "0000001X",
        user_siret: "00000000000002",
        user_nom_etablissement: "Super Etablissement",
      };

      const mappedData = {
        ...toDonneesApprenantsFromXlsx(input),
        ...userFields,
        date_inscription: new Date(),
        date_sortie_formation: addDays(new Date(), 5),
      };

      delete mappedData.date_rupture_contrat;
      delete mappedData.date_debut_contrat;
      delete mappedData.date_fin_contrat;
      delete mappedData.date_fin_formation;

      const result = getValidationResult(mappedData);

      assert.ok(result.error);
      assert.equal(result.error?.details[0]?.message === '"date_rupture_contrat" is required', true);
    });

    it("Vérifie qu'une donnée apprenant random mappée avec données du user et date_sortie_formation mais < date_inscription est invalide", () => {
      const input = createValidRandomXlsxDonneesApprenants();

      const userFields = {
        user_email: "test@test.fr",
        user_uai: "0000001X",
        user_siret: "00000000000002",
        user_nom_etablissement: "Super Etablissement",
      };

      const mappedData = {
        ...toDonneesApprenantsFromXlsx(input),
        ...userFields,
        date_inscription: new Date(),
        date_sortie_formation: subDays(new Date(), 5),
        date_rupture_contrat: subDays(new Date(), 5),
      };

      delete mappedData.date_debut_contrat;
      delete mappedData.date_fin_contrat;
      delete mappedData.date_fin_formation;

      const result = getValidationResult(mappedData);

      assert.ok(result.error);
      assert.equal(result.error?.details[0]?.message === '"date_sortie_formation" is not allowed', true);
    });

    it("Vérifie qu'une donnée apprenant random mappée avec données du user et date_sortie_formation mais < date_debut_contrat est invalide", () => {
      const input = createValidRandomXlsxDonneesApprenants();

      const userFields = {
        user_email: "test@test.fr",
        user_uai: "0000001X",
        user_siret: "00000000000002",
        user_nom_etablissement: "Super Etablissement",
      };

      const mappedData = {
        ...toDonneesApprenantsFromXlsx(input),
        ...userFields,
        date_inscription: new Date(),
        date_debut_contrat: addDays(new Date(), 2),
        date_fin_contrat: addMonths(new Date(), 12),
        date_sortie_formation: addDays(new Date(), 1),
        date_rupture_contrat: addDays(new Date(), 5),
      };

      delete mappedData.date_fin_formation;

      const result = getValidationResult(mappedData);

      assert.ok(result.error);
      assert.equal(result.error?.details[0]?.message === '"date_sortie_formation" is not allowed', true);
    });

    it("Vérifie qu'une donnée apprenant random mappée avec données du user est valide", () => {
      const input = createValidRandomXlsxDonneesApprenants();
      const mappedInput = toDonneesApprenantsFromXlsx(input);
      const userFields = {
        user_email: "test@test.fr",
        user_uai: "0000001X",
        user_siret: "00000000000002",
        user_nom_etablissement: "Super Etablissement",
      };
      const mappedInputWithUserFields = { ...mappedInput, ...userFields };
      const result = getValidationResult(mappedInputWithUserFields);
      assert.ok(!result.error);
    });
  });

  describe("getValidationResultFromList", () => {
    it("Vérifie qu'une liste contenant une donnée apprenants de valeur null est invalide", () => {
      const randomDonneeApprenant = createRandomXlsxDonneesApprenant();
      const input = [null, randomDonneeApprenant];
      const result = getValidationResultFromList(input);
      assert.ok(result.error);
    });

    it("Vérifie qu'une liste 10 données apprenants contenant des données apprenants sans cfd est invalide", () => {
      const randomList = [];

      for (let index = 0; index < 2; index++) {
        const mappedInput = toDonneesApprenantsFromXlsx(createValidRandomXlsxDonneesApprenants());
        const userFields = {
          user_email: "test@test.fr",
          user_uai: "0000001X",
          user_siret: "00000000000002",
          user_nom_etablissement: "Super Etablissement",
        };
        const mappedInputWithUserFieldsAndBadCfd = { ...mappedInput, ...userFields, cfd: undefined };
        randomList.push(mappedInputWithUserFieldsAndBadCfd);
      }

      for (let index = 0; index < 8; index++) {
        const mappedInput = toDonneesApprenantsFromXlsx(createValidRandomXlsxDonneesApprenants());
        const userFields = {
          user_email: "test@test.fr",
          user_uai: "0000001X",
          user_siret: "00000000000002",
          user_nom_etablissement: "Super Etablissement",
        };
        const mappedInputWithUserFields = { ...mappedInput, ...userFields };
        randomList.push(mappedInputWithUserFields);
      }

      const result = getValidationResultFromList(randomList);

      assert.ok(result.error);
      assert.ok(result.error.details.length === 2, true);
      assert.ok(result.error.details[0]?.context?.key === "cfd", true);
      assert.ok(result.error.details[1]?.context?.key === "cfd", true);
    });

    it("Vérifie qu'une liste 10 données apprenants contenant des données apprenants sans date d'inscription est invalide", () => {
      const randomList = [];

      for (let index = 0; index < 2; index++) {
        const mappedInput = toDonneesApprenantsFromXlsx(createValidRandomXlsxDonneesApprenants());
        const userFields = {
          user_email: "test@test.fr",
          user_uai: "0000001X",
          user_siret: "00000000000002",
          user_nom_etablissement: "Super Etablissement",
        };
        const mappedInputWithUserFieldsAndBadCfd = { ...mappedInput, ...userFields, date_inscription: undefined };
        randomList.push(mappedInputWithUserFieldsAndBadCfd);
      }

      for (let index = 0; index < 8; index++) {
        const mappedInput = toDonneesApprenantsFromXlsx(createValidRandomXlsxDonneesApprenants());
        const userFields = {
          user_email: "test@test.fr",
          user_uai: "0000001X",
          user_siret: "00000000000002",
          user_nom_etablissement: "Super Etablissement",
        };
        const mappedInputWithUserFields = { ...mappedInput, ...userFields };
        randomList.push(mappedInputWithUserFields);
      }

      const result = getValidationResultFromList(randomList);

      assert.ok(result.error);
      assert.ok(result.error.details.length === 2, true);
      assert.ok(result.error.details[0]?.context?.key === "date_inscription", true);
      assert.ok(result.error.details[1]?.context?.key === "date_inscription", true);
    });

    it("Vérifie qu'une liste de données apprenants au bon format est valide", () => {
      const randomList = [];

      for (let index = 0; index < 10; index++) {
        const mappedInput = toDonneesApprenantsFromXlsx(createValidRandomXlsxDonneesApprenants());
        const userFields = {
          user_email: "test@test.fr",
          user_uai: "0000001X",
          user_siret: "00000000000002",
          user_nom_etablissement: "Super Etablissement",
        };
        const mappedInputWithUserFields = { ...mappedInput, ...userFields };
        randomList.push(mappedInputWithUserFields);
      }

      const result = getValidationResultFromList(randomList);
      assert.ok(!result.error);
    });
  });

  describe("getFormattedErrors", () => {
    it("Vérifie qu'une liste de données apprenants contenant des données apprenants avec cfd au mauvais format est invalide", () => {
      const randomList = [];

      for (let index = 0; index < 2; index++) {
        const mappedInput = toDonneesApprenantsFromXlsx(createValidRandomXlsxDonneesApprenants());
        const userFields = {
          user_email: "test@test.fr",
          user_uai: "0000001X",
          user_siret: "00000000000002",
          user_nom_etablissement: "Super Etablissement",
        };
        const mappedInputWithUserFieldsAndBadCfd = {
          ...mappedInput,
          ...userFields,
          cfd: 123,
        };
        randomList.push(mappedInputWithUserFieldsAndBadCfd);
      }

      for (let index = 0; index < 8; index++) {
        const mappedInput = toDonneesApprenantsFromXlsx(createValidRandomXlsxDonneesApprenants());
        const userFields = {
          user_email: "test@test.fr",
          user_uai: "0000001X",
          user_siret: "00000000000002",
          user_nom_etablissement: "Super Etablissement",
        };
        const mappedInputWithUserFields = { ...mappedInput, ...userFields };
        randomList.push(mappedInputWithUserFields);
      }

      const result = getValidationResultFromList(randomList);
      assert.ok(result.error);

      const errorsByFields = getFormattedErrors(result.error);

      assert.ok(errorsByFields.length === 1, true);
      assert.ok(errorsByFields[0].errorField === "cfd", true);
      assert.ok(errorsByFields[0].errorsForField.length === 2, true);

      assert.ok(errorsByFields[0].errorsForField[0]?.type === "string.base", true);
      assert.ok(errorsByFields[0].errorsForField[1]?.type === "string.base", true);
    });

    it("Vérifie qu'une liste de données apprenants contenant des données apprenants sans cfd et avec date de naissance au mauvais format est invalide", () => {
      const randomList = [];

      for (let index = 0; index < 2; index++) {
        const mappedInput = toDonneesApprenantsFromXlsx(createValidRandomXlsxDonneesApprenants());
        const userFields = {
          user_email: "test@test.fr",
          user_uai: "0000001X",
          user_siret: "00000000000002",
          user_nom_etablissement: "Super Etablissement",
        };
        const mappedInputWithUserFieldsAndBadCfdAndBadBirthDate = {
          ...mappedInput,
          ...userFields,
          cfd: undefined,
          date_de_naissance_apprenant: 123,
        };
        randomList.push(mappedInputWithUserFieldsAndBadCfdAndBadBirthDate);
      }

      for (let index = 0; index < 8; index++) {
        const mappedInput = toDonneesApprenantsFromXlsx(createValidRandomXlsxDonneesApprenants());
        const userFields = {
          user_email: "test@test.fr",
          user_uai: "0000001X",
          user_siret: "00000000000002",
          user_nom_etablissement: "Super Etablissement",
        };
        const mappedInputWithUserFields = { ...mappedInput, ...userFields };
        randomList.push(mappedInputWithUserFields);
      }

      const result = getValidationResultFromList(randomList);
      assert.ok(result.error);

      const errorsByFields = getFormattedErrors(result.error);
      assert.ok(errorsByFields.length === 2, true);

      assert.ok(errorsByFields[0].errorField === "cfd", true);
      assert.ok(errorsByFields[0].errorsForField.length === 2, true);
      assert.ok(errorsByFields[0].errorsForField[0]?.type === "any.required", true);
      assert.ok(errorsByFields[0].errorsForField[1]?.type === "any.required", true);

      assert.ok(errorsByFields[1].errorField === "date_de_naissance_apprenant", true);
      assert.ok(errorsByFields[1].errorsForField.length === 2, true);
      assert.ok(errorsByFields[1].errorsForField[0]?.type === "date.base", true);
      assert.ok(errorsByFields[1].errorsForField[1]?.type === "date.base", true);
    });

    it("Vérifie qu'une liste de données apprenants contenant des données apprenants avec date de début de contrat mais sans date fin contrat est invalide", () => {
      const randomList = [];

      for (let index = 0; index < 3; index++) {
        const mappedInput = toDonneesApprenantsFromXlsx(createValidRandomXlsxDonneesApprenants());
        const userFields = {
          user_email: "test@test.fr",
          user_uai: "0000001X",
          user_siret: "00000000000002",
          user_nom_etablissement: "Super Etablissement",
        };
        const mappedInputWithUserFieldsAndBadCfdAndBadBirthDate = {
          ...mappedInput,
          ...userFields,
          date_debut_contrat: new Date(),
          date_fin_contrat: undefined,
        };
        randomList.push(mappedInputWithUserFieldsAndBadCfdAndBadBirthDate);
      }

      const result = getValidationResultFromList(randomList);
      assert.ok(result.error);

      const errorsByFields = getFormattedErrors(result.error);
      assert.ok(errorsByFields.length === 1, true);

      assert.ok(errorsByFields[0].errorField === "date_fin_contrat", true);
      assert.ok(errorsByFields[0].errorsForField.length === 3, true);
      assert.ok(errorsByFields[0].errorsForField[0]?.type === "any.required", true);
      assert.ok(errorsByFields[0].errorsForField[1]?.type === "any.required", true);
      assert.ok(errorsByFields[0].errorsForField[2]?.type === "any.required", true);
    });
  });
});
