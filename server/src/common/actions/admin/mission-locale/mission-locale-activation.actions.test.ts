import { ObjectId } from "mongodb";
import type { IOrganisation } from "shared/models";
import { beforeEach, describe, expect, it } from "vitest";

import { missionLocaleStatsDb, organisationsDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { activateMissionLocale } from "./mission-locale.admin.actions";

useMongo();

const ML_ID = new ObjectId();

describe("activateMissionLocale", () => {
  beforeEach(async () => {
    await organisationsDb().insertOne({
      _id: ML_ID,
      type: "MISSION_LOCALE",
      ml_id: 4243,
      nom: "ML à activer",
      adresse: { region: "32" },
      created_at: new Date(),
    } as IOrganisation);
  });

  it("pose la date d'activation et calcule aussitôt le document de stats du jour", async () => {
    const activatedAt = new Date("2026-09-21T09:00:00.000Z");

    await activateMissionLocale(ML_ID, activatedAt);

    const organisation = await organisationsDb().findOne({ _id: ML_ID });
    expect(organisation).toMatchObject({ activated_at: activatedAt });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const stats = await missionLocaleStatsDb().findOne({ mission_locale_id: ML_ID, computed_day: today });
    expect(stats).not.toBeNull();
    expect(stats?.segments?.rupture.total).toBe(0);
    expect(stats?.segments?.collab.total).toBe(0);
  });
});
