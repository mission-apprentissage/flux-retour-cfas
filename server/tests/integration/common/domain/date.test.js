const assert = require("assert").strict;
const { parseFormattedDate } = require("../../../../src/common/domain/date.js");

describe("Domain Date", () => {
  describe("parseFormattedDate", () => {
    it("Vérifie qu'on ne peut pas formatter une date vide", () => {
      const input = null;
      const result = parseFormattedDate(input);
      assert.equal(result === null, true);
    });

    it("Vérifie qu'on ne peut pas formatter une date invalide", () => {
      const input = 23;
      const result = parseFormattedDate(input);
      assert.equal(new Date(result).toString() === "Invalid Date", true);
    });
  });
});
