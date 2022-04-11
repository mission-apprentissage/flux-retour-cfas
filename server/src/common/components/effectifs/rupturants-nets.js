const { CODES_STATUT_APPRENANT } = require("../../constants/dossierApprenantConstants");
const { Indicator } = require("./indicator");

class EffectifsRupturantsNets extends Indicator {
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
          "historique_statut_apprenant.valeur_statut": CODES_STATUT_APPRENANT.abandon,
          "historique_statut_apprenant.2": { $exists: true },
        },
      },
      ...this.getEffectifsWithStatutAtDateAggregationPipeline(searchDate, options.projection),
      { $match: { "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.abandon } },
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
          previousPreviousStatutAtDate: {
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
                  2,
                ],
              },
            ],
          },
        },
      },
      {
        $match: {
          "previousStatutAtDate.valeur_statut": CODES_STATUT_APPRENANT.inscrit,
          "previousPreviousStatutAtDate.valeur_statut": CODES_STATUT_APPRENANT.apprenti,
        },
      },
    ];
  }
}

module.exports = { EffectifsRupturantsNets };
