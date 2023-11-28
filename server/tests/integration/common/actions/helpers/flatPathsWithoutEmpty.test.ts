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
});
