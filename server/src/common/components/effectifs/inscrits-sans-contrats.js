const { codesStatutsCandidats } = require("../../model/constants");
const { Indicator } = require("./indicator");

class EffectifsInscritsSansContrats extends Indicator {
  /**
   * Pipeline de récupération des inscrits sans contrats à une date donnée
   * @param {*} searchDate
   * @param {*} filters
   * @param {*} options
   * @returns
   */
  getAtDateAggregationPipeline(searchDate, filters = {}, options = {}) {
    return [
      { $match: { ...filters, "historique_statut_apprenant.valeur_statut": codesStatutsCandidats.inscrit } },
      ...this.getEffectifsWithStatutAtDateAggregationPipeline(searchDate, options.projection),
      {
        $match: {
          "statut_apprenant_at_date.valeur_statut": codesStatutsCandidats.inscrit,
          "historique_statut_apprenant.valeur_statut": { $ne: codesStatutsCandidats.apprenti },
        },
      },
    ];
  }
}

module.exports = { EffectifsInscritsSansContrats };
