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

const getStatutsSamplesInscrits = async (siretToTest) =>
  createSamplesStatutsDetailed(siretToTest, historySequenceInscrit, sampleDataFormationsInscrits);

const getStatutsSamplesApprentis = async (siretToTest) =>
  createSamplesStatutsDetailed(siretToTest, historySequenceApprenti, sampleDataFormationsApprentis);

const getStatutsSamplesAbandons = async (siretToTest) =>
  createSamplesStatutsDetailed(siretToTest, historySequenceAbandon, sampleDataFormationsAbandons);

const createSamplesStatutsDetailed = async (siretToTest, historyStatuts, { nbNiveau3, nbNiveau4 }) => {
  const statutsListToPush = [];

  // Create niveau 3 - formation 1 - year 1
  for (let index = 0; index < nbNiveau3.formation1.nbYear1; index++) {
    statutsListToPush.push(
      new StatutCandidat(
        createRandomStatutCandidat({
          ...{
            historique_statut_apprenant: historyStatuts,
            siret_etablissement_valid: true,
            niveau_formation: "3 (CAP...)",
            siret_etablissement: siretToTest,
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
            siret_etablissement_valid: true,
            niveau_formation: "3 (CAP...)",
            siret_etablissement: siretToTest,
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
            siret_etablissement_valid: true,
            niveau_formation: "3 (CAP...)",
            siret_etablissement: siretToTest,
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
            siret_etablissement_valid: true,
            niveau_formation: "3 (CAP...)",
            siret_etablissement: siretToTest,
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
            siret_etablissement_valid: true,
            niveau_formation: "4 (Bac...)",
            siret_etablissement: siretToTest,
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
            siret_etablissement_valid: true,
            niveau_formation: "4 (Bac...)",
            siret_etablissement: siretToTest,
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
            siret_etablissement_valid: true,
            niveau_formation: "4 (Bac...)",
            siret_etablissement: siretToTest,
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
            siret_etablissement_valid: true,
            niveau_formation: "4 (Bac...)",
            siret_etablissement: siretToTest,
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
        evolution: 0,
      },
      inscrits: {
        nbTotal: 14,
        nbTotalForNiveau: 8,
        evolution: null,
      },
      abandons: {
        nbTotal: 15,
        nbTotalForNiveau: 10,
        evolution: null,
      },
    },
    formations: [
      {
        libelle: "FORMATION 2",
        annee: 1,
        apprentis: {
          nbTotalForNiveau: 2,
          evolution: 0,
        },
        inscrits: {
          nbTotalForNiveau: 2,
          evolution: null,
        },
        abandons: {
          nbTotalForNiveau: 2,
          evolution: null,
        },
      },
      {
        libelle: "FORMATION 2",
        annee: 2,
        apprentis: {
          nbTotalForNiveau: 1,
          evolution: 0,
        },
        inscrits: {
          nbTotalForNiveau: 2,
          evolution: null,
        },
        abandons: {
          nbTotalForNiveau: 2,
          evolution: null,
        },
      },
      {
        libelle: "TEST FORMATION",
        annee: 1,
        apprentis: {
          nbTotalForNiveau: 1,
          evolution: 0,
        },
        inscrits: {
          nbTotalForNiveau: 3,
          evolution: null,
        },
        abandons: {
          nbTotalForNiveau: 3,
          evolution: null,
        },
      },
      {
        libelle: "TEST FORMATION",
        annee: 2,
        apprentis: {
          nbTotalForNiveau: 1,
          evolution: 0,
        },
        inscrits: {
          nbTotalForNiveau: 1,
          evolution: null,
        },
        abandons: {
          nbTotalForNiveau: 3,
          evolution: null,
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
        evolution: 0,
      },
      inscrits: {
        nbTotal: 14,
        nbTotalForNiveau: 6,
        evolution: null,
      },
      abandons: {
        nbTotal: 15,
        nbTotalForNiveau: 5,
        evolution: null,
      },
    },
    formations: [
      {
        libelle: "FORMATION 2",
        annee: 1,
        apprentis: {
          nbTotalForNiveau: 2,
          evolution: 0,
        },
        inscrits: {
          nbTotalForNiveau: 2,
          evolution: null,
        },
        abandons: {
          nbTotalForNiveau: 2,
          evolution: null,
        },
      },
      {
        libelle: "FORMATION 2",
        annee: 2,
        apprentis: {
          nbTotalForNiveau: 3,
          evolution: 0,
        },
        inscrits: {
          nbTotalForNiveau: 2,
          evolution: null,
        },
        abandons: {
          nbTotalForNiveau: 1,
          evolution: null,
        },
      },
      {
        libelle: "TEST FORMATION",
        annee: 1,
        apprentis: {
          nbTotalForNiveau: 1,
          evolution: 0,
        },
        inscrits: {
          nbTotalForNiveau: 1,
          evolution: null,
        },
        abandons: {
          nbTotalForNiveau: 1,
          evolution: null,
        },
      },
      {
        libelle: "TEST FORMATION",
        annee: 2,
        apprentis: {
          nbTotalForNiveau: 2,
          evolution: 0,
        },
        inscrits: {
          nbTotalForNiveau: 1,
          evolution: null,
        },
        abandons: {
          nbTotalForNiveau: 1,
          evolution: null,
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
