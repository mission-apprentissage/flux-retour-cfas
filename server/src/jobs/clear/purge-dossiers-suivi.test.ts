import { ObjectId } from "mongodb";
import type { IFranceTravailEffectif } from "shared/models/data/franceTravailEffectif.model";
import { type IMissionLocaleEffectif, SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { describe, expect, it } from "vitest";

import {
  franceTravailEffectifsDb,
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
} from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { purgerDossiersSuivi } from "./purge-dossiers-suivi";

useMongo();

const maintenant = new Date("2026-11-18T00:00:00Z");
const date = (iso: string) => new Date(`${iso}T00:00:00Z`);

const dossierMl = (extra: Record<string, unknown> = {}) => ({
  _id: new ObjectId(),
  mission_locale_id: new ObjectId(),
  effectif_id: new ObjectId(),
  created_at: date("2024-01-10"),
  situation: "RDV_PRIS",
  current_status: { value: "RUPTURANT", date: date("2024-01-05") },
  effectif_snapshot: { annee_scolaire: "2023-2024", apprenant: { nom: "DUPONT" } },
  ...extra,
});

const dossierFt = (created_at: string) => ({
  _id: new ObjectId(),
  effectif_id: new ObjectId(),
  created_at: date(created_at),
  current_status: { value: "INSCRIT", date: date(created_at) },
  effectif_snapshot: { annee_scolaire: "2023-2024", apprenant: { nom: "DUPONT" } },
  ft_data: {},
});

const insererMl = async (dossiers: ReturnType<typeof dossierMl>[]) => {
  await missionLocaleEffectifsDb().insertMany(dossiers as unknown as IMissionLocaleEffectif[], {
    bypassDocumentValidation: true,
  });
};

const insererFt = async (dossiers: ReturnType<typeof dossierFt>[]) => {
  await franceTravailEffectifsDb().insertMany(dossiers as unknown as IFranceTravailEffectif[], {
    bypassDocumentValidation: true,
  });
};

const log = (mission_locale_effectif_id: ObjectId) => ({
  _id: new ObjectId(),
  mission_locale_effectif_id,
  situation: SITUATION_ENUM.RDV_PRIS,
  created_at: date("2024-02-01"),
  read_by: [],
});

const idsMl = async () =>
  (
    await missionLocaleEffectifsDb()
      .find({}, { projection: { _id: 1 } })
      .toArray()
  )
    .map(({ _id }) => _id.toString())
    .sort();

const ids = (dossiers: Array<{ _id: ObjectId }>) => dossiers.map(({ _id }) => _id.toString()).sort();

describe("purgerDossiersSuivi()", () => {
  it("supprime un dossier ML rompu depuis plus de deux ans avec ses logs", async () => {
    const ancien = dossierMl({ date_rupture: date("2024-11-17") });
    const recent = dossierMl({ date_rupture: date("2024-11-19") });
    await insererMl([ancien, recent]);
    await missionLocaleEffectifsLogDb().insertMany([log(ancien._id), log(recent._id)]);

    const resultat = await purgerDossiersSuivi({ maintenant });

    expect(resultat.missionLocale).toStrictEqual({ supprimes: 1, gardesAnneeActive: 0, liesSupprimes: 1 });
    expect(await idsMl()).toStrictEqual([recent._id.toString()]);
    expect(
      (await missionLocaleEffectifsLogDb().find({}).toArray()).map((doc) => doc.mission_locale_effectif_id)
    ).toStrictEqual([recent._id]);
  });

  it("se replie sur la rupture déclarée par le CFA, puis sur la création", async () => {
    const declarationAncienne = dossierMl({ cfa_rupture_declaration: { date_rupture: date("2024-06-01") } });
    const declarationRecente = dossierMl({ cfa_rupture_declaration: { date_rupture: date("2025-03-01") } });
    const creationAncienne = dossierMl();
    const creationRecente = dossierMl({ created_at: date("2025-02-01") });
    const ruptureRecente = dossierMl({ date_rupture: date("2025-01-15") });
    await insererMl([declarationAncienne, declarationRecente, creationAncienne, creationRecente, ruptureRecente]);

    const resultat = await purgerDossiersSuivi({ maintenant });

    expect(resultat.missionLocale.supprimes).toBe(2);
    expect(await idsMl()).toStrictEqual(ids([declarationRecente, creationRecente, ruptureRecente]));
  });

  it("supprime aussi les dossiers masqués rompus depuis plus de deux ans", async () => {
    await insererMl([dossierMl({ soft_deleted: true, date_rupture: date("2024-01-05") })]);

    await purgerDossiersSuivi({ maintenant });

    expect(await idsMl()).toStrictEqual([]);
  });

  it("garde un dossier d'une année scolaire active malgré une date ancienne", async () => {
    const actif = dossierMl({
      date_rupture: date("2024-01-05"),
      effectif_snapshot: { annee_scolaire: "2025-2026", apprenant: { nom: "DUPONT" } },
    });
    await insererMl([actif]);

    const resultat = await purgerDossiersSuivi({ maintenant });

    expect(resultat.missionLocale).toStrictEqual({ supprimes: 0, gardesAnneeActive: 1, liesSupprimes: 0 });
    expect(await idsMl()).toStrictEqual([actif._id.toString()]);
  });

  it("supprime les dossiers France Travail créés depuis plus de deux ans", async () => {
    const ancien = dossierFt("2024-11-17");
    const recent = dossierFt("2024-11-19");
    await insererFt([ancien, recent]);

    const resultat = await purgerDossiersSuivi({ maintenant });

    expect(resultat.franceTravail).toStrictEqual({ supprimes: 1, gardesAnneeActive: 0, liesSupprimes: 0 });
    expect(ids(await franceTravailEffectifsDb().find({}).toArray())).toStrictEqual([recent._id.toString()]);
  });

  it("passe d'abord sur les dossiers masqués sans trace", async () => {
    const masque = dossierMl({ soft_deleted: true, situation: null, created_at: date("2025-05-28") });
    await insererMl([masque]);

    const resultat = await purgerDossiersSuivi({ maintenant });

    expect(resultat.dossiersMasques.supprimes).toBe(1);
    expect(await idsMl()).toStrictEqual([]);
  });

  it("n'écrit rien en simulation", async () => {
    const ancien = dossierMl({ date_rupture: date("2024-01-05") });
    await insererMl([ancien]);
    await missionLocaleEffectifsLogDb().insertOne(log(ancien._id));
    await insererFt([dossierFt("2024-01-10")]);

    const resultat = await purgerDossiersSuivi({ maintenant, dryRun: true });

    expect(resultat.missionLocale).toStrictEqual({ supprimes: 1, gardesAnneeActive: 0, liesSupprimes: 1 });
    expect(resultat.franceTravail.supprimes).toBe(1);
    expect(await idsMl()).toStrictEqual([ancien._id.toString()]);
    expect(await missionLocaleEffectifsLogDb().countDocuments()).toBe(1);
    expect(await franceTravailEffectifsDb().countDocuments()).toBe(1);
  });
});
