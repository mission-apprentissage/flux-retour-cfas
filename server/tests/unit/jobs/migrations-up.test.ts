import { beforeEach, describe, expect, it, vi } from "vitest";

import { configureDbSchemaValidation } from "@/common/mongodb";
import { up } from "@/jobs/migrations/migrations";
import { dbMaintenanceJobs } from "@/jobs/registry/db-maintenance";

vi.mock("job-processor", () => ({ addJob: vi.fn() }));
vi.mock("@/common/mongodb", () => ({ configureDbSchemaValidation: vi.fn() }));
vi.mock("@/jobs/migrations/migrations", () => ({ up: vi.fn(), status: vi.fn(), create: vi.fn() }));

const runMigrationsUp = () => (dbMaintenanceJobs["migrations:up"].handler as () => Promise<unknown>)();

describe("migrations:up", () => {
  const steps: string[] = [];

  beforeEach(() => {
    steps.length = 0;
    vi.mocked(configureDbSchemaValidation).mockImplementation(async (_descriptors, options) => {
      steps.push(`validators:${options?.level}`);
    });
    vi.mocked(up).mockImplementation(async () => {
      steps.push("migrations");
    });
  });

  it("passe les validateurs en moderate avant les migrations et en strict après", async () => {
    await runMigrationsUp();

    expect(steps).toEqual(["validators:moderate", "migrations", "validators:strict"]);
  });

  it("laisse les validateurs en moderate quand une migration échoue", async () => {
    vi.mocked(up).mockRejectedValue(new Error("migration en échec"));

    await expect(runMigrationsUp()).rejects.toThrow("migration en échec");
    expect(steps).toEqual(["validators:moderate"]);
  });
});
