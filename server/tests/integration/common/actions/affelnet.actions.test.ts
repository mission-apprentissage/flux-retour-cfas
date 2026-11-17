import { ObjectId } from "mongodb";
import type { IVoeuAffelnet } from "shared/models/data/voeuxAffelnet.model";
import { beforeEach, describe, expect, it } from "vitest";

import { findDeletedVoeux } from "@/common/actions/affelnet.actions";
import { voeuxAffelnetDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const IMPORT = new Date("2026-06-15T10:00:00.000Z");
const AVANT = new Date("2026-06-01T10:00:00.000Z");
const PREMIERE_SUPPRESSION = new Date("2026-05-01T10:00:00.000Z");

const ids = { absent: new ObjectId(), dejaSupprime: new ObjectId(), importe: new ObjectId() };

const voeu = (_id: ObjectId) => voeuxAffelnetDb().findOne({ _id });

const nouveauVoeu = (_id: ObjectId, updated_at: Date): IVoeuAffelnet => ({
  _id,
  created_at: AVANT,
  updated_at,
  is_contacted: false,
  annee_scolaire_rentree: "2026",
  raw: { ine: _id.toString(), nom: "DUPONT", prenom_1: "Jean" },
  _computed: { formation: {}, organisme: {} },
});

describe("findDeletedVoeux", () => {
  beforeEach(async () => {
    await voeuxAffelnetDb().insertMany([
      nouveauVoeu(ids.absent, AVANT),
      { ...nouveauVoeu(ids.dejaSupprime, AVANT), deleted_at: PREMIERE_SUPPRESSION },
      nouveauVoeu(ids.importe, IMPORT),
    ]);
  });

  it("marque supprimés les seuls vœux absents de l'import qui ne l'étaient pas déjà", async () => {
    expect(await findDeletedVoeux(IMPORT)).toBe(1);

    expect((await voeu(ids.absent))?.deleted_at).toBeInstanceOf(Date);
    expect((await voeu(ids.dejaSupprime))?.deleted_at).toEqual(PREMIERE_SUPPRESSION);
    expect(await voeu(ids.importe)).not.toHaveProperty("deleted_at");
  });

  it("ne change plus rien au second passage", async () => {
    await findDeletedVoeux(IMPORT);
    const premier = (await voeu(ids.absent))?.deleted_at;

    expect(await findDeletedVoeux(IMPORT)).toBe(0);
    expect((await voeu(ids.absent))?.deleted_at).toEqual(premier);
  });
});
