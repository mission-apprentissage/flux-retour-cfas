import { ObjectId } from "mongodb";
import { SOURCE_APPRENANT, STATUT_APPRENANT } from "shared/constants";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { getAnneeScolaireFromDate } from "shared/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as collections from "@/common/model/collections";
import { effectifsDb, effectifsDECADb, missionLocaleEffectifsDb, organismesDb } from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";
import { restaurerDecaFichier, retablirDecaFichier } from "@/jobs/tmp/retablir-deca-fichier";
import { createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { testDoc } from "@tests/utils/testUtils";

const anneeCourante = getAnneeScolaireFromDate(new Date());

function organisme(extra: Partial<IOrganisme>): IOrganisme {
  return { _id: new ObjectId(), ...createRandomOrganisme({ reseaux: [] }), ...extra };
}

async function contratDeca(
  organisme_id: ObjectId,
  statut: (typeof STATUT_APPRENANT)[keyof typeof STATUT_APPRENANT] = STATUT_APPRENANT.APPRENTI
) {
  const _id = new ObjectId();
  await effectifsDECADb().insertOne(
    testDoc<IEffectifDECA>({
      _id,
      organisme_id,
      annee_scolaire: anneeCourante,
      is_deca_compatible: false,
      _computed: { statut: { en_cours: statut, parcours: [] } },
    }),
    { bypassDocumentValidation: true }
  );
  return _id;
}

describe("tmp:retablir-deca-fichier", () => {
  useMongo();

  let fichierSeul: IOrganisme;
  let fichierAvecFormateurErp: IOrganisme;
  let formateurErp: IOrganisme;
  let fichierAvecEffectifsErp: IOrganisme;
  let contratFichierSeul: ObjectId;
  let contratAvecFormateurErp: ObjectId;

  beforeEach(async () => {
    fichierSeul = organisme({ is_transmission_target: true, erps: ["FICHIER"] });
    formateurErp = organisme({ is_transmission_target: true, erps: ["ymag"] });
    fichierAvecFormateurErp = organisme({
      is_transmission_target: true,
      erps: ["FICHIER"],
      organismesFormateurs: [{ _id: formateurErp._id, uai: formateurErp.uai, siret: formateurErp.siret }],
    });
    fichierAvecEffectifsErp = organisme({ is_transmission_target: true, erps: ["FICHIER"] });
    await organismesDb().insertMany([fichierSeul, formateurErp, fichierAvecFormateurErp, fichierAvecEffectifsErp]);
    await effectifsDb().insertOne(
      testDoc<IEffectif>({
        _id: new ObjectId(),
        organisme_id: fichierAvecEffectifsErp._id,
        annee_scolaire: anneeCourante,
        source: SOURCE_APPRENANT.ERP,
      }),
      { bypassDocumentValidation: true }
    );
    contratFichierSeul = await contratDeca(fichierSeul._id, STATUT_APPRENANT.RUPTURANT);
    contratAvecFormateurErp = await contratDeca(fichierAvecFormateurErp._id);
    await missionLocaleEffectifsDb().insertOne(
      testDoc({
        _id: new ObjectId(),
        effectif_id: contratFichierSeul,
        effectif_snapshot: { _id: contratFichierSeul, is_deca_compatible: false },
      }) as never,
      { bypassDocumentValidation: true }
    );
  });

  it("simule sans rien écrire", async () => {
    const bilan = await retablirDecaFichier();

    expect(bilan).toMatchObject({
      appliquer: false,
      organismesCibles: 3,
      organismesRetablis: 1,
      contratsDecaParAnnee: { [anneeCourante]: 1 },
      contratsDecaEnRupture: 1,
      dossiersMl: 1,
      sauvegarde: null,
    });
    expect((await organismesDb().findOne({ _id: fichierSeul._id }))?.is_transmission_target).toBe(true);
    expect((await effectifsDECADb().findOne({ _id: contratFichierSeul }))?.is_deca_compatible).toBe(false);
  });

  it("rétablit seulement les organismes sans aucune transmission hors fichier, après sauvegarde", async () => {
    const bilan = await retablirDecaFichier({ appliquer: true });

    expect((await organismesDb().findOne({ _id: fichierSeul._id }))?.is_transmission_target).toBe(false);
    expect((await effectifsDECADb().findOne({ _id: contratFichierSeul }))?.is_deca_compatible).toBe(true);
    expect(
      (await missionLocaleEffectifsDb().findOne({ effectif_id: contratFichierSeul }))?.effectif_snapshot
    ).toMatchObject({ is_deca_compatible: true });

    expect((await organismesDb().findOne({ _id: fichierAvecFormateurErp._id }))?.is_transmission_target).toBe(true);
    expect((await organismesDb().findOne({ _id: formateurErp._id }))?.is_transmission_target).toBe(true);
    expect((await organismesDb().findOne({ _id: fichierAvecEffectifsErp._id }))?.is_transmission_target).toBe(true);
    expect((await effectifsDECADb().findOne({ _id: contratAvecFormateurErp }))?.is_deca_compatible).toBe(false);

    expect(bilan.sauvegarde).toMatch(/^sauvegarde_retablir_deca_fichier_\d{8}$/);
    const sauvegarde = await getDatabase()
      .collection(bilan.sauvegarde as string)
      .find({}, { projection: { _id: 0 } })
      .toArray();
    expect(sauvegarde).toEqual(
      expect.arrayContaining([
        { collection: "organismes", document_id: fichierSeul._id, is_transmission_target: true },
        { collection: "effectifsDECA", document_id: contratFichierSeul, is_deca_compatible: false },
        { collection: "missionLocaleEffectif", document_id: expect.any(ObjectId), is_deca_compatible: false },
      ])
    );
    expect(sauvegarde).toHaveLength(3);
  });

  it("ne crée aucune collection de sauvegarde en simulation", async () => {
    const sauvegardes = () =>
      getDatabase()
        .listCollections({ name: /^sauvegarde_retablir_deca_fichier_/ })
        .toArray();
    for (const { name } of await sauvegardes()) {
      await getDatabase().collection(name).drop();
    }

    await retablirDecaFichier();

    expect(await sauvegardes()).toEqual([]);
  });

  it("traite les organismes marqués de l'ancien nom de la source fichier", async () => {
    const ancienNom = organisme({ is_transmission_target: true, erps: ["televersement", "FICHIER"] });
    const ancienNomSeul = organisme({ is_transmission_target: true, erps: ["televersement"] });
    await organismesDb().insertMany([ancienNom, ancienNomSeul]);

    const bilan = await retablirDecaFichier({ appliquer: true });

    expect(bilan.organismesCibles).toBe(5);
    expect((await organismesDb().findOne({ _id: ancienNom._id }))?.is_transmission_target).toBe(false);
    expect((await organismesDb().findOne({ _id: ancienNomSeul._id }))?.is_transmission_target).toBe(false);
  });

  it("rétablit aussi un membre de la hiérarchie qui n'est pas cible lui-même", async () => {
    const formateurSansErps = organisme({ is_transmission_target: true, erps: [] });
    const responsable = organisme({
      is_transmission_target: true,
      erps: ["FICHIER"],
      organismesFormateurs: [
        { _id: formateurSansErps._id, uai: formateurSansErps.uai, siret: formateurSansErps.siret },
      ],
    });
    await organismesDb().insertMany([formateurSansErps, responsable]);

    await retablirDecaFichier({ appliquer: true });

    expect((await organismesDb().findOne({ _id: formateurSansErps._id }))?.is_transmission_target).toBe(false);
  });

  it("reste rejouable quand l'écriture des contrats échoue", async () => {
    const original = collections.effectifsDECADb;
    const espion = vi.spyOn(collections, "effectifsDECADb").mockImplementation(() =>
      Object.assign(Object.create(original()), {
        updateMany: () => Promise.reject(new Error("écriture impossible")),
      })
    );
    await expect(retablirDecaFichier({ appliquer: true })).rejects.toThrow("écriture impossible");
    espion.mockRestore();

    await retablirDecaFichier({ appliquer: true });

    expect((await organismesDb().findOne({ _id: fichierSeul._id }))?.is_transmission_target).toBe(false);
    expect((await effectifsDECADb().findOne({ _id: contratFichierSeul }))?.is_deca_compatible).toBe(true);
  });

  it("annule un rétablissement à partir de sa sauvegarde", async () => {
    const { sauvegarde } = await retablirDecaFichier({ appliquer: true });

    const bilan = await restaurerDecaFichier(sauvegarde as string);

    expect(bilan).toMatchObject({ organismes: 1, contratsDeca: 1, dossiersMl: 1 });
    expect((await organismesDb().findOne({ _id: fichierSeul._id }))?.is_transmission_target).toBe(true);
    expect((await effectifsDECADb().findOne({ _id: contratFichierSeul }))?.is_deca_compatible).toBe(false);
    expect(
      (await missionLocaleEffectifsDb().findOne({ effectif_id: contratFichierSeul }))?.effectif_snapshot
    ).toMatchObject({ is_deca_compatible: false });
  });

  it("refuse de restaurer depuis une collection qui n'est pas une sauvegarde", async () => {
    await expect(restaurerDecaFichier("organismes")).rejects.toThrow("Sauvegarde inconnue");
  });
});
