import { ObjectId } from "mongodb";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IVoeuAffelnet } from "shared/models/data/voeuxAffelnet.model";
import { beforeEach, describe, expect, it } from "vitest";

import { findDeletedVoeux, updateVoeuxAffelnetEffectifDeca } from "@/common/actions/affelnet.actions";
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

describe("updateVoeuxAffelnetEffectifDeca", () => {
  const formateurId = new ObjectId();
  const effectifDecaId = new ObjectId();
  const contrat = {
    apprenant: { nom: "DUPONT", prenom: "JEAN" },
    annee_scolaire: "2026-2027",
  } as unknown as IEffectifDECA;

  const voeuChez = (_id: ObjectId, organisme_formateur_id: ObjectId): IVoeuAffelnet => ({
    ...nouveauVoeu(_id, AVANT),
    organisme_formateur_id,
    raw: { ine: _id.toString(), nom: "Dupont", prenom_1: "Jean", uai_etatblissement_formateur: "0802004U" },
  });

  it("relie le contrat DECA au vœu du même jeune chez son organisme formateur", async () => {
    const chezFormateur = new ObjectId();
    const ailleurs = new ObjectId();
    await voeuxAffelnetDb().insertMany([voeuChez(chezFormateur, formateurId), voeuChez(ailleurs, new ObjectId())]);

    await updateVoeuxAffelnetEffectifDeca(effectifDecaId, contrat, formateurId);

    expect((await voeu(chezFormateur))?.effectif_deca_id).toEqual(effectifDecaId);
    expect(await voeu(ailleurs)).not.toHaveProperty("effectif_deca_id");
  });

  it("ne relie rien sans organisme formateur", async () => {
    const _id = new ObjectId();
    await voeuxAffelnetDb().insertOne({
      ...nouveauVoeu(_id, AVANT),
      raw: { ine: "x", nom: "Dupont", prenom_1: "Jean" },
    });

    await updateVoeuxAffelnetEffectifDeca(effectifDecaId, contrat, null);

    expect(await voeu(_id)).not.toHaveProperty("effectif_deca_id");
  });
});
