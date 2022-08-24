const assert = require("assert").strict;
const { validateStatutApprenant } = require("../../../../../src/common/domain/apprenant/statutApprenant");

describe("Domain statut apprenant", () => {
  describe("validateStatutApprenant", () => {
    it("Vérifie qu'un statut apprenant de valeur null est invalide", () => {
      const input = null;
      const expectedOutput = false;
      assert.equal(validateStatutApprenant(input), expectedOutput);
    });

    it("Vérifie qu'un statut apprenant de valeur 0 est valide", () => {
      const input = 0;
      const expectedOutput = true;
      assert.equal(validateStatutApprenant(input), expectedOutput);
    });

    it("Vérifie qu'un statut apprenant de valeur 1 est invalide", () => {
      const input = 1;
      const expectedOutput = false;
      assert.equal(validateStatutApprenant(input), expectedOutput);
    });

    it("Vérifie qu'un statut apprenant de valeur 2 est valide", () => {
      const input = 2;
      const expectedOutput = true;
      assert.equal(validateStatutApprenant(input), expectedOutput);
    });

    it("Vérifie qu'un statut apprenant de valeur 3 est valide", () => {
      const input = 3;
      const expectedOutput = true;
      assert.equal(validateStatutApprenant(input), expectedOutput);
    });

    it("Vérifie qu'un statut apprenant de valeur 99 est invalide", () => {
      const input = 99;
      const expectedOutput = false;
      assert.equal(validateStatutApprenant(input), expectedOutput);
    });

    it("Vérifie qu'un statut apprenant de valeur string '0' est invalide", () => {
      const input = "0";
      const expectedOutput = false;
      assert.equal(validateStatutApprenant(input), expectedOutput);
    });

    it("Vérifie qu'un statut apprenant de valeur string '3' est invalide", () => {
      const input = "3";
      const expectedOutput = false;
      assert.equal(validateStatutApprenant(input), expectedOutput);
    });
  });
});
