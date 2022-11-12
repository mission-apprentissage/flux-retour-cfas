import { strict as assert } from "assert";
import { validateIneApprenant } from "../../../../../src/common/domain/apprenant/ineApprenant.js";

describe("Domain INE apprenant", () => {
  describe("validateIneApprenant", () => {
    it("Vérifie qu'un INE apprenant de valeur null est invalide", () => {
      const input = null;
      const result = validateIneApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un INE apprenant de valeur '' est invalide", () => {
      const input = "";
      const result = validateIneApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un INE apprenant de type boolean est invalide", () => {
      const input = true;
      const result = validateIneApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un INE apprenant de type number est invalide", () => {
      const input = 1234;
      const result = validateIneApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un INE apprenant de type string de moins de 11 caractères est invalide", () => {
      const input = "123456789F";
      const result = validateIneApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un INE apprenant de type string de plus de 11 caractères est invalide", () => {
      const input = "123456789FFF";
      const result = validateIneApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un INE apprenant de type string 11 caractères ne respectant pas un des formats est invalide", () => {
      const input = "A123456789F";
      const result = validateIneApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un autre INE apprenant de type string 11 caractères ne respectant pas un des formats est invalide", () => {
      const input = "1234X12345F";
      const result = validateIneApprenant(input);
      assert.ok(result.error);
    });
    it("Vérifie qu'un INE apprenant de type RNIE est valide", () => {
      const input = "123456789FF";
      const result = validateIneApprenant(input);
      assert.equal(result.error, undefined);
    });
    it("Vérifie qu'un INE apprenant de type BEA est valide", () => {
      const input = "1234567890F";
      const result = validateIneApprenant(input);
      assert.equal(result.error, undefined);
    });
    it("Vérifie qu'un INE apprenant de type APPRENTISSAGE est valide", () => {
      const input = "1234A12345F";
      const result = validateIneApprenant(input);
      assert.equal(result.error, undefined);
    });
  });
});
