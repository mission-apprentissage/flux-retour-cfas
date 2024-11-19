import { CODES_STATUT_APPRENANT } from "shared";

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
