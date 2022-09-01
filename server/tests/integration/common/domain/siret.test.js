const assert = require("assert").strict;
const { validateSiret } = require("../../../../src/common/domain/siret");

describe("Domain SIRET", () => {
  describe("validateSiret", () => {
    it("Vérifie qu'un siret de valeur null est invalide", () => {
      const input = null;
      const result = validateSiret(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un siret de valeur undefined est invalide", () => {
      const input = undefined;
      const result = validateSiret(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un siret de valeur 0 est invalide", () => {
      const input = 0;
      const result = validateSiret(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un siret de valeur chaîne vide est invalide", () => {
      const input = "";
      const result = validateSiret(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un siret contenant des lettres est invalide", () => {
      const input = "1223445660009A";
      const result = validateSiret(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un siret contenant uniquement des nombres mais de taille < à 14 est invalide", () => {
      const input = "0123456789";
      const result = validateSiret(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un siret contenant uniquement des nombres mais de taille > à 14 est invalide", () => {
      const input = "122344566000999";
      const result = validateSiret(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un siret respectant le format est valide", () => {
      const input = "12234456600099";
      const result = validateSiret(input);
      assert.equal(result.error, undefined);
    });
    it("Vérifie qu'un autre siret respectant le format est valide", () => {
      const input = "11111111100023";
      const result = validateSiret(input);
      assert.equal(result.error, undefined);
    });
  });
});
