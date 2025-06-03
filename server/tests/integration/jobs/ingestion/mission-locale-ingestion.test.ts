import { ObjectId } from "bson";
import { it, expect, describe, beforeEach } from "vitest";

import {
  effectifsDb,
  effectifsQueueDb,
  missionLocaleEffectifsDb,
  organisationsDb,
  organismesDb,
} from "@/common/model/collections";
import { processEffectifsQueue } from "@/jobs/ingestion/process-ingestion";
import { mockApiApprentissageCertificationApi } from "@tests/data/api.apprentissage.beta.gouv.fr/certification/apiApprentissage.certification.mock";
import {
  createRandomDossierApprenantApiInputV3,
  createRandomOrganisme,
  createRandomRupturantDossierApprenantApiInputV3,
} from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";

const UAI = "0802004U";
const SIRET = "77937827200016";

const UAI_RESPONSABLE = "0755805C";
const SIRET_RESPONSABLE = "77568013501139";

describe("Processus d'ingestion des adresses des missions locales", () => {
  useNock();
  useMongo();
  mockApiApprentissageCertificationApi();

  beforeEach(async () => {
    await organismesDb().insertMany([
      { _id: new ObjectId(), ...createRandomOrganisme({ uai: UAI, siret: SIRET }) },
      { _id: new ObjectId(), ...createRandomOrganisme({ uai: UAI_RESPONSABLE, siret: SIRET_RESPONSABLE }) },
    ]);

    await organisationsDb().insertOne({
      _id: new ObjectId(),
      type: "MISSION_LOCALE",
      nom: "MA MISSION LOCALE",
      created_at: new Date(),
      ml_id: 609,
      email: "",
      telephone: "",
      site_web: "",
    });
    await effectifsQueueDb().deleteMany({});
    await effectifsDb().deleteMany({});
  });

  it("Ajoute la mission locale dans l'adresse de l'apprenant", async () => {
    const payload = createRandomDossierApprenantApiInputV3({
      etablissement_formateur_uai: UAI,
      etablissement_formateur_siret: SIRET,
      etablissement_responsable_uai: UAI_RESPONSABLE,
      etablissement_responsable_siret: SIRET_RESPONSABLE,
      code_postal_apprenant: "75001",
    });

    const { insertedId } = await effectifsQueueDb().insertOne({
      _id: new ObjectId(),
      created_at: new Date(),
      ...payload,
    });

    await processEffectifsQueue();

    const effectifQueue = await effectifsQueueDb().findOne({ _id: insertedId });
    const effectifId = effectifQueue?.effectif_id;
    expect(effectifId).toBeDefined();
    if (effectifId) {
      const effectif = await effectifsDb().findOne({ _id: effectifId });
      expect(effectif?.apprenant.adresse?.mission_locale_id).toStrictEqual(609);
    }
  });

  // Création d'un effectif d'une ml doit créer un effctifMissionLocale vide

  it("L'ajout d'un effectif rupturant doit créer un effectifMissionLocale ", async () => {
    const payload = createRandomRupturantDossierApprenantApiInputV3({
      etablissement_formateur_uai: UAI,
      etablissement_formateur_siret: SIRET,
      etablissement_responsable_uai: UAI_RESPONSABLE,
      etablissement_responsable_siret: SIRET_RESPONSABLE,
      code_postal_apprenant: "75001",
    });

    const { insertedId } = await effectifsQueueDb().insertOne({
      _id: new ObjectId(),
      created_at: new Date(),
      ...payload,
    });

    await processEffectifsQueue();

    const effectifQueue = await effectifsQueueDb().findOne({ _id: insertedId });
    const effectifId = effectifQueue?.effectif_id;
    expect(effectifId).toBeDefined();
    if (effectifId) {
      const effectif = await effectifsDb().findOne({ _id: effectifId });
      expect(effectif?.apprenant.adresse?.mission_locale_id).toStrictEqual(609);

      const effectifML = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
      expect(effectifML?.effectif_snapshot).toEqual(effectif);
    }
  });

  it("L'ajout d'un effectif rupturant déja existant ne doit pas créer un effectifMissionLocale ", async () => {
    const payload = createRandomRupturantDossierApprenantApiInputV3({
      etablissement_formateur_uai: UAI,
      etablissement_formateur_siret: SIRET,
      etablissement_responsable_uai: UAI_RESPONSABLE,
      etablissement_responsable_siret: SIRET_RESPONSABLE,
      code_postal_apprenant: "75001",
    });

    // Premier ajout
    const { insertedId } = await effectifsQueueDb().insertOne({
      _id: new ObjectId(),
      created_at: new Date(),
      ...payload,
    });

    await processEffectifsQueue();

    const effectifQueue = await effectifsQueueDb().findOne({ _id: insertedId });
    const effectifId = effectifQueue?.effectif_id;
    expect(effectifId).toBeDefined();

    if (!effectifId) {
      return;
    }

    const effectif = await effectifsDb().findOne({ _id: effectifId });
    expect(effectif?.apprenant.adresse?.mission_locale_id).toStrictEqual(609);

    const effectifML = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId });
    expect(effectifML?.effectif_snapshot).toEqual(effectif);

    // Second ajout

    const inserted = await effectifsQueueDb().insertOne({
      _id: new ObjectId(),
      created_at: new Date(),
      ...payload,
    });
    await processEffectifsQueue();

    const effectifQueue2 = await effectifsQueueDb().findOne({ _id: inserted.insertedId });
    const effectifId2 = effectifQueue2?.effectif_id;
    expect(effectifId2).toBeDefined();

    if (!effectifId2) {
      return;
    }

    const effectif2 = await effectifsDb().findOne({ _id: effectifId2 });
    expect(effectif2?.apprenant.adresse?.mission_locale_id).toStrictEqual(609);

    const effectifML2 = await missionLocaleEffectifsDb().findOne({ effectif_id: effectifId2 });

    expect(effectifML2?.effectif_snapshot).toEqual(effectif);
    expect(effectifML2?.effectif_snapshot).not.toEqual(effectif2);
  });
});
