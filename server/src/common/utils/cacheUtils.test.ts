import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearCache, tryCachedExecution } from "./cacheUtils";

describe("tryCachedExecution", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ne recalcule pas avant l'expiration, puis recalcule après", async () => {
    const compute = vi.fn(async () => Date.now());

    const first = await tryCachedExecution("k", 1000, compute);
    vi.advanceTimersByTime(500);
    const second = await tryCachedExecution("k", 1000, compute);
    expect(second).toBe(first);
    expect(compute).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(600);
    await tryCachedExecution("k", 1000, compute);
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it("isole les clés", async () => {
    const compute = vi.fn(async () => 1);
    await tryCachedExecution("a", 1000, compute);
    await tryCachedExecution("b", 1000, compute);
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it("ne conserve pas un échec", async () => {
    const compute = vi.fn<() => Promise<number>>().mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce(42);

    await expect(tryCachedExecution("k", 1000, compute)).rejects.toThrow("boom");
    await expect(tryCachedExecution("k", 1000, compute)).resolves.toBe(42);
    expect(compute).toHaveBeenCalledTimes(2);
  });
});
