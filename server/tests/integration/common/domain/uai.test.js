const assert = require("assert").strict;
const { validateUai, getDepartementCodeFromUai } = require("../../../../src/common/domain/uai");

describe("Domain UAI", () => {
  describe("validateUai", () => {
    it("Vérifie qu'un uai de valeur null est invalide", async () => {
      const input = null;
      const expectedOutput = false;
      assert.deepEqual(validateUai(input), expectedOutput);
    });
    it("Vérifie qu'un uai de valeur undefined est invalide", async () => {
      const input = undefined;
      const expectedOutput = false;
      assert.deepEqual(validateUai(input), expectedOutput);
    });
    it("Vérifie qu'un uai de valeur 0 est invalide", async () => {
      const input = 0;
      const expectedOutput = false;
      assert.deepEqual(validateUai(input), expectedOutput);
    });
    it("Vérifie qu'un uai de valeur chaîne vide est invalide", async () => {
      const input = "";
      const expectedOutput = false;
      assert.deepEqual(validateUai(input), expectedOutput);
    });
    it("Vérifie qu'un uai contenant uniquement des lettres est invalide", async () => {
      const input = "abcdefgh";
      const expectedOutput = false;
      assert.deepEqual(validateUai(input), expectedOutput);
    });
    it("Vérifie qu'un uai contenant uniquement des nombes est invalide", async () => {
      const input = "12345678";
      const expectedOutput = false;
      assert.deepEqual(validateUai(input), expectedOutput);
    });
    it("Vérifie qu'un uai respectant le format est valide", async () => {
      const input = "0000001S";
      const expectedOutput = true;
      assert.deepEqual(validateUai(input), expectedOutput);
    });
  });

  describe("getDepartementCodeFromUai", () => {
    it("Vérifie qu'on récupère le département 01 pour 0011074M", () => {
      const input = "0011074M";
      const expectedOutput = "01";
      assert.equal(getDepartementCodeFromUai(input), expectedOutput);
    });

    it("Vérifie qu'on récupère le département 77 pour 0772242U", () => {
      const input = "0772242U";
      const expectedOutput = "77";
      assert.equal(getDepartementCodeFromUai(input), expectedOutput);
    });

    it("Vérifie qu'on récupère le département 974 pour 9741681J", () => {
      const input = "9741681J";
      const expectedOutput = "974";
      assert.equal(getDepartementCodeFromUai(input), expectedOutput);
    });

    it("Vérifie que la fonction throw une erreur lorsqu'un uai invalide est passé", () => {
      const input = "abc";
      assert.throws(() => getDepartementCodeFromUai(input), new Error("invalid uai passed"));
    });
  });
});
