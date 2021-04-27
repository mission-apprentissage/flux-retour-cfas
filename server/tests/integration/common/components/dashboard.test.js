const assert = require("assert").strict;
const integrationTests = require("../../../utils/integrationTests");
const { createRandomStatutCandidat } = require("../../../data/randomizedSample");
const {
  historySequenceProspectToInscritToApprentiToAbandon,
  historySequenceApprenti,
  historySequenceInscritToApprenti,
} = require("../../../data/historySequenceSamples");
const { StatutCandidat } = require("../../../../src/common/model");
const { codesStatutsCandidats, reseauxCfas } = require("../../../../src/common/model/constants");
const dashboardComponent = require("../../../../src/common/components/dashboard");
const {
  getStatutsSamplesInscrits,
  getStatutsSamplesApprentis,
  getStatutsSamplesAbandons,
  expectedDetailResultList,
} = require("../../../data/effectifDetailSamples");
const { asyncForEach } = require("../../../../src/common/utils/asyncUtils");

integrationTests(__filename, () => {
  describe("getEffectifsCountByStatutApprenantAtDate", () => {
    const { getEffectifsCountByStatutApprenantAtDate } = dashboardComponent();

    const seedStatutsCandidats = async (statutsProps) => {
      // Add 10 statuts with history sequence - full
      for (let index = 0; index < 10; index++) {
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceProspectToInscritToApprentiToAbandon,
          siret_etablissement_valid: true,
          ...statutsProps,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 5 statuts with history sequence - simple apprenti
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceApprenti,
          siret_etablissement_valid: true,
          ...statutsProps,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 15 statuts with history sequence - inscritToApprenti
      for (let index = 0; index < 15; index++) {
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceInscritToApprenti,
          siret_etablissement_valid: true,
          ...statutsProps,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }
    };

    it("Permet de récupérer les données d'effectifs par statut pour à date donnée", async () => {
      await seedStatutsCandidats();

      // Search params dates
      const date1 = new Date("2020-09-15T00:00:00.000+0000");
      const date2 = new Date("2020-09-30T00:00:00.000+0000");
      const date3 = new Date("2020-10-10T00:00:00.000+0000");

      const effectifsAtDate1 = await getEffectifsCountByStatutApprenantAtDate(date1);
      const effectifsAtDate2 = await getEffectifsCountByStatutApprenantAtDate(date2);
      const effectifsAtDate3 = await getEffectifsCountByStatutApprenantAtDate(date3);

      assert.deepStrictEqual(effectifsAtDate1, {
        [codesStatutsCandidats.inscrit]: { count: 10 },
        [codesStatutsCandidats.apprenti]: { count: 5 },
        [codesStatutsCandidats.abandon]: { count: 0 },
        [codesStatutsCandidats.abandonProspects]: { count: 0 },
        [codesStatutsCandidats.prospect]: { count: 0 },
      });
      assert.deepStrictEqual(effectifsAtDate2, {
        [codesStatutsCandidats.inscrit]: { count: 15 },
        [codesStatutsCandidats.apprenti]: { count: 15 },
        [codesStatutsCandidats.abandon]: { count: 0 },
        [codesStatutsCandidats.abandonProspects]: { count: 0 },
        [codesStatutsCandidats.prospect]: { count: 0 },
      });
      assert.deepStrictEqual(effectifsAtDate3, {
        [codesStatutsCandidats.inscrit]: { count: 15 },
        [codesStatutsCandidats.apprenti]: { count: 5 },
        [codesStatutsCandidats.abandon]: { count: 10 },
        [codesStatutsCandidats.abandonProspects]: { count: 0 },
        [codesStatutsCandidats.prospect]: { count: 0 },
      });
    });

    it("Renvoie des effectifs nuls à une date dans le passé pour laquelle on n'a pas d'historique", async () => {
      await seedStatutsCandidats();

      // Search params dates
      const date = new Date("2018-09-15T00:00:00.000+0000");
      const effectifsInPast = await getEffectifsCountByStatutApprenantAtDate(date);

      assert.deepStrictEqual(effectifsInPast, {
        [codesStatutsCandidats.inscrit]: { count: 0 },
        [codesStatutsCandidats.apprenti]: { count: 0 },
        [codesStatutsCandidats.abandon]: { count: 0 },
        [codesStatutsCandidats.abandonProspects]: { count: 0 },
        [codesStatutsCandidats.prospect]: { count: 0 },
      });
    });

    it("Permet de ne pas récupérer les données d'effectifs pour une période donnée si un siret est invalide", async () => {
      await seedStatutsCandidats({ siret_etablissement_valid: false });

      // Search params dates
      const date1 = new Date("2020-09-15T00:00:00.000+0000");
      const date2 = new Date("2020-10-10T00:00:00.000+0000");

      const expectedResult = {
        [codesStatutsCandidats.apprenti]: { count: 0 },
        [codesStatutsCandidats.inscrit]: { count: 0 },
        [codesStatutsCandidats.abandon]: { count: 0 },
        [codesStatutsCandidats.abandonProspects]: { count: 0 },
        [codesStatutsCandidats.prospect]: { count: 0 },
      };

      const result1 = await getEffectifsCountByStatutApprenantAtDate(date1);
      const result2 = await getEffectifsCountByStatutApprenantAtDate(date2);

      assert.deepEqual(result1, expectedResult);
      assert.deepEqual(result2, expectedResult);
    });

    it("Permet de récupérer les données d'effectifs à une date et une région", async () => {
      const filterQuery = { etablissement_num_region: "84" };
      await seedStatutsCandidats(filterQuery);

      // Search params & expected results
      const date = new Date("2020-09-15T00:00:00.000+0000");
      const expectedResult = {
        [codesStatutsCandidats.apprenti]: { count: 5 },
        [codesStatutsCandidats.inscrit]: { count: 10 },
        [codesStatutsCandidats.abandon]: { count: 0 },
        [codesStatutsCandidats.abandonProspects]: { count: 0 },
        [codesStatutsCandidats.prospect]: { count: 0 },
      };

      // Check for right etablissement_num_region filter
      const nbStatutsFoundInHistory = await getEffectifsCountByStatutApprenantAtDate(date, filterQuery);
      assert.deepEqual(nbStatutsFoundInHistory, expectedResult);

      // Check for another etablissement_num_region filter
      const badFilterQuery = { etablissement_num_region: "99" };
      const nbStatutsBadFilter = await getEffectifsCountByStatutApprenantAtDate(date, badFilterQuery);
      assert.deepEqual(nbStatutsBadFilter, {
        [codesStatutsCandidats.apprenti]: { count: 0 },
        [codesStatutsCandidats.inscrit]: { count: 0 },
        [codesStatutsCandidats.abandon]: { count: 0 },
        [codesStatutsCandidats.abandonProspects]: { count: 0 },
        [codesStatutsCandidats.prospect]: { count: 0 },
      });
    });

    it("Permet de récupérer les données d'effectifs à une date et un département", async () => {
      const filterQuery = { etablissement_num_departement: "01" };
      await seedStatutsCandidats(filterQuery);

      // Search params & expected results
      const date = new Date("2020-09-15T00:00:00.000+0000");
      const expectedResult = {
        [codesStatutsCandidats.apprenti]: { count: 5 },
        [codesStatutsCandidats.inscrit]: { count: 10 },
        [codesStatutsCandidats.abandon]: { count: 0 },
        [codesStatutsCandidats.abandonProspects]: { count: 0 },
        [codesStatutsCandidats.prospect]: { count: 0 },
      };

      // Check for right etablissement_num_departement filter
      const nbStatutsFoundInHistory = await getEffectifsCountByStatutApprenantAtDate(date, filterQuery);
      assert.deepEqual(nbStatutsFoundInHistory, expectedResult);

      // Check for another etablissement_num_departement filter
      const badFilterQuery = { etablissement_num_departement: "99" };
      const nbStatutsBadFilter = await getEffectifsCountByStatutApprenantAtDate(date, badFilterQuery);
      assert.deepEqual(nbStatutsBadFilter, {
        [codesStatutsCandidats.apprenti]: { count: 0 },
        [codesStatutsCandidats.inscrit]: { count: 0 },
        [codesStatutsCandidats.abandon]: { count: 0 },
        [codesStatutsCandidats.abandonProspects]: { count: 0 },
        [codesStatutsCandidats.prospect]: { count: 0 },
      });
    });

    it("Permet de récupérer les données d'effectifs à une date et un cfa via son siret", async () => {
      const filterQuery = { siret_etablissement: "77929544300013", siret_etablissement_valid: true };
      await seedStatutsCandidats(filterQuery);

      // Search params & expected results
      const date = new Date("2020-09-15T00:00:00.000+0000");
      const expectedResult = {
        [codesStatutsCandidats.apprenti]: { count: 5 },
        [codesStatutsCandidats.inscrit]: { count: 10 },
        [codesStatutsCandidats.abandon]: { count: 0 },
        [codesStatutsCandidats.abandonProspects]: { count: 0 },
        [codesStatutsCandidats.prospect]: { count: 0 },
      };

      // Check for right siret_etablissement filter
      const nbStatutsFoundInHistory = await getEffectifsCountByStatutApprenantAtDate(date, filterQuery);
      assert.deepEqual(nbStatutsFoundInHistory, expectedResult);

      // Check for another siret_etablissement filter
      const badFilterQuery = { siret_etablissement: "99" };
      const nbStatutsBadFilter = await getEffectifsCountByStatutApprenantAtDate(date, badFilterQuery);
      assert.deepEqual(nbStatutsBadFilter, {
        [codesStatutsCandidats.apprenti]: { count: 0 },
        [codesStatutsCandidats.inscrit]: { count: 0 },
        [codesStatutsCandidats.abandon]: { count: 0 },
        [codesStatutsCandidats.abandonProspects]: { count: 0 },
        [codesStatutsCandidats.prospect]: { count: 0 },
      });
    });

    it("Permet de récupérer les données d'effectifs pour une période et une formation via son cfd", async () => {
      const filterQuery = { id_formation: "77929544300013" };
      await seedStatutsCandidats(filterQuery);

      // Search params & expected results
      const date = new Date("2020-10-10T00:00:00.000+0000");
      const expectedResult = {
        [codesStatutsCandidats.apprenti]: { count: 5 },
        [codesStatutsCandidats.inscrit]: { count: 15 },
        [codesStatutsCandidats.abandon]: { count: 10 },
        [codesStatutsCandidats.abandonProspects]: { count: 0 },
        [codesStatutsCandidats.prospect]: { count: 0 },
      };

      // Check for right cfd filter
      const nbStatutsFoundInHistory = await getEffectifsCountByStatutApprenantAtDate(date, filterQuery);
      assert.deepEqual(nbStatutsFoundInHistory, expectedResult);

      // Check for another cfd filter
      const badFilterQuery = { id_formation: "99" };
      const nbStatutsBadFilter = await getEffectifsCountByStatutApprenantAtDate(date, badFilterQuery);
      assert.deepEqual(nbStatutsBadFilter, {
        [codesStatutsCandidats.apprenti]: { count: 0 },
        [codesStatutsCandidats.inscrit]: { count: 0 },
        [codesStatutsCandidats.abandon]: { count: 0 },
        [codesStatutsCandidats.abandonProspects]: { count: 0 },
        [codesStatutsCandidats.prospect]: { count: 0 },
      });
    });

    it("Permet de récupérer les données d'effectifs pour une date et réseau", async () => {
      const filterQuery = { etablissement_reseaux: [reseauxCfas.BTP_CFA.nomReseau] };
      await seedStatutsCandidats(filterQuery);

      // Search params & expected results
      const date = new Date("2020-10-10T00:00:00.000+0000");
      const expectedResult = {
        [codesStatutsCandidats.apprenti]: { count: 5 },
        [codesStatutsCandidats.inscrit]: { count: 15 },
        [codesStatutsCandidats.abandon]: { count: 10 },
        [codesStatutsCandidats.abandonProspects]: { count: 0 },
        [codesStatutsCandidats.prospect]: { count: 0 },
      };

      // Check for right reseau filter
      const filter = { etablissement_reseaux: { $in: [reseauxCfas.BTP_CFA.nomReseau] } };
      const nbStatutsFoundInHistory = await getEffectifsCountByStatutApprenantAtDate(date, filter);
      assert.deepEqual(nbStatutsFoundInHistory, expectedResult);

      // Check for another reseau filter
      const badFilterQuery = { etablissement_reseaux: { $in: [reseauxCfas.ANASUP.nomReseau] } };
      const nbStatutsBadFilter = await getEffectifsCountByStatutApprenantAtDate(date, badFilterQuery);
      assert.deepEqual(nbStatutsBadFilter, {
        [codesStatutsCandidats.apprenti]: { count: 0 },
        [codesStatutsCandidats.inscrit]: { count: 0 },
        [codesStatutsCandidats.abandon]: { count: 0 },
        [codesStatutsCandidats.abandonProspects]: { count: 0 },
        [codesStatutsCandidats.prospect]: { count: 0 },
      });
    });

    it("Permet de récupérer les données d'effectifs pour une date, pour une formation et une région", async () => {
      const filterQuery = { id_formation: "77929544300013", etablissement_num_region: "84" };
      await seedStatutsCandidats(filterQuery);

      // Search params & expected results
      const date = new Date("2020-10-10T00:00:00.000+0000");
      const expectedResult = {
        [codesStatutsCandidats.apprenti]: { count: 5 },
        [codesStatutsCandidats.inscrit]: { count: 15 },
        [codesStatutsCandidats.abandon]: { count: 10 },
        [codesStatutsCandidats.abandonProspects]: { count: 0 },
        [codesStatutsCandidats.prospect]: { count: 0 },
      };

      // Check for right filter
      const nbStatutsFoundInHistory = await getEffectifsCountByStatutApprenantAtDate(date, filterQuery);
      assert.deepEqual(nbStatutsFoundInHistory, expectedResult);

      // Check for another filter
      const badFilterQuery1 = { ...filterQuery, etablissement_num_region: "21" };
      const nbStatutsBadFilter1 = await getEffectifsCountByStatutApprenantAtDate(date, badFilterQuery1);
      assert.deepEqual(nbStatutsBadFilter1, {
        [codesStatutsCandidats.apprenti]: { count: 0 },
        [codesStatutsCandidats.inscrit]: { count: 0 },
        [codesStatutsCandidats.abandon]: { count: 0 },
        [codesStatutsCandidats.abandonProspects]: { count: 0 },
        [codesStatutsCandidats.prospect]: { count: 0 },
      });

      // Check for another filter
      const badFilterQuery2 = { ...filterQuery, id_formation: "123445" };
      const nbStatutsBadFilter2 = await getEffectifsCountByStatutApprenantAtDate(date, badFilterQuery2);
      assert.deepEqual(nbStatutsBadFilter2, {
        [codesStatutsCandidats.apprenti]: { count: 0 },
        [codesStatutsCandidats.inscrit]: { count: 0 },
        [codesStatutsCandidats.abandon]: { count: 0 },
        [codesStatutsCandidats.abandonProspects]: { count: 0 },
        [codesStatutsCandidats.prospect]: { count: 0 },
      });
    });
  });

  describe("getEffectifsDetailDataForSiret pour une date et un centre de formation", () => {
    const { getEffectifsDetailDataForSiret } = dashboardComponent();

    it("Permet de récupérer les données détaillées d'effectifs pour une date et un cfa via son siret", async () => {
      const siretToTest = "77929544300013";

      // Build sample statuts
      const statutsSamplesInscrits = await getStatutsSamplesInscrits(siretToTest);
      const statutsSamplesApprentis = await getStatutsSamplesApprentis(siretToTest);
      const statutsSamplesAbandons = await getStatutsSamplesAbandons(siretToTest);

      // Save all statuts to database
      const sampleStatutsListToSave = [
        ...statutsSamplesInscrits,
        ...statutsSamplesApprentis,
        ...statutsSamplesAbandons,
      ];
      await asyncForEach(sampleStatutsListToSave, async (currentStatut) => {
        await currentStatut.save();
      });

      // Search params & expected results
      const startDate = new Date("2020-09-15T00:00:00.000+0000");
      const endDate = new Date("2020-10-10T00:00:00.000+0000");

      // Gets effectif data detail
      const statutsFound = await getEffectifsDetailDataForSiret(startDate, endDate, siretToTest);

      // Check for siret
      assert.deepStrictEqual(statutsFound.length, 2);
      assert.deepStrictEqual(statutsFound, expectedDetailResultList);

      // Check for bad siret
      const badSiret = "99999999900999";
      const statutsBadSiret = await getEffectifsDetailDataForSiret(startDate, endDate, badSiret);
      assert.notDeepStrictEqual(statutsBadSiret.length, 2);
      assert.notDeepStrictEqual(statutsBadSiret, expectedDetailResultList);
    });
  });
});
