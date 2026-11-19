import { ObjectId } from "mongodb";
import type { IVoeuAffelnet } from "shared/models/data/voeuxAffelnet.model";
import { describe, expect, it } from "vitest";

import { voeuxAffelnetDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { purgerVoeuxAffelnet } from "./purge-voeux-affelnet";

useMongo();

const voeu = (annee_scolaire_rentree: string | null): IVoeuAffelnet => ({
  _id: new ObjectId(),
  created_at: new Date("2024-05-01T00:00:00Z"),
  updated_at: new Date("2024-05-01T00:00:00Z"),
  is_contacted: false,
  annee_scolaire_rentree,
  raw: { nom: "DUPONT", prenom_1: "Jean" },
  _computed: { formation: {} },
});

const campagnesRestantes = async () =>
  (await voeuxAffelnetDb().find({}).toArray()).map(({ annee_scolaire_rentree }) => annee_scolaire_rentree).sort();

describe("purgerVoeuxAffelnet()", () => {
  const inserer = () =>
    voeuxAffelnetDb().insertMany([voeu("2024"), voeu("2024"), voeu("2025"), voeu("2026"), voeu(null)]);

  it("supprime la campagne N-2 au 1er septembre et garde la campagne N-1", async () => {
    await inserer();

    const resultat = await purgerVoeuxAffelnet({ maintenant: new Date("2026-09-01T08:00:00Z") });

    expect(resultat).toStrictEqual({ dryRun: false, premiereCampagneConservee: 2025, parCampagne: { "2024": 2 } });
    expect(await campagnesRestantes()).toStrictEqual(["2025", "2026", null]);
  });

  it("garde la campagne N-2 le 31 août", async () => {
    await inserer();

    const resultat = await purgerVoeuxAffelnet({ maintenant: new Date("2026-08-31T20:00:00Z") });

    expect(resultat.parCampagne).toStrictEqual({});
    expect(await campagnesRestantes()).toHaveLength(5);
  });

  it("n'écrit rien en simulation", async () => {
    await inserer();

    const resultat = await purgerVoeuxAffelnet({ maintenant: new Date("2026-11-19T08:00:00Z"), dryRun: true });

    expect(resultat.parCampagne).toStrictEqual({ "2024": 2 });
    expect(await campagnesRestantes()).toHaveLength(5);
  });
});
