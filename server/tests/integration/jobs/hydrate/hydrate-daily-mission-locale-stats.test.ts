import { ObjectId } from "bson";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as statsActions from "@/common/actions/mission-locale/mission-locale-stats.actions";
import { listUtcDays } from "@/common/actions/mission-locale/mission-locale-stats.helpers";
import * as collectionsModule from "@/common/model/collections";
import { organisationsDb } from "@/common/model/collections";
import { hydrateDailyMissionLocaleStats } from "@/jobs/hydrate/mission-locale/hydrate-mission-locale";
import { useMongo } from "@tests/jest/setupMongo";

const premierDossier = new Date(Date.now() - 2 * 86_400_000);

const insererMl = (ml_id: number) =>
  organisationsDb().insertOne({
    _id: new ObjectId(),
    type: "MISSION_LOCALE",
    nom: `ML ${ml_id}`,
    created_at: new Date(),
    ml_id,
    email: "",
    telephone: "",
    site_web: "",
  });

describe("hydrateDailyMissionLocaleStats", () => {
  useMongo();

  let calculs: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    calculs = vi.spyOn(statsActions, "createMissionLocaleStatsIfMissing").mockResolvedValue(true);
    vi.spyOn(collectionsModule, "missionLocaleEffectifsDb").mockImplementation(
      () =>
        ({ findOne: async () => ({ created_at: premierDossier }) }) as unknown as ReturnType<
          typeof collectionsModule.missionLocaleEffectifsDb
        >
    );
    await insererMl(1);
    await insererMl(2);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("crée la photo absente de chaque ML pour chaque jour depuis le premier dossier", async () => {
    await hydrateDailyMissionLocaleStats();

    expect(calculs).toHaveBeenCalledTimes(2 * listUtcDays(premierDossier, new Date()).length);
  });

  it("va au bout puis lève en comptant les calculs en échec", async () => {
    calculs.mockRejectedValueOnce(new Error("calcul impossible"));

    await expect(hydrateDailyMissionLocaleStats()).rejects.toThrow(
      "1 daily mission locale stats computation(s) failed"
    );

    expect(calculs).toHaveBeenCalledTimes(2 * listUtcDays(premierDossier, new Date()).length);
  });
});
