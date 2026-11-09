import { ObjectId } from "mongodb";
import { SOURCE_APPRENANT, STATUT_APPRENANT } from "shared/constants";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { getAnneeScolaireFromDate } from "shared/utils";
import { beforeEach, describe, expect, it } from "vitest";

import { effectifsDb, effectifsDECADb, missionLocaleEffectifsDb, organismesDb } from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";
import { retablirDecaFichier } from "@/jobs/tmp/retablir-deca-fichier";
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
});
