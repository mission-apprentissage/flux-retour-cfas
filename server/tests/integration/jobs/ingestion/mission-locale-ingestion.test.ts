import { ObjectId } from "bson";
import { it, expect, describe, beforeEach } from "vitest";

import { createOrganisme } from "@/common/actions/organismes/organismes.actions";
import { effectifsDb, effectifsQueueDb, organismesReferentielDb } from "@/common/model/collections";
import { processEffectifsQueue } from "@/jobs/ingestion/process-ingestion";
import { mockApiApprentissageCertificationApi } from "@tests/data/api.apprentissage.beta.gouv.fr/certification/apiApprentissage.certification.mock";
import { createRandomDossierApprenantApiInputV3, createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";

const UAI = "0802004U";
const SIRET = "77937827200016";

const UAI_REFERENTIEL_FERME = "4422672E";
const SIRET_REFERENTIEL_FERME = "44370584100099";

const UAI_RESPONSABLE = "0755805C";
const SIRET_RESPONSABLE = "77568013501139";

describe("Processus d'ingestion des adresses des missions locales", () => {
  useNock();
  useMongo();
  mockApiApprentissageCertificationApi();

  beforeEach(async () => {
    await organismesReferentielDb().insertMany([
      {
        _id: new ObjectId(),
        uai: UAI,
        siret: SIRET,
        nature: "formateur",
        lieux_de_formation: [{ uai: UAI }],
        relations: [],
      },
      {
        _id: new ObjectId(),
        uai: UAI_RESPONSABLE,
        siret: SIRET_RESPONSABLE,
        nature: "responsable",
        lieux_de_formation: [{ uai: UAI_RESPONSABLE }],
        relations: [],
      },
      {
        _id: new ObjectId(),
        uai: UAI_REFERENTIEL_FERME,
        siret: SIRET_REFERENTIEL_FERME,
        nature: "formateur",
        lieux_de_formation: [{ uai: UAI_REFERENTIEL_FERME }],
        relations: [],
        etat_administratif: "fermé",
      },
    ]);
    await createOrganisme(createRandomOrganisme({ uai: UAI, siret: SIRET }));
    await createOrganisme(createRandomOrganisme({ uai: UAI_RESPONSABLE, siret: SIRET_RESPONSABLE }));

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
});
