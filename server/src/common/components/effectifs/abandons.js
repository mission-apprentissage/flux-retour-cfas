const { codesStatutsCandidats } = require("../../constants/statutsCandidatsConstants");
const { Indicator } = require("./indicator");

class EffectifsAbandons extends Indicator {
  /**
   * Pipeline de récupération des abandons à une date donnée
   * @param {*} searchDate
   * @param {*} filters
   * @param {*} options
   * @returns
   */
  getAtDateAggregationPipeline(searchDate, filters = {}, options = {}) {
    return [
      { $match: { ...filters, "historique_statut_apprenant.valeur_statut": codesStatutsCandidats.abandon } },
      ...this.getEffectifsWithStatutAtDateAggregationPipeline(searchDate, options.projection),
      { $match: { "statut_apprenant_at_date.valeur_statut": codesStatutsCandidats.abandon } },
    ];
  }
}

module.exports = { EffectifsAbandons };
