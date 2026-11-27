import { Collection, MongoWriteConcernError, ObjectId } from "mongodb";
import { STATUT_PRESENCE_REFERENTIEL } from "shared/constants";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IEffectifArchive } from "shared/models/data/effectifsArchive.model";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import effectifsPurgesStatsDescriptor from "shared/models/data/effectifsPurgesStats.model";
import type { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";
import type { IVoeuAffelnet } from "shared/models/data/voeuxAffelnet.model";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { describe, expect, it, vi } from "vitest";

import {
  effectifsArchiveDb,
  effectifsDb,
  effectifsDECADb,
  effectifsPurgesStatsDb,
  missionLocaleEffectifsDb,
  organismesDb,
  voeuxAffelnetDb,
} from "@/common/model/collections";
import { createCollectionIndexes } from "@/common/model/indexes/createCollectionIndexes";
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

  it("compte le lot quand la suppression dépasse l'acquittement majority, puis s'arrête", async () => {
    await insererEffectifs([effectif("2022-2023", { formation: "2023-06-30", contrats: [{ fin: "2023-08-31" }] })]);
    const deleteMany = Collection.prototype.deleteMany;
    const retard = Object.assign(Object.create(MongoWriteConcernError.prototype), {
      message: "waiting for replication timed out",
    }) as MongoWriteConcernError;
    let retardes = 0;
    const espion = vi.spyOn(Collection.prototype, "deleteMany").mockImplementation(async function (
      this: Collection,
      ...args: Parameters<Collection["deleteMany"]>
    ) {
      const resultat = await deleteMany.apply(this, args);
      if (this.collectionName === effectifsDb().collectionName && retardes++ === 0) throw retard;
      return resultat;
    });

    await expect(purgerEffectifsAnciens({ maintenant })).rejects.toBe(retard);
    espion.mockRestore();

    expect(await idsRestants()).toStrictEqual({ effectifs: [], deca: [] });
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

  it("traite plusieurs lots et respecte l'index unique des compteurs", async () => {
    await createCollectionIndexes(effectifsPurgesStatsDescriptor);
    const sansStatut = { _computed: { organisme: { uai: "0751234A", siret: "12345678900011" } } };
    await insererEffectifs([
      ...Array.from({ length: 1500 }, () => effectif("2022-2023", { formation: "2023-06-30" })),
      ...Array.from({ length: 3 }, () => effectif("2022-2023", { formation: "2023-06-30" }, sansStatut)),
    ]);

    const resultat = await purgerEffectifsAnciens({ maintenant });

    expect(resultat.effectifs.total).toBe(1503);
    expect(await effectifsDb().countDocuments()).toBe(0);
    expect(await compteurs()).toStrictEqual([
      compteur("2022-2023", "ERP", 3, null),
      compteur("2022-2023", "ERP", 1500),
    ]);
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
    expect(resultat.voeuxDelies).toStrictEqual({ effectif_id: 1, effectif_deca_id: 0 });
    expect(await idsRestants()).toStrictEqual({
      effectifs: ids.map((id) => id.toString()),
      deca: [idDeca.toString()],
    });
    expect(await compteurs()).toStrictEqual([]);
    expect(await voeuxAffelnetDb().findOne({ _id: voeuLie._id })).toStrictEqual(voeuLie);
  });

  it("compte les organismes que la purge vide, en simulation comme en réel", async () => {
    const organisme = (siret: string, est_dans_le_referentiel: "absent" | "present") =>
      generateOrganismeFixture({ siret, uai: null, effectifs_count: 0, est_dans_le_referentiel });
    const vide = organisme("13002975400020", STATUT_PRESENCE_REFERENTIEL.ABSENT);
    const encoreActif = organisme("19240007500011", STATUT_PRESENCE_REFERENTIEL.ABSENT);
    const auReferentiel = organisme("19590065900028", STATUT_PRESENCE_REFERENTIEL.PRESENT);
    await organismesDb().insertMany([vide, encoreActif, auReferentiel]);
    const ancien = (organisme_id: ObjectId) => effectif("2022-2023", { formation: "2023-06-30" }, { organisme_id });
    await insererEffectifs([
      ancien(vide._id),
      ancien(vide._id),
      ancien(encoreActif._id),
      effectif("2025-2026", { formation: "2026-06-30" }, { organisme_id: encoreActif._id }),
      ancien(auReferentiel._id),
    ]);

    expect((await purgerEffectifsAnciens({ maintenant, dryRun: true })).organismesVides).toBe(1);
    expect((await purgerEffectifsAnciens({ maintenant })).organismesVides).toBe(1);
    expect(await organismesDb().countDocuments()).toBe(3);
  });

  it("compte le responsable que la purge prive de ses contrats DECA fléchés", async () => {
    const responsable = generateOrganismeFixture({
      siret: "13002975400020",
      uai: null,
      effectifs_count: 0,
      est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.ABSENT,
    });
    const formateur = generateOrganismeFixture({
      siret: "19590065900028",
      uai: null,
      est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.PRESENT,
    });
    await organismesDb().insertMany([responsable, formateur]);
    const fleche = (finContrat: string) => ({
      ...effectifDeca("2022-2023", finContrat, new ObjectId()),
      organisme_id: formateur._id,
      organisme_responsable_id: responsable._id,
      fleche: { date: date("2023-01-01") },
    });
    await insererDeca([fleche("2023-08-31"), fleche("2023-07-31")]);

    expect((await purgerEffectifsAnciens({ maintenant, dryRun: true })).organismesVides).toBe(1);
    expect((await purgerEffectifsAnciens({ maintenant })).organismesVides).toBe(1);
  });

  it("garde le responsable qui garde un contrat DECA fléché récent", async () => {
    const responsable = generateOrganismeFixture({
      siret: "13002975400020",
      uai: null,
      effectifs_count: 0,
      est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.ABSENT,
    });
    await organismesDb().insertOne(responsable);
    const fleche = (annee: string, finContrat: string) => ({
      ...effectifDeca(annee, finContrat, new ObjectId()),
      organisme_id: new ObjectId(),
      organisme_responsable_id: responsable._id,
      fleche: { date: date("2023-01-01") },
    });
    await insererDeca([fleche("2022-2023", "2023-08-31"), fleche("2025-2026", "2026-08-31")]);

    expect((await purgerEffectifsAnciens({ maintenant, dryRun: true })).organismesVides).toBe(0);
  });

  it("supprime aussi les archives d'effectifs hors conservation, sans les compter", async () => {
    const archive = (dates: Dates, annee: string) => ({
      ...effectif(annee, dates),
      suppression: { motif: "Doublon", date: new Date("2026-10-01T00:00:00Z") },
    });
    const ancienne = archive({ formation: "2019-06-30" }, "2018-2019");
    const recente = archive({ formation: "2025-06-30" }, "2024-2025");
    await effectifsArchiveDb().insertMany([ancienne, recente] as unknown as IEffectifArchive[], {
      bypassDocumentValidation: true,
    });

    const resultat = await purgerEffectifsAnciens({ maintenant });

    expect(resultat.effectifsArchive).toStrictEqual({ total: 1, parAnnee: { "2018-2019": { ERP: 1 } } });
    expect((await effectifsArchiveDb().find({}).toArray()).map(({ _id }) => _id.toString())).toStrictEqual([
      recente._id.toString(),
    ]);
    expect(await compteurs()).toStrictEqual([]);
    expect(resultat.organismesVides).toBe(0);
  });

  it("refuse une date limite dans le futur", async () => {
    await expect(
      purgerEffectifsAnciens({ maintenant: new Date(Date.now() + 3 * 365 * 24 * 3600 * 1000) })
    ).rejects.toThrow("date limite");
  });
});
