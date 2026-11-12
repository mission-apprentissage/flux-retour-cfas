import * as Boom from "@hapi/boom";
import { ObjectId } from "mongodb";
import { MOTIF_SUPPRESSION, SOURCE_APPRENANT, STATUT_APPRENANT } from "shared/constants";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as effectifsActions from "@/common/actions/effectifs.actions";
import {
  getDuplicatesEffectifsForOrganismeIdWithPagination,
  supprimerDoublon,
  supprimerDoublonsEnLot,
} from "@/common/actions/effectifs.duplicates.actions";
import * as statsMissionLocale from "@/common/actions/mission-locale/mission-locale-stats.actions";
import { effectifsArchiveDb, effectifsDb, missionLocaleEffectifsDb } from "@/common/model/collections";
import * as repointage from "@/jobs/effectifs/repointer-liens";
import { useMongo } from "@tests/jest/setupMongo";
import {
  avecStatut,
  creerMissionLocale,
  creerOrganisme,
  identite,
  insererDossierMl,
  insererEffectif,
  ML_ID,
  NOW,
} from "@tests/utils/effectifsJumeaux";

const UTILISATEUR = new ObjectId();

describe("Doublons certains d'effectifs", () => {
  useMongo();

  let organisme: IOrganisme;

  const inserer = async (
    idErp: string,
    {
      apprenant = {},
      source = SOURCE_APPRENANT.ERP,
      misAJourLe = new Date("2026-10-01T00:00:00Z"),
      transmisLe = NOW,
      annee,
      statut,
    }: {
      apprenant?: Partial<IEffectif["apprenant"]>;
      source?: string;
      misAJourLe?: Date;
      transmisLe?: Date;
      annee?: string;
      statut?: (typeof STATUT_APPRENANT)[keyof typeof STATUT_APPRENANT];
    } = {}
  ) => {
    const effectif = await insererEffectif({
      organisme,
      idErp,
      apprenant: { ...identite, adresse: { mission_locale_id: 42 }, ...apprenant },
      statut,
    });
    const champs = {
      source,
      updated_at: misAJourLe,
      transmitted_at: transmisLe,
      ...(annee ? { annee_scolaire: annee } : {}),
    };
    await effectifsDb().updateOne({ _id: effectif._id }, { $set: champs });
    return { ...effectif, ...champs } as IEffectif;
  };

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    organisme = await creerOrganisme("CFA de test");
    await creerMissionLocale();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("regroupe le même apprenant saisi sous deux identifiants, malgré la casse, les accents et la ponctuation", async () => {
    await inserer("ERP-1", { apprenant: { nom: "Dupont-Martin", prenom: "LÉA" } });
    await inserer("hash-fichier", { apprenant: { nom: "DUPONT MARTIN", prenom: "LEA" }, source: "FICHIER" });

    const { totalItems, data } = await getDuplicatesEffectifsForOrganismeIdWithPagination(organisme._id, 1, 10);

    expect(totalItems).toBe(1);
    expect(data[0].duplicates.map(({ id_erp_apprenant }) => id_erp_apprenant).sort()).toEqual([
      "ERP-1",
      "hash-fichier",
    ]);
  });

  it("ne prend jamais deux jumeaux pour un doublon", async () => {
    await inserer("A", { apprenant: { prenom: "Léa" } });
    await inserer("B", { apprenant: { prenom: "Lou" } });

    expect((await getDuplicatesEffectifsForOrganismeIdWithPagination(organisme._id, 1, 10)).totalItems).toBe(0);
  });

  it("pagine les groupes de doublons", async () => {
    for (const prenom of ["Ana", "Bea", "Cyd", "Dan", "Eva"]) {
      await inserer(`${prenom}-1`, { apprenant: { prenom } });
      await inserer(`${prenom}-2`, { apprenant: { prenom } });
    }

    const page3 = await getDuplicatesEffectifsForOrganismeIdWithPagination(organisme._id, 3, 2);

    expect(page3.totalItems).toBe(5);
    expect(page3.data).toHaveLength(1);
    expect(page3.data[0].duplicates).toHaveLength(2);
  });

  it("en lot, garde l'effectif ERP, archive le fichier et reporte son dossier Mission Locale", async () => {
    const erp = await inserer("ERP-1", { misAJourLe: new Date("2026-09-01T00:00:00Z") });
    const fichier = await inserer("hash-fichier", {
      source: SOURCE_APPRENANT.FICHIER,
      misAJourLe: new Date("2026-10-15T00:00:00Z"),
    });
    const dossier = await insererDossierMl(fichier);

    const resultat = await supprimerDoublonsEnLot(organisme._id, UTILISATEUR);

    expect(resultat).toEqual({ supprimes: 1, refuses: 0 });
    expect(await effectifsDb().distinct("_id", { organisme_id: organisme._id })).toEqual([erp._id]);
    expect(await effectifsArchiveDb().findOne({ id_erp_apprenant: "hash-fichier" })).toMatchObject({
      suppression: { motif: MOTIF_SUPPRESSION.Doublon, user_id: UTILISATEUR },
    });
    expect((await missionLocaleEffectifsDb().findOne({ _id: dossier._id }))?.effectif_id).toEqual(erp._id);
  });

  it("entre deux effectifs de même source, garde le plus récent", async () => {
    await inserer("ancien", { source: SOURCE_APPRENANT.FICHIER, misAJourLe: new Date("2026-09-01T00:00:00Z") });
    const recent = await inserer("recent", {
      source: SOURCE_APPRENANT.FICHIER,
      misAJourLe: new Date("2026-10-01T00:00:00Z"),
    });

    await supprimerDoublonsEnLot(organisme._id, UTILISATEUR);

    expect(await effectifsDb().distinct("_id", { organisme_id: organisme._id })).toEqual([recent._id]);
  });

  it("laisse l'effectif en place quand son dossier Mission Locale ne peut pas être reporté", async () => {
    await inserer("ERP-1", { statut: STATUT_APPRENANT.APPRENTI });
    const fichier = await inserer("hash-fichier", {
      source: SOURCE_APPRENANT.FICHIER,
      statut: STATUT_APPRENANT.RUPTURANT,
    });
    await insererDossierMl(avecStatut(fichier, STATUT_APPRENANT.RUPTURANT));

    const resultat = await supprimerDoublonsEnLot(organisme._id, UTILISATEUR);

    expect(resultat).toEqual({ supprimes: 0, refuses: 1 });
    expect(await effectifsDb().countDocuments({ _id: fichier._id })).toBe(1);
    expect(await effectifsArchiveDb().countDocuments({})).toBe(0);
  });

  it("supprime un doublon choisi à l'écran en l'archivant", async () => {
    const erp = await inserer("ERP-1");
    const fichier = await inserer("hash-fichier", { source: SOURCE_APPRENANT.FICHIER });

    await supprimerDoublon(erp._id, UTILISATEUR);

    expect(await effectifsDb().distinct("_id", { organisme_id: organisme._id })).toEqual([fichier._id]);
    expect(await effectifsArchiveDb().countDocuments({ id_erp_apprenant: "ERP-1" })).toBe(1);
  });

  it("refuse de supprimer à l'écran un effectif qui n'a pas de doublon", async () => {
    const seul = await inserer("ERP-1");

    await expect(supprimerDoublon(seul._id, UTILISATEUR)).rejects.toSatisfy(
      (err: unknown) => Boom.isBoom(err) && err.output.statusCode === 409
    );
    expect(await effectifsDb().countDocuments({ _id: seul._id })).toBe(1);
  });

  it("détecte aussi les doublons de l'année scolaire précédente", async () => {
    await inserer("ERP-1", { annee: "2025-2026" });
    await inserer("hash-fichier", { annee: "2025-2026", source: SOURCE_APPRENANT.FICHIER });
    await inserer("ERP-2024", { annee: "2024-2025", apprenant: { prenom: "Lou" } });
    await inserer("hash-2024", { annee: "2024-2025", apprenant: { prenom: "Lou" }, source: SOURCE_APPRENANT.FICHIER });

    const { totalItems, data } = await getDuplicatesEffectifsForOrganismeIdWithPagination(organisme._id, 1, 10);

    expect(totalItems).toBe(1);
    expect(data[0]._id).toMatchObject({ annee_scolaire: "2025-2026" });
  });

  it("regroupe une date de naissance ERP enregistrée la veille à 23 h UTC", async () => {
    await inserer("ERP-1", { apprenant: { date_de_naissance: new Date("2007-03-03T23:00:00Z") } });
    await inserer("hash-fichier", { source: SOURCE_APPRENANT.FICHIER });

    expect((await getDuplicatesEffectifsForOrganismeIdWithPagination(organisme._id, 1, 10)).totalItems).toBe(1);
  });

  it("regroupe les noms aux lettres d'Europe centrale", async () => {
    await inserer("ERP-1", { apprenant: { nom: "ŠIMIĆ" } });
    await inserer("hash-fichier", { apprenant: { nom: "SIMIC" }, source: SOURCE_APPRENANT.FICHIER });

    expect((await getDuplicatesEffectifsForOrganismeIdWithPagination(organisme._id, 1, 10)).totalItems).toBe(1);
  });

  it("entre deux effectifs de même source, garde le dernier transmis même si l'autre a été retouché après", async () => {
    const transmisEnDernier = await inserer("recent", {
      source: SOURCE_APPRENANT.FICHIER,
      transmisLe: new Date("2026-09-20T00:00:00Z"),
      misAJourLe: new Date("2026-09-21T00:00:00Z"),
    });
    await inserer("ancien", {
      source: SOURCE_APPRENANT.FICHIER,
      transmisLe: new Date("2026-06-01T00:00:00Z"),
      misAJourLe: new Date("2026-09-26T03:00:00Z"),
    });

    await supprimerDoublonsEnLot(organisme._id, UTILISATEUR);

    expect(await effectifsDb().distinct("_id", { organisme_id: organisme._id })).toEqual([transmisEnDernier._id]);
  });

  it("en lot, ne garde qu'un effectif d'un groupe de trois", async () => {
    const erp = await inserer("ERP-1");
    await inserer("hash-1", { source: SOURCE_APPRENANT.FICHIER });
    await inserer("hash-2", { source: SOURCE_APPRENANT.FICHIER });

    expect(await supprimerDoublonsEnLot(organisme._id, UTILISATEUR)).toEqual({ supprimes: 2, refuses: 0 });
    expect(await effectifsDb().distinct("_id", { organisme_id: organisme._id })).toEqual([erp._id]);
  });

  it("en lot, compte un doublon en erreur et continue avec les suivants", async () => {
    await inserer("ERP-1");
    await inserer("hash-1", { source: SOURCE_APPRENANT.FICHIER });
    await inserer("ERP-2", { apprenant: { prenom: "Lou" } });
    await inserer("hash-2", { apprenant: { prenom: "Lou" }, source: SOURCE_APPRENANT.FICHIER });
    const original = effectifsActions.softDeleteEffectif;
    vi.spyOn(effectifsActions, "softDeleteEffectif")
      .mockRejectedValueOnce(new Error("écriture impossible"))
      .mockImplementation(original);

    expect(await supprimerDoublonsEnLot(organisme._id, UTILISATEUR)).toEqual({ supprimes: 1, refuses: 1 });
  });

  it("garde l'effectif quand son jumeau disparaît pendant la suppression", async () => {
    const erp = await inserer("ERP-1");
    const fichier = await inserer("hash-fichier", { source: SOURCE_APPRENANT.FICHIER });
    const original = repointage.repointerLiensVersJumeau;
    vi.spyOn(repointage, "repointerLiensVersJumeau").mockImplementation(async (...args) => {
      await effectifsDb().deleteOne({ _id: fichier._id });
      return original(...args);
    });

    await expect(supprimerDoublon(erp._id, UTILISATEUR)).rejects.toSatisfy(
      (err: unknown) => Boom.isBoom(err) && err.output.statusCode === 409
    );
    expect(await effectifsDb().countDocuments({ _id: erp._id })).toBe(1);
  });

  it("refuse à l'écran la suppression d'un effectif dont le dossier Mission Locale ne peut pas être reporté", async () => {
    await inserer("ERP-1", { statut: STATUT_APPRENANT.APPRENTI });
    const fichier = await inserer("hash-fichier", {
      source: SOURCE_APPRENANT.FICHIER,
      statut: STATUT_APPRENANT.RUPTURANT,
    });
    await insererDossierMl(avecStatut(fichier, STATUT_APPRENANT.RUPTURANT));

    await expect(supprimerDoublon(fichier._id, UTILISATEUR)).rejects.toSatisfy(
      (err: unknown) => Boom.isBoom(err) && err.output.statusCode === 409
    );
    expect(await effectifsDb().countDocuments({ _id: fichier._id })).toBe(1);
  });

  it("rafraîchit les statistiques de la Mission Locale dont un dossier a été reporté", async () => {
    await inserer("ERP-1");
    const fichier = await inserer("hash-fichier", { source: SOURCE_APPRENANT.FICHIER });
    await insererDossierMl(fichier);
    const stats = vi
      .spyOn(statsMissionLocale, "createOrUpdateMissionLocaleStats")
      .mockResolvedValue(undefined as never);

    await supprimerDoublonsEnLot(organisme._id, UTILISATEUR);

    expect(stats).toHaveBeenCalledWith(ML_ID);
  });
});
