import { strict as assert } from "assert";

import { it, describe } from "vitest";

import { generateRandomAlphanumericPhrase, stripEmptyFields } from "@/common/utils/miscUtils";

describe("generateRandomAlphanumericPhrase", () => {
  it("crée une chaîne de caractère aléatoire de longueur demandée", () => {
    const randomPhrase = generateRandomAlphanumericPhrase(13);
    assert.equal(randomPhrase.length, 13);
  });

  it("crée une chaîne de caractère aléatoire de longueur 20 lorsqu'aucun longueur n'est passée", () => {
    const randomPhrase = generateRandomAlphanumericPhrase();
    assert.equal(randomPhrase.length, 20);
  });

  it("crée une chaîne de caractère aléatoire ne contenant que des caractères alphanumériques", () => {
    const randomPhrase = generateRandomAlphanumericPhrase();
    assert.equal(/^[a-zA-Z0-9]*$/.test(randomPhrase), true);
  });
});

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
