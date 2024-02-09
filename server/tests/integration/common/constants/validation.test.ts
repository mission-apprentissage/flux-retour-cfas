import { DERNIER_ORGANISME_UAI_REGEX } from "shared";

describe("Regex DERNIER_ORGANISME_UAI_REGEX", () => {
  describe("Cas valides", () => {
    const validValues = [
      "44",
      "044",
      "95",
      "095",
      "2B",
      "02B",
      "972",
      "986",
      "990",
      "991",
      "993",
      "995",
      "0802004U",
      "4422672E",
      "0755805C",
    ];

    it.each(validValues)('"%s" devrait être valide', (value) => {
      expect(DERNIER_ORGANISME_UAI_REGEX.test(value)).toBeTruthy();
    });
  });
  describe("Cas invalides", () => {
    const invalidValues = ["123", "ABC", "97Z", "9865", "9900", "99123", "ABCD", "1234567890", "0X0X0X"];

    it.each(invalidValues)('"%s" devrait être invalide', (value) => {
      expect(DERNIER_ORGANISME_UAI_REGEX.test(value)).toBeFalsy();
    });
  });
});
