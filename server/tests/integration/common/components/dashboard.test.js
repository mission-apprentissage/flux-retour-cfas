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

  describe("getEffectifsParNiveauEtAnneeFormation pour une date et un centre de formation", () => {
    const { getEffectifsParNiveauEtAnneeFormation } = dashboardComponent();

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
      const date = new Date("2020-10-10T00:00:00.000+0000");

      // Gets effectif data detail
      const statutsFound = await getEffectifsParNiveauEtAnneeFormation(date, { siret_etablissement: siretToTest });

      // Check for siret
      assert.deepEqual(statutsFound.length, 2);
      assert.deepEqual(statutsFound, expectedDetailResultList);

      // Check for bad siret
      const badSiret = "99999999900999";
      const statutsBadSiret = await getEffectifsParNiveauEtAnneeFormation(date, { siret_etablissement: badSiret });
      assert.notDeepEqual(statutsBadSiret.length, 2);
      assert.notDeepEqual(statutsBadSiret, expectedDetailResultList);
    });
  });

  describe("getEffectifsCountByCfaAtDate", () => {
    const { getEffectifsCountByCfaAtDate } = dashboardComponent();

    it("Permet de récupérer les effectifs par CFA à une date donnée pour une formation", async () => {
      const filterQuery = { formation_cfd: "77929544300013" };
      const cfa1 = {
        siret_etablissement: "00690630980544",
        uai_etablissement: "0123456Z",
        nom_etablissement: "CFA 1",
      };
      const cfa2 = {
        siret_etablissement: "00690630980588",
        uai_etablissement: "0123456T",
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
            inscrits: 15,
            abandons: 10,
          },
        },
        {
          ...cfa2,
          effectifs: {
            apprentis: 10,
            inscrits: 30,
            abandons: 20,
          },
        },
      ];

      const effectifsByCfa = await getEffectifsCountByCfaAtDate(date, filterQuery);
      // we will sort results because we don't care of the order in the test
      const sortBySiret = (a, b) => Number(a.siret_etablissement) - Number(b.siret_etablissement);
      assert.deepEqual(effectifsByCfa.sort(sortBySiret), expectedResult);
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
        // rupturant
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
        // not a rupturant
        createRandomStatutCandidat({
          historique_statut_apprenant: [{ valeur_statut: 1, date_statut: new Date("2020-03-22T00:00:00") }],
        }),
        // not a rupturant
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: 1, date_statut: new Date("2020-04-21T00:00:00") },
            { valeur_statut: 2, date_statut: new Date("2020-04-24T00:00:00") },
            { valeur_statut: 3, date_statut: new Date("2020-04-30T00:00:00") },
          ],
        }),
        createRandomStatutCandidat({
          historique_statut_apprenant: [
            { valeur_statut: 3, date_statut: new Date("2020-07-29T00:00:00") },
            { valeur_statut: 2, date_statut: new Date("2020-09-20T00:00:00") },
            { valeur_statut: 0, date_statut: new Date("2020-12-07T00:00:00") },
          ],
        }),
        // not a rupturant
        createRandomStatutCandidat({
          historique_statut_apprenant: [{ valeur_statut: 2, date_statut: new Date("2020-02-01T00:00:00") }],
        }),
        // not a rupturant
        createRandomStatutCandidat({
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
      assert.equal(count, 1);
    });

    it("gets count of rupturants at date with additional filter", async () => {
      const date = new Date("2020-10-12T00:00:00");
      const count = await getRupturantsCountAtDate(date, { etablissement_num_region: "199" });
      assert.equal(count, 1);
    });
  });

  describe("getJeunesSansContratCountAtDate", () => {
    const { getJeunesSansContratCountAtDate } = dashboardComponent();

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

    it("gets count of jeunes sans contrat at date", async () => {
      const date = new Date("2020-10-10T00:00:00");
      const count = await getJeunesSansContratCountAtDate(date);
      assert.equal(count, 5);
    });

    it("gets count of jeunes sans contrat now", async () => {
      const date = new Date();
      const count = await getJeunesSansContratCountAtDate(date);
      assert.equal(count, 3);
    });

    it("gets count of rupturants now with additional filter", async () => {
      const date = new Date();
      const count = await getJeunesSansContratCountAtDate(date, { etablissement_num_region: "199" });
      assert.equal(count, 1);
    });
  });
});
