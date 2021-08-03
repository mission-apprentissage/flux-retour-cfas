const assert = require("assert").strict;
const { containsSubArray, countSubArrayInArray } = require("../../../../src/common/utils/subArrayUtils");

describe("containsSubArray", () => {
  it("returns false when passed array is not an array", () => {
    const array = 12;
    const subArray = [];
    const expectedOutput = false;

    assert.equal(expectedOutput, containsSubArray(array, subArray));
  });

  it("returns false when passed subarray is not an array", () => {
    const array = [];
    const subArray = true;
    const expectedOutput = false;

    assert.equal(expectedOutput, containsSubArray(array, subArray));
  });

  it("returns false when passed subarray is longer than array", () => {
    const array = [1, 2, 3];
    const subArray = [1, 2, 3, 4];
    const expectedOutput = false;

    assert.equal(expectedOutput, containsSubArray(array, subArray));
  });

  it("returns false when passed array does not subarray", () => {
    const array = [1, 2];
    const subArray = [1, 6];
    const expectedOutput = false;

    assert.equal(expectedOutput, containsSubArray(array, subArray));
  });

  const numbersArray = [1, 56, 20, 10, 45, 999, 25];
  [[1, 56, 20, 10, 45, 999, 25, 0], [12345], [null], ["1", "56"]].forEach((subArray) => {
    it(`returns false when array of numbers does not contain subarray ${JSON.stringify(subArray)}`, () => {
      const expectedOutput = false;
      assert.equal(expectedOutput, containsSubArray(numbersArray, subArray));
    });
  });

  [[20, 10, 45], [1], [1, 56], [1, 56, 20, 10, 45, 999, 25], [999, 25]].forEach((subArray) => {
    it(`returns true when array of numbers contains subarray ${JSON.stringify(subArray)}`, () => {
      const expectedOutput = true;
      assert.equal(expectedOutput, containsSubArray(numbersArray, subArray));
    });
  });

  const mixedArray = ["hello", true, null, 2, "world"];
  [[2], ["hello", true], [true, null, 2]].forEach((subArray) => {
    it(`returns true when array of mixed primitive types contains subarray ${JSON.stringify(subArray)}`, () => {
      const expectedOutput = true;
      assert.equal(expectedOutput, containsSubArray(mixedArray, subArray));
    });
  });
});

describe("countSubArrayInArray", () => {
  it("returns 0 when passed array is not an array", () => {
    const array = 12;
    const subArray = [];
    const expectedOutput = 0;

    assert.equal(expectedOutput, countSubArrayInArray(array, subArray));
  });

  it("returns 0 when passed subarray is not an array", () => {
    const array = [];
    const subArray = true;
    const expectedOutput = 0;

    assert.equal(expectedOutput, countSubArrayInArray(array, subArray));
  });

  it("returns 0 when passed subarray is longer than array", () => {
    const array = [1, 2, 3];
    const subArray = [1, 2, 3, 4];
    const expectedOutput = 0;

    assert.equal(expectedOutput, countSubArrayInArray(array, subArray));
  });

  it("returns 0 when passed array does not contain subarray", () => {
    const array = [1, 2];
    const subArray = [1, 6];
    const expectedOutput = 0;

    assert.equal(expectedOutput, countSubArrayInArray(array, subArray));
  });

  const numbersArray = [1, 56, 20, 10, 45, 999, 20, 10];

  [[1, 56, 20, 10, 45, 999, 20, 10, 25], [12345], [null], ["1", "56"]].forEach((subArray) => {
    it(`returns 0 when array of numbers does not contain subarray ${JSON.stringify(subArray)}`, () => {
      const expectedOutput = 0;
      assert.equal(expectedOutput, countSubArrayInArray(numbersArray, subArray));
    });
  });

  [[1, 56, 20], [1], [56, 20], [10, 45, 999], [999, 20], [1, 56, 20, 10, 45, 999, 20, 10]].forEach((subArray) => {
    it(`returns 1 when array of numbers contains 1 occurence of subarray ${JSON.stringify(subArray)}`, () => {
      const expectedOutput = 1;
      assert.equal(expectedOutput, countSubArrayInArray(numbersArray, subArray));
    });
  });

  [[20], [20, 10]].forEach((subArray) => {
    it(`returns 2 when array of numbers contains 2 occurences of subarray ${JSON.stringify(subArray)}`, () => {
      const expectedOutput = 2;
      assert.equal(expectedOutput, countSubArrayInArray(numbersArray, subArray));
    });
  });
});
