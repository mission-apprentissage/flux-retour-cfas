import { strict as assert } from 'assert';
import { validateCfd } from '../../../../src/common/domain/cfd';

describe("Domain CFD", () => {
  describe("validateCfd", () => {
    it("Vérifie qu'un cfd de valeur null est invalide", () => {
      const input = null;
      const expectedOutput = false;
      assert.equal(validateCfd(input), expectedOutput);
    });
    it("Vérifie qu'un cfd de valeur undefined est invalide", () => {
      const input = undefined;
      const expectedOutput = false;
      assert.equal(validateCfd(input), expectedOutput);
    });
    it("Vérifie qu'un cfd de valeur 0 est invalide", () => {
      const input = 0;
      const expectedOutput = false;
      assert.equal(validateCfd(input), expectedOutput);
    });
    it("Vérifie qu'un cfd de valeur chaîne vide est invalide", () => {
      const input = "";
      const expectedOutput = false;
      assert.equal(validateCfd(input), expectedOutput);
    });
    it("Vérifie qu'un cfd alphanumérique de longueur < 8 est invalide", () => {
      const input = "abc123";
      const expectedOutput = false;
      assert.equal(validateCfd(input), expectedOutput);
    });
    it("Vérifie qu'un cfd alphanumérique de longueur > 8 est invalide", () => {
      const input = "abc123456";
      const expectedOutput = false;
      assert.equal(validateCfd(input), expectedOutput);
    });
    it("Vérifie qu'un cfd contenant 8 nombres est valide", () => {
      const input = "12345678";
      const expectedOutput = true;
      assert.equal(validateCfd(input), expectedOutput);
    });
    it("Vérifie qu'un cfd contenant 8 lettres est valide", () => {
      const input = "abcdefgh";
      const expectedOutput = true;
      assert.equal(validateCfd(input), expectedOutput);
    });
    it("Vérifie qu'un cfd contenant 8 caractère alphanumériques est valide", () => {
      const input = "abcd1234";
      const expectedOutput = true;
      assert.equal(validateCfd(input), expectedOutput);
    });
  });
});
