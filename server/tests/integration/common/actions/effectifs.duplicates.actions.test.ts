import { strict as assert } from "assert";

import { ObjectId } from "mongodb";
import { IOrganisme } from "shared/models/data/organismes.model";
import { getAnneesScolaireListFromDate } from "shared/utils";

import {
  deleteOldestDuplicates,
  getDuplicatesEffectifsForOrganismeIdWithPagination,
} from "@/common/actions/effectifs.duplicates.actions";
import { effectifsDb, organismesDb } from "@/common/model/collections";
import { createSampleEffectif, createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { id } from "@tests/utils/testUtils";

const TEST_SIREN = "190404921";
const ANNEE_SCOLAIRE = getAnneesScolaireListFromDate(new Date())[0];

const sampleOrganismeId = new ObjectId(id(1));
const sampleOrganisme: IOrganisme = {
  _id: sampleOrganismeId,
  ...createRandomOrganisme({ siret: `${TEST_SIREN}00016` }),
};

/**
 * Fonction utilitaire pour ajouter des doublons d'effectif basés sur id_erp_apprenant
 */
const insertDuplicateEffectifs = async (totalEffectifs = 5, duplicatesCount = 2) => {
  const insertedIdList: ObjectId[] = [];

  for (let i = 0; i < totalEffectifs; i++) {
    const idErpApprenant = `ID_ERP_${i}`;

    for (let j = 0; j < duplicatesCount; j++) {
      const effectif = {
        _id: new ObjectId(),
        ...createSampleEffectif({
          organisme: sampleOrganisme,
          annee_scolaire: ANNEE_SCOLAIRE,
          id_erp_apprenant: idErpApprenant,
        }),
      };

      const { insertedId } = await effectifsDb().insertOne(effectif);
      insertedIdList.push(insertedId);
    }
  }

  return insertedIdList;
};

describe("Tests de pagination et détection des doublons basés sur id_erp_apprenant", () => {
  useMongo();

  beforeEach(async () => {
    await effectifsDb().deleteMany({});
    await organismesDb().deleteMany({});
    await organismesDb().insertOne(sampleOrganisme);
  });

  it("doit récupérer correctement les doublons avec pagination", async () => {
    await insertDuplicateEffectifs(5, 2);

    const duplicatesPage1 = await getDuplicatesEffectifsForOrganismeIdWithPagination(sampleOrganismeId, 1, 2);
    assert.equal(duplicatesPage1.data.length, 2, "La première page doit contenir 2 effectifs en doublons");
    assert.equal(duplicatesPage1.totalItems, 5, "Doit indiquer un total de 5 effectifs en doublons");
    assert.equal(
      duplicatesPage1.data[0].duplicates.length,
      2,
      "Le groupe de doublons sur la première page doit contenir 2 éléments"
    );

    const duplicatesPage2 = await getDuplicatesEffectifsForOrganismeIdWithPagination(sampleOrganismeId, 2, 2);
    assert.equal(duplicatesPage2.data.length, 2, "La deuxième page doit encore contenir 2 effectifs en doublons");
    assert.equal(
      duplicatesPage2.data[0].duplicates.length,
      2,
      "Le groupe de doublons sur la deuxième page doit contenir 2 éléments"
    );

    const duplicatesPage3 = await getDuplicatesEffectifsForOrganismeIdWithPagination(sampleOrganismeId, 3, 2);
    assert.equal(duplicatesPage3.data.length, 1, "La troisième page doit encore contenir 1 effectifs en doublons");
    assert.equal(
      duplicatesPage3.data[0].duplicates.length,
      2,
      "Le groupe de doublons sur la troisième page doit contenir 2 éléments"
    );
  });

  it("ne doit pas récupérer de doublons si un seul effectif est présent pour un id_erp_apprenant", async () => {
    await insertDuplicateEffectifs(3, 1);

    const duplicates = await getDuplicatesEffectifsForOrganismeIdWithPagination(sampleOrganismeId, 1, 10);
    assert.equal(duplicates.data.length, 0, "Ne doit pas trouver de doublons pour un id_erp_apprenant unique");
  });
});

describe("Suppression des doublons les plus anciens", () => {
  useMongo();

  beforeEach(async () => {
    await effectifsDb().deleteMany({});
    await organismesDb().deleteMany({});
    await organismesDb().insertOne(sampleOrganisme);
  });

  it("devrait supprimer les doublons les plus anciens, ne laissant que l'enregistrement le plus récent pour chaque id_erp_apprenant", async () => {
    await insertDuplicateEffectifs(5, 3);
    await deleteOldestDuplicates(sampleOrganismeId);

    const effectifsRestants = await effectifsDb().find({ organisme_id: sampleOrganismeId }).toArray();

    assert.strictEqual(
      effectifsRestants.length,
      5,
      "Il ne devrait rester que 5 effectifs, un pour chaque id_erp_apprenant"
    );

    const counts = effectifsRestants.reduce((acc, effectif) => {
      acc[effectif.id_erp_apprenant] = (acc[effectif.id_erp_apprenant] || 0) + 1;
      return acc;
    }, {});

    const allHaveOneDuplicate = Object.values(counts).every((count) => count === 1);

    assert.strictEqual(
      allHaveOneDuplicate,
      true,
      "Chaque effectif devrait avoir exactement 1 occurrence après la suppression des doublons"
    );
  });
});
