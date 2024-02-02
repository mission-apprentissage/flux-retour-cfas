import { strict as assert } from "assert";

import { ObjectId } from "mongodb";
import { Organisme } from "shared/models/data/@types";

import { getDuplicatesEffectifsForOrganismeId } from "@/common/actions/effectifs.duplicates.actions";
import { effectifsDb, organismesDb } from "@/common/model/collections";
import { createSampleEffectif, createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { id } from "@tests/utils/testUtils";

const TEST_SIREN = "190404921";
const ANNEE_SCOLAIRE = "2023-2024";

const sampleOrganismeId = new ObjectId(id(1));
const sampleOrganisme: Organisme = {
  _id: sampleOrganismeId,
  ...createRandomOrganisme({ siret: `${TEST_SIREN}00016` }),
};

/**
 * Fonction utilitaire d'ajout en doublon d'effectif
 */
const insertDuplicateEffectifs = async (sampleEffectif: any, nbDuplicates = 2) => {
  const insertedIdList: Promise<ObjectId>[] = [];
  for (let index = 0; index < nbDuplicates; index++) {
    insertedIdList.push(
      effectifsDb()
        .insertOne({
          ...sampleEffectif,
          id_erp_apprenant: `ID_ERP_${index}`,
          annee_scolaire: ANNEE_SCOLAIRE,
        })
        .then(({ insertedId }) => insertedId)
    );
  }

  return Promise.all(insertedIdList);
};

const sanitizeString = (string) => string.replace(/\s/g, "").toLowerCase();

describe("Tests des actions de détection des doublons dans les effectifs", () => {
  useMongo();

  beforeEach(async () => {
    await organismesDb().insertOne(sampleOrganisme);
  });

  const testDuplicateDetection = async (modification, expectedCount, includeFormationCFD = true) => {
    const sampleEffectif = createSampleEffectif({
      organisme: sampleOrganisme,
      annee_scolaire: ANNEE_SCOLAIRE,
      ...modification,
    });

    await insertDuplicateEffectifs(sampleEffectif, expectedCount);
    const duplicates = await getDuplicatesEffectifsForOrganismeId(sampleOrganismeId, includeFormationCFD);

    assert.equal(duplicates.length, expectedCount > 1 ? 1 : 0);

    if (expectedCount > 1) {
      assert.equal(duplicates[0].count, expectedCount);
      assert.equal(duplicates[0].duplicates.length, expectedCount);
      assert.equal(sanitizeString(duplicates[0]._id.nom_apprenant), sanitizeString(sampleEffectif.apprenant.nom));
      assert.equal(sanitizeString(duplicates[0]._id.prenom_apprenant), sanitizeString(sampleEffectif.apprenant.prenom));
      assert.deepEqual(duplicates[0]._id.date_de_naissance_apprenant, sampleEffectif.apprenant.date_de_naissance);
      assert.equal(duplicates[0]._id.annee_scolaire, sampleEffectif.annee_scolaire);
      if (includeFormationCFD) {
        assert.equal(duplicates[0]._id.formation_cfd, sampleEffectif.formation?.cfd);
      } else {
        assert.equal(duplicates[0]._id.formation_cfd, undefined);
      }
    }
  };

  it("Permet de vérifier la récupération de doublons d'effectifs", async () => {
    await testDuplicateDetection({}, 2);
  });

  it("Permet de vérifier la non récupération de doublons d'effectifs", async () => {
    await testDuplicateDetection({}, 1);
  });

  it("Permet de vérifier la récupération de doublons d'effectifs avec un prénom multi-casse", async () => {
    await testDuplicateDetection({ prenom: "SYlvAiN" }, 5);
  });

  it("Permet de vérifier la récupération de doublons d'effectifs avec un nom multi-casse", async () => {
    await testDuplicateDetection({ nom: "mBaPpe" }, 2);
  });

  it("Permet de vérifier la récupération de doublons d'effectifs avec un prénom avec caractères spéciaux, accents et espace", async () => {
    await testDuplicateDetection({ prenom: "JeAn- éDouArd" }, 5);
  });

  it("Permet de vérifier la récupération de doublons d'effectifs avec un nom avec caractères spéciaux, accents et espace", async () => {
    await testDuplicateDetection({ nom: "M' BaPpé" }, 5);
  });

  it("Permet de vérifier la détection des doublons sans prendre en compte formation_cfd", async () => {
    await testDuplicateDetection({}, 3, false);
  });
});
