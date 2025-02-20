import { strict as assert } from "assert";

import { it, describe } from "vitest";

import { stripEmptyFields } from "@/common/utils/miscUtils";

describe("stripEmptyFields", () => {
  it('supprime les champs undefined, null, et "" à la racine et imbriqués', () => {
    const output = stripEmptyFields({
      a: 1,
      b: 2,
      c: 3,
      d: null,
      e: undefined,
      f: "",
      g: 0,
      h: false,
      i: [],
      j: [null, "", undefined],
      nested: {
        a: 1,
        b: undefined,
        c: [],
      },
    });
    assert.deepStrictEqual(output, {
      a: 1,
      b: 2,
      c: 3,
      g: 0,
      h: false,
      i: [],
      j: [null, "", undefined],
      nested: { a: 1, c: [] },
    });
  });
});
