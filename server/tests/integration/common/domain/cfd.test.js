const assert = require("assert").strict;
const { validateCfd } = require("../../../../src/common/domain/cfd");

describe("Domain CFD", () => {
  describe("validateCfd", () => {
    it("Vérifie qu'un cfd de valeur null est invalide", async () => {
      const input = null;
      const expectedOutput = false;
      assert.equal(validateCfd(input), expectedOutput);
    });
    it("Vérifie qu'un cfd de valeur undefined est invalide", async () => {
      const input = undefined;
      const expectedOutput = false;
      assert.equal(validateCfd(input), expectedOutput);
    });
    it("Vérifie qu'un cfd de valeur 0 est invalide", async () => {
      const input = 0;
      const expectedOutput = false;
      assert.equal(validateCfd(input), expectedOutput);
    });
    it("Vérifie qu'un cfd de valeur chaîne vide est invalide", async () => {
      const input = "";
      const expectedOutput = false;
      assert.equal(validateCfd(input), expectedOutput);
    });
    it("Vérifie qu'un cfd alphanumérique de longueur < 8 est invalide", async () => {
      const input = "abc123";
      const expectedOutput = false;
      assert.equal(validateCfd(input), expectedOutput);
    });
    it("Vérifie qu'un cfd alphanumérique de longueur > 8 est invalide", async () => {
      const input = "abc123456";
      const expectedOutput = false;
      assert.equal(validateCfd(input), expectedOutput);
    });
    it("Vérifie qu'un cfd contenant 8 nombres est valide", async () => {
      const input = "12345678";
      const expectedOutput = true;
      assert.equal(validateCfd(input), expectedOutput);
    });
    it("Vérifie qu'un cfd contenant 8 lettres est valide", async () => {
      const input = "abcdefgh";
      const expectedOutput = true;
      assert.equal(validateCfd(input), expectedOutput);
    });
    it("Vérifie qu'un cfd contenant 8 caractère alphanumériques est valide", async () => {
      const input = "abcd1234";
      const expectedOutput = true;
      assert.equal(validateCfd(input), expectedOutput);
    });
  });
});
