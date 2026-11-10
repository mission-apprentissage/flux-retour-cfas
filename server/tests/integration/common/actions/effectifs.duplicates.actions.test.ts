import * as Boom from "@hapi/boom";
import { ObjectId } from "mongodb";
import { MOTIF_SUPPRESSION, SOURCE_APPRENANT, STATUT_APPRENANT } from "shared/constants";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { beforeEach, describe, expect, it } from "vitest";

import {
  getDuplicatesEffectifsForOrganismeIdWithPagination,
  supprimerDoublon,
  supprimerDoublonsEnLot,
} from "@/common/actions/effectifs.duplicates.actions";
import { effectifsArchiveDb, effectifsDb, missionLocaleEffectifsDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";
import {
  avecStatut,
  creerMissionLocale,
  creerOrganisme,
  identite,
  insererDossierMl,
  insererEffectif,
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
      statut,
    }: {
      apprenant?: Partial<IEffectif["apprenant"]>;
      source?: string;
      misAJourLe?: Date;
      statut?: (typeof STATUT_APPRENANT)[keyof typeof STATUT_APPRENANT];
    } = {}
  ) => {
    const effectif = await insererEffectif({
      organisme,
      idErp,
      apprenant: { ...identite, adresse: { mission_locale_id: 42 }, ...apprenant },
      statut,
    });
    await effectifsDb().updateOne({ _id: effectif._id }, { $set: { source, updated_at: misAJourLe } });
    return { ...effectif, source, updated_at: misAJourLe } as IEffectif;
  };

  beforeEach(async () => {
    organisme = await creerOrganisme("CFA de test");
    await creerMissionLocale();
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
});
