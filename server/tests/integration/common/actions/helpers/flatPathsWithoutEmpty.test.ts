import { it, expect, describe } from "vitest";

import { flatPathsWithoutEmpty } from "@/common/actions/effectifs.actions";

describe("flatPathsWithoutEmpty()", () => {
  it("should return an array of paths", () => {
    const paths = flatPathsWithoutEmpty({
      a: {
        b: {
          c: "c",
          d: "d",
        },
        e: "e",
      },
      f: "f",
    });
    expect(paths).toHaveLength(4);
    expect(paths).toEqual(["a.b.c", "a.b.d", "a.e", "f"]);
  });
  it("should not consider empty values", () => {
    const paths = flatPathsWithoutEmpty({
      a: {
        b: {
          c: "c",
          d: "d",
          h: "",
        },
        e: "e",
        i: null,
      },
      f: "f",
      g: undefined,
    });
    expect(paths).toHaveLength(4);
    expect(paths).toEqual(["a.b.c", "a.b.d", "a.e", "f"]);
  });
  it("should keep zero values", () => {
    const paths = flatPathsWithoutEmpty({
      a: {
        b: {
          c: "c",
          d: "d",
          h: 0,
        },
        e: "e",
        i: null,
      },
      f: "f",
      g: undefined,
    });
    expect(paths).toHaveLength(5);
    expect(paths).toEqual(["a.b.c", "a.b.d", "a.b.h", "a.e", "f"]);
  });
});
