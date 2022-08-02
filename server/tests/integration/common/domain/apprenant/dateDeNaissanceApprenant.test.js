const {
  validateDateDeNaissanceApprenant,
} = require("../../../../../src/common/domain/apprenant/dateDeNaissanceApprenant");

const assert = require("assert").strict;

describe("Domain date de naissance apprenant", () => {
  describe("validateDateDeNaissanceApprenant", () => {
    it("Vérifie qu'une date de naissance d'apprenant de valeur null est invalide", async () => {
      const input = null;
      const result = validateDateDeNaissanceApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'une date de naissance d'apprenant de valeur '' est invalide", async () => {
      const input = "";
      const result = validateDateDeNaissanceApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'une date de naissance d'apprenant de type boolean est invalide", async () => {
      const input = true;
      const result = validateDateDeNaissanceApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'une date de naissance d'apprenant de type number est invalide", async () => {
      const input = 1234;
      const result = validateDateDeNaissanceApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'une date de naissance d'apprenant de type date string non ISO8601 est invalide", async () => {
      const input = "16-08-2022";
      const result = validateDateDeNaissanceApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'une date de naissance d'apprenant de type date string ISO8601 avec seulement année est invalide", async () => {
      const input = "2022";
      const result = validateDateDeNaissanceApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'une date de naissance d'apprenant de type date string ISO8601 avec seulement mois est invalide", async () => {
      const input = "2022-01";
      const result = validateDateDeNaissanceApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'une date de naissance d'apprenant de type date string ISO8601 incomplète est invalide", async () => {
      const input = "2022-01-0";
      const result = validateDateDeNaissanceApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'une date de naissance d'apprenant de type string de bonne longueur mais date invalide est invalide", async () => {
      const input = "2022-20-20";
      const result = validateDateDeNaissanceApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'une date de naissance d'apprenant de type date string ISO8601 YYYY-MM-DD est valide", async () => {
      const input = "2021-12-01";
      const result = validateDateDeNaissanceApprenant(input);
      assert.equal(result.error, undefined);
    });
    it("Vérifie qu'une date de naissance d'apprenant de type date string ISO8601 YYYY-MM-DDThh:mm est valide", async () => {
      const input = "2021-12-01T13:00";
      const result = validateDateDeNaissanceApprenant(input);
      assert.equal(result.error, undefined);
    });
    it("Vérifie qu'une date de naissance d'apprenant de type date string ISO8601 YYYY-MM-DDThh:mm:ss est valide", async () => {
      const input = "2021-12-01T13:15:24";
      const result = validateDateDeNaissanceApprenant(input);
      assert.equal(result.error, undefined);
    });
    it("Vérifie qu'une date de naissance d'apprenant de type date string ISO8601 YYYY-MM-DDThh:mm:ssZ est valide", async () => {
      const input = "2021-12-01T13:15:24Z";
      const result = validateDateDeNaissanceApprenant(input);
      assert.equal(result.error, undefined);
    });
    it("Vérifie qu'une date de naissance d'apprenant de type date string ISO8601 YYYY-MM-DDThh:mm:ss.SSS est valide", async () => {
      const input = "2021-12-01T13:15:24.123";
      const result = validateDateDeNaissanceApprenant(input);
      assert.equal(result.error, undefined);
    });
    it("Vérifie qu'une date de naissance d'apprenant de type date string ISO8601 YYYY-MM-DDThh:mm:ss.SSSZ est valide", async () => {
      const input = "2021-12-01T13:15:24.999Z";
      const result = validateDateDeNaissanceApprenant(input);
      assert.equal(result.error, undefined);
    });
  });
});
