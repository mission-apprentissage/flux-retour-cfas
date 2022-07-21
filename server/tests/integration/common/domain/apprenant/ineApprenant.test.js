const assert = require("assert").strict;
const { validateIneApprenant } = require("../../../../../src/common/domain/apprenant/ineApprenant");

describe("Domain INE apprenant", () => {
  describe("validateIneApprenant", () => {
    it("Vérifie qu'un INE apprenant de valeur null est invalide", async () => {
      const input = null;
      const result = validateIneApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un INE apprenant de valeur '' est invalide", async () => {
      const input = "";
      const result = validateIneApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un INE apprenant de type boolean est invalide", async () => {
      const input = true;
      const result = validateIneApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un INE apprenant de type number est invalide", async () => {
      const input = 1234;
      const result = validateIneApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un INE apprenant de type string de moins de 11 caractères est invalide", async () => {
      const input = "123456789F";
      const result = validateIneApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un INE apprenant de type string de plus de 11 caractères est invalide", async () => {
      const input = "123456789FFF";
      const result = validateIneApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un INE apprenant de type string 11 caractères ne respectant pas un des formats est invalide", async () => {
      const input = "A123456789F";
      const result = validateIneApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un autre INE apprenant de type string 11 caractères ne respectant pas un des formats est invalide", async () => {
      const input = "1234X12345F";
      const result = validateIneApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un INE apprenant de type RNIE est valide", async () => {
      const input = "123456789FF";
      const result = validateIneApprenant(input);
      assert.equal(result.error, undefined);
    });
    it("Vérifie qu'un INE apprenant de type BEA est valide", async () => {
      const input = "1234567890F";
      const result = validateIneApprenant(input);
      assert.equal(result.error, undefined);
    });
    it("Vérifie qu'un INE apprenant de type APPRENTISSAGE est valide", async () => {
      const input = "1234A12345F";
      const result = validateIneApprenant(input);
      assert.equal(result.error, undefined);
    });
  });
});
