import { it, expect, describe } from "vitest";

import { sortAlphabeticallyBy } from "./sortAlphabetically";

describe("sortAlphabeticallyBy()", () => {
  it("sorts array by numeric item fields", () => {
    const array = [{ age: 21 }, { age: 15 }, { age: 60 }];
    expect(sortAlphabeticallyBy("age", array)).toEqual([{ age: 15 }, { age: 21 }, { age: 60 }]);
  });

  it("sorts array by string item fields", () => {
    const array = [{ firstName: "Margot" }, { firstName: "Jean" }, { firstName: "Marine" }];
    expect(sortAlphabeticallyBy("firstName", array)).toEqual([
      { firstName: "Jean" },
      { firstName: "Margot" },
      { firstName: "Marine" },
    ]);
  });

  it("sorts array by string item fields with non-trimmed values", () => {
    const array = [{ firstName: "b" }, { firstName: "a" }];
    expect(sortAlphabeticallyBy("firstName", array)).toEqual([{ firstName: "a" }, { firstName: "b" }]);
  });
});
