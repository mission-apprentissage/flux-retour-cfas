const assert = require("assert").strict;
const { validateUai } = require("../../../../src/common/domain/uai");

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
});
