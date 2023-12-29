import { addMonths } from "date-fns";
import { CODES_STATUT_APPRENANT } from "shared/constants/dossierApprenant";

import {
  SEUIL_ALERTE_NB_MOIS_INSCRITS_SANS_CONTRATS,
  SEUIL_ALERTE_NB_MOIS_RUPTURANTS,
} from "@/common/constants/effectif";

import { mapMongoObjectToCSVObject } from "./export";
import { Indicator } from "./indicator";

export const apprentisIndicator = new Indicator({
  preStages: [
    {
      $match: { "apprenant.historique_statut.valeur_statut": CODES_STATUT_APPRENANT.apprenti },
    },
  ],
  postStages: [{ $match: { "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.apprenti } }],
  formatRow(item) {
    return mapMongoObjectToCSVObject(item);
  },
});

export const abandonsIndicator = new Indicator({
  preStages: [{ $match: { "apprenant.historique_statut.valeur_statut": CODES_STATUT_APPRENANT.abandon } }],
  postStages: [{ $match: { "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.abandon } }],
  formatRow(item) {
    return mapMongoObjectToCSVObject(item);
  },
});

export const inscritsSansContratsIndicator = new Indicator({
  preStages: [{ $match: { "apprenant.historique_statut.valeur_statut": CODES_STATUT_APPRENANT.inscrit } }],
  postStages: [
    {
      $match: {
        "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.inscrit,
        "apprenant.historique_statut.valeur_statut": { $ne: CODES_STATUT_APPRENANT.apprenti },
      },
    },
  ],
  formatRow(item) {
    return {
      ...mapMongoObjectToCSVObject(item),
      date_inscription: item.statut_apprenant_at_date.date_statut, // Specific for inscrits sans contrats indicateur
      dans_le_statut_depuis:
        addMonths(
          new Date(item.statut_apprenant_at_date.date_statut),
          SEUIL_ALERTE_NB_MOIS_INSCRITS_SANS_CONTRATS
        ).getTime() > Date.now()
          ? `Moins de ${SEUIL_ALERTE_NB_MOIS_INSCRITS_SANS_CONTRATS} mois`
          : `Plus de ${SEUIL_ALERTE_NB_MOIS_INSCRITS_SANS_CONTRATS} mois`,
    };
  },
});

export const rupturantsIndicator = new Indicator({
  preStages: [
    {
      $match: {
        "apprenant.historique_statut.valeur_statut": CODES_STATUT_APPRENANT.inscrit,
        "apprenant.historique_statut.1": { $exists: true },
      },
    },
  ],
  postStages: [
    { $match: { "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.inscrit } },
    // set previousStatutAtDate to be the element in apprenant.historique_statut juste before statut_apprenant_at_date
    {
      $addFields: {
        previousStatutAtDate: {
          $arrayElemAt: ["$apprenant.historique_statut", -2],
        },
      },
    },
    { $match: { "previousStatutAtDate.valeur_statut": CODES_STATUT_APPRENANT.apprenti } },
  ],
  formatRow(item) {
    return {
      ...mapMongoObjectToCSVObject(item),
      dans_le_statut_depuis:
        addMonths(new Date(item.statut_apprenant_at_date.date_statut), SEUIL_ALERTE_NB_MOIS_RUPTURANTS).getTime() >
        Date.now()
          ? `Moins de ${SEUIL_ALERTE_NB_MOIS_RUPTURANTS} mois`
          : `Plus de ${SEUIL_ALERTE_NB_MOIS_RUPTURANTS} mois`,
    };
  },
});
