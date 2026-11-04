import { ObjectId } from "bson";
import { ACTIVATION_RATTRAPAGE_DATE } from "shared/constants/missionLocale";
import type { IOrganisation } from "shared/models/data/organisations.model";
import { beforeEach, describe, expect, it } from "vitest";

import { missionLocaleStatsDb, organisationsDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { getTraitementExportData } from "./mission-locale-stats.actions";

useMongo();

const ML_RATTRAPEE = new ObjectId();
const ML_DATEE = new ObjectId();
const DATE_REELLE = new Date("2025-09-11T00:00:00.000Z");

const today = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

describe("getTraitementExportData : date d'activation", () => {
  beforeEach(async () => {
    const base = { type: "MISSION_LOCALE", created_at: new Date(), adresse: { region: "11" } };
    await organisationsDb().insertMany(
      [
        { _id: ML_RATTRAPEE, ...base, ml_id: 911, nom: "ML rattrapée", activated_at: ACTIVATION_RATTRAPAGE_DATE },
        { _id: ML_DATEE, ...base, ml_id: 912, nom: "ML datée", activated_at: DATE_REELLE },
      ] as IOrganisation[],
      { bypassDocumentValidation: true }
    );
    for (const mlId of [ML_RATTRAPEE, ML_DATEE]) {
      await missionLocaleStatsDb().insertOne(
        {
          _id: new ObjectId(),
          mission_locale_id: mlId,
          computed_day: today(),
          created_at: new Date(),
          updated_at: new Date(),
          stats: { total: 4, traite: 2, a_traiter: 2 },
        } as never,
        { bypassDocumentValidation: true }
      );
    }
  });

  it("n'exporte pas la date de rattrapage, qui n'est pas une vraie date d'activation", async () => {
    const { mlData } = await getTraitementExportData({});

    const lignes = mlData as unknown as Array<{ nom: string; date_activation: Date | null }>;
    const dateDe = (nom: string) => lignes.find((ligne) => ligne.nom === nom)?.date_activation;
    expect(dateDe("ML rattrapée")).toBeNull();
    expect(dateDe("ML datée")).toEqual(DATE_REELLE);
  });
});
