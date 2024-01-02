import { CODES_STATUT_APPRENANT } from "shared";

export const historySequenceApprenti = [
  {
    valeur_statut: CODES_STATUT_APPRENANT.apprenti,
    date_statut: new Date("2020-08-30T00:00:00.000+0000"),
    date_reception: new Date("2020-08-30T00:00:00.000+0000"),
  },
];

export const historySequenceInscrit = [
  {
    valeur_statut: CODES_STATUT_APPRENANT.inscrit,
    date_statut: new Date("2020-09-20T00:00:00.000+0000"),
    date_reception: new Date("2020-09-20T00:00:00.000+0000"),
  },
];

export const historySequenceAbandon = [
  {
    valeur_statut: CODES_STATUT_APPRENANT.abandon,
    date_statut: new Date("2020-09-20T00:00:00.000+0000"),
    date_reception: new Date("2020-09-20T00:00:00.000+0000"),
  },
];

export const historySequenceApprentiToAbandon = [
  {
    valeur_statut: CODES_STATUT_APPRENANT.apprenti,
    date_statut: new Date("2020-11-15T00:00:00.000+0000"),
    date_reception: new Date("2020-11-15T00:00:00.000+0000"),
  },
  {
    valeur_statut: CODES_STATUT_APPRENANT.abandon,
    date_statut: new Date("2020-12-18T00:00:00.000+0000"),
    date_reception: new Date("2020-12-18T00:00:00.000+0000"),
  },
];

export const historySequenceApprentiToInscrit = [
  {
    valeur_statut: CODES_STATUT_APPRENANT.apprenti,
    date_statut: new Date("2020-09-15T00:00:00.000+0000"),
    date_reception: new Date("2020-09-15T00:00:00.000+0000"),
  },
  {
    valeur_statut: CODES_STATUT_APPRENANT.inscrit,
    date_statut: new Date("2020-10-01T00:00:00.000+0000"),
    date_reception: new Date("2020-10-01T00:00:00.000+0000"),
  },
];

export const historySequenceInscritToApprenti = [
  {
    valeur_statut: CODES_STATUT_APPRENANT.inscrit,
    date_statut: new Date("2020-09-29T00:00:00.000+0000"),
    date_reception: new Date("2020-09-29T00:00:00.000+0000"),
  },
  {
    valeur_statut: CODES_STATUT_APPRENANT.apprenti,
    date_statut: new Date("2020-10-15T00:00:00.000+0000"),
    date_reception: new Date("2020-10-15T00:00:00.000+0000"),
  },
];

export const historySequenceInscritToApprentiToAbandon = [
  {
    valeur_statut: CODES_STATUT_APPRENANT.inscrit,
    date_statut: new Date("2020-09-12T00:00:00.000+0000"),
    date_reception: new Date("2020-09-12T00:00:00.000+0000"),
  },
  {
    valeur_statut: CODES_STATUT_APPRENANT.apprenti,
    date_statut: new Date("2020-09-23T00:00:00.000+0000"),
    date_reception: new Date("2020-09-23T00:00:00.000+0000"),
  },
  {
    valeur_statut: CODES_STATUT_APPRENANT.abandon,
    date_statut: new Date("2020-10-02T00:00:00.000+0000"),
    date_reception: new Date("2020-10-02T00:00:00.000+0000"),
  },
];
