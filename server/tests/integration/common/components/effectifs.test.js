const assert = require("assert").strict;
const { createRandomDossierApprenant } = require("../../../data/randomizedSample");
const { DossierApprenantModel } = require("../../../../src/common/model");
const effectifs = require("../../../../src/common/components/effectifs");
const {
  CODES_STATUT_APPRENANT,
  EFFECTIF_INDICATOR_NAMES,
} = require("../../../../src/common/constants/dossierApprenantConstants");
const { RESEAUX_CFAS } = require("../../../../src/common/constants/networksConstants");

describe(__filename, () => {
  const seedDossiersApprenants = async (statutsProps) => {
    const nbAbandons = 10;
    const nbApprentis = 5;

    // Add 10 statuts with full sequence, inscrit -> apprenti -> abandon
    for (let index = 0; index < nbAbandons; index++) {
      const randomStatut = createRandomDossierApprenant({
        historique_statut_apprenant: [
          {
            valeur_statut: CODES_STATUT_APPRENANT.inscrit,
            date_statut: new Date("2020-09-12T00:00:00.000+0000"),
          },
          {
            valeur_statut: CODES_STATUT_APPRENANT.apprenti,
            date_statut: new Date("2020-09-23T00:00:00.000+0000"),
          },
          {
            valeur_statut: CODES_STATUT_APPRENANT.abandon,
            date_statut: new Date("2020-10-02T00:00:00.000+0000"),
          },
        ],
        ...statutsProps,
      });
      const toAdd = new DossierApprenantModel(randomStatut);
      await toAdd.save();
    }

    // Add 5 statuts with simple apprenti sequence
    for (let index = 0; index < nbApprentis; index++) {
      const randomStatut = createRandomDossierApprenant({
        historique_statut_apprenant: [
          {
            valeur_statut: CODES_STATUT_APPRENANT.apprenti,
            date_statut: new Date("2020-08-30T00:00:00.000+0000"),
          },
        ],
        ...statutsProps,
      });
      const toAdd = new DossierApprenantModel(randomStatut);
      await toAdd.save();
    }

    // Add 15 statuts with inscrit -> apprenti sequence
    for (let index = 0; index < 15; index++) {
      const randomStatut = createRandomDossierApprenant({
        historique_statut_apprenant: [
          {
            valeur_statut: CODES_STATUT_APPRENANT.inscrit,
            date_statut: new Date("2020-09-29T00:00:00.000+0000"),
          },
          {
            valeur_statut: CODES_STATUT_APPRENANT.apprenti,
            date_statut: new Date("2020-10-15T00:00:00.000+0000"),
          },
        ],
        ...statutsProps,
      });
      const toAdd = new DossierApprenantModel(randomStatut);
      await toAdd.save();
    }
  };

  describe("getEffectifsCountByNiveauFormationAtDate", () => {
    it("Permet de récupérer les effectifs par niveau_formation à une date donnée", async () => {
      const { getEffectifsCountByNiveauFormationAtDate } = await effectifs();

      const filterQuery = { uai_etablissement: "0123456Z" };

      await seedDossiersApprenants({ ...filterQuery, niveau_formation: "1", niveau_formation_libelle: "1 blabla" });
      await seedDossiersApprenants({ ...filterQuery, niveau_formation: "2", niveau_formation_libelle: "2 blabla" });
      await seedDossiersApprenants({ ...filterQuery, niveau_formation: "3", niveau_formation_libelle: "3 blabla" });
      await seedDossiersApprenants({ ...filterQuery, niveau_formation: null });
      await seedDossiersApprenants({
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

      await seedDossiersApprenants({ ...filterQuery, annee_formation: 1 });
      await seedDossiersApprenants({ ...filterQuery, annee_formation: 2 });
      await seedDossiersApprenants({ ...filterQuery, annee_formation: 3 });
      await seedDossiersApprenants({ ...filterQuery, annee_formation: null });
      await seedDossiersApprenants({ uai_etablissement: "0123456T", annee_formation: 1 });

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

      await seedDossiersApprenants({ ...filterQuery, libelle_long_formation: "a", formation_cfd: "77929544300013" });
      await seedDossiersApprenants({ ...filterQuery, libelle_long_formation: "a", formation_cfd: "77929544300013" });
      await seedDossiersApprenants({ ...filterQuery, libelle_long_formation: "b", formation_cfd: "77929544300014" });
      await seedDossiersApprenants({ ...filterQuery, libelle_long_formation: "c", formation_cfd: "77929544300015" });
      await seedDossiersApprenants({ uai_etablissement: "0123456T", formation_cfd: "77929544300013" });

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
        siret_etablissement: "12345678900011",
      };
      const cfa2 = {
        uai_etablissement: "012345Z",
        nom_etablissement: "CFA 2",
        siret_etablissement: "12345678900099",
      };
      await seedDossiersApprenants({ ...filterQuery, ...cfa1 });
      await seedDossiersApprenants({ formation_cfd: "12345", ...cfa1 });
      await seedDossiersApprenants({ ...filterQuery, ...cfa2 });
      await seedDossiersApprenants({ ...filterQuery, ...cfa2 });

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const expectedResult = [
        {
          ...cfa1,
          siret_etablissement: [cfa1.siret_etablissement],
          effectifs: {
            apprentis: 5,
            inscritsSansContrat: 15,
            rupturants: 0,
            abandons: 10,
          },
        },
        {
          ...cfa2,
          siret_etablissement: [cfa2.siret_etablissement],
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

  describe("getEffectifsCountBySiretAtDate", () => {
    it("Permet de récupérer les effectifs par Siret à une date donnée pour une formation", async () => {
      const { getEffectifsCountBySiretAtDate } = await effectifs();

      const filterQuery = { formation_cfd: "77929544300013" };
      const cfa1 = {
        siret_etablissement: "40239075100046",
        nom_etablissement: "CFA 1",
      };
      const cfa2 = {
        siret_etablissement: "40239075100099",
        nom_etablissement: "CFA 2",
      };
      await seedDossiersApprenants({ ...filterQuery, ...cfa1 });
      await seedDossiersApprenants({ formation_cfd: "12345", ...cfa1 });
      await seedDossiersApprenants({ ...filterQuery, ...cfa2 });
      await seedDossiersApprenants({ ...filterQuery, ...cfa2 });

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

      const effectifsByCfa = await getEffectifsCountBySiretAtDate(date, filterQuery);
      // we will sort results because we don't care of the order in the test
      const sortBySiret = (a, b) => (a.siret_etablissement > b.siret_etablissement ? 1 : -1);
      assert.deepEqual(effectifsByCfa.sort(sortBySiret), expectedResult);
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
      await seedDossiersApprenants({ ...departement1 });
      await seedDossiersApprenants({ ...departement2 });
      await seedDossiersApprenants({ ...departement2 });

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
      const sortByDepartement = (a, b) =>
        Number(a.etablissement_num_departement) > Number(b.etablissement_num_departement) ? 1 : -1;
      assert.deepEqual(effectifsByDepartement.sort(sortByDepartement), expectedResult);
    });
  });

  describe("getEffectifsCountByFormationAndDepartementAtDate", () => {
    it("Permet de récupérer les effectifs par departement ET formation à une date donnée", async () => {
      const { getEffectifsCountByFormationAndDepartementAtDate } = await effectifs();
      const departement1 = {
        etablissement_num_departement: "75",
        etablissement_nom_departement: "Paris",
      };
      const departement2 = {
        etablissement_num_departement: "77",
        etablissement_nom_departement: "Seine-et-Marne",
      };
      const cfd1 = "77929544300000";
      const cfd2 = "77929544300001";
      await seedDossiersApprenants({ ...departement1, formation_cfd: cfd1, libelle_long_formation: "x" });
      await seedDossiersApprenants({ ...departement1, formation_cfd: cfd1, libelle_long_formation: "x" });
      await seedDossiersApprenants({ ...departement2, formation_cfd: cfd1, libelle_long_formation: "x" });
      await seedDossiersApprenants({ ...departement2, formation_cfd: cfd2, libelle_long_formation: "x" });
      await seedDossiersApprenants({ ...departement2, formation_cfd: cfd2, libelle_long_formation: "x" });

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const expectedResult = [
        {
          departement: "75",
          formation_cfd: cfd1,
          intitule: "x",
          effectifs: {
            apprentis: 10,
            inscritsSansContrat: 30,
            rupturants: 0,
            abandons: 20,
          },
        },
        {
          departement: "77",
          formation_cfd: cfd2,
          intitule: "x",
          effectifs: {
            apprentis: 10,
            inscritsSansContrat: 30,
            rupturants: 0,
            abandons: 20,
          },
        },
        {
          departement: "77",
          formation_cfd: cfd1,
          intitule: "x",
          effectifs: {
            apprentis: 5,
            inscritsSansContrat: 15,
            rupturants: 0,
            abandons: 10,
          },
        },
      ];

      const effectifsByDepartementAndFormation = await getEffectifsCountByFormationAndDepartementAtDate(date);
      // we will sort results because we don't care of the order in the test
      const sortByDepartementAndCfd = (a, b) => {
        if (a.departement === b.departement) {
          return Number(a.formation_cfd) < Number(b.formation_cfd) ? 1 : -1;
        }
        return Number(a.departement) > Number(b.departement) ? 1 : -1;
      };
      const sorted = effectifsByDepartementAndFormation.sort(sortByDepartementAndCfd);
      assert.equal(effectifsByDepartementAndFormation.length, 3);
      assert.deepEqual(sorted[0], expectedResult[0]);
      assert.deepEqual(sorted[1], expectedResult[1]);
      assert.deepEqual(sorted[2], expectedResult[2]);
    });
  });

  describe("getDataListEffectifsAtDate", () => {
    const createApprentisForQuery = async (nbDossiersToCreate, filterQuery) => {
      // Add statuts apprenti
      for (let index = 0; index < nbDossiersToCreate; index++) {
        await new DossierApprenantModel(
          createRandomDossierApprenant({
            historique_statut_apprenant: [
              { valeur_statut: CODES_STATUT_APPRENANT.apprenti, date_statut: new Date("2020-08-30T00:00:00.000+0000") },
            ],
            ...filterQuery,
          })
        ).save();
      }
    };

    const createInscritsSansContratsForQuery = async (nbDossiersToCreate, filterQuery) => {
      // Add statuts inscrits sans contrat
      for (let index = 0; index < nbDossiersToCreate; index++) {
        await new DossierApprenantModel(
          createRandomDossierApprenant({
            historique_statut_apprenant: [
              { valeur_statut: CODES_STATUT_APPRENANT.inscrit, date_statut: new Date("2020-09-01T00:00:00") },
            ],
            ...filterQuery,
          })
        ).save();
      }
    };

    const createRupturantsForQuery = async (nbDossiersToCreate, filterQuery) => {
      // Add statuts rupturant
      for (let index = 0; index < nbDossiersToCreate; index++) {
        await new DossierApprenantModel(
          createRandomDossierApprenant({
            historique_statut_apprenant: [
              { valeur_statut: 3, date_statut: new Date("2020-09-13T00:00:00") },
              { valeur_statut: 2, date_statut: new Date("2020-10-01T00:00:00") },
            ],
            ...filterQuery,
          })
        ).save();
      }
    };

    const createAbandonsForQuery = async (nbDossiersToCreate, filterQuery) => {
      // Add statuts abandon
      for (let index = 0; index < nbDossiersToCreate; index++) {
        await new DossierApprenantModel(
          createRandomDossierApprenant({
            historique_statut_apprenant: [
              {
                valeur_statut: CODES_STATUT_APPRENANT.inscrit,
                date_statut: new Date("2020-09-12T00:00:00.000+0000"),
              },
              {
                valeur_statut: CODES_STATUT_APPRENANT.apprenti,
                date_statut: new Date("2020-09-23T00:00:00.000+0000"),
              },
              {
                valeur_statut: CODES_STATUT_APPRENANT.abandon,
                date_statut: new Date("2020-10-02T00:00:00.000+0000"),
              },
            ],
            ...filterQuery,
          })
        ).save();
      }
    };

    it("Permet de récupérer les effectifs anonymisés à une date donnée", async () => {
      const { getDataListEffectifsAtDate } = await effectifs();

      // Seed data for each indicator with specific query & other queyr
      const nbApprentis = 18;
      const nbInscritsSansContrat = 8;
      const nbRupturants = 6;
      const nbAbandons = 5;

      // Seed for filterQuery
      await createApprentisForQuery(nbApprentis, {});
      await createInscritsSansContratsForQuery(nbInscritsSansContrat, {});
      await createRupturantsForQuery(nbRupturants, {});
      await createAbandonsForQuery(nbAbandons, {});

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const effectifsByDepartementAndFormation = await getDataListEffectifsAtDate(date, {});

      // Check effectifs anonymized total length & for each indicator
      assert.equal(
        effectifsByDepartementAndFormation.length,
        nbApprentis + nbInscritsSansContrat + nbRupturants + nbAbandons
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.apprentis)
          .length,
        nbApprentis
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter(
          (item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.inscritsSansContrats
        ).length,
        nbInscritsSansContrat
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.rupturants)
          .length,
        nbRupturants
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.abandons)
          .length,
        nbAbandons
      );
      assert.equal(
        effectifsByDepartementAndFormation.some((item) => item.nom_apprenant !== undefined),
        false
      );
      assert.equal(
        effectifsByDepartementAndFormation.some((item) => item.prenom_apprenant !== undefined),
        false
      );
      assert.equal(
        effectifsByDepartementAndFormation.some((item) => item.date_de_naissance_apprenant !== undefined),
        false
      );
    });

    it("Permet de récupérer les effectifs anonymisés pour un département à une date donnée", async () => {
      const { getDataListEffectifsAtDate } = await effectifs();

      const filterQuery = { etablissement_num_departement: "75" };
      const otherQuery = { etablissement_num_departement: "91" };

      // Seed data for each indicator with specific query & other queyr
      const nbApprentis = 18;
      const nbInscritsSansContrat = 8;
      const nbRupturants = 6;
      const nbAbandons = 5;

      // Seed for filterQuery
      await createApprentisForQuery(nbApprentis, filterQuery);
      await createInscritsSansContratsForQuery(nbInscritsSansContrat, filterQuery);
      await createRupturantsForQuery(nbRupturants, filterQuery);
      await createAbandonsForQuery(nbAbandons, filterQuery);

      // Seed for otherQuery
      await createApprentisForQuery(5, otherQuery);
      await createInscritsSansContratsForQuery(5, otherQuery);
      await createRupturantsForQuery(5, otherQuery);
      await createAbandonsForQuery(5, otherQuery);

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const effectifsByDepartementAndFormation = await getDataListEffectifsAtDate(date, filterQuery);

      // Check effectifs anonymized total length & for each indicator
      assert.equal(
        effectifsByDepartementAndFormation.length,
        nbApprentis + nbInscritsSansContrat + nbRupturants + nbAbandons
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.apprentis)
          .length,
        nbApprentis
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter(
          (item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.inscritsSansContrats
        ).length,
        nbInscritsSansContrat
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.rupturants)
          .length,
        nbRupturants
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.abandons)
          .length,
        nbAbandons
      );
      assert.equal(
        effectifsByDepartementAndFormation.some((item) => item.nom_apprenant !== undefined),
        false
      );
      assert.equal(
        effectifsByDepartementAndFormation.some((item) => item.prenom_apprenant !== undefined),
        false
      );
      assert.equal(
        effectifsByDepartementAndFormation.some((item) => item.date_de_naissance_apprenant !== undefined),
        false
      );
    });

    it("Permet de récupérer les effectifs anonymisés pour une région à une date donnée", async () => {
      const { getDataListEffectifsAtDate } = await effectifs();

      const filterQuery = { etablissement_num_region: "28" };
      const otherQuery = { etablissement_num_departement: "52" };

      // Seed data for each indicator with specific query & other queyr
      const nbApprentis = 18;
      const nbInscritsSansContrat = 8;
      const nbRupturants = 6;
      const nbAbandons = 5;

      // Seed for filterQuery
      await createApprentisForQuery(nbApprentis, filterQuery);
      await createInscritsSansContratsForQuery(nbInscritsSansContrat, filterQuery);
      await createRupturantsForQuery(nbRupturants, filterQuery);
      await createAbandonsForQuery(nbAbandons, filterQuery);

      // Seed for otherQuery
      await createApprentisForQuery(5, otherQuery);
      await createInscritsSansContratsForQuery(5, otherQuery);
      await createRupturantsForQuery(5, otherQuery);
      await createAbandonsForQuery(5, otherQuery);

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const effectifsByDepartementAndFormation = await getDataListEffectifsAtDate(date, filterQuery);

      // Check effectifs anonymized total length & for each indicator
      assert.equal(
        effectifsByDepartementAndFormation.length,
        nbApprentis + nbInscritsSansContrat + nbRupturants + nbAbandons
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.apprentis)
          .length,
        nbApprentis
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter(
          (item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.inscritsSansContrats
        ).length,
        nbInscritsSansContrat
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.rupturants)
          .length,
        nbRupturants
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.abandons)
          .length,
        nbAbandons
      );
      assert.equal(
        effectifsByDepartementAndFormation.some((item) => item.nom_apprenant !== undefined),
        false
      );
      assert.equal(
        effectifsByDepartementAndFormation.some((item) => item.prenom_apprenant !== undefined),
        false
      );
      assert.equal(
        effectifsByDepartementAndFormation.some((item) => item.date_de_naissance_apprenant !== undefined),
        false
      );
    });

    it("Permet de récupérer les effectifs anonymisés pour un réseau à une date donnée", async () => {
      const { getDataListEffectifsAtDate } = await effectifs();

      const filterQuery = { etablissement_reseaux: RESEAUX_CFAS.BTP_CFA.nomReseau };
      const otherQuery = { etablissement_reseaux: RESEAUX_CFAS.AFTRAL.nomReseau };

      // Seed data for each indicator with specific query & other queyr
      const nbApprentis = 18;
      const nbInscritsSansContrat = 8;
      const nbRupturants = 6;
      const nbAbandons = 5;

      // Seed for filterQuery
      await createApprentisForQuery(nbApprentis, filterQuery);
      await createInscritsSansContratsForQuery(nbInscritsSansContrat, filterQuery);
      await createRupturantsForQuery(nbRupturants, filterQuery);
      await createAbandonsForQuery(nbAbandons, filterQuery);

      // Seed for otherQuery
      await createApprentisForQuery(5, otherQuery);
      await createInscritsSansContratsForQuery(5, otherQuery);
      await createRupturantsForQuery(5, otherQuery);
      await createAbandonsForQuery(5, otherQuery);

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const effectifsByDepartementAndFormation = await getDataListEffectifsAtDate(date, filterQuery);

      // Check effectifs anonymized total length & for each indicator
      assert.equal(
        effectifsByDepartementAndFormation.length,
        nbApprentis + nbInscritsSansContrat + nbRupturants + nbAbandons
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.apprentis)
          .length,
        nbApprentis
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter(
          (item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.inscritsSansContrats
        ).length,
        nbInscritsSansContrat
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.rupturants)
          .length,
        nbRupturants
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.abandons)
          .length,
        nbAbandons
      );
      assert.equal(
        effectifsByDepartementAndFormation.some((item) => item.nom_apprenant !== undefined),
        false
      );
      assert.equal(
        effectifsByDepartementAndFormation.some((item) => item.prenom_apprenant !== undefined),
        false
      );
      assert.equal(
        effectifsByDepartementAndFormation.some((item) => item.date_de_naissance_apprenant !== undefined),
        false
      );
    });

    it("Permet de récupérer les effectifs anonymisés pour une formation à une date donnée", async () => {
      const { getDataListEffectifsAtDate } = await effectifs();

      const filterQuery = { formation_cfd: "50033610" };
      const otherQuery = { formation_cfd: "99999999" };

      // Seed data for each indicator with specific query & other queyr
      const nbApprentis = 18;
      const nbInscritsSansContrat = 8;
      const nbRupturants = 6;
      const nbAbandons = 5;

      // Seed for filterQuery
      await createApprentisForQuery(nbApprentis, filterQuery);
      await createInscritsSansContratsForQuery(nbInscritsSansContrat, filterQuery);
      await createRupturantsForQuery(nbRupturants, filterQuery);
      await createAbandonsForQuery(nbAbandons, filterQuery);

      // Seed for otherQuery
      await createApprentisForQuery(5, otherQuery);
      await createInscritsSansContratsForQuery(5, otherQuery);
      await createRupturantsForQuery(5, otherQuery);
      await createAbandonsForQuery(5, otherQuery);

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const effectifsByDepartementAndFormation = await getDataListEffectifsAtDate(date, filterQuery);

      // Check effectifs anonymized total length & for each indicator
      assert.equal(
        effectifsByDepartementAndFormation.length,
        nbApprentis + nbInscritsSansContrat + nbRupturants + nbAbandons
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.apprentis)
          .length,
        nbApprentis
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter(
          (item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.inscritsSansContrats
        ).length,
        nbInscritsSansContrat
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.rupturants)
          .length,
        nbRupturants
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.abandons)
          .length,
        nbAbandons
      );
      assert.equal(
        effectifsByDepartementAndFormation.some((item) => item.nom_apprenant !== undefined),
        false
      );
      assert.equal(
        effectifsByDepartementAndFormation.some((item) => item.prenom_apprenant !== undefined),
        false
      );
      assert.equal(
        effectifsByDepartementAndFormation.some((item) => item.date_de_naissance_apprenant !== undefined),
        false
      );
    });

    it("Permet de récupérer les effectifs anonymisés pour un CFA à une date donnée", async () => {
      const { getDataListEffectifsAtDate } = await effectifs();

      const filterQuery = { uai_etablissement: "0762232N" };
      const otherQuery = { uai_etablissement: "9992232X" };

      // Seed data for each indicator with specific query & other queyr
      const nbApprentis = 18;
      const nbInscritsSansContrat = 8;
      const nbRupturants = 6;
      const nbAbandons = 5;

      // Seed for filterQuery
      await createApprentisForQuery(nbApprentis, filterQuery);
      await createInscritsSansContratsForQuery(nbInscritsSansContrat, filterQuery);
      await createRupturantsForQuery(nbRupturants, filterQuery);
      await createAbandonsForQuery(nbAbandons, filterQuery);

      // Seed for otherQuery
      await createApprentisForQuery(5, otherQuery);
      await createInscritsSansContratsForQuery(5, otherQuery);
      await createRupturantsForQuery(5, otherQuery);
      await createAbandonsForQuery(5, otherQuery);

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const effectifsByDepartementAndFormation = await getDataListEffectifsAtDate(date, filterQuery);

      // Check effectifs anonymized total length & for each indicator
      assert.equal(
        effectifsByDepartementAndFormation.length,
        nbApprentis + nbInscritsSansContrat + nbRupturants + nbAbandons
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.apprentis)
          .length,
        nbApprentis
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter(
          (item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.inscritsSansContrats
        ).length,
        nbInscritsSansContrat
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.rupturants)
          .length,
        nbRupturants
      );
      assert.equal(
        effectifsByDepartementAndFormation.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.abandons)
          .length,
        nbAbandons
      );
      assert.equal(
        effectifsByDepartementAndFormation.some((item) => item.nom_apprenant !== undefined),
        false
      );
      assert.equal(
        effectifsByDepartementAndFormation.some((item) => item.prenom_apprenant !== undefined),
        false
      );
      assert.equal(
        effectifsByDepartementAndFormation.some((item) => item.date_de_naissance_apprenant !== undefined),
        false
      );
    });

    it("Permet de récupérer les effectifs avec données nominatives pour un CFA à une date donnée", async () => {
      const { getDataListEffectifsAtDate } = await effectifs();

      const filterQuery = { uai_etablissement: "0762232N" };
      const otherQuery = { uai_etablissement: "9992232X" };

      // Seed data for each indicator with specific query & other queyr
      const nbApprentis = 18;
      const nbInscritsSansContrat = 8;
      const nbRupturants = 6;
      const nbAbandons = 5;

      // Seed for filterQuery
      await createApprentisForQuery(nbApprentis, filterQuery);
      await createInscritsSansContratsForQuery(nbInscritsSansContrat, filterQuery);
      await createRupturantsForQuery(nbRupturants, filterQuery);
      await createAbandonsForQuery(nbAbandons, filterQuery);

      // Seed for otherQuery
      await createApprentisForQuery(5, otherQuery);
      await createInscritsSansContratsForQuery(5, otherQuery);
      await createRupturantsForQuery(5, otherQuery);
      await createAbandonsForQuery(5, otherQuery);

      const date = new Date("2020-10-10T00:00:00.000+0000");
      const effectifsTests = await getDataListEffectifsAtDate(date, filterQuery, true);

      // Check effectifs anonymized total length & for each indicator
      assert.equal(effectifsTests.length, nbApprentis + nbInscritsSansContrat + nbRupturants + nbAbandons);
      assert.equal(
        effectifsTests.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.apprentis).length,
        nbApprentis
      );
      assert.equal(
        effectifsTests.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.inscritsSansContrats).length,
        nbInscritsSansContrat
      );
      assert.equal(
        effectifsTests.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.rupturants).length,
        nbRupturants
      );
      assert.equal(
        effectifsTests.filter((item) => item.indicateur === EFFECTIF_INDICATOR_NAMES.abandons).length,
        nbAbandons
      );
      assert.equal(
        effectifsTests.some((item) => item.nom_apprenant !== undefined),
        true
      );
      assert.equal(
        effectifsTests.some((item) => item.prenom_apprenant !== undefined),
        true
      );
      assert.equal(
        effectifsTests.some((item) => item.date_de_naissance_apprenant !== undefined),
        true
      );
    });
  });
});
