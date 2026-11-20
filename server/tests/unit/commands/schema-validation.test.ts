import { startJobProcessor } from "job-processor";
import { afterEach, describe, expect, it, vi } from "vitest";

import { modelDescriptors } from "@/common/model/collections";
import { configureDbSchemaValidation } from "@/common/mongodb";
import createServer from "@/http/server";
import { startEffectifQueueProcessor } from "@/jobs/ingestion/process-ingestion";

vi.mock("job-processor", async (importOriginal) => ({
  ...(await importOriginal<typeof import("job-processor")>()),
  startJobProcessor: vi.fn(),
}));

vi.mock("@/common/mongodb", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/mongodb")>()),
  closeMongodbConnection: vi.fn(),
  configureDbSchemaValidation: vi.fn(),
}));

vi.mock("@/common/services/sentry/sentry", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/services/sentry/sentry")>()),
  closeSentry: vi.fn(),
}));

vi.mock("@/http/server", () => ({ default: vi.fn() }));

vi.mock("@/jobs/ingestion/process-ingestion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/jobs/ingestion/process-ingestion")>()),
  startEffectifQueueProcessor: vi.fn(),
}));

const STRICT_ON_START = { level: "strict", onIndexBuild: "warn" };

describe("validateurs posés au démarrage des services", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ["queue_processor:start", () => startEffectifQueueProcessor],
    ["job_processor:start", () => startJobProcessor],
  ])("%s pose les validateurs en strict avant de démarrer", async (command, started) => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    const { program } = await import("commander");
    await import("@/commands");

    await program.parseAsync([command], { from: "user" });

    expect(configureDbSchemaValidation).toHaveBeenCalledWith(modelDescriptors, STRICT_ON_START);
    expect(vi.mocked(configureDbSchemaValidation).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(started()).mock.invocationCallOrder[0]
    );
  });

  it("start pose les validateurs en strict avant de créer le serveur", async () => {
    vi.mocked(createServer).mockRejectedValue(new Error("arrêt du test"));
    const { program } = await import("commander");
    await import("@/commands");

    await expect(program.parseAsync(["start"], { from: "user" })).rejects.toThrow("arrêt du test");

    expect(configureDbSchemaValidation).toHaveBeenCalledWith(modelDescriptors, STRICT_ON_START);
    expect(vi.mocked(configureDbSchemaValidation).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(createServer).mock.invocationCallOrder[0]
    );
  });
});
