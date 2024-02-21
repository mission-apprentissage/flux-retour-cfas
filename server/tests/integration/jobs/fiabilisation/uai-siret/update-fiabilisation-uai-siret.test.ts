import { strict as assert } from "assert";

import { effectifsDb, organismesDb } from "@/common/model/collections";
import { getEffectifsDuplicatesFromOrganismes } from "@/jobs/fiabilisation/uai-siret/update.utils";
import { createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";

describe("Job Update Fiabilisation UAI SIRET", () => {
  useMongo();
  describe("getEffectifsDuplicatesFromOrganismes", () => {
    let organisme1Id;
    let organisme2Id;
    let sampleEffectif1;
    let sampleEffectif2;

    beforeEach(async () => {
      // Ajout de 2 organismes test
      const organisme1Created = await organismesDb().insertOne({
        uai: "1133672E",
        siret: "99370584100099",
        nature: "responsable",
        relatedFormations: [],
        organismesFormateurs: [],
        organismesResponsables: [],
      });
      organisme1Id = organisme1Created.insertedId;

      const organisme2Created = await organismesDb().insertOne({
        uai: "8844672E",
        siret: "12340584100099",
        nature: "responsable",
        relatedFormations: [],
        organismesFormateurs: [],
        organismesResponsables: [],
      });
      organisme2Id = organisme2Created.insertedId;

      // Ajout de doublons : 2 effectifs sur les 2 mêmes organismes
      sampleEffectif1 = createSampleEffectif({ formation: { cfd: "01022103" } });
      sampleEffectif2 = createSampleEffectif({ formation: { cfd: "01022999" } });
    });

    afterEach(async () => {
      await organismesDb().deleteMany({});
      await effectifsDb().deleteMany({});
    });

    it("Vérifie la récupération des doublons d'effectifs sur 2 organismes", async () => {
      await effectifsDb().insertMany([
        { ...sampleEffectif1, organisme_id: organisme1Id },
        { ...sampleEffectif2, organisme_id: organisme1Id },
        { ...sampleEffectif1, organisme_id: organisme2Id },
        { ...sampleEffectif2, organisme_id: organisme2Id },
      ]);

      // Récupération des doublons & décompte
      const duplicates = await getEffectifsDuplicatesFromOrganismes(organisme1Id, organisme2Id);
      assert.deepEqual(duplicates.length, 2);
    });

    it("Vérifie la non récupération des doublons d'effectifs sur 2 organismes", async () => {
      await effectifsDb().insertMany([
        { ...sampleEffectif1, organisme_id: organisme1Id },
        { ...sampleEffectif2, organisme_id: organisme2Id },
      ]);

      // Récupération des doublons & décompte
      const duplicates = await getEffectifsDuplicatesFromOrganismes(organisme1Id, organisme2Id);
      assert.deepEqual(duplicates.length, 0);
    });
  });
});
