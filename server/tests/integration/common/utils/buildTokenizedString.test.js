import { strict as assert } from 'assert';
import { buildTokenizedString } from '../../../../src/common/utils/buildTokenizedString';

describe("buildTokenizedString", () => {
  it('returns "" when given undefined', () => {
    const input = undefined;
    const expectedOutput = "";

    assert.equal(expectedOutput, buildTokenizedString(input));
  });

  it('returns "" when given ""', () => {
    const input = "";
    const expectedOutput = "";

    assert.equal(expectedOutput, buildTokenizedString(input));
  });

  it("returns tokens of size 1 when second parameter not passed", () => {
    const input = "hello";
    const expectedOutput = "h he hel hell hello";

    assert.equal(expectedOutput, buildTokenizedString(input));
  });

  it("returns tokens separated with spaces", () => {
    const input = "hello world";
    const expectedOutput = "hel hell hello wor worl world";

    assert.equal(expectedOutput, buildTokenizedString(input, 3));
  });

  it("returns full worlds shorter than given minimum size", () => {
    const input = "hello world";
    const expectedOutput = "hello world";

    assert.equal(expectedOutput, buildTokenizedString(input, 5));
  });
});
