const { codesStatutsCandidats } = require("../../src/common/model/constants");

const historySequenceApprenti = [
  {
    valeur_statut: codesStatutsCandidats.apprenti,
    date_statut: new Date("2020-08-30T00:00:00.000+0000"),
  },
];

const historySequenceInscrit = [
  {
    valeur_statut: codesStatutsCandidats.inscrit,
    date_statut: new Date("2020-09-20T00:00:00.000+0000"),
  },
];

const historySequenceAbandon = [
  {
    valeur_statut: codesStatutsCandidats.abandon,
    date_statut: new Date("2020-09-20T00:00:00.000+0000"),
  },
];

const historySequenceApprentiToAbandon = [
  {
    valeur_statut: codesStatutsCandidats.apprenti,
    date_statut: new Date("2020-11-15T00:00:00.000+0000"),
  },
  {
    valeur_statut: codesStatutsCandidats.abandon,
    date_statut: new Date("2020-12-18T00:00:00.000+0000"),
  },
];

const historySequenceInscritToApprenti = [
  {
    valeur_statut: codesStatutsCandidats.inscrit,
    date_statut: new Date("2020-09-29T00:00:00.000+0000"),
  },
  {
    valeur_statut: codesStatutsCandidats.apprenti,
    date_statut: new Date("2020-10-15T00:00:00.000+0000"),
  },
];

const historySequenceInscritToApprentiToAbandon = [
  {
    valeur_statut: codesStatutsCandidats.inscrit,
    date_statut: new Date("2020-09-12T00:00:00.000+0000"),
  },
  {
    valeur_statut: codesStatutsCandidats.apprenti,
    date_statut: new Date("2020-09-23T00:00:00.000+0000"),
  },
  {
    valeur_statut: codesStatutsCandidats.abandon,
    date_statut: new Date("2020-10-02T00:00:00.000+0000"),
  },
];

module.exports = {
  historySequenceApprenti,
  historySequenceApprentiToAbandon,
  historySequenceInscrit,
  historySequenceInscritToApprenti,
  historySequenceInscritToApprentiToAbandon,
  historySequenceAbandon,
};
