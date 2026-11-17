import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";

import { effectifsQueueDb, transmissionDailyReportDb } from "@/common/model/collections";
import { formatDateYYYYMMDD } from "@/common/utils/dateUtils";
import { useMongo } from "@tests/jest/setupMongo";

import { computeDailyTransmissions } from "./hydrate-transmissions";

const yesterdayNoon = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  date.setHours(12, 0, 0, 0);
  return date;
};

const insertQueueItems = async (organismeId: ObjectId, items: Array<{ has_error: boolean }>) => {
  await effectifsQueueDb().insertMany(
    items.map(({ has_error }) => ({
      source_organisme_id: organismeId.toString(),
      processed_at: yesterdayNoon(),
      created_at: yesterdayNoon(),
      has_error,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any[],
    { bypassDocumentValidation: true }
  );
};

describe("hydrate:transmission-daily", () => {
  useMongo();

  it("ne lève pas sur une journée sans transmission", async () => {
    await expect(computeDailyTransmissions()).resolves.toBeUndefined();

    expect(await transmissionDailyReportDb().countDocuments({})).toBe(0);
  });

  it("écrit une ligne par organisme pour la veille", async () => {
    const organismeId = new ObjectId();
    await insertQueueItems(organismeId, [{ has_error: false }, { has_error: false }, { has_error: true }]);

    await computeDailyTransmissions();

    const reports = await transmissionDailyReportDb().find({}).toArray();
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({
      organisme_id: organismeId,
      current_day: formatDateYYYYMMDD(yesterdayNoon()),
      success_count: 2,
      error_count: 1,
    });
  });

  it("met la ligne à jour au rejeu au lieu de lever sur le doublon", async () => {
    const organismeId = new ObjectId();
    await insertQueueItems(organismeId, [{ has_error: false }]);
    await computeDailyTransmissions();
    const [first] = await transmissionDailyReportDb().find({}).toArray();

    await insertQueueItems(organismeId, [{ has_error: true }]);
    await computeDailyTransmissions();

    const reports = await transmissionDailyReportDb().find({}).toArray();
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({ _id: first._id, success_count: 1, error_count: 1 });
  });
});
