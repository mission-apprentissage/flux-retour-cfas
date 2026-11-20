import { addJob } from "job-processor";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("job-processor", async (importOriginal) => ({
  ...(await importOriginal<typeof import("job-processor")>()),
  addJob: vi.fn(),
}));

vi.mock("@/common/mongodb", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/mongodb")>()),
  closeMongodbConnection: vi.fn(),
}));

vi.mock("@/common/services/sentry/sentry", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/services/sentry/sentry")>()),
  closeSentry: vi.fn(),
}));

describe("commande clear:queue-orphans", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("lit les options en nombres sans les tronquer", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    const { program } = await import("commander");
    await import("@/commands");

    await program.parseAsync(
      ["clear:queue-orphans", "--batch-size", "1e4", "--sleep-ms", "10k", "--nb-days-to-keep", "15"],
      { from: "user" }
    );

    expect(vi.mocked(addJob).mock.calls[0][0].payload).toEqual({
      batchSize: 10_000,
      sleepMs: Number.NaN,
      nbDaysToKeep: 15,
    });
  });
});
