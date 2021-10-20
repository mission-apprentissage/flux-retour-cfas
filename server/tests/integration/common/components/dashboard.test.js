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

integrationTests(__filename, () => {
  const seedStatutsCandidats = async (statutsProps) => {
    // Add 10 statuts with history sequence - full
    for (let index = 0; index < 10; index++) {
      const randomStatut = createRandomStatutCandidat({
        historique_statut_apprenant: historySequenceProspectToInscritToApprentiToAbandon,
        ...statutsProps,
      });
      const toAdd = new StatutCandidat(randomStatut);
      await toAdd.save();
    }

    // Add 5 statuts with history sequence - simple apprenti
    for (let index = 0; index < 5; index++) {
      const randomStatut = createRandomStatutCandidat({
        historique_statut_apprenant: historySequenceApprenti,
        ...statutsProps,
      });
      const toAdd = new StatutCandidat(randomStatut);
      await toAdd.save();
    }

    // Add 15 statuts with history sequence - inscritToApprenti
    for (let index = 0; index < 15; index++) {
      const randomStatut = createRandomStatutCandidat({
        historique_statut_apprenant: historySequenceInscritToApprenti,
        ...statutsProps,
      });
      const toAdd = new StatutCandidat(randomStatut);
      await toAdd.save();
    }
  };

  describe("getApprentisCountAtDate", () => {
    const { getApprentisCountAtDate } = dashboardComponent();

    it("gets count of apprentis at one date", async () => {
      await seedStatutsCandidats();

      const date = new Date("2020-09-15T00:00:00.000+0000");
      const apprentisCount = await getApprentisCountAtDate(date);

      assert.equal(apprentisCount, 5);
    });

    it("gets count of apprentis at another date", async () => {
      await seedStatutsCandidats();

      const date = new Date("2020-09-30T00:00:00.000+0000");
      const apprentisCount = await getApprentisCountAtDate(date);

      assert.equal(apprentisCount, 15);
    });

    it("gets count of apprentis at yet another date", async () => {
      await seedStatutsCandidats();

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const apprentisCount = await getApprentisCountAtDate(date);

      assert.equal(apprentisCount, 5);
    });

    it("gets count of apprentis at a date when there was no data", async () => {
      await seedStatutsCandidats();

      const date = new Date("2010-10-10T00:00:00.000+0000");
      const apprentisCount = await getApprentisCountAtDate(date);

      assert.equal(apprentisCount, 0);
    });

    it("gets count of apprentis at a date and for a region", async () => {
      const filters = { etablissement_num_region: "28" };
      await seedStatutsCandidats(filters);

      const date = new Date("2020-09-30T00:00:00.000+0000");
      const apprentisCountForRegion = await getApprentisCountAtDate(date, filters);

      assert.equal(apprentisCountForRegion, 15);

      const apprentisCountForAnotherRegion = await getApprentisCountAtDate(date, { etablissement_num_region: "100" });
      assert.equal(apprentisCountForAnotherRegion, 0);
    });

    it("gets count of apprentis at a date and for a departement", async () => {
      const filters = { etablissement_num_departement: "75" };
      await seedStatutsCandidats(filters);

      const date = new Date("2020-09-30T00:00:00.000+0000");
      const apprentisCountForDepartement = await getApprentisCountAtDate(date, filters);

      assert.equal(apprentisCountForDepartement, 15);

      const apprentisCountForAnotherDepartement = await getApprentisCountAtDate(date, {
        etablissement_num_departement: "100",
      });
      assert.equal(apprentisCountForAnotherDepartement, 0);
    });

    it("gets count of apprentis at a date and for a siret_etablissement", async () => {
      const filters = { siret_etablissement: "77929544300013" };
      await seedStatutsCandidats(filters);

      const date = new Date("2020-09-30T00:00:00.000+0000");
      const apprentisCountForSiret = await getApprentisCountAtDate(date, filters);

      assert.equal(apprentisCountForSiret, 15);

      const apprentisCountForAnotherSiret = await getApprentisCountAtDate(date, {
        siret_etablissement: "77929544300099",
      });
      assert.equal(apprentisCountForAnotherSiret, 0);
    });

    it("gets count of apprentis at a date and for a formation_cfd", async () => {
      const filters = { formation_cfd: "2502000D" };
      await seedStatutsCandidats(filters);

      const date = new Date("2020-09-30T00:00:00.000+0000");
      const apprentisCountForCfd = await getApprentisCountAtDate(date, filters);

      assert.equal(apprentisCountForCfd, 15);

      const apprentisCountForAnotherCfd = await getApprentisCountAtDate(date, { formation_cfd: "2502000X" });
      assert.equal(apprentisCountForAnotherCfd, 0);
    });

    it("gets count of apprentis at a date and for a reseau", async () => {
      const filters = { etablissement_reseaux: reseauxCfas.BTP_CFA.nomReseau };
      await seedStatutsCandidats(filters);

      const date = new Date("2020-09-30T00:00:00.000+0000");
      const apprentisCountForReseau = await getApprentisCountAtDate(date, filters);

      assert.equal(apprentisCountForReseau, 15);

      const apprentisCountForAnotherReseau = await getApprentisCountAtDate(date, { etablissement_reseaux: "inconnu" });
      assert.equal(apprentisCountForAnotherReseau, 0);
    });
  });

  describe("getAbandonsCountAtDate", () => {
    const { getAbandonsCountAtDate } = dashboardComponent();

    it("gets count of abandons at one date", async () => {
      await seedStatutsCandidats();

      const date = new Date("2020-09-15T00:00:00.000+0000");
      const abandonsCount = await getAbandonsCountAtDate(date);

      assert.equal(abandonsCount, 0);
    });

    it("gets count of abandons at yet another date", async () => {
      await seedStatutsCandidats();

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const abandonsCount = await getAbandonsCountAtDate(date);

      assert.equal(abandonsCount, 10);
    });

    it("gets count of abandons at a date when there was no data", async () => {
      await seedStatutsCandidats();

      const date = new Date("2010-10-10T00:00:00.000+0000");
      const abandonsCount = await getAbandonsCountAtDate(date);

      assert.equal(abandonsCount, 0);
    });

    it("gets count of abandons at a date and for a region", async () => {
      const filters = { etablissement_num_region: "28" };
      await seedStatutsCandidats(filters);

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const abandonsCountForRegion = await getAbandonsCountAtDate(date, filters);

      assert.equal(abandonsCountForRegion, 10);

      const abandonsCountForAnotherRegion = await getAbandonsCountAtDate(date, { etablissement_num_region: "100" });
      assert.equal(abandonsCountForAnotherRegion, 0);
    });
  });

  describe("getEffectifsCountByNiveauFormationAtDate", () => {
    const { getEffectifsCountByNiveauFormationAtDate } = dashboardComponent();

    it("Permet de récupérer les effectifs par niveau_formation à une date donnée", async () => {
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
    const { getEffectifsCountByAnneeFormationAtDate } = dashboardComponent();

    it("Permet de récupérer les effectifs par annee_formation à une date donnée", async () => {
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
    const { getEffectifsCountByFormationAtDate } = dashboardComponent();

    it("Permet de récupérer les effectifs par formation_cfd à une date donnée", async () => {
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
    const { getEffectifsCountByCfaAtDate } = dashboardComponent();

    it("Permet de récupérer les effectifs par CFA à une date donnée pour une formation", async () => {
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
    const { getEffectifsCountByDepartementAtDate } = dashboardComponent();

    it("Permet de récupérer les effectifs par departement à une date donnée", async () => {
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

  describe("getNouveauxContratsCountInDateRange", () => {
    const { getNouveauxContratsCountInDateRange } = dashboardComponent();

    beforeEach(async () => {
      const statuts = [
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: 2, date_statut: new Date("2021-02-01T00:00:00") },
            { valeur_statut: 3, date_statut: new Date("2021-06-13T00:00:00") },
            { valeur_statut: 2, date_statut: new Date("2021-09-13T00:00:00") },
            { valeur_statut: 3, date_statut: new Date("2021-10-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: 1, date_statut: new Date("2021-03-22T00:00:00") },
            { valeur_statut: 2, date_statut: new Date("2021-03-29T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: 1, date_statut: new Date("2021-04-21T00:00:00") },
            { valeur_statut: 2, date_statut: new Date("2021-04-24T00:00:00") },
            { valeur_statut: 3, date_statut: new Date("2021-04-30T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: 2, date_statut: new Date("2020-12-20T00:00:00") },
            { valeur_statut: 3, date_statut: new Date("2020-12-29T00:00:00") },
            { valeur_statut: 0, date_statut: new Date("2021-01-07T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: 2, date_statut: new Date("2020-02-01T00:00:00") },
            { valeur_statut: 3, date_statut: new Date("2020-06-13T00:00:00") },
            { valeur_statut: 2, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: 3, date_statut: new Date("2020-10-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [{ valeur_statut: 3, date_statut: new Date("2021-05-15T00:00:00") }],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [{ valeur_statut: 2, date_statut: new Date("2020-05-15T00:00:00") }],
        }),
      ];
      for (let index = 0; index < statuts.length; index++) {
        const toAdd = new StatutCandidat(statuts[index]);
        await toAdd.save();
      }
    });

    [
      { dateRange: [new Date("2021-01-01T00:00:00"), new Date("2021-12-31T00:00:00")], expectedCount: 4 },
      { dateRange: [new Date("2020-01-01T00:00:00"), new Date("2020-12-31T00:00:00")], expectedCount: 3 },
      { dateRange: [new Date("2020-07-01T00:00:00"), new Date("2021-06-30T00:00:00")], expectedCount: 5 },
      { dateRange: [new Date("2019-07-01T00:00:00"), new Date("2020-06-30T00:00:00")], expectedCount: 1 },
      { dateRange: [new Date("2019-07-01T00:00:00"), new Date("2019-12-31T00:00:00")], expectedCount: 0 },
    ].forEach(({ dateRange, expectedCount }) => {
      it(`computes number of new contracts for date range ${dateRange[0].toLocaleDateString()} - ${dateRange[1].toLocaleDateString()}`, async () => {
        const count = await getNouveauxContratsCountInDateRange(dateRange);
        assert.equal(count, expectedCount);
      });
    });
  });

  describe("getRupturantsCountAtDate", () => {
    const { getRupturantsCountAtDate } = dashboardComponent();

    beforeEach(async () => {
      const statuts = [
        // following statuts are potential rupturants (depends on date)
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [
            { valeur_statut: 3, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: 2, date_statut: new Date("2020-10-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: 3, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: 2, date_statut: new Date("2020-10-01T00:00:00") },
            { valeur_statut: 3, date_statut: new Date("2020-11-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: 1, date_statut: new Date("2020-03-01T00:00:00") },
            { valeur_statut: 3, date_statut: new Date("2020-07-29T00:00:00") },
            { valeur_statut: 2, date_statut: new Date("2020-09-20T00:00:00") },
            { valeur_statut: 0, date_statut: new Date("2020-12-07T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: 1, date_statut: new Date("2020-07-29T00:00:00") },
            { valeur_statut: 2, date_statut: new Date("2020-09-20T00:00:00") },
            { valeur_statut: 3, date_statut: new Date("2020-12-07T00:00:00") },
            { valeur_statut: 2, date_statut: new Date("2020-12-21T00:00:00") },
          ],
        }),
        // following statuts cannot be rupturants
        createRandomStatutCandidat({
          historique_statut_apprenant: [{ valeur_statut: 2, date_statut: new Date("2020-03-22T00:00:00") }],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [{ valeur_statut: 3, date_statut: new Date("2020-11-01T00:00:00") }],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: 1, date_statut: new Date("2020-04-21T00:00:00") },
            { valeur_statut: 2, date_statut: new Date("2020-04-24T00:00:00") },
            { valeur_statut: 3, date_statut: new Date("2020-04-30T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [{ valeur_statut: 2, date_statut: new Date("2020-02-01T00:00:00") }],
        }),
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [{ valeur_statut: 3, date_statut: new Date("2020-05-15T00:00:00") }],
        }),
      ];
      for (let index = 0; index < statuts.length; index++) {
        const toAdd = new StatutCandidat(statuts[index]);
        await toAdd.save();
      }
    });

    it("gets count of rupturants at date", async () => {
      const date = new Date("2020-10-12T00:00:00");
      const count = await getRupturantsCountAtDate(date);
      assert.equal(count, 3);
    });

    it("gets count of rupturants now", async () => {
      const date = new Date();
      const count = await getRupturantsCountAtDate(date);
      assert.equal(count, 2);
    });

    it("gets count of rupturants now with additional filter", async () => {
      const date = new Date();
      const count = await getRupturantsCountAtDate(date, { etablissement_num_region: "199" });
      assert.equal(count, 1);
    });
  });

  describe("getNbRupturesContratAtDate", () => {
    const { getNbRupturesContratAtDate } = dashboardComponent();

    it("gets count of ruptures for apprentis to abandon at date", async () => {
      const statuts = [
        // 3 ruptures apprentis to abandon at 05-07-2021
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2020-10-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.prospect, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-10-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2020-11-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2021-06-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2021-07-05T00:00:00") },
          ],
        }),

        // 4 ruptures apprentis to abandon to apprentis to abandon at 05-07-2021
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2020-10-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-10-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2020-11-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-09-14T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2020-10-02T00:00:00") },
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-10-14T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2020-11-02T00:00:00") },
          ],
        }),
      ];
      for (let index = 0; index < statuts.length; index++) {
        const toAdd = new StatutCandidat(statuts[index]);
        await toAdd.save();
      }

      const date = new Date("2021-07-10T00:00:00");
      const count = await getNbRupturesContratAtDate(date);
      assert.equal(count, 7);
    });

    it("gets count of ruptures for apprentis to inscrits at date", async () => {
      const statuts = [
        // 4 ruptures apprentis to inscrits
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2020-10-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.prospect, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-10-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2020-11-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2021-06-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2021-07-05T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.prospect, date_statut: new Date("2021-05-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2021-06-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2021-07-05T00:00:00") },
          ],
        }),

        // 2 ruptures apprentis to inscrits to apprentis to inscrits
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2020-10-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-10-08T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2020-12-01T00:00:00") },
          ],
        }),
      ];
      for (let index = 0; index < statuts.length; index++) {
        const toAdd = new StatutCandidat(statuts[index]);
        await toAdd.save();
      }

      const date = new Date("2021-07-10T00:00:00");
      const count = await getNbRupturesContratAtDate(date);
      assert.equal(count, 6);
    });

    it("gets count of ruptures for mix apprentis to abandon & inscrits at date", async () => {
      const statuts = [
        // 3 ruptures apprentis to abandon at 05-07-2021
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2020-10-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.prospect, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-10-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2020-11-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2021-06-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2021-07-05T00:00:00") },
          ],
        }),

        // 4 ruptures apprentis to abandon to apprentis to abandon at 05-07-2021
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2020-10-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-10-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2020-11-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-09-14T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2020-10-02T00:00:00") },
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-10-14T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2020-11-02T00:00:00") },
          ],
        }),

        // 4 ruptures apprentis to inscrits
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2020-10-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.prospect, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-10-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2020-11-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2021-06-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2021-07-05T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.prospect, date_statut: new Date("2021-05-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2021-06-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2021-07-05T00:00:00") },
          ],
        }),

        // 2 ruptures apprentis to inscrits to apprentis to inscrits
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2020-10-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-10-08T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2020-12-01T00:00:00") },
          ],
        }),
      ];

      for (let index = 0; index < statuts.length; index++) {
        const toAdd = new StatutCandidat(statuts[index]);
        await toAdd.save();
      }

      const date = new Date("2021-07-10T00:00:00");
      const count = await getNbRupturesContratAtDate(date);
      assert.equal(count, 13);
    });

    it("gets count of ruptures for mix apprentis to abandon & inscrits at date for etablissement filter", async () => {
      const statuts = [
        // 3 ruptures apprentis to abandon at 05-07-2021 - 1 for etablissement_num_region 199
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2020-10-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.prospect, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-10-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2020-11-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2021-06-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2021-07-05T00:00:00") },
          ],
        }),

        // 4 ruptures apprentis to abandon to apprentis to abandon at 05-07-2021 - 2 for etablissement_num_region 199
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2020-10-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-10-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2020-11-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-09-14T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2020-10-02T00:00:00") },
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-10-14T00:00:00") },
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2020-11-02T00:00:00") },
          ],
        }),

        // 4 ruptures apprentis to inscrits - 2 for etablissement_num_region 199
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2020-10-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.prospect, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-10-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2020-11-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2021-06-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2021-07-05T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.prospect, date_statut: new Date("2021-05-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2021-06-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2021-07-05T00:00:00") },
          ],
        }),

        // 2 ruptures apprentis to inscrits to apprentis to inscrits - 2 for etablissement_num_region 199
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2020-10-01T00:00:00") },
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-10-08T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2020-12-01T00:00:00") },
          ],
        }),
      ];

      for (let index = 0; index < statuts.length; index++) {
        const toAdd = new StatutCandidat(statuts[index]);
        await toAdd.save();
      }

      const date = new Date("2021-07-10T00:00:00");
      const count = await getNbRupturesContratAtDate(date, { etablissement_num_region: "199" });
      assert.equal(count, 7);
    });
  });

  describe("getInscritsSansContratCountAtDate", () => {
    const { getInscritsSansContratCountAtDate } = dashboardComponent();

    beforeEach(async () => {
      const statuts = [
        // rupturant, should not be counted
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-09-13T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2020-10-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2020-10-03T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2020-09-01T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          etablissement_num_region: "199",
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.prospect, date_statut: new Date("2020-03-21T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2020-03-22T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-03-22T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.abandon, date_statut: new Date("2020-03-25T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.prospect, date_statut: new Date("2020-04-21T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2020-09-24T00:00:00") },
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-10-30T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2020-09-24T00:00:00") },
            { valeur_statut: codesStatutsCandidats.apprenti, date_statut: new Date("2020-11-30T00:00:00") },
            { valeur_statut: codesStatutsCandidats.inscrit, date_statut: new Date("2020-12-30T00:00:00") },
          ],
        }),
      ];
      for (let index = 0; index < statuts.length; index++) {
        const toAdd = new StatutCandidat(statuts[index]);
        await toAdd.save();
      }
    });

    it("gets count of inscrits sans contrat at date", async () => {
      const date = new Date("2020-10-10T00:00:00");
      const count = await getInscritsSansContratCountAtDate(date);
      assert.equal(count, 5);
    });

    it("gets count of inscrits sans contrat now", async () => {
      const date = new Date();
      const count = await getInscritsSansContratCountAtDate(date);
      assert.equal(count, 3);
    });

    it("gets count of rupturants now with additional filter", async () => {
      const date = new Date();
      const count = await getInscritsSansContratCountAtDate(date, { etablissement_num_region: "199" });
      assert.equal(count, 1);
    });
  });

  describe("getContratsCountAtDate", () => {
    const { getContratsCountAtDate } = dashboardComponent();

    it("gets count of contrats now", async () => {
      const statuts = [
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            {
              valeur_statut: codesStatutsCandidats.inscrit,
              date_statut: new Date("2021-01-04T00:00:00"),
            },
            {
              valeur_statut: codesStatutsCandidats.apprenti,
              date_statut: new Date("2021-01-13T00:00:00"),
            },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            {
              valeur_statut: codesStatutsCandidats.inscrit,
              date_statut: new Date("2021-02-05T00:00:00"),
            },
            {
              valeur_statut: codesStatutsCandidats.apprenti,
              date_statut: new Date("2021-02-16T00:00:00"),
            },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            {
              valeur_statut: codesStatutsCandidats.apprenti,
              date_statut: new Date("2021-03-10T00:00:00"),
            },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            {
              valeur_statut: codesStatutsCandidats.apprenti,
              date_statut: new Date("2021-03-21T00:00:00"),
            },
          ],
        }),
        // Not counted : inscrit
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            {
              valeur_statut: codesStatutsCandidats.inscrit,
              date_statut: new Date("2021-03-21T00:00:00"),
            },
          ],
        }),
      ];
      for (let index = 0; index < statuts.length; index++) {
        const toAdd = new StatutCandidat(statuts[index]);
        await toAdd.save();
      }

      const count = await getContratsCountAtDate(new Date(Date.now()), {});
      assert.equal(count, 4);
    });

    it("gets count of contrats now with additional parameter", async () => {
      const statuts = [
        createRandomStatutCandidat({
          uai_etablissement: "0123456Z",
          historique_statut_apprenant: [
            {
              valeur_statut: codesStatutsCandidats.inscrit,
              date_statut: new Date("2021-01-04T00:00:00"),
            },
            {
              valeur_statut: codesStatutsCandidats.apprenti,
              date_statut: new Date("2021-01-13T00:00:00"),
            },
          ],
        }),
        createRandomStatutCandidat({
          uai_etablissement: "0123456Z",
          historique_statut_apprenant: [
            {
              valeur_statut: codesStatutsCandidats.inscrit,
              date_statut: new Date("2021-02-05T00:00:00"),
            },
            {
              valeur_statut: codesStatutsCandidats.apprenti,
              date_statut: new Date("2021-02-16T00:00:00"),
            },
          ],
        }),
        createRandomStatutCandidat({
          uai_etablissement: "0123456Z",
          historique_statut_apprenant: [
            {
              valeur_statut: codesStatutsCandidats.apprenti,
              date_statut: new Date("2021-03-10T00:00:00"),
            },
          ],
        }),
        createRandomStatutCandidat({
          uai_etablissement: "0123456Z",
          historique_statut_apprenant: [
            {
              valeur_statut: codesStatutsCandidats.apprenti,
              date_statut: new Date("2021-03-21T00:00:00"),
            },
          ],
        }),
        createRandomStatutCandidat({
          uai_etablissement: "0123456Z",
          historique_statut_apprenant: [
            {
              valeur_statut: codesStatutsCandidats.apprenti,
              date_statut: new Date("2021-05-14T00:00:00"),
            },
          ],
        }),
      ];
      for (let index = 0; index < statuts.length; index++) {
        const toAdd = new StatutCandidat(statuts[index]);
        await toAdd.save();
      }

      const count = await getContratsCountAtDate(new Date(Date.now()), { uai_etablissement: "0123456Z" });
      assert.equal(count, 5);
    });

    it("gets count of contrats at date", async () => {
      const statuts = [
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            {
              valeur_statut: codesStatutsCandidats.inscrit,
              date_statut: new Date("2021-01-04T00:00:00"),
            },
            {
              valeur_statut: codesStatutsCandidats.apprenti,
              date_statut: new Date("2021-01-13T00:00:00"),
            },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            {
              valeur_statut: codesStatutsCandidats.inscrit,
              date_statut: new Date("2021-02-05T00:00:00"),
            },
            {
              valeur_statut: codesStatutsCandidats.apprenti,
              date_statut: new Date("2021-02-16T00:00:00"),
            },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            {
              valeur_statut: codesStatutsCandidats.apprenti,
              date_statut: new Date("2021-03-10T00:00:00"),
            },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            {
              valeur_statut: codesStatutsCandidats.apprenti,
              date_statut: new Date("2021-03-21T00:00:00"),
            },
          ],
        }),
        // Not counted : inscrit
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            {
              valeur_statut: codesStatutsCandidats.inscrit,
              date_statut: new Date("2021-03-21T00:00:00"),
            },
          ],
        }),
        // Not counted : abandon
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            {
              valeur_statut: codesStatutsCandidats.abandon,
              date_statut: new Date("2018-03-21T00:00:00"),
            },
          ],
        }),
      ];
      for (let index = 0; index < statuts.length; index++) {
        const toAdd = new StatutCandidat(statuts[index]);
        await toAdd.save();
      }

      const count = await getContratsCountAtDate(new Date("2021-02-28T00:00:00.000Z"), {});
      assert.equal(count, 2);
    });
  });
});
