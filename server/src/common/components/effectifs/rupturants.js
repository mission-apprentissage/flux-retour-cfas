import { CODES_STATUT_APPRENANT } from "../../constants/dossierApprenantConstants.js";
import { Indicator } from "./indicator.js";

export class EffectifsRupturants extends Indicator {
  /**
   * Pipeline de récupération des rupturants à une date donnée
   * @param {*} searchDate
   * @param {*} filters
   * @param {*} options
   * @returns
   */
  getAtDateAggregationPipeline(searchDate, filters = {}, options = {}) {
    return [
      // Filtrage sur les filtres passés en paramètres
      {
        $match: {
          ...filters,
          "apprenant.historique_statut.valeur_statut": CODES_STATUT_APPRENANT.inscrit,
          "apprenant.historique_statut.1": { $exists: true },
        },
      },
      ...this.getEffectifsWithStatutAtDateAggregationPipeline(searchDate, options.projection),
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
    ];
  }
}
