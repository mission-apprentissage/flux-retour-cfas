import { ObjectId } from "mongodb";

import { mergeIgnoringNullPreferringNewArray } from "@/common/utils/mergeIgnoringNullPreferringNewArray";

describe("mergeIgnoringNullPreferringNewArray", () => {
  it("returns an empty object when given an empty object", async () => {
    const input: any = {};
    const expectedResult: any = {};
    const result = mergeIgnoringNullPreferringNewArray(input, {});

    expect(result).toStrictEqual(expectedResult);
  });

  it("returns an object merged by given key", async () => {
    const input: any = {
      id: 123,
      apples: 10,
    };
    const expectedResult = {
      id: 123,
      apples: 10,
      oranges: 3,
    };
    const result = mergeIgnoringNullPreferringNewArray(input, { oranges: 3 });

    expect(result).toStrictEqual(expectedResult);
  });

  it("should not merge null values", async () => {
    const input: any = {
      id: 123,
      apples: 10,
      kiwis: 90,
    };
    const expectedResult = {
      id: 123,
      apples: 10,
      oranges: 3,
      kiwis: 90,
    };
    const result = mergeIgnoringNullPreferringNewArray(input, { oranges: 3, apples: null, id: "", kiwis: undefined });

    expect(result).toStrictEqual(expectedResult);
  });

  it("should work with Date and ObjectId", async () => {
    const input: any = {
      id: 123,
      date: new Date("2021-09-28T04:05:47.647Z"),
      oid: new ObjectId("6152d7d3e6b5a5a5a5a5a5a5"),
    };
    const expectedResult = {
      id: 123,
      date: new Date("2025-09-28T04:05:47.647Z"),
      oid: new ObjectId("6152d7d3e6b5a5a5a5a5a5a5"),
    };
    const result = mergeIgnoringNullPreferringNewArray(input, {
      date: new Date("2025-09-28T04:05:47.647Z"),
    });

    expect(result).toStrictEqual(expectedResult);
  });

  it("shoud work with nested objects", async () => {
    const input: any = {
      id: 123,
      apples: 10,
      nested: {
        id: 123,
        apples: 10,
        kiwis: 90,
      },
    };
    const expectedResult = {
      id: 123,
      apples: 10,
      oranges: 3,
      nested: {
        id: 123,
        apples: 10,
        kiwis: 90,
        oranges: 3,
      },
    };
    const result = mergeIgnoringNullPreferringNewArray(input, { oranges: 3, nested: { oranges: 3 } });

    expect(result).toStrictEqual(expectedResult);
  });

  it("should not merge array and prefer new one", async () => {
    const input: any = {
      id: 123,
      apples: 10,
      nested: {
        fruits: ["apple", "kiwi"],
      },
    };
    const expectedResult = {
      id: 123,
      apples: 10,
      oranges: 3,
      nested: {
        fruits: ["orange"],
      },
    };
    const result = mergeIgnoringNullPreferringNewArray(input, { oranges: 3, nested: { fruits: ["orange"] } });

    expect(result).toStrictEqual(expectedResult);
  });
});
