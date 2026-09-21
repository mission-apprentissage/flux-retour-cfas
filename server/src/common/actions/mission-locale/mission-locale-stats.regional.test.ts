import { ObjectId } from "bson";
import type { IOrganisation } from "shared/models/data/organisations.model";
import { beforeEach, describe, expect, it } from "vitest";

import { missionLocaleStatsDb, organisationsDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { getRegionalStats } from "./mission-locale-stats.actions";

useMongo();

const ML_ENGAGEE = new ObjectId();
const ML_PASSIVE = new ObjectId();
const ML_INACTIVE = new ObjectId();

const daysAgo = (n: number) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};

const insertStats = async (missionLocaleId: ObjectId, computedDay: Date, stats: Record<string, number>) => {
  await missionLocaleStatsDb().insertOne(
    {
      _id: new ObjectId(),
      mission_locale_id: missionLocaleId,
      computed_day: computedDay,
      created_at: new Date(),
      updated_at: new Date(),
      stats,
    } as never,
    { bypassDocumentValidation: true }
  );
};

describe("getRegionalStats", () => {
  beforeEach(async () => {
    const base = { type: "MISSION_LOCALE", created_at: new Date() };
    await organisationsDb().insertMany(
      [
        {
          _id: ML_ENGAGEE,
          ...base,
          ml_id: 901,
          nom: "ML engagée",
          adresse: { region: "11" },
          activated_at: daysAgo(200),
        },
        {
          _id: ML_PASSIVE,
          ...base,
          ml_id: 902,
          nom: "ML passive",
          adresse: { region: "11" },
          activated_at: daysAgo(200),
        },
        { _id: ML_INACTIVE, ...base, ml_id: 903, nom: "ML inactive", adresse: { region: "84" } },
      ] as IOrganisation[],
      { bypassDocumentValidation: true }
    );
  });

  it("lit le dernier document de chaque ML quand celui du jour n'existe pas encore", async () => {
    await insertStats(ML_ENGAGEE, daysAgo(1), { total: 10, traite: 8, a_traiter: 2 });
    await insertStats(ML_ENGAGEE, daysAgo(31), { total: 5, traite: 2, a_traiter: 3 });
    await insertStats(ML_PASSIVE, daysAgo(2), { total: 10, traite: 2, a_traiter: 8 });
    await insertStats(ML_INACTIVE, daysAgo(1), { total: 4, traite: 4, a_traiter: 0 });

    const { regions } = await getRegionalStats("30days");

    expect(regions.find((region) => region.code === "11")).toMatchObject({
      ml_total: 2,
      ml_activees: 2,
      ml_engagees: 1,
      ml_engagees_delta: 1,
      a_traiter: 10,
      traites: 10,
      traites_variation: "+80%",
    });
    expect(regions.find((region) => region.code === "84")).toMatchObject({
      ml_total: 1,
      ml_activees: 0,
      ml_engagees: 0,
      a_traiter: 0,
      traites: 4,
    });
  });

  it("ignore les documents plus vieux que la fenêtre de repli", async () => {
    await insertStats(ML_ENGAGEE, daysAgo(45), { total: 10, traite: 8, a_traiter: 2 });

    const { regions } = await getRegionalStats("30days");

    expect(regions.find((region) => region.code === "11")).toMatchObject({ ml_engagees: 0, traites: 0 });
  });
});
