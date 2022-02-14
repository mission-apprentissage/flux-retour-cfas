const { codesStatutsCandidats } = require("../../model/constants");
const { Indicator } = require("./indicator");

class EffectifsApprentis extends Indicator {
  /**
   * Pipeline de récupération des apprentis à une date donnée
   * @param {*} searchDate
   * @param {*} filters
   * @param {*} options
   * @returns
   */
  getAtDateAggregationPipeline(searchDate, filters = {}, options = {}) {
    return [
      { $match: { ...filters, "historique_statut_apprenant.valeur_statut": codesStatutsCandidats.apprenti } },
      ...this.getEffectifsWithStatutAtDateAggregationPipeline(searchDate, options.projection),
      { $match: { "statut_apprenant_at_date.valeur_statut": codesStatutsCandidats.apprenti } },
    ];
  }
}

module.exports = { EffectifsApprentis };
