import type { IJobsSimple } from "job-processor";
import { describe, expect, it } from "vitest";

import { effectifsJobs } from "@/jobs/registry/effectifs";

const lancer = (payload: Record<string, unknown>) =>
  effectifsJobs["effectifs:doublons-obsoletes"].handler({ payload } as unknown as IJobsSimple);

describe("effectifs:doublons-obsoletes", () => {
  it("refuse un seuil non numérique", async () => {
    await expect(lancer({ seuilJours: Number.NaN })).rejects.toThrow("Seuil invalide");
  });

  it("refuse un seuil négatif ou décimal", async () => {
    await expect(lancer({ seuilJours: -1 })).rejects.toThrow("Seuil invalide");
    await expect(lancer({ seuilJours: 7.5 })).rejects.toThrow("Seuil invalide");
  });

  it("refuse un seuil inférieur à 30 jours avec --appliquer", async () => {
    await expect(lancer({ seuilJours: 7, appliquer: true })).rejects.toThrow("minimum 30 jours");
  });
});
