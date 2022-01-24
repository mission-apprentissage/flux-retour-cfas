const assert = require("assert").strict;
const integrationTests = require("../../../utils/integrationTests");
const { createRandomStatutCandidat } = require("../../../data/randomizedSample");
const {
  historySequenceInscritToApprentiToAbandon,
  historySequenceApprenti,
  historySequenceInscritToApprenti,
} = require("../../../data/historySequenceSamples");
const { StatutCandidatModel } = require("../../../../src/common/model");
const effectifs = require("../../../../src/common/components/effectifs");

integrationTests(__filename, () => {
  const seedStatutsCandidats = async (statutsProps) => {
    // Add 10 statuts with history sequence - full
    for (let index = 0; index < 10; index++) {
      const randomStatut = createRandomStatutCandidat({
        historique_statut_apprenant: historySequenceInscritToApprentiToAbandon,
        ...statutsProps,
      });
      const toAdd = new StatutCandidatModel(randomStatut);
      await toAdd.save();
    }

    // Add 5 statuts with history sequence - simple apprenti
    for (let index = 0; index < 5; index++) {
      const randomStatut = createRandomStatutCandidat({
        historique_statut_apprenant: historySequenceApprenti,
        ...statutsProps,
      });
      const toAdd = new StatutCandidatModel(randomStatut);
      await toAdd.save();
    }

    // Add 15 statuts with history sequence - inscritToApprenti
    for (let index = 0; index < 15; index++) {
      const randomStatut = createRandomStatutCandidat({
        historique_statut_apprenant: historySequenceInscritToApprenti,
        ...statutsProps,
      });
      const toAdd = new StatutCandidatModel(randomStatut);
      await toAdd.save();
    }
  };

  describe("getEffectifsCountByNiveauFormationAtDate", () => {
    it("Permet de récupérer les effectifs par niveau_formation à une date donnée", async () => {
      const { getEffectifsCountByNiveauFormationAtDate } = await effectifs();

      const filterQuery = { uai_etablissement: "0123456Z" };

      await seedStatutsCandidats({ ...filterQuery, niveau_formation: "1", niveau_formation_libelle: "1 blabla" });
      await seedStatutsCandidats({ ...filterQuery, niveau_formation: "2", niveau_formation_libelle: "2 blabla" });
      await seedStatutsCandidats({ ...filterQuery, niveau_formation: "3", niveau_formation_libelle: "3 blabla" });
      await seedStatutsCandidats({ ...filterQuery, niveau_formation: null });
      await seedStatutsCandidats({
        uai_etablissement: "0123456T",
        niveau_formation: 1,
        niveau_formation_libelle: "1 blabla",
      });

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const expectedResult = [
        {
          niveau_formation: "1",
          niveau_formation_libelle: "1 blabla",
          effectifs: {
            apprentis: 5,
            inscritsSansContrat: 15,
            rupturants: 0,
            abandons: 10,
          },
        },
        {
          niveau_formation: "2",
          niveau_formation_libelle: "2 blabla",
          effectifs: {
            apprentis: 5,
            inscritsSansContrat: 15,
            rupturants: 0,
            abandons: 10,
          },
        },
        {
          niveau_formation: "3",
          niveau_formation_libelle: "3 blabla",
          effectifs: {
            apprentis: 5,
            inscritsSansContrat: 15,
            rupturants: 0,
            abandons: 10,
          },
        },
      ];

      const effectifsByNiveauFormation = await getEffectifsCountByNiveauFormationAtDate(date, filterQuery);
      // we will sort results because we don't care of the order in the test
      const sortByNiveauFormation = (a, b) => (Number(a.niveau_formation) > Number(b.niveau_formation) ? 1 : -1);
      assert.deepEqual(effectifsByNiveauFormation.sort(sortByNiveauFormation), expectedResult);
    });
  });

  describe("getEffectifsCountByAnneeFormationAtDate", () => {
    it("Permet de récupérer les effectifs par annee_formation à une date donnée", async () => {
      const { getEffectifsCountByAnneeFormationAtDate } = await effectifs();

      const filterQuery = { uai_etablissement: "0123456Z" };

      await seedStatutsCandidats({ ...filterQuery, annee_formation: 1 });
      await seedStatutsCandidats({ ...filterQuery, annee_formation: 2 });
      await seedStatutsCandidats({ ...filterQuery, annee_formation: 3 });
      await seedStatutsCandidats({ ...filterQuery, annee_formation: null });
      await seedStatutsCandidats({ uai_etablissement: "0123456T", annee_formation: 1 });

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const expectedResult = [
        {
          annee_formation: null,
          effectifs: {
            apprentis: 5,
            inscritsSansContrat: 15,
            rupturants: 0,
            abandons: 10,
          },
        },
        {
          annee_formation: 1,
          effectifs: {
            apprentis: 5,
            inscritsSansContrat: 15,
            rupturants: 0,
            abandons: 10,
          },
        },
        {
          annee_formation: 2,
          effectifs: {
            apprentis: 5,
            inscritsSansContrat: 15,
            rupturants: 0,
            abandons: 10,
          },
        },
        {
          annee_formation: 3,
          effectifs: {
            apprentis: 5,
            inscritsSansContrat: 15,
            rupturants: 0,
            abandons: 10,
          },
        },
      ];

      const effectifsByAnneeFormation = await getEffectifsCountByAnneeFormationAtDate(date, filterQuery);
      // we will sort results because we don't care of the order in the test
      const sortByAnneeFormation = (a, b) => (a.annee_formation > b.annee_formation ? 1 : -1);
      assert.deepEqual(effectifsByAnneeFormation.sort(sortByAnneeFormation), expectedResult);
    });
  });

  describe("getEffectifsCountByFormationAtDate", () => {
    it("Permet de récupérer les effectifs par formation_cfd à une date donnée", async () => {
      const { getEffectifsCountByFormationAtDate } = await effectifs();

      const filterQuery = { uai_etablissement: "0123456Z" };

      await seedStatutsCandidats({ ...filterQuery, libelle_long_formation: "a", formation_cfd: "77929544300013" });
      await seedStatutsCandidats({ ...filterQuery, libelle_long_formation: "a", formation_cfd: "77929544300013" });
      await seedStatutsCandidats({ ...filterQuery, libelle_long_formation: "b", formation_cfd: "77929544300014" });
      await seedStatutsCandidats({ ...filterQuery, libelle_long_formation: "c", formation_cfd: "77929544300015" });
      await seedStatutsCandidats({ uai_etablissement: "0123456T", formation_cfd: "77929544300013" });

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const expectedResult = [
        {
          formation_cfd: "77929544300013",
          intitule: "a",
          effectifs: {
            apprentis: 10,
            inscritsSansContrat: 30,
            rupturants: 0,
            abandons: 20,
          },
        },
        {
          formation_cfd: "77929544300014",
          intitule: "b",
          effectifs: {
            apprentis: 5,
            inscritsSansContrat: 15,
            rupturants: 0,
            abandons: 10,
          },
        },
        {
          formation_cfd: "77929544300015",
          intitule: "c",
          effectifs: {
            apprentis: 5,
            inscritsSansContrat: 15,
            rupturants: 0,
            abandons: 10,
          },
        },
      ];

      const effectifsByFormation = await getEffectifsCountByFormationAtDate(date, filterQuery);
      // we will sort results because we don't care of the order in the test
      const sortByFormation = (a, b) => (a.formation_cfd > b.formation_cfd ? 1 : -1);
      assert.deepEqual(effectifsByFormation.sort(sortByFormation), expectedResult);
    });
  });

  describe("getEffectifsCountByCfaAtDate", () => {
    it("Permet de récupérer les effectifs par CFA à une date donnée pour une formation", async () => {
      const { getEffectifsCountByCfaAtDate } = await effectifs();

      const filterQuery = { formation_cfd: "77929544300013" };
      const cfa1 = {
        uai_etablissement: "0123456T",
        nom_etablissement: "CFA 1",
      };
      const cfa2 = {
        uai_etablissement: "012345Z",
        nom_etablissement: "CFA 2",
      };
      await seedStatutsCandidats({ ...filterQuery, ...cfa1 });
      await seedStatutsCandidats({ formation_cfd: "12345", ...cfa1 });
      await seedStatutsCandidats({ ...filterQuery, ...cfa2 });
      await seedStatutsCandidats({ ...filterQuery, ...cfa2 });

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const expectedResult = [
        {
          ...cfa1,
          effectifs: {
            apprentis: 5,
            inscritsSansContrat: 15,
            rupturants: 0,
            abandons: 10,
          },
        },
        {
          ...cfa2,
          effectifs: {
            apprentis: 10,
            inscritsSansContrat: 30,
            rupturants: 0,
            abandons: 20,
          },
        },
      ];

      const effectifsByCfa = await getEffectifsCountByCfaAtDate(date, filterQuery);
      // we will sort results because we don't care of the order in the test
      const sortByUai = (a, b) => (a.uai_etablissement > b.uai_etablissement ? 1 : -1);
      assert.deepEqual(effectifsByCfa.sort(sortByUai), expectedResult);
    });
  });

  describe("getEffectifsCountByDepartementAtDate", () => {
    it("Permet de récupérer les effectifs par departement à une date donnée", async () => {
      const { getEffectifsCountByDepartementAtDate } = await effectifs();
      const departement1 = {
        etablissement_num_departement: "75",
        etablissement_nom_departement: "Paris",
      };
      const departement2 = {
        etablissement_num_departement: "77",
        etablissement_nom_departement: "Seine-et-Marne",
      };
      await seedStatutsCandidats({ ...departement1 });
      await seedStatutsCandidats({ ...departement2 });
      await seedStatutsCandidats({ ...departement2 });

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const expectedResult = [
        {
          ...departement1,
          effectifs: {
            apprentis: 5,
            inscritsSansContrat: 15,
            rupturants: 0,
            abandons: 10,
          },
        },
        {
          ...departement2,
          effectifs: {
            apprentis: 10,
            inscritsSansContrat: 30,
            rupturants: 0,
            abandons: 20,
          },
        },
      ];

      const effectifsByDepartement = await getEffectifsCountByDepartementAtDate(date);
      // we will sort results because we don't care of the order in the test
      const sortByDepartement = (a, b) => (a.etablissement_num_departement > b.etablissement_num_departement ? 1 : -1);
      assert.deepEqual(effectifsByDepartement.sort(sortByDepartement), expectedResult);
    });
  });
});
