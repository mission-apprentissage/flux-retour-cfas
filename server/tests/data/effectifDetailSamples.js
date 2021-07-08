const { StatutCandidat } = require("../../src/common/model");
const { historySequenceInscrit, historySequenceApprenti, historySequenceAbandon } = require("./historySequenceSamples");
const { createRandomStatutCandidat } = require("./randomizedSample");

const sampleDataFormationsInscrits = {
  nbNiveau3: {
    formation1: {
      libelle_court: "TEST FORMATION",
      nbYear1: 3,
      nbYear2: 1,
    },
    formation2: {
      libelle_court: "FORMATION 2",
      nbYear1: 2,
      nbYear2: 2,
    },
  },
  nbNiveau4: {
    formation1: {
      libelle_court: "TEST FORMATION",
      nbYear1: 1,
      nbYear2: 1,
    },
    formation2: {
      libelle_court: "FORMATION 2",
      nbYear1: 2,
      nbYear2: 2,
    },
  },
};

const sampleDataFormationsApprentis = {
  nbNiveau3: {
    formation1: {
      libelle_court: "TEST FORMATION",
      nbYear1: 1,
      nbYear2: 1,
    },
    formation2: {
      libelle_court: "FORMATION 2",
      nbYear1: 2,
      nbYear2: 1,
    },
  },
  nbNiveau4: {
    formation1: {
      libelle_court: "TEST FORMATION",
      nbYear1: 1,
      nbYear2: 2,
    },
    formation2: {
      libelle_court: "FORMATION 2",
      nbYear1: 2,
      nbYear2: 3,
    },
  },
};

const sampleDataFormationsAbandons = {
  nbNiveau3: {
    formation1: {
      libelle_court: "TEST FORMATION",
      nbYear1: 3,
      nbYear2: 3,
    },
    formation2: {
      libelle_court: "FORMATION 2",
      nbYear1: 2,
      nbYear2: 2,
    },
  },
  nbNiveau4: {
    formation1: {
      libelle_court: "TEST FORMATION",
      nbYear1: 1,
      nbYear2: 1,
    },
    formation2: {
      libelle_court: "FORMATION 2",
      nbYear1: 2,
      nbYear2: 1,
    },
  },
};

const getStatutsSamplesInscrits = async (uaiToTest) =>
  createSamplesStatutsDetailed(uaiToTest, historySequenceInscrit, sampleDataFormationsInscrits);

const getStatutsSamplesApprentis = async (uaiToTest) =>
  createSamplesStatutsDetailed(uaiToTest, historySequenceApprenti, sampleDataFormationsApprentis);

const getStatutsSamplesAbandons = async (uaiToTest) =>
  createSamplesStatutsDetailed(uaiToTest, historySequenceAbandon, sampleDataFormationsAbandons);

const createSamplesStatutsDetailed = async (uaiToTest, historyStatuts, { nbNiveau3, nbNiveau4 }) => {
  const statutsListToPush = [];

  // Create niveau 3 - formation 1 - year 1
  for (let index = 0; index < nbNiveau3.formation1.nbYear1; index++) {
    statutsListToPush.push(
      new StatutCandidat(
        createRandomStatutCandidat({
          ...{
            historique_statut_apprenant: historyStatuts,
            niveau_formation: "3 (CAP...)",
            uai_etablissement: uaiToTest,
            annee_formation: 1,
            libelle_court_formation: nbNiveau3.formation1.libelle_court,
          },
        })
      )
    );
  }

  // Create niveau 3 - formation 1 - year 2
  for (let index = 0; index < nbNiveau3.formation1.nbYear2; index++) {
    statutsListToPush.push(
      new StatutCandidat(
        createRandomStatutCandidat({
          ...{
            historique_statut_apprenant: historyStatuts,
            niveau_formation: "3 (CAP...)",
            uai_etablissement: uaiToTest,
            annee_formation: 2,
            libelle_court_formation: nbNiveau3.formation1.libelle_court,
          },
        })
      )
    );
  }

  // Create niveau 3 - formation 2 - year 1
  for (let index = 0; index < nbNiveau3.formation2.nbYear1; index++) {
    statutsListToPush.push(
      new StatutCandidat(
        createRandomStatutCandidat({
          ...{
            historique_statut_apprenant: historyStatuts,
            niveau_formation: "3 (CAP...)",
            uai_etablissement: uaiToTest,
            annee_formation: 1,
            libelle_court_formation: nbNiveau3.formation2.libelle_court,
          },
        })
      )
    );
  }

  // Create niveau 3 - formation 2 - year 2
  for (let index = 0; index < nbNiveau3.formation2.nbYear2; index++) {
    statutsListToPush.push(
      new StatutCandidat(
        createRandomStatutCandidat({
          ...{
            historique_statut_apprenant: historyStatuts,
            niveau_formation: "3 (CAP...)",
            uai_etablissement: uaiToTest,
            annee_formation: 2,
            libelle_court_formation: nbNiveau3.formation2.libelle_court,
          },
        })
      )
    );
  }

  // Create niveau 4 - formation 1 - year 1
  for (let index = 0; index < nbNiveau4.formation1.nbYear1; index++) {
    statutsListToPush.push(
      new StatutCandidat(
        createRandomStatutCandidat({
          ...{
            historique_statut_apprenant: historyStatuts,
            niveau_formation: "4 (Bac...)",
            uai_etablissement: uaiToTest,
            annee_formation: 1,
            libelle_court_formation: nbNiveau3.formation1.libelle_court,
          },
        })
      )
    );
  }

  // Create niveau 4 - formation 1 - year 2
  for (let index = 0; index < nbNiveau4.formation1.nbYear2; index++) {
    statutsListToPush.push(
      new StatutCandidat(
        createRandomStatutCandidat({
          ...{
            historique_statut_apprenant: historyStatuts,
            niveau_formation: "4 (Bac...)",
            uai_etablissement: uaiToTest,
            annee_formation: 2,
            libelle_court_formation: nbNiveau3.formation1.libelle_court,
          },
        })
      )
    );
  }

  // Create niveau 4 - formation 2 - year 1
  for (let index = 0; index < nbNiveau4.formation2.nbYear1; index++) {
    statutsListToPush.push(
      new StatutCandidat(
        createRandomStatutCandidat({
          ...{
            historique_statut_apprenant: historyStatuts,
            niveau_formation: "4 (Bac...)",
            uai_etablissement: uaiToTest,
            annee_formation: 1,
            libelle_court_formation: nbNiveau3.formation2.libelle_court,
          },
        })
      )
    );
  }

  // Create niveau 4 - formation 2 - year 2
  for (let index = 0; index < nbNiveau4.formation2.nbYear2; index++) {
    statutsListToPush.push(
      new StatutCandidat(
        createRandomStatutCandidat({
          ...{
            historique_statut_apprenant: historyStatuts,
            niveau_formation: "4 (Bac...)",
            uai_etablissement: uaiToTest,
            annee_formation: 2,
            libelle_court_formation: nbNiveau3.formation2.libelle_court,
          },
        })
      )
    );
  }

  return statutsListToPush;
};

const expectedDetailResultList = [
  {
    niveau: {
      libelle: "3 (CAP...)",
      apprentis: {
        nbTotal: 13,
        nbTotalForNiveau: 5,
      },
      inscrits: {
        nbTotal: 14,
        nbTotalForNiveau: 8,
      },
      abandons: {
        nbTotal: 15,
        nbTotalForNiveau: 10,
      },
    },
    formations: [
      {
        libelle: "FORMATION 2",
        annee: 1,
        apprentis: {
          nbTotalForNiveau: 2,
        },
        inscrits: {
          nbTotalForNiveau: 2,
        },
        abandons: {
          nbTotalForNiveau: 2,
        },
      },
      {
        libelle: "FORMATION 2",
        annee: 2,
        apprentis: {
          nbTotalForNiveau: 1,
        },
        inscrits: {
          nbTotalForNiveau: 2,
        },
        abandons: {
          nbTotalForNiveau: 2,
        },
      },
      {
        libelle: "TEST FORMATION",
        annee: 1,
        apprentis: {
          nbTotalForNiveau: 1,
        },
        inscrits: {
          nbTotalForNiveau: 3,
        },
        abandons: {
          nbTotalForNiveau: 3,
        },
      },
      {
        libelle: "TEST FORMATION",
        annee: 2,
        apprentis: {
          nbTotalForNiveau: 1,
        },
        inscrits: {
          nbTotalForNiveau: 1,
        },
        abandons: {
          nbTotalForNiveau: 3,
        },
      },
    ],
  },
  {
    niveau: {
      libelle: "4 (Bac...)",
      apprentis: {
        nbTotal: 13,
        nbTotalForNiveau: 8,
      },
      inscrits: {
        nbTotal: 14,
        nbTotalForNiveau: 6,
      },
      abandons: {
        nbTotal: 15,
        nbTotalForNiveau: 5,
      },
    },
    formations: [
      {
        libelle: "FORMATION 2",
        annee: 1,
        apprentis: {
          nbTotalForNiveau: 2,
        },
        inscrits: {
          nbTotalForNiveau: 2,
        },
        abandons: {
          nbTotalForNiveau: 2,
        },
      },
      {
        libelle: "FORMATION 2",
        annee: 2,
        apprentis: {
          nbTotalForNiveau: 3,
        },
        inscrits: {
          nbTotalForNiveau: 2,
        },
        abandons: {
          nbTotalForNiveau: 1,
        },
      },
      {
        libelle: "TEST FORMATION",
        annee: 1,
        apprentis: {
          nbTotalForNiveau: 1,
        },
        inscrits: {
          nbTotalForNiveau: 1,
        },
        abandons: {
          nbTotalForNiveau: 1,
        },
      },
      {
        libelle: "TEST FORMATION",
        annee: 2,
        apprentis: {
          nbTotalForNiveau: 2,
        },
        inscrits: {
          nbTotalForNiveau: 1,
        },
        abandons: {
          nbTotalForNiveau: 1,
        },
      },
    ],
  },
];

module.exports = {
  getStatutsSamplesInscrits,
  getStatutsSamplesApprentis,
  getStatutsSamplesAbandons,
  expectedDetailResultList,
};
