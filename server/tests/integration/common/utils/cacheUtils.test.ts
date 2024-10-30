import { strict as assert } from "assert";

import { vi, it, expect, describe, beforeEach } from "vitest";

import { sleep } from "@/common/utils/asyncUtils";
import { clearCache, tryCachedExecution } from "@/common/utils/cacheUtils";

describe("tryCachedExecution()", () => {
  beforeEach(() => {
    clearCache();
  });

  const obj1 = {
    obj: 1,
  };
  const obj2 = {
    obj: 2,
  };

  it("expiration works", async () => {
    const func = vi.fn();
    func.mockImplementation(async () => {
      await sleep(100);
      return {
        obj: 1,
      };
    });

    assert.deepStrictEqual(await tryCachedExecution("1", 200, func), obj1);
    assert.deepStrictEqual(await tryCachedExecution("1", 200, func), obj1);
    expect(func).toHaveBeenCalledTimes(1);

    // not expired yet
    await sleep(50);
    assert.deepStrictEqual(await tryCachedExecution("1", 200, func), obj1);
    expect(func).toHaveBeenCalledTimes(1);

    // expiration
    await sleep(100);
    assert.deepStrictEqual(await tryCachedExecution("1", 200, func), obj1);
    assert.deepStrictEqual(await tryCachedExecution("1", 200, func), obj1);
    expect(func).toHaveBeenCalledTimes(2);
  });

  it("multiple keys do not overlap", async () => {
    const func1 = vi.fn();
    func1.mockImplementation(async () => {
      await sleep(100);
      return {
        obj: 1,
      };
    });
    const func2 = vi.fn();
    func2.mockImplementation(async () => {
      await sleep(100);
      return {
        obj: 2,
      };
    });
    assert.deepStrictEqual(await tryCachedExecution("11", 1000, func1), obj1);
    assert.deepStrictEqual(await tryCachedExecution("22", 1000, func2), obj2);
    assert.deepStrictEqual(await tryCachedExecution("11", 1000, func1), obj1);
    assert.deepStrictEqual(await tryCachedExecution("22", 1000, func2), obj2);
    expect(func1).toHaveBeenCalledOnce();
    expect(func2).toHaveBeenCalledOnce();
  });
});
