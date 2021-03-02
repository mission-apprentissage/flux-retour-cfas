const { codesStatutsCandidats } = require("../../src/common/model/constants");

const historySequenceApprenti = [
  {
    valeur_statut: codesStatutsCandidats.apprenti,
    position_statut: 1,
    date_statut: new Date("2020-08-30T00:00:00.000+0000"),
  },
];

const historySequenceApprentiToAbandon = [
  {
    valeur_statut: codesStatutsCandidats.apprenti,
    position_statut: 1,
    date_statut: new Date("2020-11-15T00:00:00.000+0000"),
  },
  {
    valeur_statut: codesStatutsCandidats.abandon,
    position_statut: 46,
    date_statut: new Date("2020-12-18T00:00:00.000+0000"),
  },
];

const historySequenceInscritToApprenti = [
  {
    valeur_statut: codesStatutsCandidats.inscrit,
    position_statut: 1,
    date_statut: new Date("2020-09-29T00:00:00.000+0000"),
  },
  {
    valeur_statut: codesStatutsCandidats.apprenti,
    position_statut: 46,
    date_statut: new Date("2020-10-15T00:00:00.000+0000"),
  },
];

const historySequenceProspectToInscritToApprentiToAbandon = [
  {
    valeur_statut: codesStatutsCandidats.prospect,
    position_statut: 1,
    date_statut: new Date("2020-08-15T00:00:00.000+0000"),
  },
  {
    valeur_statut: codesStatutsCandidats.inscrit,
    position_statut: 2,
    date_statut: new Date("2020-09-12T00:00:00.000+0000"),
  },
  {
    valeur_statut: codesStatutsCandidats.apprenti,
    position_statut: 3,
    date_statut: new Date("2020-09-23T00:00:00.000+0000"),
  },
  {
    valeur_statut: codesStatutsCandidats.abandon,
    position_statut: 4,
    date_statut: new Date("2020-10-02T00:00:00.000+0000"),
  },
  {
    valeur_statut: codesStatutsCandidats.prospect,
    position_statut: 5,
    date_statut: new Date("2020-10-28T00:00:00.000+0000"),
  },
];

module.exports = {
  historySequenceApprenti,
  historySequenceApprentiToAbandon,
  historySequenceInscritToApprenti,
  historySequenceProspectToInscritToApprentiToAbandon,
};
