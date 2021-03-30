const assert = require("assert");
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
  describe("getNbStatutsInHistoryForStatutAndDate", () => {
    const { getNbStatutsInHistoryForStatutAndDate } = dashboardComponent();

    it("Récupère le nb de statuts dans l'historique pour 10 statuts ayant une séquence complète", async () => {
      // Search params
      const searchDate = new Date("2020-08-16T00:00:00.000+0000");
      const searchStatut = codesStatutsCandidats.prospect;

      // Add 10 statuts with history sequence
      for (let index = 0; index < 10; index++) {
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceProspectToInscritToApprentiToAbandon,
          siret_etablissement_valid: true,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      const nbStatutsFoundInHistory = await getNbStatutsInHistoryForStatutAndDate(searchDate, searchStatut);
      assert.deepStrictEqual(nbStatutsFoundInHistory, 10);
    });

    it("Récupère le nb de statuts dans l'historique pour 5 statuts ayant une séquence complète - recherche 2", async () => {
      // Search params
      const searchDate = new Date("2020-09-25T00:00:00.000+0000");
      const searchStatut = codesStatutsCandidats.apprenti;

      // Add 10 statuts with history sequence
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceProspectToInscritToApprentiToAbandon,
          siret_etablissement_valid: true,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      const nbStatutsFoundInHistory = await getNbStatutsInHistoryForStatutAndDate(searchDate, searchStatut);
      assert.deepStrictEqual(nbStatutsFoundInHistory, 5);
    });

    it("Ne récupère aucun statut dans l'historique pour 10 statuts ayant une séquence complète", async () => {
      // Search params
      const searchDate = new Date("2020-09-15T00:00:00.000+0000");
      const searchStatut = codesStatutsCandidats.prospect;

      // Add 10 statuts with history sequence
      for (let index = 0; index < 10; index++) {
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceProspectToInscritToApprentiToAbandon,
          siret_etablissement_valid: true,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      const nbStatutsFoundInHistory = await getNbStatutsInHistoryForStatutAndDate(searchDate, searchStatut);
      assert.notDeepStrictEqual(nbStatutsFoundInHistory, 10);
    });
  });

  describe("getEffectifsData pour une période donnée", () => {
    const { getEffectifsData } = dashboardComponent();

    it("Permet de récupérer les données d'effectifs pour une période donnée", async () => {
      // Add 10 statuts with history sequence - full
      for (let index = 0; index < 10; index++) {
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceProspectToInscritToApprentiToAbandon,
          siret_etablissement_valid: true,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 5 statuts with history sequence - simple apprenti
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceApprenti,
          siret_etablissement_valid: true,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 15 statuts with history sequence - inscritToApprenti
      for (let index = 0; index < 15; index++) {
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceInscritToApprenti,
          siret_etablissement_valid: true,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Search params dates
      const startDate = new Date("2020-09-15T00:00:00.000+0000");
      const endDate = new Date("2020-10-10T00:00:00.000+0000");

      const expectedResults = {
        startDate: {
          nbInscrits: 10,
          nbApprentis: 5,
          nbAbandons: 0,
        },
        endDate: {
          nbInscrits: 15,
          nbApprentis: 5,
          nbAbandons: 10,
        },
      };

      const nbStatutsFoundInHistory = await getEffectifsData(startDate, endDate);

      assert.deepStrictEqual(nbStatutsFoundInHistory.startDate.nbInscrits, expectedResults.startDate.nbInscrits);
      assert.deepStrictEqual(nbStatutsFoundInHistory.startDate.nbApprentis, expectedResults.startDate.nbApprentis);
      assert.deepStrictEqual(nbStatutsFoundInHistory.startDate.nbAbandons, expectedResults.startDate.nbAbandons);
      assert.deepStrictEqual(nbStatutsFoundInHistory.endDate.nbInscrits, expectedResults.endDate.nbInscrits);
      assert.deepStrictEqual(nbStatutsFoundInHistory.endDate.nbApprentis, expectedResults.endDate.nbApprentis);
      assert.deepStrictEqual(nbStatutsFoundInHistory.endDate.nbAbandons, expectedResults.endDate.nbAbandons);
    });

    it("Permet de ne pas récupérer les données d'effectifs pour une période donnée si un siret est invalide", async () => {
      // Add 10 statuts with history sequence - full
      for (let index = 0; index < 10; index++) {
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceProspectToInscritToApprentiToAbandon,
          siret_etablissement_valid: false,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 5 statuts with history sequence - simple apprenti
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceApprenti,
          siret_etablissement_valid: false,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 15 statuts with history sequence - inscritToApprenti
      for (let index = 0; index < 15; index++) {
        const randomStatut = createRandomStatutCandidat({
          historique_statut_apprenant: historySequenceInscritToApprenti,
          siret_etablissement_valid: false,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Search params dates
      const startDate = new Date("2020-09-15T00:00:00.000+0000");
      const endDate = new Date("2020-10-10T00:00:00.000+0000");

      const expectedResults = {
        startDate: {
          nbInscrits: 10,
          nbApprentis: 5,
          nbAbandons: 0,
        },
        endDate: {
          nbInscrits: 15,
          nbApprentis: 5,
          nbAbandons: 10,
        },
      };

      const nbStatutsFoundInHistory = await getEffectifsData(startDate, endDate);

      assert.notDeepStrictEqual(nbStatutsFoundInHistory.startDate.nbInscrits, expectedResults.startDate.nbInscrits);
      assert.notDeepStrictEqual(nbStatutsFoundInHistory.startDate.nbApprentis, expectedResults.startDate.nbApprentis);
      assert.deepStrictEqual(nbStatutsFoundInHistory.startDate.nbAbandons, 0);
      assert.notDeepStrictEqual(nbStatutsFoundInHistory.endDate.nbInscrits, expectedResults.endDate.nbInscrits);
      assert.notDeepStrictEqual(nbStatutsFoundInHistory.endDate.nbApprentis, expectedResults.endDate.nbApprentis);
      assert.notDeepStrictEqual(nbStatutsFoundInHistory.endDate.nbAbandons, expectedResults.endDate.nbAbandons);
    });
  });

  describe("getEffectifsData pour une période et une localisation", () => {
    const { getEffectifsData } = dashboardComponent();

    it("Permet de récupérer les données d'effectifs pour une période et une région", async () => {
      const filterQuery = { etablissement_num_region: "84" };

      // Add 10 statuts for filter with history sequence - full
      for (let index = 0; index < 10; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{
            historique_statut_apprenant: historySequenceProspectToInscritToApprentiToAbandon,
            siret_etablissement_valid: true,
          },
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 5 statuts for filter with history sequence - simple apprenti
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{ historique_statut_apprenant: historySequenceApprenti, siret_etablissement_valid: true },
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 15 statuts for filter  with history sequence - inscritToApprenti
      for (let index = 0; index < 15; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{ historique_statut_apprenant: historySequenceInscritToApprenti, siret_etablissement_valid: true },
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Search params & expected results
      const startDate = new Date("2020-09-15T00:00:00.000+0000");
      const endDate = new Date("2020-10-10T00:00:00.000+0000");
      const expectedResults = {
        startDate: {
          nbInscrits: 10,
          nbApprentis: 5,
          nbAbandons: 0,
        },
        endDate: {
          nbInscrits: 15,
          nbApprentis: 5,
          nbAbandons: 10,
        },
      };

      // Check for good filter
      const nbStatutsFoundInHistory = await getEffectifsData(startDate, endDate, filterQuery);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbInscrits, expectedResults.startDate.nbInscrits);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbApprentis, expectedResults.startDate.nbApprentis);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbAbandons, expectedResults.startDate.nbAbandons);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbInscrits, expectedResults.endDate.nbInscrits);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbApprentis, expectedResults.endDate.nbApprentis);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbAbandons, expectedResults.endDate.nbAbandons);

      // Check for bad filter
      const badFilterQuery = { etablissement_num_region: "99" };
      const nbStatutsBadFilter = await getEffectifsData(startDate, endDate, badFilterQuery);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbInscrits, 0);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbApprentis, 0);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbAbandons, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbInscrits, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbApprentis, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbAbandons, 0);
    });

    it("Permet de récupérer les données d'effectifs pour une période et un département", async () => {
      const filterQuery = { etablissement_num_departement: "01" };

      // Add 10 statuts for filter with history sequence - full
      for (let index = 0; index < 10; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{
            historique_statut_apprenant: historySequenceProspectToInscritToApprentiToAbandon,
            siret_etablissement_valid: true,
          },
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 5 statuts for filter with history sequence - simple apprenti
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{ historique_statut_apprenant: historySequenceApprenti, siret_etablissement_valid: true },
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 15 statuts for filter  with history sequence - inscritToApprenti
      for (let index = 0; index < 15; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{ historique_statut_apprenant: historySequenceInscritToApprenti, siret_etablissement_valid: true },
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Search params & expected results
      const startDate = new Date("2020-09-15T00:00:00.000+0000");
      const endDate = new Date("2020-10-10T00:00:00.000+0000");
      const expectedResults = {
        startDate: {
          nbInscrits: 10,
          nbApprentis: 5,
          nbAbandons: 0,
        },
        endDate: {
          nbInscrits: 15,
          nbApprentis: 5,
          nbAbandons: 10,
        },
      };

      // Check for good filter
      const nbStatutsFoundInHistory = await getEffectifsData(startDate, endDate, filterQuery);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbInscrits, expectedResults.startDate.nbInscrits);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbApprentis, expectedResults.startDate.nbApprentis);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbAbandons, expectedResults.startDate.nbAbandons);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbInscrits, expectedResults.endDate.nbInscrits);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbApprentis, expectedResults.endDate.nbApprentis);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbAbandons, expectedResults.endDate.nbAbandons);

      // Check for bad filter
      const badFilterQuery = { etablissement_num_departement: "99" };
      const nbStatutsBadFilter = await getEffectifsData(startDate, endDate, badFilterQuery);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbInscrits, 0);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbApprentis, 0);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbAbandons, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbInscrits, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbApprentis, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbAbandons, 0);
    });

    it("Permet de récupérer les données d'effectifs pour une période et une académie", async () => {
      const filterQuery = { etablissement_num_academie: "4" };

      // Add 10 statuts for filter with history sequence - full
      for (let index = 0; index < 10; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{
            historique_statut_apprenant: historySequenceProspectToInscritToApprentiToAbandon,
            siret_etablissement_valid: true,
          },
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 5 statuts for filter with history sequence - simple apprenti
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{ historique_statut_apprenant: historySequenceApprenti, siret_etablissement_valid: true },
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 15 statuts for filter  with history sequence - inscritToApprenti
      for (let index = 0; index < 15; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{ historique_statut_apprenant: historySequenceInscritToApprenti, siret_etablissement_valid: true },
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Search params & expected results
      const startDate = new Date("2020-09-15T00:00:00.000+0000");
      const endDate = new Date("2020-10-10T00:00:00.000+0000");
      const expectedResults = {
        startDate: {
          nbInscrits: 10,
          nbApprentis: 5,
          nbAbandons: 0,
        },
        endDate: {
          nbInscrits: 15,
          nbApprentis: 5,
          nbAbandons: 10,
        },
      };

      // Check for good filter
      const nbStatutsFoundInHistory = await getEffectifsData(startDate, endDate, filterQuery);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbInscrits, expectedResults.startDate.nbInscrits);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbApprentis, expectedResults.startDate.nbApprentis);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbAbandons, expectedResults.startDate.nbAbandons);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbInscrits, expectedResults.endDate.nbInscrits);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbApprentis, expectedResults.endDate.nbApprentis);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbAbandons, expectedResults.endDate.nbAbandons);

      // Check for bad filter
      const badFilterQuery = { etablissement_num_academie: "99" };
      const nbStatutsBadFilter = await getEffectifsData(startDate, endDate, badFilterQuery);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbInscrits, 0);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbApprentis, 0);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbAbandons, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbInscrits, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbApprentis, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbAbandons, 0);
    });
  });

  describe("getEffectifsData pour une période et un centre de formation", () => {
    const { getEffectifsData } = dashboardComponent();

    it("Permet de récupérer les données d'effectifs pour une période et un cfa via son siret", async () => {
      const filterQuery = { siret_etablissement: "77929544300013", siret_etablissement_valid: true };

      // Add 10 statuts for filter with history sequence - full
      for (let index = 0; index < 10; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{
            historique_statut_apprenant: historySequenceProspectToInscritToApprentiToAbandon,
            siret_etablissement_valid: true,
          },
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 5 statuts for filter with history sequence - simple apprenti
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{ historique_statut_apprenant: historySequenceApprenti, siret_etablissement_valid: true },
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 15 statuts for filter  with history sequence - inscritToApprenti
      for (let index = 0; index < 15; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{ historique_statut_apprenant: historySequenceInscritToApprenti, siret_etablissement_valid: true },
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Search params & expected results
      const startDate = new Date("2020-09-15T00:00:00.000+0000");
      const endDate = new Date("2020-10-10T00:00:00.000+0000");
      const expectedResults = {
        startDate: {
          nbInscrits: 10,
          nbApprentis: 5,
          nbAbandons: 0,
        },
        endDate: {
          nbInscrits: 15,
          nbApprentis: 5,
          nbAbandons: 10,
        },
      };

      // Check for good filter
      const nbStatutsFoundInHistory = await getEffectifsData(startDate, endDate, filterQuery);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbInscrits, expectedResults.startDate.nbInscrits);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbApprentis, expectedResults.startDate.nbApprentis);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbAbandons, expectedResults.startDate.nbAbandons);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbInscrits, expectedResults.endDate.nbInscrits);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbApprentis, expectedResults.endDate.nbApprentis);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbAbandons, expectedResults.endDate.nbAbandons);

      // Check for bad filter
      const badFilterQuery = { siret_etablissement: "99999999900999", siret_etablissement_valid: true };
      const nbStatutsBadFilter = await getEffectifsData(startDate, endDate, badFilterQuery);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbInscrits, 0);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbApprentis, 0);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbAbandons, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbInscrits, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbApprentis, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbAbandons, 0);
    });
  });

  describe("getEffectifsData pour une période et une formation", () => {
    const { getEffectifsData } = dashboardComponent();

    it("Permet de récupérer les données d'effectifs pour une période et une formation via son cfd", async () => {
      const filterQuery = { id_formation: "77929544300013" };

      // Add 10 statuts for filter with history sequence - full
      for (let index = 0; index < 10; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{
            historique_statut_apprenant: historySequenceProspectToInscritToApprentiToAbandon,
            siret_etablissement_valid: true,
          },
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 5 statuts for filter with history sequence - simple apprenti
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{ historique_statut_apprenant: historySequenceApprenti, siret_etablissement_valid: true },
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 15 statuts for filter  with history sequence - inscritToApprenti
      for (let index = 0; index < 15; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{ historique_statut_apprenant: historySequenceInscritToApprenti, siret_etablissement_valid: true },
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Search params & expected results
      const startDate = new Date("2020-09-15T00:00:00.000+0000");
      const endDate = new Date("2020-10-10T00:00:00.000+0000");
      const expectedResults = {
        startDate: {
          nbInscrits: 10,
          nbApprentis: 5,
          nbAbandons: 0,
        },
        endDate: {
          nbInscrits: 15,
          nbApprentis: 5,
          nbAbandons: 10,
        },
      };

      // Check for good filter
      const nbStatutsFoundInHistory = await getEffectifsData(startDate, endDate, filterQuery);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbInscrits, expectedResults.startDate.nbInscrits);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbApprentis, expectedResults.startDate.nbApprentis);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbAbandons, expectedResults.startDate.nbAbandons);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbInscrits, expectedResults.endDate.nbInscrits);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbApprentis, expectedResults.endDate.nbApprentis);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbAbandons, expectedResults.endDate.nbAbandons);

      // Check for bad filter
      const badFilterQuery = { id_formation: "99999999999999" };
      const nbStatutsBadFilter = await getEffectifsData(startDate, endDate, badFilterQuery);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbInscrits, 0);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbApprentis, 0);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbAbandons, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbInscrits, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbApprentis, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbAbandons, 0);
    });
  });

  describe("getEffectifsData pour une période et un réseau", () => {
    const { getEffectifsData } = dashboardComponent();

    it("Permet de récupérer les données d'effectifs pour une période et un réseau", async () => {
      const createQuery = { etablissement_reseaux: [reseauxCfas.BTP_CFA.nomReseau] };

      // Add 10 statuts for filter with history sequence - full
      for (let index = 0; index < 10; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{
            historique_statut_apprenant: historySequenceProspectToInscritToApprentiToAbandon,
            siret_etablissement_valid: true,
          },
          ...createQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 5 statuts for filter with history sequence - simple apprenti
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{ historique_statut_apprenant: historySequenceApprenti, siret_etablissement_valid: true },
          ...createQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 15 statuts for filter  with history sequence - inscritToApprenti
      for (let index = 0; index < 15; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{ historique_statut_apprenant: historySequenceInscritToApprenti, siret_etablissement_valid: true },
          ...createQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Search params & expected results
      const startDate = new Date("2020-09-15T00:00:00.000+0000");
      const endDate = new Date("2020-10-10T00:00:00.000+0000");
      const expectedResults = {
        startDate: {
          nbInscrits: 10,
          nbApprentis: 5,
          nbAbandons: 0,
        },
        endDate: {
          nbInscrits: 15,
          nbApprentis: 5,
          nbAbandons: 10,
        },
      };

      // Check for good filter
      const filterQuery = { etablissement_reseaux: { $in: [reseauxCfas.BTP_CFA.nomReseau] } };
      const nbStatutsFoundInHistory = await getEffectifsData(startDate, endDate, filterQuery);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbInscrits, expectedResults.startDate.nbInscrits);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbApprentis, expectedResults.startDate.nbApprentis);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbAbandons, expectedResults.startDate.nbAbandons);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbInscrits, expectedResults.endDate.nbInscrits);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbApprentis, expectedResults.endDate.nbApprentis);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbAbandons, expectedResults.endDate.nbAbandons);

      // Check for bad filter
      const badFilterQuery = { etablissement_reseaux: { $in: [reseauxCfas.ANASUP.nomReseau] } };
      const nbStatutsBadFilter = await getEffectifsData(startDate, endDate, badFilterQuery);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbInscrits, 0);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbApprentis, 0);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbAbandons, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbInscrits, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbApprentis, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbAbandons, 0);
    });
  });

  describe("getEffectifsData pour une période, une localisation, une formation", () => {
    const { getEffectifsData } = dashboardComponent();

    it("Permet de récupérer les données d'effectifs pour une période - une région - une formation ", async () => {
      const filterQuery = { id_formation: "77929544300013", etablissement_num_region: "84" };

      // Add 10 statuts for filter with history sequence - full
      for (let index = 0; index < 10; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{
            historique_statut_apprenant: historySequenceProspectToInscritToApprentiToAbandon,
            siret_etablissement_valid: true,
          },
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 5 statuts for filter with history sequence - simple apprenti
      for (let index = 0; index < 5; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{ historique_statut_apprenant: historySequenceApprenti, siret_etablissement_valid: true },
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Add 15 statuts for filter  with history sequence - inscritToApprenti
      for (let index = 0; index < 15; index++) {
        const randomStatut = createRandomStatutCandidat({
          ...{ historique_statut_apprenant: historySequenceInscritToApprenti, siret_etablissement_valid: true },
          ...filterQuery,
        });
        const toAdd = new StatutCandidat(randomStatut);
        await toAdd.save();
      }

      // Search params & expected results
      const startDate = new Date("2020-09-15T00:00:00.000+0000");
      const endDate = new Date("2020-10-10T00:00:00.000+0000");
      const expectedResults = {
        startDate: {
          nbInscrits: 10,
          nbApprentis: 5,
          nbAbandons: 0,
        },
        endDate: {
          nbInscrits: 15,
          nbApprentis: 5,
          nbAbandons: 10,
        },
      };

      // Check for good filter
      const nbStatutsFoundInHistory = await getEffectifsData(startDate, endDate, filterQuery);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbInscrits, expectedResults.startDate.nbInscrits);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbApprentis, expectedResults.startDate.nbApprentis);
      assert.strictEqual(nbStatutsFoundInHistory.startDate.nbAbandons, expectedResults.startDate.nbAbandons);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbInscrits, expectedResults.endDate.nbInscrits);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbApprentis, expectedResults.endDate.nbApprentis);
      assert.strictEqual(nbStatutsFoundInHistory.endDate.nbAbandons, expectedResults.endDate.nbAbandons);

      // Check for bad filter
      const badFilterQuery = { id_formation: "99999999999999", etablissement_num_region: "99" };
      const nbStatutsBadFilter = await getEffectifsData(startDate, endDate, badFilterQuery);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbInscrits, 0);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbApprentis, 0);
      assert.strictEqual(nbStatutsBadFilter.startDate.nbAbandons, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbInscrits, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbApprentis, 0);
      assert.strictEqual(nbStatutsBadFilter.endDate.nbAbandons, 0);
    });
  });
});
