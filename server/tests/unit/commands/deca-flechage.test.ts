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

describe("commande deca:flechage", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("met le job en file, sauf en --dry-run", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    const { program } = await import("commander");
    await import("@/commands");

    await program.parseAsync(["deca:flechage", "--organisme", "13002374000439"], { from: "user" });
    await program.parseAsync(["deca:flechage", "--dry-run"], { from: "user" });

    expect(vi.mocked(addJob).mock.calls.map(([job]) => ({ name: job.name, queued: job.queued }))).toEqual([
      { name: "deca:flechage", queued: true },
      { name: "deca:flechage", queued: false },
    ]);
  });
});
