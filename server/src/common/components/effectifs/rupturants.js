const { CODES_STATUT_APPRENANT } = require("../../constants/statutsCandidatsConstants");
const { Indicator } = require("./indicator");

class EffectifsRupturants extends Indicator {
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
          "historique_statut_apprenant.valeur_statut": CODES_STATUT_APPRENANT.inscrit,
          "historique_statut_apprenant.1": { $exists: true },
        },
      },
      ...this.getEffectifsWithStatutAtDateAggregationPipeline(searchDate, options.projection),
      { $match: { "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.inscrit } },
      // set previousStatutAtDate to be the element in historique_statut_apprenant juste before statut_apprenant_at_date
      {
        $addFields: {
          previousStatutAtDate: {
            $arrayElemAt: [
              "$historique_statut_apprenant",
              {
                $subtract: [
                  {
                    $indexOfArray: [
                      "$historique_statut_apprenant.date_statut",
                      "$statut_apprenant_at_date.date_statut",
                    ],
                  },
                  1,
                ],
              },
            ],
          },
        },
      },
      { $match: { "previousStatutAtDate.valeur_statut": CODES_STATUT_APPRENANT.apprenti } },
    ];
  }
}

module.exports = { EffectifsRupturants };
