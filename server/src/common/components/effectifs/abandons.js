import { CODES_STATUT_APPRENANT } from "../../constants/dossierApprenantConstants.js";
import { Indicator } from "./indicator.js";

export class EffectifsAbandons extends Indicator {
  /**
   * Pipeline de récupération des abandons à une date donnée
   * @param {*} searchDate
   * @param {*} filters
   * @param {*} options
   * @returns
   */
  getAtDateAggregationPipeline(searchDate, filters = {}, options = {}) {
    return [
      { $match: { ...filters, "apprenant.historique_statut.valeur_statut": CODES_STATUT_APPRENANT.abandon } },
      ...this.getEffectifsWithStatutAtDateAggregationPipeline(searchDate, options.projection),
      { $match: { "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.abandon } },
    ];
  }
}
