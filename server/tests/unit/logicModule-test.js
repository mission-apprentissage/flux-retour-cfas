/**
 * Example of unit testing a logic module
 */
const assert = require("assert");
const { getTestMessage, compare } = require("../../src/logic/logicModule");

describe(__filename, () => {
  it("Renvoi un message de test valide", () => {
    assert.strictEqual(getTestMessage("TEST"), "TEST Message");
  });

  it("Peut comparer 2 valeurs", () => {
    assert.strictEqual(compare(1, 2), false);
    assert.strictEqual(compare(2, 2), true);
  });
});
