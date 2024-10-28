import { strict as assert } from "assert";

import { spy } from "sinon";

import { sleep } from "@/common/utils/asyncUtils";
import { clearCache, tryCachedExecution } from "@/common/utils/cacheUtils";

describe("tryCachedExecution()", () => {
  beforeEach(() => {
    clearCache();
  });

  const fn1 = async () => {
    await sleep(100);
    return {
      obj: 1,
    };
  };
  const fn2 = async () => {
    await sleep(100);
    return {
      obj: 2,
    };
  };
  const obj1 = {
    obj: 1,
  };
  const obj2 = {
    obj: 2,
  };

  it("expiration works", async () => {
    const func = spy(fn1);

    assert.deepStrictEqual(await tryCachedExecution("1", 200, func), obj1);
    assert.deepStrictEqual(await tryCachedExecution("1", 200, func), obj1);
    assert.strictEqual(func.callCount, 1);

    // not expired yet
    await sleep(50);
    assert.deepStrictEqual(await tryCachedExecution("1", 200, func), obj1);
    assert.strictEqual(func.callCount, 1);

    // expiration
    await sleep(100);
    assert.deepStrictEqual(await tryCachedExecution("1", 200, func), obj1);
    assert.deepStrictEqual(await tryCachedExecution("1", 200, func), obj1);
    assert.strictEqual(func.callCount, 2);
  });

  it("multiple keys do not overlap", async () => {
    const func1 = spy(fn1);
    const func2 = spy(fn2);
    assert.deepStrictEqual(await tryCachedExecution("11", 1000, func1), obj1);
    assert.deepStrictEqual(await tryCachedExecution("22", 1000, func2), obj2);
    assert.deepStrictEqual(await tryCachedExecution("11", 1000, func1), obj1);
    assert.deepStrictEqual(await tryCachedExecution("22", 1000, func2), obj2);
    assert.strictEqual(func1.callCount, 1);
    assert.strictEqual(func2.callCount, 1);
  });
});
