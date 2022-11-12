import { strict as assert } from "assert";
import { escapeRegExp } from "../../../../src/common/utils/regexUtils.js";

describe("escapeRegExp", () => {
  it("returns string with ambiguous chars escaped", () => {
    const input = ".hello ( * $ ^";
    const expectedOutput = `\\.hello \\( \\* \\$ \\^`;

    assert.equal(escapeRegExp(input), expectedOutput);
  });

  it("returns string with ambiguous chars escaped (simpler case)", () => {
    const input = "HELLO**";
    const expectedOutput = `HELLO\\*\\*`;

    assert.equal(escapeRegExp(input), expectedOutput);
  });

  it("returns string with ambiguous chars escaped (another case)", () => {
    const input = "ABADIE (R)";
    const expectedOutput = `ABADIE \\(R\\)`;

    assert.equal(escapeRegExp(input), expectedOutput);
  });
});
