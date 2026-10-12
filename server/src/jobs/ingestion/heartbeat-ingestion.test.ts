import { describe, expect, it, vi, beforeEach } from "vitest";

import { effectifsQueueDb } from "@/common/model/collections";
import { reportDependencyHealth } from "@/common/services/sentry/reportOnce";

import { heartbeatIngestion } from "./heartbeat-ingestion";

vi.mock("@/common/model/collections", () => ({ effectifsQueueDb: vi.fn() }));
vi.mock("@/common/services/sentry/reportOnce", () => ({ reportDependencyHealth: vi.fn() }));

function queueReturning(docs: Array<{ created_at: Date }>) {
  const chain = {
    find: vi.fn(() => chain),
    sort: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    toArray: vi.fn(async () => docs),
  };
  vi.mocked(effectifsQueueDb).mockReturnValue(chain as never);
  return chain;
}

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000);

beforeEach(() => {
  vi.mocked(reportDependencyHealth).mockClear();
});

describe("heartbeatIngestion", () => {
  it("se tait quand la file est vide", async () => {
    queueReturning([]);

    await expect(heartbeatIngestion()).resolves.toBe(0);
    expect(reportDependencyHealth).toHaveBeenCalledWith("ingestion", true, expect.anything(), expect.anything());
  });

  // Sans trafic la nuit, un critère « rien traité depuis N minutes » alerterait à tort.
  it("se tait quand la file avance", async () => {
    queueReturning([{ created_at: minutesAgo(5) }]);

    await expect(heartbeatIngestion()).resolves.toBe(0);
    expect(reportDependencyHealth).toHaveBeenCalledWith("ingestion", true, expect.anything(), expect.anything());
  });

  it("signale quand le plus vieux document attend depuis plus de 30 minutes", async () => {
    queueReturning([{ created_at: minutesAgo(45) }]);

    await expect(heartbeatIngestion()).resolves.toBe(1);
    expect(reportDependencyHealth).toHaveBeenCalledWith(
      "ingestion",
      false,
      expect.objectContaining({ message: expect.stringContaining("45 minutes") }),
      expect.objectContaining({ tier: "oncall" })
    );
  });

  it("interroge la file sur les documents non traités, du plus ancien au plus récent", async () => {
    const chain = queueReturning([]);
    await heartbeatIngestion();

    expect(chain.find).toHaveBeenCalledWith({ processed_at: { $exists: false } }, { projection: { created_at: 1 } });
    expect(chain.sort).toHaveBeenCalledWith({ created_at: 1 });
    expect(chain.limit).toHaveBeenCalledWith(1);
  });
});
