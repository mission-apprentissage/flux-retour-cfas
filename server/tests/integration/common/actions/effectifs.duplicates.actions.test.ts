import { strict as assert } from "assert";

import { ObjectId } from "mongodb";

import { getDuplicatesEffectifsForOrganismeId } from "@/common/actions/effectifs.duplicates.actions";
import { Organisme } from "@/common/model/@types";
import { effectifsDb, organismesDb } from "@/common/model/collections";
import { createSampleEffectif, createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { id } from "@tests/utils/testUtils";

const TEST_SIREN = "190404921";

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
          annee_scolaire: "2023-2024",
        })
        .then(({ insertedId }) => insertedId)
    );
  }

  return Promise.all(insertedIdList);
};

const sanitizeString = (string) => string.replace(/\s/g, "").toLowerCase();

describe("Test des actions Effectifs Duplicates", () => {
  useMongo();
  describe("getDuplicatesEffectifsForOrganismeId", () => {
    beforeEach(async () => {
      // Création d'un organisme de test
      await organismesDb().insertOne(sampleOrganisme);
    });

    it("Permet de vérifier la récupération de doublons d'effectifs", async () => {
      // Ajout de 2 doublons d'effectifs
      const sampleEffectif = createSampleEffectif({ organisme: sampleOrganisme, annee_scolaire: "2023-2024" });
      await insertDuplicateEffectifs(sampleEffectif);

      const duplicates = await getDuplicatesEffectifsForOrganismeId(sampleOrganismeId);

      // Vérification de la récupération d'une liste avec un doublon identifié 2 fois sur les champs de la clé d'unicité
      assert.equal(duplicates.length, 1);
      assert.equal(duplicates[0].count, 2);
      assert.equal(duplicates[0].duplicates.length, 2);

      assert.equal(sanitizeString(duplicates[0]._id.nom_apprenant), sanitizeString(sampleEffectif.apprenant.nom));
      assert.equal(sanitizeString(duplicates[0]._id.prenom_apprenant), sanitizeString(sampleEffectif.apprenant.prenom));
      assert.deepEqual(duplicates[0]._id.date_de_naissance_apprenant, sampleEffectif.apprenant.date_de_naissance);
      assert.equal(duplicates[0]._id.annee_scolaire, sampleEffectif.annee_scolaire);
      assert.equal(duplicates[0]._id.formation_cfd, sampleEffectif.formation?.cfd);
    });

    it("Permet de vérifier la non récupération de doublons d'effectifs", async () => {
      // Ajout d'effectif
      await insertDuplicateEffectifs(
        createSampleEffectif({ organisme: sampleOrganisme, annee_scolaire: "2023-2024" }),
        1
      );
      const duplicates = await getDuplicatesEffectifsForOrganismeId(sampleOrganismeId);

      // Vérification de la récupération des doublons
      assert.equal(duplicates.length, 0);
    });

    it("Permet de vérifier la récupération de doublons d'effectifs avec un prénom multi-casse", async () => {
      // Ajout de 2 doublons d'effectifs
      const sampleEffectif = createSampleEffectif({
        organisme: sampleOrganisme,
        apprenant: { prenom: "SYlvAiN" },
        annee_scolaire: "2023-2024",
      });
      await insertDuplicateEffectifs(sampleEffectif, 5);

      const duplicates = await getDuplicatesEffectifsForOrganismeId(sampleOrganismeId);

      // Vérification de la récupération d'une liste avec un doublon identifié 5 fois sur les champs de la clé d'unicité
      assert.equal(duplicates.length, 1);
      assert.equal(duplicates[0].count, 5);
      assert.equal(duplicates[0].duplicates.length, 5);

      assert.equal(sanitizeString(duplicates[0]._id.nom_apprenant), sanitizeString(sampleEffectif.apprenant.nom));
      assert.equal(sanitizeString(duplicates[0]._id.prenom_apprenant), sanitizeString(sampleEffectif.apprenant.prenom));
      assert.deepEqual(duplicates[0]._id.date_de_naissance_apprenant, sampleEffectif.apprenant.date_de_naissance);
      assert.equal(duplicates[0]._id.annee_scolaire, sampleEffectif.annee_scolaire);
      assert.equal(duplicates[0]._id.formation_cfd, sampleEffectif.formation?.cfd);
    });

    it("Permet de vérifier la récupération de doublons d'effectifs avec un nom multi-casse", async () => {
      // Ajout de 2 doublons d'effectifs
      const sampleEffectif = createSampleEffectif({
        organisme: sampleOrganisme,
        apprenant: { nom: "mBaPpe" },
        annee_scolaire: "2023-2024",
      });
      await insertDuplicateEffectifs(sampleEffectif);

      const duplicates = await getDuplicatesEffectifsForOrganismeId(sampleOrganismeId);

      // Vérification de la récupération d'une liste avec un doublon identifié 2 fois sur les champs de la clé d'unicité
      assert.equal(duplicates.length, 1);
      assert.equal(duplicates[0].count, 2);
      assert.equal(duplicates[0].duplicates.length, 2);

      assert.equal(sanitizeString(duplicates[0]._id.nom_apprenant), sanitizeString(sampleEffectif.apprenant.nom));
      assert.equal(sanitizeString(duplicates[0]._id.prenom_apprenant), sanitizeString(sampleEffectif.apprenant.prenom));
      assert.deepEqual(duplicates[0]._id.date_de_naissance_apprenant, sampleEffectif.apprenant.date_de_naissance);
      assert.equal(duplicates[0]._id.annee_scolaire, sampleEffectif.annee_scolaire);
      assert.equal(duplicates[0]._id.formation_cfd, sampleEffectif.formation?.cfd);
    });

    it("Permet de vérifier la récupération de doublons d'effectifs avec un prénom avec caractères spéciaux, accents et espace", async () => {
      // Ajout de 2 doublons d'effectifs
      const sampleEffectif = createSampleEffectif({
        organisme: sampleOrganisme,
        apprenant: { prenom: "JeAn- éDouArd" },
        annee_scolaire: "2023-2024",
      });
      await insertDuplicateEffectifs(sampleEffectif, 5);

      const duplicates = await getDuplicatesEffectifsForOrganismeId(sampleOrganismeId);

      // Vérification de la récupération d'une liste avec un doublon identifié 5 fois sur les champs de la clé d'unicité
      assert.equal(duplicates.length, 1);
      assert.equal(duplicates[0].count, 5);
      assert.equal(duplicates[0].duplicates.length, 5);

      assert.equal(sanitizeString(duplicates[0]._id.nom_apprenant), sanitizeString(sampleEffectif.apprenant.nom));
      assert.equal(sanitizeString(duplicates[0]._id.prenom_apprenant), "jeanédouard"); // Transformation du prenom_apprenant en champ normalisé
      assert.deepEqual(duplicates[0]._id.date_de_naissance_apprenant, sampleEffectif.apprenant.date_de_naissance);
      assert.equal(duplicates[0]._id.annee_scolaire, sampleEffectif.annee_scolaire);
      assert.equal(duplicates[0]._id.formation_cfd, sampleEffectif.formation?.cfd);
    });

    it("Permet de vérifier la récupération de doublons d'effectifs avec un nom avec caractères spéciaux, accents et espace", async () => {
      // Ajout de 2 doublons d'effectifs
      const sampleEffectif = createSampleEffectif({
        organisme: sampleOrganisme,
        apprenant: { nom: "M' BaPpé" },
        annee_scolaire: "2023-2024",
      });
      await insertDuplicateEffectifs(sampleEffectif, 5);

      const duplicates = await getDuplicatesEffectifsForOrganismeId(sampleOrganismeId);

      // Vérification de la récupération d'une liste avec un doublon identifié 5 fois sur les champs de la clé d'unicité
      assert.equal(duplicates.length, 1);
      assert.equal(duplicates[0].count, 5);
      assert.equal(duplicates[0].duplicates.length, 5);

      assert.equal(sanitizeString(duplicates[0]._id.nom_apprenant), "mbappé"); // Transformation du nom en champ normalisé
      assert.equal(sanitizeString(duplicates[0]._id.prenom_apprenant), sanitizeString(sampleEffectif.apprenant.prenom));
      assert.deepEqual(duplicates[0]._id.date_de_naissance_apprenant, sampleEffectif.apprenant.date_de_naissance);
      assert.equal(duplicates[0]._id.annee_scolaire, sampleEffectif.annee_scolaire);
      assert.equal(duplicates[0]._id.formation_cfd, sampleEffectif.formation?.cfd);
    });
  });
});
