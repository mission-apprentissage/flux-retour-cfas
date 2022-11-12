import { strict as assert } from 'assert';
import { mergeObjectsBy } from '../../../../src/common/utils/mergeObjectsBy';

describe("mergeObjectsBy", () => {
  it("returns an empty array when given an empty array", async () => {
    const input = [];
    const expectedResult = [];
    const result = mergeObjectsBy(input, "id");

    assert.deepEqual(result, expectedResult);
  });

  it("returns an array of objects merged by given key", async () => {
    const input = [
      { id: 123, apples: 10 },
      { id: 123, oranges: 3 },
      { id: 456, apples: 0 },
      { id: 456, oranges: 10 },
      { id: 789, potatoes: 1 },
    ];
    const expectedResult = [
      { id: 123, apples: 10, oranges: 3 },
      { id: 456, apples: 0, oranges: 10 },
      { id: 789, potatoes: 1 },
    ];
    const result = mergeObjectsBy(input, "id");

    assert.deepEqual(result, expectedResult);
  });

  it("returns an array of objects merged by given key when key value is an object", async () => {
    const id1 = { season: "summer", zone: "europe" };
    const id2 = { season: "winter", zone: "europe" };
    const input = [
      { id: id1, apples: 10 },
      { id: id1, oranges: 3 },
      { id: id2, apples: 0 },
      { id: id2, oranges: 10 },
    ];
    const expectedResult = [
      { id: id1, apples: 10, oranges: 3 },
      { id: id2, apples: 0, oranges: 10 },
    ];
    const result = mergeObjectsBy(input, "id");

    assert.deepEqual(result, expectedResult);
  });

  it("returns an array of objects merged by given key with last encountered key overriding previous ones", async () => {
    const input = [
      { id: 123, apples: 10 },
      { id: 123, apples: 10, oranges: 3 },
      { id: 123, apples: 8, oranges: 2, mango: 5 },
    ];
    const expectedResult = [{ id: 123, apples: 8, oranges: 2, mango: 5 }];
    const result = mergeObjectsBy(input, "id");

    assert.deepEqual(result, expectedResult);
  });

  it("returns an array of objects with every object merged when given key does not exist", async () => {
    const input = [
      { id: 123, apples: 10 },
      { id: 123, oranges: 3 },
      { id: 456, apples: 0 },
      { id: 456, oranges: 10 },
      { id: 789, potatoes: 1 },
    ];
    const expectedResult = [{ id: 789, apples: 0, oranges: 10, potatoes: 1 }];
    const result = mergeObjectsBy(input, "hello");

    // Check unique length
    assert.deepEqual(result, expectedResult);
  });
});
