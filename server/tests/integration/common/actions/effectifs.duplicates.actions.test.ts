import { strict as assert } from "assert";

import { ObjectId } from "mongodb";

import {
  getDuplicatesEffectifsForOrganismeId,
  getEffectifsDuplicatesFromSIREN,
  getOrganismesHavingDuplicatesEffectifs,
} from "@/common/actions/effectifs.duplicates.actions";
import { Organisme } from "@/common/model/@types";
import { effectifsDb, organismesDb } from "@/common/model/collections";
import { createSampleEffectif, createRandomOrganisme } from "@tests/data/randomizedSample";
import { id } from "@tests/utils/testUtils";

const TEST_SIREN = "190404921";

const sampleOrganismeId = new ObjectId(id(1));
const sampleOrganisme: Organisme = {
  _id: sampleOrganismeId,
  ...createRandomOrganisme({ siret: `${TEST_SIREN}00016` }),
};

const sampleOrganisme2Id = new ObjectId(id(2));
const sampleOrganisme2: Organisme = {
  _id: sampleOrganisme2Id,
  ...createRandomOrganisme({ siret: `${TEST_SIREN}00017` }),
};

/**
 * Fonction utilitaire d'ajout en doublon d'effectif
 * @param sampleEffectif
 * @param nbDuplicates
 */
const insertDuplicateEffectifs = async (sampleEffectif, nbDuplicates = 2) => {
  const insertedIdList: ObjectId[] = [];
  for (let index = 0; index < nbDuplicates; index++) {
    const { insertedId } = await effectifsDb().insertOne({ ...sampleEffectif, id_erp_apprenant: `ID_ERP_${index}` });
    insertedIdList.push(insertedId);
  }

  return insertedIdList;
};

const sanitizeString = (string) => string.replace(/\s/g, "").toLowerCase();

describe("Test des actions Effectifs Duplicates", () => {
  describe("getDuplicatesEffectifsForOrganismeId", () => {
    beforeEach(async () => {
      // Création d'un organisme de test
      await organismesDb().insertOne(sampleOrganisme);
    });

    it("Permet de vérifier la récupération de doublons d'effectifs", async () => {
      // Ajout de 2 doublons d'effectifs
      const sampleEffectif = createSampleEffectif({ organisme: sampleOrganisme });
      await insertDuplicateEffectifs(sampleEffectif);

      const duplicates = await getDuplicatesEffectifsForOrganismeId(sampleOrganismeId);

      // Vérification de la récupération d'une liste avec un doublon identifié 2 fois sur les champs de la clé d'unicité
      assert.equal(duplicates.length, 1);
      assert.equal(duplicates[0].count, 2);
      assert.equal(duplicates[0].duplicatesIds.length, 2);

      assert.equal(sanitizeString(duplicates[0]._id.nom_apprenant), sanitizeString(sampleEffectif.apprenant.nom));
      assert.equal(sanitizeString(duplicates[0]._id.prenom_apprenant), sanitizeString(sampleEffectif.apprenant.prenom));
      assert.deepEqual(duplicates[0]._id.date_de_naissance_apprenant, sampleEffectif.apprenant.date_de_naissance);
      assert.equal(duplicates[0]._id.annee_scolaire, sampleEffectif.annee_scolaire);
      assert.equal(duplicates[0]._id.formation_cfd, sampleEffectif.formation?.cfd);
    });

    it("Permet de vérifier la non récupération de doublons d'effectifs", async () => {
      // Ajout d'effectif
      await insertDuplicateEffectifs(createSampleEffectif({ organisme: sampleOrganisme }), 1);
      const duplicates = await getDuplicatesEffectifsForOrganismeId(sampleOrganismeId);

      // Vérification de la récupération des doublons
      assert.equal(duplicates.length, 0);
    });

    it("Permet de vérifier la récupération de doublons d'effectifs avec un prénom multi-casse", async () => {
      // Ajout de 2 doublons d'effectifs
      const sampleEffectif = createSampleEffectif({ organisme: sampleOrganisme, apprenant: { prenom: "SYlvAiN" } });
      await insertDuplicateEffectifs(sampleEffectif, 5);

      const duplicates = await getDuplicatesEffectifsForOrganismeId(sampleOrganismeId);

      // Vérification de la récupération d'une liste avec un doublon identifié 5 fois sur les champs de la clé d'unicité
      assert.equal(duplicates.length, 1);
      assert.equal(duplicates[0].count, 5);
      assert.equal(duplicates[0].duplicatesIds.length, 5);

      assert.equal(sanitizeString(duplicates[0]._id.nom_apprenant), sanitizeString(sampleEffectif.apprenant.nom));
      assert.equal(sanitizeString(duplicates[0]._id.prenom_apprenant), sanitizeString(sampleEffectif.apprenant.prenom));
      assert.deepEqual(duplicates[0]._id.date_de_naissance_apprenant, sampleEffectif.apprenant.date_de_naissance);
      assert.equal(duplicates[0]._id.annee_scolaire, sampleEffectif.annee_scolaire);
      assert.equal(duplicates[0]._id.formation_cfd, sampleEffectif.formation?.cfd);
    });

    it("Permet de vérifier la récupération de doublons d'effectifs avec un nom multi-casse", async () => {
      // Ajout de 2 doublons d'effectifs
      const sampleEffectif = createSampleEffectif({ organisme: sampleOrganisme, apprenant: { nom: "mBaPpe" } });
      await insertDuplicateEffectifs(sampleEffectif);

      const duplicates = await getDuplicatesEffectifsForOrganismeId(sampleOrganismeId);

      // Vérification de la récupération d'une liste avec un doublon identifié 2 fois sur les champs de la clé d'unicité
      assert.equal(duplicates.length, 1);
      assert.equal(duplicates[0].count, 2);
      assert.equal(duplicates[0].duplicatesIds.length, 2);

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
      });
      await insertDuplicateEffectifs(sampleEffectif, 5);

      const duplicates = await getDuplicatesEffectifsForOrganismeId(sampleOrganismeId);

      // Vérification de la récupération d'une liste avec un doublon identifié 5 fois sur les champs de la clé d'unicité
      assert.equal(duplicates.length, 1);
      assert.equal(duplicates[0].count, 5);
      assert.equal(duplicates[0].duplicatesIds.length, 5);

      assert.equal(sanitizeString(duplicates[0]._id.nom_apprenant), sanitizeString(sampleEffectif.apprenant.nom));
      assert.equal(sanitizeString(duplicates[0]._id.prenom_apprenant), "jeanédouard"); // Transformation du prenom_apprenant en champ normalisé
      assert.deepEqual(duplicates[0]._id.date_de_naissance_apprenant, sampleEffectif.apprenant.date_de_naissance);
      assert.equal(duplicates[0]._id.annee_scolaire, sampleEffectif.annee_scolaire);
      assert.equal(duplicates[0]._id.formation_cfd, sampleEffectif.formation?.cfd);
    });

    it("Permet de vérifier la récupération de doublons d'effectifs avec un nom avec caractères spéciaux, accents et espace", async () => {
      // Ajout de 2 doublons d'effectifs
      const sampleEffectif = createSampleEffectif({ organisme: sampleOrganisme, apprenant: { nom: "M' BaPpé" } });
      await insertDuplicateEffectifs(sampleEffectif, 5);

      const duplicates = await getDuplicatesEffectifsForOrganismeId(sampleOrganismeId);

      // Vérification de la récupération d'une liste avec un doublon identifié 5 fois sur les champs de la clé d'unicité
      assert.equal(duplicates.length, 1);
      assert.equal(duplicates[0].count, 5);
      assert.equal(duplicates[0].duplicatesIds.length, 5);

      assert.equal(sanitizeString(duplicates[0]._id.nom_apprenant), "mbappé"); // Transformation du nom en champ normalisé
      assert.equal(sanitizeString(duplicates[0]._id.prenom_apprenant), sanitizeString(sampleEffectif.apprenant.prenom));
      assert.deepEqual(duplicates[0]._id.date_de_naissance_apprenant, sampleEffectif.apprenant.date_de_naissance);
      assert.equal(duplicates[0]._id.annee_scolaire, sampleEffectif.annee_scolaire);
      assert.equal(duplicates[0]._id.formation_cfd, sampleEffectif.formation?.cfd);
    });
  });

  describe("getEffectifsDuplicatesFromSIREN", () => {
    beforeEach(async () => {
      // Création de 2 organismes ayant le meme SIREN
      await Promise.all([organismesDb().insertOne(sampleOrganisme), organismesDb().insertOne(sampleOrganisme2)]);
    });

    it("Permet de vérifier la récupération de doublons d'effectifs sur un SIREN commun", async () => {
      // Ajout de 2 doublons d'effectifs
      const commonSampleEffectif = createSampleEffectif();
      const sampleEffectifOrganisme1 = createSampleEffectif({ ...commonSampleEffectif, organisme: sampleOrganisme });
      const sampleEffectifOrganisme2 = createSampleEffectif({ ...commonSampleEffectif, organisme: sampleOrganisme2 });

      await Promise.all([
        effectifsDb().insertOne({ ...sampleEffectifOrganisme1, id_erp_apprenant: "ID_ERP_OF1" }),
        effectifsDb().insertOne({ ...sampleEffectifOrganisme2, id_erp_apprenant: "ID_ERP_OF2" }),
      ]);

      const duplicates = await getEffectifsDuplicatesFromSIREN(TEST_SIREN);

      // Vérification de la récupération d'une liste avec doublons identifiés sur les champs de la clé d'unicité
      assert.equal(duplicates.length, 1);
      assert.equal(duplicates[0].count, 2);
      assert.equal(duplicates[0].duplicatesIds.length, 2);

      assert.equal(
        sanitizeString(duplicates[0]._id.nom_apprenant),
        sanitizeString(sampleEffectifOrganisme1.apprenant.nom)
      );
      assert.equal(
        sanitizeString(duplicates[0]._id.prenom_apprenant),
        sanitizeString(sampleEffectifOrganisme1.apprenant.prenom)
      );
      assert.deepEqual(
        duplicates[0]._id.date_de_naissance_apprenant,
        sampleEffectifOrganisme1.apprenant.date_de_naissance
      );
      assert.equal(duplicates[0]._id.annee_scolaire, sampleEffectifOrganisme1.annee_scolaire);
      assert.equal(duplicates[0]._id.formation_cfd, sampleEffectifOrganisme1.formation?.cfd);
    });

    it("Permet de vérifier la non récupération de doublons d'effectifs sur un SIREN commun", async () => {
      // Ajout d'effectif
      await effectifsDb().insertOne({ ...createSampleEffectif({ organisme: sampleOrganisme }) });
      const duplicates = await getEffectifsDuplicatesFromSIREN(TEST_SIREN);

      // Vérification de la récupération des doublons
      assert.equal(duplicates.length, 0);
    });

    it("Permet de vérifier la non récupération de doublons d'effectifs sur un mauvais SIREN commun", async () => {
      // Ajout de 2 doublons d'effectifs
      const commonSampleEffectif = createSampleEffectif();
      const sampleEffectifOrganisme1 = createSampleEffectif({ ...commonSampleEffectif, organisme: sampleOrganisme });
      const sampleEffectifOrganisme2 = createSampleEffectif({ ...commonSampleEffectif, organisme: sampleOrganisme2 });

      await Promise.all([
        effectifsDb().insertOne({ ...sampleEffectifOrganisme1, id_erp_apprenant: "ID_ERP_OF1" }),
        effectifsDb().insertOne({ ...sampleEffectifOrganisme2, id_erp_apprenant: "ID_ERP_OF2" }),
      ]);

      const duplicates = await getEffectifsDuplicatesFromSIREN("000000001");

      // Vérification de la récupération des doublons
      assert.equal(duplicates.length, 0);
    });
  });

  describe("getOrganismesHavingDuplicatesEffectifs", () => {
    beforeEach(async () => {
      await Promise.all([organismesDb().insertOne(sampleOrganisme), organismesDb().insertOne(sampleOrganisme2)]);
    });

    it("Permet de vérifier la non récupération d'organismes ayant des doublons d'effectifs", async () => {
      const organismesWithDuplicates = await getOrganismesHavingDuplicatesEffectifs();
      assert.equal(organismesWithDuplicates.length, 0);
    });

    it("Permet de vérifier la récupération d'organismes ayant des doublons d'effectifs", async () => {
      // Ajout de doublons d'effectifs à l'organisme sampleOrganisme & sampleOrganisme2
      await Promise.all([
        insertDuplicateEffectifs(createSampleEffectif({ organisme: sampleOrganisme })),
        insertDuplicateEffectifs(createSampleEffectif({ organisme: sampleOrganisme2 })),
      ]);

      const organismesWithDuplicates = await getOrganismesHavingDuplicatesEffectifs();

      assert.equal(organismesWithDuplicates.length, 2);
      assert.equal(
        organismesWithDuplicates.some(({ _id }) => _id.equals(sampleOrganismeId)),
        true
      );
      assert.equal(
        organismesWithDuplicates.some(({ _id }) => _id.equals(sampleOrganisme2Id)),
        true
      );
    });
  });
});
