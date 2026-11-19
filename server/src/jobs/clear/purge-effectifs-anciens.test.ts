import { ObjectId } from "mongodb";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";
import type { IVoeuAffelnet } from "shared/models/data/voeuxAffelnet.model";
import { describe, expect, it } from "vitest";

import {
  effectifsDb,
  effectifsDECADb,
  effectifsPurgesStatsDb,
  missionLocaleEffectifsDb,
  voeuxAffelnetDb,
} from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { purgerEffectifsAnciens } from "./purge-effectifs-anciens";

useMongo();

const maintenant = new Date("2026-11-18T00:00:00Z");
const organismeId = new ObjectId();
const date = (iso: string) => new Date(`${iso}T00:00:00Z`);

type Dates = { formation?: string; contrats?: Array<{ fin?: string; rupture?: string }> };

const effectif = (annee_scolaire: string, dates: Dates, extra: Record<string, unknown> = {}) => ({
  _id: new ObjectId(),
  organisme_id: organismeId,
  annee_scolaire,
  source: "ERP",
  id_erp_apprenant: new ObjectId().toString(),
  apprenant: { nom: "DUPONT", prenom: "Jean" },
  formation: dates.formation ? { date_fin: date(dates.formation), niveau: "4" } : { niveau: "4" },
  contrats: (dates.contrats ?? []).map((contrat) => ({
    date_debut: date("2020-09-01"),
    ...(contrat.fin ? { date_fin: date(contrat.fin) } : {}),
    ...(contrat.rupture ? { date_rupture: date(contrat.rupture) } : {}),
  })),
  transmitted_at: date("2023-06-01"),
  _computed: { organisme: { uai: "0751234A", siret: "12345678900011" }, statut: { en_cours: "APPRENTI" } },
  ...extra,
});

const effectifDeca = (annee_scolaire: string, finContrat: string, deca_raw_id: ObjectId) => ({
  ...effectif(annee_scolaire, { contrats: [{ fin: finContrat }] }),
  source: "DECA",
  deca_raw_id,
});

const voeu = (lien: Pick<IVoeuAffelnet, "effectif_id" | "effectif_deca_id">): IVoeuAffelnet => ({
  _id: new ObjectId(),
  ...lien,
  created_at: date("2022-05-01"),
  updated_at: date("2022-05-01"),
  is_contacted: false,
  annee_scolaire_rentree: "2022",
  raw: { nom: "DUPONT" },
  _computed: { formation: {} },
});

const insererEffectifs = async (docs: ReturnType<typeof effectif>[]) => {
  await effectifsDb().insertMany(docs as unknown as IEffectif[], { bypassDocumentValidation: true });
  return docs.map((doc) => doc._id);
};

const insererDeca = async (docs: ReturnType<typeof effectifDeca>[]) => {
  await effectifsDECADb().insertMany(docs as unknown as IEffectifDECA[], { bypassDocumentValidation: true });
  return docs.map((doc) => doc._id);
};

const idsRestants = async () => ({
  effectifs: (
    await effectifsDb()
      .find({}, { projection: { _id: 1 } })
      .toArray()
  ).map((doc) => doc._id.toString()),
  deca: (
    await effectifsDECADb()
      .find({}, { projection: { _id: 1 } })
      .toArray()
  ).map((doc) => doc._id.toString()),
});

const compteurs = async () =>
  effectifsPurgesStatsDb()
    .find({}, { projection: { _id: 0, updated_at: 0 } })
    .sort({ annee_scolaire: 1, source: 1, statut: 1 })
    .toArray();

const compteur = (annee_scolaire: string, source: string, nombre: number, statut: string | null = "APPRENTI") => ({
  organisme_id: organismeId,
  uai: "0751234A",
  siret: "12345678900011",
  annee_scolaire,
  source,
  statut,
  niveau: "4",
  nombre,
});

describe("purgerEffectifsAnciens()", () => {
  it("supprime un effectif fini depuis plus de deux ans et le compte", async () => {
    await insererEffectifs([effectif("2022-2023", { formation: "2023-06-30", contrats: [{ fin: "2023-08-31" }] })]);

    const resultat = await purgerEffectifsAnciens({ maintenant });

    expect(await idsRestants()).toStrictEqual({ effectifs: [], deca: [] });
    expect(resultat.effectifs).toStrictEqual({ total: 1, parAnnee: { "2022-2023": { ERP: 1 } } });
    expect(await compteurs()).toStrictEqual([compteur("2022-2023", "ERP", 1)]);
  });

  it("garde les effectifs encore dans le délai de conservation", async () => {
    const gardes = await insererEffectifs([
      effectif("2023-2024", { formation: "2025-06-30" }),
      effectif("2022-2023", { formation: "2023-06-30", contrats: [{ fin: "2023-08-31", rupture: "2025-01-15" }] }),
      effectif("2024-2025", {}),
      effectif("2025-2026", { formation: "2020-06-30" }),
      effectif("2022-2023", { formation: "2023-06-30" }, { transmitted_at: new Date(Date.now() + 60_000) }),
    ]);

    const resultat = await purgerEffectifsAnciens({ maintenant });

    expect((await idsRestants()).effectifs.sort()).toStrictEqual(gardes.map((id) => id.toString()).sort());
    expect(resultat.effectifs.total).toBe(0);
    expect(await compteurs()).toStrictEqual([]);
  });

  it("supprime un effectif sans date d'une année finie avant la limite", async () => {
    await insererEffectifs([
      effectif("2021-2022", {}, { _computed: { organisme: { uai: "0751234A", siret: "12345678900011" } } }),
    ]);

    await purgerEffectifsAnciens({ maintenant });

    expect((await idsRestants()).effectifs).toStrictEqual([]);
    expect(await compteurs()).toStrictEqual([compteur("2021-2022", "ERP", 1, null)]);
  });

  it("supprime un contrat DECA sur toutes ses années scolaires", async () => {
    const decaRawAncien = new ObjectId();
    const [garde] = await insererDeca([
      effectifDeca("2023-2024", "2025-08-31", new ObjectId()),
      effectifDeca("2022-2023", "2024-08-31", decaRawAncien),
      effectifDeca("2023-2024", "2024-08-31", decaRawAncien),
    ]);

    const resultat = await purgerEffectifsAnciens({ maintenant });

    expect((await idsRestants()).deca).toStrictEqual([garde.toString()]);
    expect(resultat.effectifsDECA).toStrictEqual({
      total: 2,
      parAnnee: { "2022-2023": { DECA: 1 }, "2023-2024": { DECA: 1 } },
    });
    expect(await compteurs()).toStrictEqual([compteur("2022-2023", "DECA", 1), compteur("2023-2024", "DECA", 1)]);
  });

  it("délie les vœux et garde les dossiers ML des effectifs supprimés", async () => {
    const [ancien, recent] = await insererEffectifs([
      effectif("2022-2023", { formation: "2023-06-30" }),
      effectif("2023-2024", { formation: "2025-06-30" }),
    ]);
    const [ancienDeca] = await insererDeca([effectifDeca("2022-2023", "2023-08-31", new ObjectId())]);
    const { effectif_id: _lienAncien, ...voeuAncienDelie } = voeu({ effectif_id: ancien });
    const { effectif_deca_id: _lienDeca, ...voeuDecaDelie } = voeu({ effectif_deca_id: ancienDeca });
    const voeuRecent = voeu({ effectif_id: recent });
    await voeuxAffelnetDb().insertMany([
      { ...voeuAncienDelie, effectif_id: ancien },
      { ...voeuDecaDelie, effectif_deca_id: ancienDeca },
      voeuRecent,
    ]);
    const dossierMl = {
      _id: new ObjectId(),
      effectif_id: ancien,
      mission_locale_id: new ObjectId(),
      effectif_snapshot: { apprenant: { nom: "DUPONT", prenom: "Jean" } },
    };
    await missionLocaleEffectifsDb().insertOne(dossierMl as unknown as IMissionLocaleEffectif, {
      bypassDocumentValidation: true,
    });

    const resultat = await purgerEffectifsAnciens({ maintenant });

    expect(resultat.voeuxDelies).toStrictEqual({ effectif_id: 1, effectif_deca_id: 1 });
    expect(await voeuxAffelnetDb().findOne({ _id: voeuAncienDelie._id })).toStrictEqual(voeuAncienDelie);
    expect(await voeuxAffelnetDb().findOne({ _id: voeuDecaDelie._id })).toStrictEqual(voeuDecaDelie);
    expect(await voeuxAffelnetDb().findOne({ _id: voeuRecent._id })).toStrictEqual(voeuRecent);
    expect(await missionLocaleEffectifsDb().findOne({ _id: dossierMl._id })).toStrictEqual(dossierMl);
  });

  it("garde des compteurs justes sur plusieurs exécutions", async () => {
    await insererEffectifs([effectif("2022-2023", { formation: "2023-06-30" })]);
    await purgerEffectifsAnciens({ maintenant });

    const deuxieme = await purgerEffectifsAnciens({ maintenant });
    expect(deuxieme.effectifs.total).toBe(0);
    expect(await compteurs()).toStrictEqual([compteur("2022-2023", "ERP", 1)]);

    await insererEffectifs([effectif("2022-2023", { formation: "2023-07-31" })]);
    await purgerEffectifsAnciens({ maintenant });
    expect(await compteurs()).toStrictEqual([compteur("2022-2023", "ERP", 2)]);
  });

  it("n'écrit rien en simulation", async () => {
    const ids = await insererEffectifs([
      effectif("2022-2023", { formation: "2023-06-30" }),
      effectif("2021-2022", { formation: "2022-06-30" }, { source: "FICHIER" }),
    ]);
    const [idDeca] = await insererDeca([effectifDeca("2022-2023", "2023-08-31", new ObjectId())]);
    const voeuLie = voeu({ effectif_id: ids[0] });
    await voeuxAffelnetDb().insertOne(voeuLie);

    const resultat = await purgerEffectifsAnciens({ maintenant, dryRun: true });

    expect(resultat.effectifs).toStrictEqual({
      total: 2,
      parAnnee: { "2021-2022": { FICHIER: 1 }, "2022-2023": { ERP: 1 } },
    });
    expect(resultat.effectifsDECA.total).toBe(1);
    expect(await idsRestants()).toStrictEqual({
      effectifs: ids.map((id) => id.toString()),
      deca: [idDeca.toString()],
    });
    expect(await compteurs()).toStrictEqual([]);
    expect(await voeuxAffelnetDb().findOne({ _id: voeuLie._id })).toStrictEqual(voeuLie);
  });

  it("refuse une date limite dans le futur", async () => {
    await expect(
      purgerEffectifsAnciens({ maintenant: new Date(Date.now() + 3 * 365 * 24 * 3600 * 1000) })
    ).rejects.toThrow("date limite");
  });
});
