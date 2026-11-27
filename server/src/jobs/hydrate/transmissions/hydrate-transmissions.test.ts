import type { IJobsSimple } from "job-processor";
import { ObjectId } from "mongodb";
import { EFFECTIF_HORS_CONSERVATION } from "shared/models/data/effectifs.model";
import { describe, expect, it } from "vitest";

import { effectifsQueueDb, transmissionDailyReportDb } from "@/common/model/collections";
import { formatDateYYYYMMDD } from "@/common/utils/dateUtils";
import { useMongo } from "@tests/jest/setupMongo";

import { transmissionsJobs } from "../../registry/transmissions";

import { computeDailyTransmissions } from "./hydrate-transmissions";

const noonDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(12, 0, 0, 0);
  return date;
};

const yesterdayNoon = () => noonDaysAgo(1);

const insertQueueItems = async (
  organismeId: ObjectId,
  items: Array<{ has_error: boolean; validation_errors?: Array<{ message: string; path: string[] }> }>,
  processedAt: Date = yesterdayNoon()
) => {
  await effectifsQueueDb().insertMany(
    items.map(({ has_error, validation_errors }) => ({
      source_organisme_id: organismeId.toString(),
      processed_at: processedAt,
      created_at: processedAt,
      has_error,
      ...(validation_errors ? { validation_errors } : {}),
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

  it("ne compte pas en erreur un effectif refusé seulement parce qu'il est hors conservation", async () => {
    const organismeId = new ObjectId();
    const horsConservation = { message: EFFECTIF_HORS_CONSERVATION, path: ["date_fin_formation"] };
    await insertQueueItems(organismeId, [
      { has_error: false },
      { has_error: true, validation_errors: [horsConservation] },
      { has_error: true, validation_errors: [horsConservation, { message: "UAI invalide", path: ["uai"] }] },
    ]);

    await computeDailyTransmissions();

    expect(await transmissionDailyReportDb().findOne({ organisme_id: organismeId })).toMatchObject({
      success_count: 1,
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

  it("recalcule un jour passé donné par le job", async () => {
    const organismeId = new ObjectId();
    await insertQueueItems(organismeId, [{ has_error: false }, { has_error: true }], noonDaysAgo(3));
    await insertQueueItems(organismeId, [{ has_error: false }]);
    const day = formatDateYYYYMMDD(noonDaysAgo(3));

    await transmissionsJobs["hydrate:transmission-daily"].handler({ payload: { day } } as unknown as IJobsSimple);

    const reports = await transmissionDailyReportDb().find({}).toArray();
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({ organisme_id: organismeId, current_day: day, success_count: 1, error_count: 1 });
  });

  it.each([
    ["mal formé", "2026-13-01"],
    ["du jour", formatDateYYYYMMDD(new Date())],
    ["trop ancien", formatDateYYYYMMDD(noonDaysAgo(15))],
  ])("refuse un jour %s", async (_, day) => {
    await expect(computeDailyTransmissions({ day })).rejects.toThrow("Option day");
  });
});
