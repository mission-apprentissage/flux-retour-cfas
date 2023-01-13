import { CODES_STATUT_APPRENANT } from "../../constants/dossierApprenantConstants.js";
import { Indicator } from "./indicator.js";

export class EffectifsInscritsSansContrats extends Indicator {
  /**
   * Pipeline de récupération des inscrits sans contrats à une date donnée
   * @param {*} searchDate
   * @param {*} filters
   * @param {*} options
   * @returns
   */
  getAtDateAggregationPipeline(searchDate, filters = {}, options = {}) {
    return [
      { $match: { ...filters, "apprenant.historique_statut.valeur_statut": CODES_STATUT_APPRENANT.inscrit } },
      ...this.getEffectifsWithStatutAtDateAggregationPipeline(searchDate, options.projection),
      {
        $match: {
          "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.inscrit,
          "apprenant.historique_statut.valeur_statut": { $ne: CODES_STATUT_APPRENANT.apprenti },
        },
      },
    ];
  }
}
